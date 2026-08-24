import { useEffect, useState } from 'react'
import { useLedger } from '../hooks/useLedger'
import { useAuth } from '../hooks/useAuth'
import { StatementImportModal } from '../components/StatementImportModal'
import axios from 'axios'
import {
  FileText,
  Mail,
  Download,
  UploadCloud,
  Calendar,
  AlertCircle,
  Loader2,
  Filter,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from 'lucide-react'

const STATEMENT_EMAIL_DAILY_LIMIT = 5
const STATEMENT_EMAIL_COOLDOWN_MS = 5 * 60 * 1000

type StatementEmailLimitState = {
  dayKey: string
  count: number
  lastSentAt: number | null
}

type StatementEmailRateLimitPayload = StatementEmailLimitState & {
  remainingToday: number
  nextAllowedAt: number | null
  cooldownMs: number
  dailyLimit: number
  blockedReason: 'cooldown' | 'daily' | null
}

const getStatementDayKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeEmail = (value: string) => value.trim().toLowerCase()

const getStatementLimitStorageKey = (value: string) =>
  `fintrack_statement_email_limit_${normalizeEmail(value)}`

const getDefaultStatementLimitState = (): StatementEmailLimitState => ({
  dayKey: getStatementDayKey(),
  count: 0,
  lastSentAt: null,
})

const readStatementLimitState = (value: string): StatementEmailLimitState => {
  if (!value) {
    return getDefaultStatementLimitState()
  }

  const fallbackState = getDefaultStatementLimitState()

  try {
    const raw = localStorage.getItem(getStatementLimitStorageKey(value))
    if (!raw) {
      return fallbackState
    }

    const parsed = JSON.parse(raw) as Partial<StatementEmailLimitState>
    if (parsed.dayKey !== fallbackState.dayKey) {
      return fallbackState
    }

    return {
      dayKey: typeof parsed.dayKey === 'string' ? parsed.dayKey : fallbackState.dayKey,
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      lastSentAt: typeof parsed.lastSentAt === 'number' ? parsed.lastSentAt : null,
    }
  } catch {
    return fallbackState
  }
}

const writeStatementLimitState = (value: string, state: StatementEmailLimitState) => {
  if (!value) {
    return
  }

  localStorage.setItem(getStatementLimitStorageKey(value), JSON.stringify(state))
}

const recordStatementLimitLocally = (
  value: string,
  currentState?: StatementEmailLimitState | null,
  now = Date.now()
) => {
  if (!value) {
    return null
  }

  const baseState = currentState && currentState.dayKey === getStatementDayKey(new Date(now))
    ? currentState
    : readStatementLimitState(value)
  const nextState: StatementEmailLimitState = {
    dayKey: getStatementDayKey(new Date(now)),
    count: baseState.dayKey === getStatementDayKey(new Date(now)) ? baseState.count + 1 : 1,
    lastSentAt: now,
  }

  writeStatementLimitState(value, nextState)
  return nextState
}

const syncStatementLimitFromServer = (
  value: string,
  payload?: Partial<StatementEmailRateLimitPayload> | null
): StatementEmailLimitState | null => {
  if (!value || !payload) {
    return null
  }

  const nextState: StatementEmailLimitState = {
    dayKey: typeof payload.dayKey === 'string' ? payload.dayKey : getStatementDayKey(),
    count: typeof payload.count === 'number' ? payload.count : 0,
    lastSentAt: typeof payload.lastSentAt === 'number' ? payload.lastSentAt : null,
  }

  writeStatementLimitState(value, nextState)
  return nextState
}

const formatCooldown = (ms: number) => {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  if (seconds === 0) {
    return `${minutes}m`
  }

  return `${minutes}m ${seconds}s`
}

const getStatementLimitStatus = (state: StatementEmailLimitState, now: number) => {
  const currentState = state.dayKey === getStatementDayKey(new Date(now))
    ? state
    : getDefaultStatementLimitState()
  const remainingToday = Math.max(0, STATEMENT_EMAIL_DAILY_LIMIT - currentState.count)
  const cooldownRemainingMs = currentState.lastSentAt
    ? Math.max(0, STATEMENT_EMAIL_COOLDOWN_MS - (now - currentState.lastSentAt))
    : 0

  if (cooldownRemainingMs > 0) {
    return {
      isBlocked: true,
      reason: 'cooldown' as const,
      remainingToday,
      message: `Please wait ${formatCooldown(cooldownRemainingMs)} before sending another PDF statement.`,
    }
  }

  if (currentState.count >= STATEMENT_EMAIL_DAILY_LIMIT) {
    return {
      isBlocked: true,
      reason: 'daily' as const,
      remainingToday: 0,
      message: `Daily limit reached. You can send up to ${STATEMENT_EMAIL_DAILY_LIMIT} PDF statements per day.`,
    }
  }

  return {
    isBlocked: false,
    reason: null,
    remainingToday,
    message: `${remainingToday} of ${STATEMENT_EMAIL_DAILY_LIMIT} PDF emails remaining today.`,
  }
}

const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function StatementPage() {
  useEffect(() => {
    document.title = 'Generate Account Statements | FinTrack'
  }, [])

  const { unifiedRecords, loading, fetchLedger } = useLedger()
  const { user, email, refreshUser } = useAuth()
  const recipientEmail = user?.Email || email || ''

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1))
  })
  const [endDate, setEndDate] = useState(() => {
    return formatLocalDate(new Date())
  })

  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [emailLimitState, setEmailLimitState] = useState<StatementEmailLimitState>(() =>
    readStatementLimitState(recipientEmail)
  )
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    setEmailLimitState(readStatementLimitState(recipientEmail))
    setCurrentTime(Date.now())
  }, [recipientEmail])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [])

  // Format date strings
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatFullDateTime = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${datePart}, ${timePart}`
  }

  // Compute filtered records & stats
  const getStatementData = () => {
    const startMs = new Date(startDate + 'T00:00:00').getTime()
    const endMs = new Date(endDate + 'T23:59:59').getTime()

    const sorted = [...unifiedRecords].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())

    const filtered = sorted.filter(r => {
      const rTime = new Date(r.Date).getTime()
      return rTime >= startMs && rTime <= endMs
    })

    const priorRecords = sorted.filter(r => new Date(r.Date).getTime() < startMs)
    let startingBalance = user?.Balance || 0
    if (priorRecords.length > 0) {
      startingBalance = priorRecords[priorRecords.length - 1].Balance
    }

    const totalInflow = filtered.reduce((acc, r) => acc + (r.Credit || 0), 0)
    const totalOutflow = filtered.reduce((acc, r) => acc + (r.Debit || 0), 0)
    const endingBalance = filtered.length > 0
      ? filtered[filtered.length - 1].Balance
      : startingBalance

    // Category Breakdowns
    const spendingMap: { [cat: string]: number } = {}
    const incomeMap: { [cat: string]: number } = {}

    filtered.forEach(r => {
      if (r.Debit > 0) {
        const cat = r.Purpose || 'Other'
        spendingMap[cat] = (spendingMap[cat] || 0) + r.Debit
      }
      if (r.Credit > 0) {
        const cat = r.Purpose || 'Other'
        incomeMap[cat] = (incomeMap[cat] || 0) + r.Credit
      }
    })

    const spendingBreakdown = Object.entries(spendingMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    const incomeBreakdown = Object.entries(incomeMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    return {
      filteredRecords: filtered,
      startingBalance,
      totalInflow,
      totalOutflow,
      endingBalance,
      spendingBreakdown,
      incomeBreakdown
    }
  }

  const {
    filteredRecords,
    startingBalance,
    totalInflow,
    totalOutflow,
    endingBalance,
    spendingBreakdown,
    incomeBreakdown
  } = getStatementData()

  // Apply Quick Date Range Preset
  const applyPreset = (preset: 'this-month' | 'last-month' | 'last-30' | 'last-90' | 'this-year') => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (preset) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last-30':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last-90':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1)
        break
    }

    setStartDate(formatLocalDate(start))
    setEndDate(formatLocalDate(end))
    setToast(null)
  }

  // Generate CSV export
  const handleCSVDownload = () => {
    if (filteredRecords.length === 0) return

    const headers = ['Date & Time', 'Type', 'Category / Purpose', 'Payment Node', 'Debit (INR)', 'Credit (INR)', 'Balance (INR)']
    const rows = filteredRecords.map(r => [
      `"${formatFullDateTime(r.Date)}"`,
      `"${r.Credit > 0 ? 'Credit' : 'Debit'}"`,
      `"${r.Purpose || ''}"`,
      `"${r['Source of Payment'] || ''}"`,
      r.Debit > 0 ? r.Debit : '',
      r.Credit > 0 ? r.Credit : '',
      r.Balance
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FinTrack-Statement-${startDate}-to-${endDate}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const emailLimitStatus = getStatementLimitStatus(emailLimitState, currentTime)
  const canSendEmailStatement = !isSendingEmail && filteredRecords.length > 0 && !emailLimitStatus.isBlocked

  // Helper to build statement HTML template
  const buildStatementHtml = () => {
    return `
