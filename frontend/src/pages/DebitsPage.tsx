import { useState, useEffect } from 'react'
import { useLedger } from '../hooks/useLedger'
import { useAuth } from '../hooks/useAuth'
import {
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronDown,
  Calendar,
  FileText,
  Edit,
  Trash2,
  Settings,
  Handshake
} from 'lucide-react'

// Helper to get local date-time string formatted for datetime-local inputs
const getLocalDateTimeString = (date = new Date()) => {
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

// Payment method brand custom SVG icons - standardized to w-4 h-4
const PhonePeIcon = () => (
  <svg className="w-4 h-4 rounded-sm shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#5F259F"/>
    <path d="M12 4a3.5 3.5 0 00-3.5 3.5v9a3.5 3.5 0 007 0v-9A3.5 3.5 0 0012 4zm2 12.5a2 2 0 11-4 0v-1.5h4v1.5zm0-3.5h-4V7.5a2 2 0 114 0V13z" fill="white"/>
  </svg>
)

const GPayIcon = () => (
  <svg className="w-4 h-4 bg-white rounded-sm border border-zinc-700 p-0.5 shrink-0" viewBox="0 0 40 40" fill="none">
    <path d="M20 8c-6.63 0-12 5.37-12 12s5.37 12 12 12c3.67 0 6.96-1.65 9.2-4.24l-3.12-3.12A7.54 7.54 0 0120 26.4c-3.53 0-6.4-2.87-6.4-6.4s2.87-6.4 6.4-6.4c1.92 0 3.65.85 4.86 2.19l3.12-3.12A11.93 11.93 0 0020 8z" fill="#4285F4"/>
    <path d="M29.6 17.6h-6.4v4.8h6.4v-4.8z" fill="#34A853"/>
    <path d="M28 14.4h-3.2v11.2H28V14.4z" fill="#EA4335"/>
    <path d="M26.4 12.8H24.8V28.8h1.6V12.8z" fill="#FBBC05"/>
  </svg>
)

const PaytmIcon = () => (
  <svg className="w-4 h-4 rounded-sm shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#002E7E"/>
    <text x="12" y="15" textAnchor="middle" fill="#00B9F5" fontSize="7" fontFamily="system-ui, sans-serif" fontWeight="900">Paytm</text>
  </svg>
)

const SuperMoneyIcon = () => (
  <svg className="w-4 h-4 rounded-sm shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#0A0B0D"/>
    <path d="M12 5l1.5 5.5H19l-4.5 3.5 1.5 5.5-4-3.5-4 3.5 1.5-5.5L7 10.5h5.5L12 5z" fill="#10B981"/>
  </svg>
)

const AmazonPayIcon = () => (
  <svg className="w-4 h-4 rounded-sm bg-zinc-900 border border-zinc-700 p-0.5 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M16.4 14.5c-.7.6-1.7.9-2.7.9-2.1 0-3.6-1.3-3.6-3.4 0-2.4 1.8-3.7 4.5-3.7h1.8v.8c0 1.2-.5 2-1.8 2-1 0-1.7-.5-1.7-1.3 0-.9.9-1.4 2.1-1.4h1.4v6.2h-1.8v-.6zm-1.8-4.5c-1.1 0-1.6.4-1.6.9 0 .5.4.8 1.1.8s1.6-.4 1.6-1v-.7h-1.1z" fill="white"/>
    <path d="M6 18c3.5 2 8.5 2 12 0" stroke="#FF9900" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M16.5 16.5l1.5 1.5-.5 1" stroke="#FF9900" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const PopUpiIcon = () => (
  <svg className="w-4 h-4 rounded-sm shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#E11D48"/>
    <text x="12" y="15" textAnchor="middle" fill="white" fontSize="8" fontFamily="system-ui, sans-serif" fontWeight="900">POP</text>
  </svg>
)

const CashIcon = () => (
  <svg className="w-4 h-4 rounded-sm bg-emerald-600 p-0.5 shrink-0" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5"/>
    <path d="M6 12h1M17 12h1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const OtherIcon = () => (
  <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

// Category visual custom SVG icons
const BusIcon = () => (
  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 18h8M6 12h12M6 8h12M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
  </svg>
)

const RentIcon = () => (
  <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const LunchIcon = () => (
  <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M6 6l12 12M6 18L12 12" />
  </svg>
)

const SweetIcon = () => (
  <svg className="w-4 h-4 text-pink-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v2m0 8v2M6 12h2m8 0h2" />
  </svg>
)

const DrinkIcon = () => (
  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M12 2v4M8 6h8l-2 15H10L8 6z" />
  </svg>
)

const TransferIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const TeaIcon = () => (
  <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h10v2a3 3 0 01-3 3H9a3 3 0 01-3-3v-2zm10-3h1a2 2 0 012 2v1a2 2 0 01-2 2h-1M9 3v4M13 3v4M5 10h14" />
  </svg>
)

const OrderIcon = () => (
  <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

const LentIcon = () => <Handshake className="w-4 h-4 text-indigo-400 shrink-0" />

export function DebitsPage() {
  useEffect(() => {
    document.title = 'Expenses & Spendings | FinTrack'
  }, [])

  const {
    debits,
    loading,
    error,
    addDebit,
    fetchDebits,
    deleteDebit,
    updateDebit,
  } = useLedger()
  const { email } = useAuth()

  const [amountInput, setAmountInput] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('GPay')
  const [otherPaymentMethodText, setOtherPaymentMethodText] = useState('')
  const [selectedPaidTo, setSelectedPaidTo] = useState('')
  const [otherPaidToText, setOtherPaidToText] = useState('')
  const [dateInput, setDateInput] = useState(() => getLocalDateTimeString())
  const [noteInput, setNoteInput] = useState('')
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isPaidToOpen, setIsPaidToOpen] = useState(false)
  const [buttonState, setButtonState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState('')
  const [editOtherPaymentMethodText, setEditOtherPaymentMethodText] = useState('')
  const [editPaidTo, setEditPaidTo] = useState('')
  const [editOtherPaidToText, setEditOtherPaidToText] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false)
  const [isEditPaidToOpen, setIsEditPaidToOpen] = useState(false)
  const [editButtonState, setEditButtonState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<any | null>(null)
  const [deleteButtonState, setDeleteButtonState] = useState<'idle' | 'deleting' | 'deleted' | 'error'>('idle')

  // Custom Presets State
  const [presetItems, setPresetItems] = useState<any[]>([])
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false)
  const [newPresetLabel, setNewPresetLabel] = useState('')
  const [newPresetAmount, setNewPresetAmount] = useState('')
  const [newPresetPaidTo, setNewPresetPaidTo] = useState('Bus Ticket')
  const [newPresetOtherPaidToText, setNewPresetOtherPaidToText] = useState('')
  const [isNewPresetPaidToOpen, setIsNewPresetPaidToOpen] = useState(false)

  const DEFAULT_DEBIT_PRESETS = [
    { label: '🚌 Bus', amount: 12, paidTo: 'Bus Ticket' },
    { label: '🏠 Rent', amount: 7800, paidTo: 'PG Rent' },
    { label: '🍱 Lunch', amount: 150, paidTo: 'Lunch Meal' },
    { label: '☕ Tea', amount: 20, paidTo: 'Tea' },
  ]

  useEffect(() => {
    if (!email) return
    const stored = localStorage.getItem(`fintrack_presets_debit_${email}`) || localStorage.getItem(`walletinsights_presets_debit_${email}`)
    if (stored) {
      try {
        setPresetItems(JSON.parse(stored))
      } catch (e) {
        setPresetItems(DEFAULT_DEBIT_PRESETS)
      }
    } else {
      setPresetItems(DEFAULT_DEBIT_PRESETS)
      localStorage.setItem(`fintrack_presets_debit_${email}`, JSON.stringify(DEFAULT_DEBIT_PRESETS))
    }
  }, [email])

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(newPresetAmount)
    if (!newPresetLabel.trim() || isNaN(amt) || amt <= 0) return

    const finalPaidTo = newPresetPaidTo === 'Other' ? newPresetOtherPaidToText : newPresetPaidTo
    const newPreset = {
      label: newPresetLabel.trim(),
      amount: amt,
      paidTo: finalPaidTo || 'Other'
    }

    const updated = [...presetItems, newPreset]
    setPresetItems(updated)
    if (email) {
      localStorage.setItem(`fintrack_presets_debit_${email}`, JSON.stringify(updated))
    }

    // Reset form
    setNewPresetLabel('')
    setNewPresetAmount('')
    setNewPresetPaidTo('Bus Ticket')
    setNewPresetOtherPaidToText('')
  }

  const handleDeletePreset = (indexToDelete: number) => {
    const updated = presetItems.filter((_, idx) => idx !== indexToDelete)
    setPresetItems(updated)
    if (email) {
      localStorage.setItem(`fintrack_presets_debit_${email}`, JSON.stringify(updated))
    }
  }

  const paymentMethods = [
    { value: 'PhonePe', label: 'PhonePe', icon: <PhonePeIcon /> },
    { value: 'GPay', label: 'GPay', icon: <GPayIcon /> },
    { value: 'Paytm', label: 'Paytm', icon: <PaytmIcon /> },
    { value: 'Super Money', label: 'Super Money', icon: <SuperMoneyIcon /> },
    { value: 'Amazon Pay', label: 'Amazon Pay', icon: <AmazonPayIcon /> },
    { value: 'Pop UPI', label: 'Pop UPI', icon: <PopUpiIcon /> },
    { value: 'Cash', label: 'Cash', icon: <CashIcon /> },
    { value: 'Other', label: 'Other', icon: <OtherIcon /> },
  ]

  const paidToOptions = [
    { value: 'Bus Ticket', label: 'Bus Ticket', icon: <BusIcon /> },
    { value: 'PG Rent', label: 'PG Rent', icon: <RentIcon /> },
    { value: 'Lunch Meal', label: 'Lunch Meal', icon: <LunchIcon /> },
    { value: 'Sweet/Snacks', label: 'Sweet/Snacks', icon: <SweetIcon /> },
    { value: 'Cold Drinks', label: 'Cold Drinks', icon: <DrinkIcon /> },
    { value: 'UPI Transfer', label: 'UPI Transfer', icon: <TransferIcon /> },
    { value: 'Tea', label: 'Tea', icon: <TeaIcon /> },
    { value: 'Online Order', label: 'Online Order', icon: <OrderIcon /> },
    { value: 'Lent / Loan', label: 'Lent / Loan', icon: <LentIcon /> },
    { value: 'Other', label: 'Other', icon: <OtherIcon /> },
  ]

  const handlePresetSelect = (amount: number, paidTo: string) => {
    setAmountInput(amount.toString())
    setSelectedPaidTo(paidTo)
    setOtherPaidToText('')
    setDateInput(getLocalDateTimeString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amountInput)
    if (isNaN(amt) || amt <= 0) return

    setButtonState('saving')
    const finalPaymentMethod = selectedPaymentMethod === 'Other' ? otherPaymentMethodText : selectedPaymentMethod
    const finalPaidTo = selectedPaidTo === 'Other'
      ? otherPaidToText
      : selectedPaidTo === 'Lent / Loan'
        ? `Lent / Loan: ${otherPaidToText}`
        : selectedPaidTo

    const success = await addDebit(
      amt,
      finalPaymentMethod,
      finalPaidTo,
      noteInput,
      new Date(dateInput).toISOString()
    )

    if (success !== null) {
      if (selectedPaidTo === 'Lent / Loan') {
        const storageKey = `fintrack_peer_loans_${email}`
        let list = []
        try {
          const stored = localStorage.getItem(storageKey) || localStorage.getItem(`walletinsights_peer_loans_${email}`)
          if (stored) list = JSON.parse(stored)
        } catch (e) {
          console.error(e)
        }
        const newLoan = {
          id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'lend' as const,
          contact: otherPaidToText.trim() || 'Borrower',
          amount: amt,
          purpose: noteInput.trim() || 'Lent / Loan',
          date: dateInput.split('T')[0],
          status: 'active' as const
        }
        localStorage.setItem(storageKey, JSON.stringify([newLoan, ...list]))
      }

      setButtonState('saved')
      setAmountInput('')
      setSelectedPaymentMethod('GPay')
      setOtherPaymentMethodText('')
      setSelectedPaidTo('')
      setOtherPaidToText('')
      setDateInput(getLocalDateTimeString())
      setNoteInput('')
      setTimeout(() => setButtonState('idle'), 1800)
    } else {
      setButtonState('error')
      setTimeout(() => setButtonState('idle'), 1800)
    }
  }

  const handleEditClick = (record: any) => {
    setEditingRecord(record)
    setEditAmount(record.Amount.toString())
    
    // Check if payment method is in predefined options
    const isMethodPredefined = paymentMethods.some(o => o.value === record['Payment Method'] && o.value !== 'Other')
    if (isMethodPredefined) {
      setEditPaymentMethod(record['Payment Method'])
      setEditOtherPaymentMethodText('')
    } else {
      setEditPaymentMethod('Other')
      setEditOtherPaymentMethodText(record['Payment Method'] || '')
    }

    // Check if Paid to is in predefined options
    const isPaidToPredefined = paidToOptions.some(o => o.value === record['Paid to'] && o.value !== 'Other')
    if (isPaidToPredefined) {
      setEditPaidTo(record['Paid to'])
      setEditOtherPaidToText('')
    } else {
      setEditPaidTo('Other')
      setEditOtherPaidToText(record['Paid to'] || '')
    }

    // Format date correctly for datetime-local (YYYY-MM-DDTHH:mm)
    const dateObj = new Date(record.Date)
    setEditDate(getLocalDateTimeString(dateObj))
    setEditNote(record.Note || '')
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord) return
    const amt = parseFloat(editAmount)
    if (isNaN(amt) || amt <= 0) return

    setEditButtonState('saving')
    const finalPaymentMethod = editPaymentMethod === 'Other' ? editOtherPaymentMethodText : editPaymentMethod
    const finalPaidTo = editPaidTo === 'Other' ? editOtherPaidToText : editPaidTo

    const success = await updateDebit(
      editingRecord._id,
      editingRecord.Amount,
      amt,
      editingRecord['Paid to'],
      finalPaidTo,
      editingRecord.Date,
      new Date(editDate).toISOString(),
      finalPaidTo,
      finalPaymentMethod,
      editNote
    )

    if (success) {
      setEditButtonState('saved')
      setTimeout(() => {
        setIsEditOpen(false)
        setEditingRecord(null)
        setEditButtonState('idle')
      }, 1000)
    } else {
      setEditButtonState('error')
      setTimeout(() => setEditButtonState('idle'), 1500)
    }
  }

  const handleDeleteClick = (record: any) => {
    setDeletingRecord(record)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return
    setDeleteButtonState('deleting')

    const success = await deleteDebit(
      deletingRecord._id,
      deletingRecord.Amount,
      deletingRecord['Paid to'],
      deletingRecord.Date
    )

    if (success) {
      setDeleteButtonState('deleted')
      setTimeout(() => {
        setIsDeleteOpen(false)
        setDeletingRecord(null)
        setDeleteButtonState('idle')
      }, 1000)
    } else {
      setDeleteButtonState('error')
      setTimeout(() => setDeleteButtonState('idle'), 1500)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2 sm:p-4 md:p-6 text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-200">
      
      {/* Alert Message for API Errors */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Record Debit Form Container */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-md dark:shadow-xl dark:shadow-black/40">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
              <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Record New Expense
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Log internal financial debits and transactions securely.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            
            {/* Quick Presets */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Quick Presets</span>
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(true)}
                  className="p-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg cursor-pointer transition-all active:scale-90 flex items-center gap-1 text-[10px] font-medium"
                  title="Customize Presets"
                >
                  <Settings className="w-3 h-3 text-zinc-400" />
                  <span>Customize</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {presetItems.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset.amount, preset.paidTo)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/40 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-[11px] text-zinc-700 dark:text-zinc-300 rounded-lg transition-all duration-150 cursor-pointer active:scale-95 hover:border-zinc-300 dark:hover:border-zinc-600 font-medium"
                  >
                    {preset.label}
                  </button>
                ))}
                {presetItems.length === 0 && (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">No presets. Click Customize to add.</span>
                )}
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Amount (₹) <span className="text-rose-600 dark:text-rose-400 font-bold ml-0.5">*</span>
              </label>
              <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/10 transition-all duration-150 shadow-inner flex items-center">
                <span className="pl-3.5 font-mono text-zinc-400">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 md:h-11 px-2 pr-4 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Payment Method Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Payment Method <span className="text-rose-600 dark:text-rose-400 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentOpen(!isPaymentOpen)
                    setIsPaidToOpen(false)
                  }}
                  disabled={loading}
                  className="w-full h-12 md:h-11 px-3.5 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all duration-150 text-zinc-800 dark:text-zinc-200 text-base md:text-sm font-medium cursor-pointer focus:border-zinc-300 dark:focus:border-zinc-700"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {paymentMethods.find(m => m.value === selectedPaymentMethod)?.icon}
                    <span className="truncate">{selectedPaymentMethod || 'Select Method'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform duration-200" style={{ transform: isPaymentOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
              </div>

              {isPaymentOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPaymentOpen(false)} />
                  <div className="absolute left-0 top-[calc(100%+6px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 overflow-y-auto max-h-56 animate-in fade-in zoom-in-95 duration-100">
                    {paymentMethods.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMethod(opt.value)
                          setIsPaymentOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors duration-100 cursor-pointer font-medium"
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Other Payment Method Input */}
            {selectedPaymentMethod === 'Other' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Specify Method</label>
                <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-150">
                  <input
                    type="text"
                    required
                    placeholder="Type custom method..."
                    value={otherPaymentMethodText}
                    onChange={(e) => setOtherPaymentMethodText(e.target.value)}
                    disabled={loading}
                    className="w-full h-11 px-3.5 text-zinc-900 dark:text-zinc-200 text-sm bg-transparent outline-none border-none placeholder:text-zinc-400"
                  />
                </div>
              </div>
            )}

            {/* Paid To Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Paid To</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaidToOpen(!isPaidToOpen)
                    setIsPaymentOpen(false)
                  }}
                  disabled={loading}
                  className="w-full h-11 px-3.5 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all duration-150 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer focus:border-zinc-300 dark:focus:border-zinc-700"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {selectedPaidTo ? (
                      <>
                        {paidToOptions.find(o => o.value === selectedPaidTo)?.icon}
                        <span className="truncate">{selectedPaidTo}</span>
                      </>
                    ) : (
                      <span className="text-zinc-500 text-sm">Select Category</span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform duration-200" style={{ transform: isPaidToOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
              </div>

              {isPaidToOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPaidToOpen(false)} />
                  <div className="absolute left-0 top-[calc(100%+6px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 overflow-y-auto max-h-56 animate-in fade-in zoom-in-95 duration-100">
                    {paidToOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedPaidTo(opt.value)
                          setIsPaidToOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors duration-100 cursor-pointer font-medium"
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Other Paid To Input */}
            {(selectedPaidTo === 'Other' || selectedPaidTo === 'Lent / Loan') && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  {selectedPaidTo === 'Lent / Loan' ? 'Specify Peer / Contact Name' : 'Specify Custom Name'}
                </label>
                <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-150">
                  <input
                    type="text"
                    required
                    placeholder={selectedPaidTo === 'Lent / Loan' ? "Enter peer contact name..." : "Type name here..."}
                    value={otherPaidToText}
                    onChange={(e) => setOtherPaidToText(e.target.value)}
                    disabled={loading}
                    className="w-full h-11 px-3.5 text-zinc-900 dark:text-zinc-200 text-sm bg-transparent outline-none border-none placeholder:text-zinc-400"
                  />
                </div>
              </div>
            )}

            {/* Date Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Date <span className="text-rose-600 dark:text-rose-400 font-bold ml-0.5">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-150 flex items-center">
                  <input
                    type="datetime-local"
                    required
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 md:h-11 px-3.5 text-zinc-900 dark:text-zinc-200 text-base md:text-sm bg-transparent outline-none border-none font-medium text-left cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDateInput(getLocalDateTimeString())}
                  className="w-full sm:w-auto px-4 h-12 md:h-11 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-base md:text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  Now
                </button>
              </div>
            </div>

            {/* Note Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Note (Optional)</label>
              <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-150">
                <textarea
                  rows={2}
                  placeholder="Include extra metadata or context..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-3 bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 resize-none font-medium"
                />
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !amountInput || (selectedPaymentMethod === 'Other' && !otherPaymentMethodText)}
                className={`w-full h-11 rounded-xl text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 ${
                  buttonState === 'saving'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-200 dark:border-zinc-700/50'
                    : buttonState === 'saved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : buttonState === 'error'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-zinc-900/10'
                }`}
              >
                {buttonState === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Outflow...
                  </>
                ) : buttonState === 'saved' ? (
                  'Saved Successfully ✓'
                ) : buttonState === 'error' ? (
                  'Transaction Error ✗'
                ) : (
                  'Submit Record'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Debits History Table List */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col shadow-md dark:shadow-xl backdrop-blur-md">
          <div className="px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Debits Log History
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Real-time ledger updates and transaction histories.</p>
            </div>
            <button
              onClick={fetchDebits}
              disabled={loading}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl cursor-pointer active:scale-95 transition-all"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600 dark:text-rose-400' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 font-medium tracking-wider uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800/60">
                  <th className="px-6 py-3.5 text-left">Actions</th>
                  <th className="px-6 py-3.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> Date</th>
                  <th className="px-6 py-3.5">Paid To</th>
                  <th className="px-6 py-3.5">Payment Node</th>
                  <th className="px-6 py-3.5 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 font-sans text-sm">
                {debits.map((record) => (
                  <tr key={record._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 text-left whitespace-nowrap">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => handleEditClick(record)}
                          className="p-1.5 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-lg cursor-pointer transition-all active:scale-90"
                          title="Edit Transaction"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-450 rounded-lg cursor-pointer transition-all active:scale-90"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">
                      {formatDate(record.Date)}
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-200 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {paidToOptions.find(o => o.value === record['Paid to'])?.icon || <FileText className="w-4 h-4 text-zinc-400" />}
                        <span>{record['Paid to']}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium">
                        {paymentMethods.find(o => o.value === record['Payment Method'])?.icon}
                        <span>{record['Payment Method']}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      -₹{record.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {debits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-zinc-400 dark:text-zinc-500 italic font-normal">
                      {loading ? 'Processing asset entries...' : 'No debit balances or logs initialized.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Edit Debit Modal */}
      {isEditOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-xs">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Edit Expense Record
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Modify current transaction values in the master ledger.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Amount Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  Amount (₹) <span className="text-rose-600 dark:text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-rose-500/50 transition-all duration-150">
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full h-12 md:h-10 px-3 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Node Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    Payment Method
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditPaymentOpen(!isEditPaymentOpen)
                      setIsEditPaidToOpen(false)
                    }}
                    className="w-full h-12 md:h-10 px-3 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 text-base md:text-sm font-medium cursor-pointer"
                  >
                    <span className="text-xs truncate">
                      {editPaymentMethod || 'Select Method'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {isEditPaymentOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsEditPaymentOpen(false)} />
                      <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1 z-50 overflow-y-auto max-h-40">
                        {paymentMethods.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setEditPaymentMethod(opt.value)
                              setIsEditPaymentOpen(false)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Paid To Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    Paid To / Category
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditPaidToOpen(!isEditPaidToOpen)
                      setIsEditPaymentOpen(false)
                    }}
                    className="w-full h-10 px-3 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                  >
                    <span className="text-xs truncate">
                      {editPaidTo || 'Select Category'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {isEditPaidToOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsEditPaidToOpen(false)} />
                      <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1 z-50 overflow-y-auto max-h-40">
                        {paidToOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setEditPaidTo(opt.value)
                              setIsEditPaidToOpen(false)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Other Payment Method Text Input */}
              {editPaymentMethod === 'Other' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Specify Method</label>
                  <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950">
                    <input
                      type="text"
                      required
                      placeholder="Specify payment method..."
                      value={editOtherPaymentMethodText}
                      onChange={(e) => setEditOtherPaymentMethodText(e.target.value)}
                      className="w-full h-12 md:h-10 px-3 text-zinc-900 dark:text-zinc-200 text-base md:text-xs bg-transparent outline-none border-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Other Paid To Text Input */}
              {editPaidTo === 'Other' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Specify Category</label>
                  <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950">
                    <input
                      type="text"
                      required
                      placeholder="Specify custom category..."
                      value={editOtherPaidToText}
                      onChange={(e) => setEditOtherPaidToText(e.target.value)}
                      className="w-full h-10 px-3 text-zinc-900 dark:text-zinc-200 text-xs bg-transparent outline-none border-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Date Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Date</label>
                <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950">
                  <input
                    type="datetime-local"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full h-12 md:h-10 px-3 text-zinc-900 dark:text-zinc-200 text-base md:text-xs bg-transparent outline-none border-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Note Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Note (Optional)</label>
                <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950">
                  <textarea
                    rows={2}
                    placeholder="Transaction details..."
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border-none outline-none text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 resize-none font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false)
                    setEditingRecord(null)
                  }}
                  className="flex-1 h-12 md:h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 text-base md:text-sm font-semibold cursor-pointer active:scale-[0.98] transition-all bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || editButtonState === 'saving'}
                  className={`flex-1 h-12 md:h-10 rounded-xl font-semibold transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    editButtonState === 'saving'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-800/80 cursor-not-allowed'
                      : editButtonState === 'saved'
                      ? 'bg-rose-600 text-white'
                      : editButtonState === 'error'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200'
                  }`}
                >
                  {editButtonState === 'saving' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : editButtonState === 'saved' ? (
                    'Updated ✓'
                  ) : editButtonState === 'error' ? (
                    'Failed ✗'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Debit Modal */}
      {isDeleteOpen && deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-zinc-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-150 text-xs">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-500 animate-pulse" />
                Confirm Expense Deletion
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">This operation is permanent. Please review the details below.</p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4.5 space-y-3 font-medium text-zinc-700 dark:text-zinc-300">
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
                <span className="text-zinc-500 font-normal">Amount:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">-₹{deletingRecord.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
                <span className="text-zinc-500 font-normal">Category / Paid to:</span>
                <span>{deletingRecord['Paid to']}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
                <span className="text-zinc-500 font-normal">Payment Method:</span>
                <span>{deletingRecord['Payment Method']}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-normal">Date:</span>
                <span className="font-mono">{formatDate(deletingRecord.Date)}</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-200">Wallet Impact Notice</p>
                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Deleting this expense will increase your wallet balance by <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">₹{deletingRecord.Amount.toLocaleString()}</span>. This change propagates to the unified cash flow ledger instantly.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false)
                  setDeletingRecord(null)
                }}
                className="flex-1 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer active:scale-[0.98] transition-all bg-transparent"
              >
                Keep Record
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loading || deleteButtonState === 'deleting'}
                className={`flex-1 h-10 rounded-xl font-semibold transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                  deleteButtonState === 'deleting'
                    ? 'bg-rose-900/40 text-rose-500/50 border border-rose-900/60 cursor-not-allowed'
                    : deleteButtonState === 'deleted'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    : 'bg-rose-600 text-white hover:bg-rose-500'
                }`}
              >
                {deleteButtonState === 'deleting' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : deleteButtonState === 'deleted' ? (
                  'Deleted ✓'
                ) : deleteButtonState === 'error' ? (
                  'Error ✗'
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Presets Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  Customize Expense Presets
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Define custom presets to autofill the record forms instantly.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Existing Presets List */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Existing Presets</span>
              <div className="border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/60 bg-slate-50 dark:bg-zinc-950/50">
                {presetItems.map((preset, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs">{preset.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-400 rounded-md">
                          {preset.paidTo}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Amount: <span className="font-mono font-bold text-rose-600 dark:text-rose-400">₹{preset.amount}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(idx)}
                      className="p-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer transition-all active:scale-90"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {presetItems.length === 0 && (
                  <div className="p-6 text-center text-zinc-400 italic">No custom presets configured. Add one below!</div>
                )}
              </div>
            </div>

            {/* Add New Preset Form */}
            <form onSubmit={handleAddPreset} className="space-y-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Add New Preset</span>
              
              <div className="grid grid-cols-2 gap-3.5">
                {/* Preset Label */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Preset Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🍱 Lunch"
                    value={newPresetLabel}
                    onChange={(e) => setNewPresetLabel(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-200 text-xs outline-none"
                  />
                </div>

                {/* Preset Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={newPresetAmount}
                    onChange={(e) => setNewPresetAmount(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-200 text-xs outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Preset Paid To / Category */}
              <div className="space-y-1 relative">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Paid To / Category</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNewPresetPaidToOpen(!isNewPresetPaidToOpen)}
                    className="w-full h-10 px-3 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                  >
                    <span className="text-xs truncate">{newPresetPaidTo}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {isNewPresetPaidToOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNewPresetPaidToOpen(false)} />
                      <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1 z-50 overflow-y-auto max-h-40">
                        {paidToOptions.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setNewPresetPaidTo(opt.value)
                              setIsNewPresetPaidToOpen(false)
                            }}
                            className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer font-medium"
                          >
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Other Paid To Specifier */}
              {newPresetPaidTo === 'Other' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Specify Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subscriptions"
                    value={newPresetOtherPaidToText}
                    onChange={(e) => setNewPresetOtherPaidToText(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-200 text-xs outline-none"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="flex-1 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer active:scale-[0.98] transition-all bg-transparent"
                >
                  Close Manager
                </button>
                <button
                  type="submit"
                  disabled={!newPresetLabel || !newPresetAmount}
                  className="flex-1 h-10 rounded-xl font-semibold transition-all cursor-pointer active:scale-[0.98] bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}