<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td>
        <h1 style="margin: 0; color: #4f46e5; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">FinTrack</h1>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Personal Expense & Financial Statement</p>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <span style="background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">STATEMENT</span>
      </td>
    </tr>
  </table>

  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <h3 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Account Holder</h3>
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">${user?.Name || 'N/A'}</p>
        <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">${user?.Email || email || 'N/A'}</p>
        ${user?.Phone ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Phone: ${user.Phone}</p>` : ''}
        ${user?.City ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">City: ${user.City}</p>` : ''}
      </td>
      <td style="width: 50%; vertical-align: top; text-align: right;">
        <h3 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Statement Period</h3>
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">${formatDateString(startDate)} to ${formatDateString(endDate)}</p>
        <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}</p>
      </td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
    <tr>
      <td style="width: 25%; padding-right: 6px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600;">Starting Balance</p>
          <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #0f172a;">₹${startingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </td>
      <td style="width: 25%; padding: 0 6px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #166534; font-weight: 600;">Total Inflow (+)</p>
          <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #15803d;">₹${totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </td>
      <td style="width: 25%; padding: 0 6px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #991b1b; font-weight: 600;">Total Outflow (-)</p>
          <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #b91c1c;">₹${totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </td>
      <td style="width: 25%; padding-left: 6px;">
        <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #3730a3; font-weight: 600;">Ending Balance</p>
          <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #4338ca;">₹${endingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </td>
    </tr>
  </table>

  <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; font-weight: 600;">Transaction History</h3>
  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; margin-bottom: 24px;">
    <thead>
      <tr style="border-bottom: 2px solid #e2e8f0; background: #f8fafc;">
        <th style="padding: 8px 10px; color: #475569; font-weight: 600; width: 24%;">Date & Time</th>
        <th style="padding: 8px 10px; color: #475569; font-weight: 600; width: 30%;">Purpose / Paid To</th>
        <th style="padding: 8px 10px; color: #475569; font-weight: 600; width: 16%;">Payment Node</th>
        <th style="padding: 8px 10px; color: #475569; font-weight: 600; text-align: right; width: 15%;">Amount</th>
        <th style="padding: 8px 10px; color: #475569; font-weight: 600; text-align: right; width: 15%;">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${filteredRecords.map((r, index) => {
        const isCredit = r.Credit > 0;
        const amount = isCredit ? r.Credit : r.Debit;
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 10px; color: #475569; font-family: monospace;">${formatFullDateTime(r.Date)}</td>
            <td style="padding: 8px 10px; font-weight: 500; color: #0f172a;">${r.Purpose || '-'}</td>
            <td style="padding: 8px 10px; color: #64748b;">${r['Source of Payment'] || '-'}</td>
            <td style="padding: 8px 10px; text-align: right; color: ${isCredit ? '#15803d' : '#b91c1c'}; font-weight: 600;">
              ${isCredit ? '+' : '-'} ₹${amount.toLocaleString('en-IN')}
            </td>
            <td style="padding: 8px 10px; text-align: right; color: #0f172a; font-weight: 600;">
              ₹${r.Balance.toLocaleString('en-IN')}
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h3 style="margin: 28px 0 12px 0; color: #0f172a; font-size: 14px; font-weight: 600;">Spending Breakdown</h3>
  ${spendingBreakdown.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0; background: #f8fafc;">
          <th style="padding: 8px 10px; color: #475569; font-weight: 600; width: 60%;">Category / Purpose</th>
          <th style="padding: 8px 10px; color: #475569; font-weight: 600; text-align: right; width: 40%;">Total Spent</th>
        </tr>
      </thead>
      <tbody>
        ${spendingBreakdown.map((item, index) => `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 10px; font-weight: 500; color: #0f172a;">${item.category}</td>
            <td style="padding: 8px 10px; text-align: right; color: #b91c1c; font-weight: 600;">₹${item.amount.toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `<p style="margin: 0 0 24px 0; font-size: 12px; color: #64748b; font-style: italic;">No expenses recorded in this statement period.</p>`}

  <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
    <p style="margin: 0;">This is a system generated statement of accounts for FinTrack.</p>
    <p style="margin: 4px 0 0 0;">Thank you for using FinTrack for your financial tracking needs.</p>
  </div>
</div>
    `
  }

  // Direct PDF Download Handler
  const handlePDFDownload = async () => {
    if (filteredRecords.length === 0) return
    setIsDownloadingPdf(true)
    setToast(null)

    try {
      const htmlContent = buildStatementHtml()
      const res = await axios.post(
        '/api/statement/download',
        {
          html: htmlContent,
          startDate,
          endDate,
        },
        { responseType: 'blob' }
      )

      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `FinTrack-Statement-${startDate}-to-${endDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setToast({ type: 'success', message: 'PDF statement downloaded directly!' })
    } catch (err: any) {
      console.error(err)
      setToast({ type: 'error', message: 'Failed to download PDF statement. Please try again.' })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Email PDF
  const sendEmailStatement = async () => {
    if (!recipientEmail) {
      setToast({ type: 'error', message: 'No account email is available for statement delivery.' })
      return
    }

    if (filteredRecords.length === 0) {
      setToast({ type: 'error', message: 'No transactions found in this date range to email.' })
      return
    }

    const latestLimitState = readStatementLimitState(recipientEmail)
    const latestLimitStatus = getStatementLimitStatus(latestLimitState, Date.now())

    if (latestLimitStatus.isBlocked) {
      setEmailLimitState(latestLimitState)
      setToast({ type: 'error', message: latestLimitStatus.message })
      return
    }

    setIsSendingEmail(true)
    setToast(null)

    const htmlContent = buildStatementHtml()

    try {
      const res = await axios.post('/api/statement/email', {
        email: recipientEmail,
        html: htmlContent,
        startDate,
        endDate
      })

      const syncedState = syncStatementLimitFromServer(recipientEmail, res.data?.rateLimit)
      const nextLimitState = syncedState || recordStatementLimitLocally(recipientEmail, emailLimitState)
      if (nextLimitState) {
        setEmailLimitState(nextLimitState)
      }

      setToast({ type: 'success', message: `PDF statement dispatched directly to ${recipientEmail}!` })
    } catch (err: any) {
      console.error(err)
      const syncedState = syncStatementLimitFromServer(recipientEmail, err.response?.data?.rateLimit)
      if (syncedState) {
        setEmailLimitState(syncedState)
      }
      setToast({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Statement request sent. You can also click Download PDF for instant access.'
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-200">

      {/* Filter Controls Section */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-md dark:shadow-xl dark:shadow-black/20 backdrop-blur-md">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Filter className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Statement Filters
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Select a date range or use quick presets to generate your financial statement.</p>
        </div>

        <div className="p-6 space-y-5">

          {/* Date Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium tracking-wider text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Start Date
              </label>
              <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 px-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setToast(null) }}
                  className="w-full h-10 px-3 text-zinc-900 dark:text-zinc-200 text-xs bg-transparent outline-none border-none cursor-pointer font-medium"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium tracking-wider text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> End Date
              </label>
              <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 px-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setToast(null) }}
                  className="w-full h-10 px-3 text-zinc-900 dark:text-zinc-200 text-xs bg-transparent outline-none border-none cursor-pointer font-medium"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Quick Date Presets</label>
            <div className="flex flex-wrap gap-2.5">
              {([
                { key: 'this-month', label: 'This Month' },
                { key: 'last-month', label: 'Last Month' },
                { key: 'last-30', label: 'Last 30 Days' },
                { key: 'last-90', label: 'Last 90 Days' },
                { key: 'this-year', label: 'This Year' },
              ] as const).map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className="py-2 px-3.5 text-[10px] font-semibold tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-850 rounded-lg cursor-pointer active:scale-95 transition-all uppercase"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="h-10 px-5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Bank Statement</span>
            </button>
            <button
              type="button"
              onClick={handleCSVDownload}
              disabled={filteredRecords.length === 0}
              className={`h-10 px-5 rounded-xl font-semibold cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs ${
                filteredRecords.length === 0
                  ? 'bg-zinc-100 dark:bg-zinc-850 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-850 cursor-not-allowed'
                  : 'bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePDFDownload}
              disabled={filteredRecords.length === 0 || isDownloadingPdf}
              className={`h-10 px-5 rounded-xl font-semibold cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs ${
                filteredRecords.length === 0
                  ? 'bg-zinc-100 dark:bg-zinc-850 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-850 cursor-not-allowed'
                  : 'bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
              }`}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={sendEmailStatement}
              disabled={!canSendEmailStatement}
              className={`h-10 px-5 rounded-xl font-semibold transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-xs ${
                !canSendEmailStatement
                  ? 'bg-zinc-100 dark:bg-zinc-850 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800/80 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-md'
              }`}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending PDF...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email PDF Statement</span>
                </>
              )}
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div className={`p-3 rounded-xl border text-[11px] font-semibold flex items-start gap-2.5 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{toast.message}</span>
            </div>
          )}

          {/* Email notice */}
          <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed bg-slate-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 p-3 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span>Statements are emailed to: </span>
              <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">{recipientEmail || 'No email found'}</strong>
              <p className="mt-1 text-zinc-500">
                Limit: {STATEMENT_EMAIL_DAILY_LIMIT} emails per day with a {Math.floor(STATEMENT_EMAIL_COOLDOWN_MS / 60000)} minute cooldown.
              </p>
              <p className={emailLimitStatus.isBlocked ? 'mt-1 text-amber-600 dark:text-amber-400' : 'mt-1 text-zinc-500'}>
                {emailLimitStatus.message}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Starting Balance */}
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-sm dark:shadow-lg dark:shadow-black/20">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-lg">
              <IndianRupee className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Starting Balance</span>
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">₹{startingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Total Inflow */}
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-sm dark:shadow-lg dark:shadow-black/20">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Total Inflow</span>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">₹{totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Total Outflow */}
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-sm dark:shadow-lg dark:shadow-black/20">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg">
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Total Outflow</span>
          </div>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">₹{totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Ending Balance */}
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-sm dark:shadow-lg dark:shadow-black/20">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Ending Balance</span>
          </div>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">₹{endingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Spending & Income Breakdown Side by Side */}
      {(spendingBreakdown.length > 0 || incomeBreakdown.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Spending Breakdown */}
          {spendingBreakdown.length > 0 && (
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl dark:shadow-black/20 backdrop-blur-md">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  Spending Breakdown
                </h3>
                <span className="text-[10px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 px-2 py-1 rounded-lg">
                  {spendingBreakdown.length} Categories
                </span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                {spendingBreakdown.map((item, i) => {
                  const pct = totalOutflow > 0 ? (item.amount / totalOutflow) * 100 : 0
                  return (
                    <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded">{pct.toFixed(1)}%</span>
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Income Breakdown */}
          {incomeBreakdown.length > 0 && (
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl dark:shadow-black/20 backdrop-blur-md">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  Income Breakdown
                </h3>
                <span className="text-[10px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 px-2 py-1 rounded-lg">
                  {incomeBreakdown.length} Sources
                </span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                {incomeBreakdown.map((item, i) => {
                  const pct = totalInflow > 0 ? (item.amount / totalInflow) * 100 : 0
                  return (
                    <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded">{pct.toFixed(1)}%</span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction History Table */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl dark:shadow-black/20 backdrop-blur-md">
        <div className="px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Filtered Transactions
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {formatDateString(startDate)} – {formatDateString(endDate)}
            </p>
          </div>
          <span className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 px-2.5 py-1.5 rounded-lg shadow-sm">
            {filteredRecords.length} Records
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 font-medium tracking-wider uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800/60 font-mono">
                <th className="px-6 py-3.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> Date & Time</th>
                <th className="px-6 py-3.5">Purpose / Paid To</th>
                <th className="px-6 py-3.5">Payment Node</th>
                <th className="px-6 py-3.5 text-right">Debit (-)</th>
                <th className="px-6 py-3.5 text-right">Credit (+)</th>
                <th className="px-6 py-3.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 font-sans text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500 dark:text-indigo-400 mx-auto mb-2" />
                    <p className="text-zinc-500 text-xs">Loading transaction data...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <FileText className="w-6 h-6 text-zinc-400 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-700 dark:text-zinc-500 text-xs font-medium">No transactions found in this date range.</p>
                    <p className="text-zinc-500 dark:text-zinc-600 text-[10px] mt-1">Try changing the start/end dates or use a preset above.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isCredit = record.Credit > 0
                  return (
                    <tr key={record._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">
                        {formatFullDateTime(record.Date)}
                      </td>
                      <td className="px-6 py-4 text-zinc-900 dark:text-zinc-200 font-medium whitespace-nowrap">
                        {record.Purpose || '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                        {record['Source of Payment'] || '-'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {record.Debit > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                            -₹{record.Debit.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {record.Credit > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                            +₹{record.Credit.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">-</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-right whitespace-nowrap font-bold tabular-nums ${isCredit ? 'text-emerald-600 dark:text-emerald-300/80' : 'text-zinc-800 dark:text-zinc-300'}`}>
                        ₹{record.Balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Bank Statement Auto-Importer Modal */}
      <StatementImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={async (count) => {
          await fetchLedger()
          await refreshUser()
          setToast({
            type: 'success',
            message: `Successfully imported ${count} transactions from bank statement! Running balances updated.`
          })
        }}
      />

    </div>
  )
}
