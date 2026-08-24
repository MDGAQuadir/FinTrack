import { useState, useEffect } from 'react'
import { useLedger } from '../hooks/useLedger'
import { useAuth } from '../hooks/useAuth'
import {
  PlusCircle,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  Briefcase,
  Code,
  TrendingUp as TrendIcon,
  Gift,
  RotateCcw,
  Landmark,
  FileCheck,
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

// Payment method brand custom SVG icons - standardized and streamlined
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

const SalaryIcon = () => <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
const FreelanceIcon = () => <Code className="w-4 h-4 text-cyan-400 shrink-0" />
const InvestmentIcon = () => <TrendIcon className="w-4 h-4 text-indigo-400 shrink-0" />
const GiftIcon = () => <Gift className="w-4 h-4 text-rose-400 shrink-0" />
const RefundIcon = () => <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
const BorrowedIcon = () => <Handshake className="w-4 h-4 text-indigo-400 shrink-0" />

export function CreditsPage() {
  useEffect(() => {
    document.title = 'Incomes & Earnings | FinTrack'
  }, [])

  const { credits, loading, error, addCredit, fetchCredits, deleteCredit, updateCredit } = useLedger()
  const { email } = useAuth()

  const [amountInput, setAmountInput] = useState('')
  const [selectedSourceOfPayment, setSelectedSourceOfPayment] = useState('Bank Transfer')
  const [otherSourceText, setOtherSourceText] = useState('')
  const [selectedPurpose, setSelectedPurpose] = useState('')
  const [otherPurposeText, setOtherPurposeText] = useState('')
  const [creditedFromInput, setCreditedFromInput] = useState('')
  const [dateInput, setDateInput] = useState(() => getLocalDateTimeString())
  const [noteInput, setNoteInput] = useState('')
  
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [isPurposeOpen, setIsPurposeOpen] = useState(false)
  const [buttonState, setButtonState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editSourceOfPayment, setEditSourceOfPayment] = useState('')
  const [editOtherSourceText, setEditOtherSourceText] = useState('')
  const [editPurpose, setEditPurpose] = useState('')
  const [editOtherPurposeText, setEditOtherPurposeText] = useState('')
  const [editCreditedFrom, setEditCreditedFrom] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [isEditSourceOpen, setIsEditSourceOpen] = useState(false)
  const [isEditPurposeOpen, setIsEditPurposeOpen] = useState(false)
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
  const [newPresetPurpose, setNewPresetPurpose] = useState('Salary')
  const [newPresetOtherPurposeText, setNewPresetOtherPurposeText] = useState('')
  const [newPresetCreditedFrom, setNewPresetCreditedFrom] = useState('')
  const [isNewPresetPurposeOpen, setIsNewPresetPurposeOpen] = useState(false)

  const DEFAULT_CREDIT_PRESETS = [
    { label: '💼 Salary', amount: 5000, purpose: 'Salary', creditedFrom: 'Corporate Workspace' },
    { label: '💻 Freelance', amount: 1500, purpose: 'Freelance', creditedFrom: 'Client Project' },
    { label: '📈 Dividend', amount: 250, purpose: 'Investments', creditedFrom: 'Broker Account' },
    { label: '🎁 Gift', amount: 100, purpose: 'Gift', creditedFrom: 'Family member' },
  ]

  useEffect(() => {
    if (!email) return
    const stored = localStorage.getItem(`fintrack_presets_credit_${email}`) || localStorage.getItem(`walletinsights_presets_credit_${email}`)
    if (stored) {
      try {
        setPresetItems(JSON.parse(stored))
      } catch (e) {
        setPresetItems(DEFAULT_CREDIT_PRESETS)
      }
    } else {
      setPresetItems(DEFAULT_CREDIT_PRESETS)
      localStorage.setItem(`fintrack_presets_credit_${email}`, JSON.stringify(DEFAULT_CREDIT_PRESETS))
    }
  }, [email])

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(newPresetAmount)
    if (!newPresetLabel.trim() || isNaN(amt) || amt <= 0) return

    const finalPurpose = newPresetPurpose === 'Other' ? newPresetOtherPurposeText : newPresetPurpose
    const newPreset = {
      label: newPresetLabel.trim(),
      amount: amt,
      purpose: finalPurpose || 'Other',
      creditedFrom: newPresetCreditedFrom.trim()
    }

    const updated = [...presetItems, newPreset]
    setPresetItems(updated)
    if (email) {
      localStorage.setItem(`fintrack_presets_credit_${email}`, JSON.stringify(updated))
    }

    // Reset form
    setNewPresetLabel('')
    setNewPresetAmount('')
    setNewPresetPurpose('Salary')
    setNewPresetOtherPurposeText('')
    setNewPresetCreditedFrom('')
  }

  const handleDeletePreset = (indexToDelete: number) => {
    const updated = presetItems.filter((_, idx) => idx !== indexToDelete)
    setPresetItems(updated)
    if (email) {
      localStorage.setItem(`fintrack_presets_credit_${email}`, JSON.stringify(updated))
    }
  }

  const sourceOptions = [
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: <Landmark className="w-4 h-4 text-zinc-400 shrink-0" /> },
    { value: 'GPay', label: 'GPay', icon: <GPayIcon /> },
    { value: 'PhonePe', label: 'PhonePe', icon: <PhonePeIcon /> },
    { value: 'Cash', label: 'Cash', icon: <CashIcon /> },
    { value: 'Cheque', label: 'Cheque', icon: <FileCheck className="w-4 h-4 text-zinc-400 shrink-0" /> },
    { value: 'Other', label: 'Other', icon: <OtherIcon /> },
  ]

  const purposeOptions = [
    { value: 'Salary', label: 'Salary', icon: <SalaryIcon /> },
    { value: 'Freelance', label: 'Freelance / Projects', icon: <FreelanceIcon /> },
    { value: 'Investments', label: 'Investments / Dividends', icon: <InvestmentIcon /> },
    { value: 'Gift', label: 'Gift', icon: <GiftIcon /> },
    { value: 'Refund', label: 'Refund / Cashbacks', icon: <RefundIcon /> },
    { value: 'Borrowed / Loan', label: 'Borrowed / Loan', icon: <BorrowedIcon /> },
    { value: 'Other', label: 'Other', icon: <OtherIcon /> },
  ]

  const handlePresetSelect = (amount: number, purpose: string, creditedFrom: string) => {
    setAmountInput(amount.toString())
    setSelectedPurpose(purpose)
    setOtherPurposeText('')
    setCreditedFromInput(creditedFrom)
    setDateInput(getLocalDateTimeString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amountInput)
    if (isNaN(amt) || amt <= 0) return

    setButtonState('saving')
    const finalSourceOfPayment = selectedSourceOfPayment === 'Other' ? otherSourceText : selectedSourceOfPayment
    const finalPurpose = selectedPurpose === 'Other' ? otherPurposeText : selectedPurpose

    const success = await addCredit(
      amt,
      finalPurpose,
      creditedFromInput,
      finalSourceOfPayment,
      noteInput,
      new Date(dateInput).toISOString()
    )

    if (success !== null) {
      if (finalPurpose === 'Borrowed / Loan') {
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
          type: 'borrow' as const,
          contact: creditedFromInput.trim() || 'Lender',
          amount: amt,
          purpose: noteInput.trim() || 'Borrowed / Loan',
          date: dateInput.split('T')[0],
          status: 'active' as const
        }
        localStorage.setItem(storageKey, JSON.stringify([newLoan, ...list]))
      }

      setButtonState('saved')
      setAmountInput('')
      setSelectedSourceOfPayment('Bank Transfer')
      setOtherSourceText('')
      setSelectedPurpose('')
      setOtherPurposeText('')
      setCreditedFromInput('')
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
    
    // Check if source of payment is in predefined options
    const isSourcePredefined = sourceOptions.some(o => o.value === record['Source of Payment'] && o.value !== 'Other')
    if (isSourcePredefined) {
      setEditSourceOfPayment(record['Source of Payment'])
      setEditOtherSourceText('')
    } else {
      setEditSourceOfPayment('Other')
      setEditOtherSourceText(record['Source of Payment'] || '')
    }

    // Check if purpose is in predefined options
    const isPurposePredefined = purposeOptions.some(o => o.value === record.Purpose && o.value !== 'Other')
    if (isPurposePredefined) {
      setEditPurpose(record.Purpose)
      setEditOtherPurposeText('')
    } else {
      setEditPurpose('Other')
      setEditOtherPurposeText(record.Purpose || '')
    }

    setEditCreditedFrom(record['Credited From'] || '')
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
    const finalSourceOfPayment = editSourceOfPayment === 'Other' ? editOtherSourceText : editSourceOfPayment
    const finalPurpose = editPurpose === 'Other' ? editOtherPurposeText : editPurpose

    const success = await updateCredit(
      editingRecord._id,
      editingRecord.Amount,
      amt,
      editingRecord.Purpose,
      finalPurpose,
      editingRecord.Date,
      new Date(editDate).toISOString(),
      editCreditedFrom,
      finalSourceOfPayment,
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

    const success = await deleteCredit(
      deletingRecord._id,
      deletingRecord.Amount,
      deletingRecord.Purpose,
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
        
        {/* Record Credit Form Container */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-md dark:shadow-xl dark:shadow-black/40">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
              <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Record New Income
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Log internal financial inflows and transactions securely.</p>
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
                    onClick={() => handlePresetSelect(preset.amount, preset.purpose, preset.creditedFrom)}
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
                Amount (₹) <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-0.5">*</span>
              </label>
              <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-150 shadow-inner flex items-center">
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

            {/* Source of Payment Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Source of Payment <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSourceOpen(!isSourceOpen)
                    setIsPurposeOpen(false)
                  }}
                  className="w-full h-12 md:h-11 px-3.5 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all duration-150 text-zinc-800 dark:text-zinc-200 text-base md:text-sm font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {sourceOptions.find(o => o.value === selectedSourceOfPayment)?.icon}
                    <span className="truncate">{selectedSourceOfPayment}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>

                {isSourceOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 overflow-y-auto max-h-48">
                    {sourceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedSourceOfPayment(opt.value)
                          setIsSourceOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors duration-100 cursor-pointer font-medium"
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedSourceOfPayment === 'Other' && (
                <input
                  type="text"
                  required
                  placeholder="Specify payment source..."
                  value={otherSourceText}
                  onChange={(e) => setOtherSourceText(e.target.value)}
                  className="w-full mt-2 h-11 px-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm outline-none placeholder:text-zinc-400"
                />
              )}
            </div>

            {/* Purpose / Category Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Purpose / Category <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsPurposeOpen(!isPurposeOpen)
                    setIsSourceOpen(false)
                  }}
                  className="w-full h-11 px-3.5 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all duration-150 text-zinc-800 dark:text-zinc-200 text-sm font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {purposeOptions.find(o => o.value === selectedPurpose)?.icon}
                    <span className="truncate">{selectedPurpose || 'Select Category'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>

                {isPurposeOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 overflow-y-auto max-h-48">
                    {purposeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedPurpose(opt.value)
                          setIsPurposeOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors duration-100 cursor-pointer font-medium"
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPurpose === 'Other' && (
                <input
                  type="text"
                  required
                  placeholder="Specify income purpose..."
                  value={otherPurposeText}
                  onChange={(e) => setOtherPurposeText(e.target.value)}
                  className="w-full mt-2 h-11 px-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm outline-none placeholder:text-zinc-400"
                />
              )}
            </div>

            {/* Credited From Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Credited From (Optional)</label>
              <input
                type="text"
                placeholder="Sender, Client name, or Company..."
                value={creditedFromInput}
                onChange={(e) => setCreditedFromInput(e.target.value)}
                className="w-full h-11 px-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm outline-none placeholder:text-zinc-400"
              />
            </div>

            {/* Date Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Date &amp; Time</label>
              <input
                type="datetime-local"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full h-11 px-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm outline-none font-mono"
              />
            </div>

            {/* Note Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Note (Optional)</label>
              <textarea
                rows={2}
                placeholder="Details, memo, or transaction references..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs outline-none resize-none font-medium placeholder:text-zinc-400"
              />
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !amountInput || (selectedSourceOfPayment === 'Other' && !otherSourceText)}
                className={`w-full h-11 rounded-xl text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 ${
                  buttonState === 'saving'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                    : buttonState === 'saved'
                    ? 'bg-emerald-600 text-white'
                    : buttonState === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                {buttonState === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Inflow...
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

        {/* Credits History Table List */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col shadow-md dark:shadow-xl backdrop-blur-md">
          <div className="px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Credits Log History
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Real-time ledger updates and transaction histories.</p>
            </div>
            <button
              onClick={fetchCredits}
              disabled={loading}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl cursor-pointer active:scale-95 transition-all"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 font-bold tracking-wider uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800/60">
                  <th className="px-6 py-3.5 text-left">Actions</th>
                  <th className="px-6 py-3.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" /> Date</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Credited From</th>
                  <th className="px-6 py-3.5">Payment Node</th>
                  <th className="px-6 py-3.5 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 font-sans text-sm">
                {credits.map((record) => (
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
                    <td className="px-6 py-4 text-zinc-800 dark:text-zinc-200 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {purposeOptions.find(o => o.value === record.Purpose)?.icon || <FileText className="w-4 h-4 text-zinc-400" />}
                        <span>{record.Purpose}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-normal">{record['Credited From']}</td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium">
                        {sourceOptions.find(o => o.value === record['Source of Payment'])?.icon}
                        <span>{record['Source of Payment']}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                      +₹{record.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {credits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-zinc-400 dark:text-zinc-500 italic font-normal">
                      {loading ? 'Processing asset entries...' : 'No credit balances or logs initialized.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Edit Credit Modal */}
      {isEditOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-xs">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Edit Income Record
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Modify current transaction values in the master ledger.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Amount Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  Amount (₹) <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-0.5">*</span>
                </label>
                <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 transition-all duration-150">
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full h-12 md:h-10 px-3 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Source of Payment Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    Source of Payment
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditSourceOpen(!isEditSourceOpen)
                      setIsEditPurposeOpen(false)
                    }}
                    className="w-full h-12 md:h-10 px-3 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 text-base md:text-sm font-medium cursor-pointer"
                  >
                    <span className="text-xs truncate">
                      {editSourceOfPayment || 'Select Source'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {isEditSourceOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsEditSourceOpen(false)} />
                      <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1 z-50 overflow-y-auto max-h-40">
                        {sourceOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setEditSourceOfPayment(opt.value)
                              setIsEditSourceOpen(false)
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

                {/* Purpose / Category Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    Purpose / Category
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditPurposeOpen(!isEditPurposeOpen)
                      setIsEditSourceOpen(false)
                    }}
                    className="w-full h-10 px-3 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                  >
                    <span className="text-xs truncate">
                      {editPurpose || 'Select Category'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {isEditPurposeOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsEditPurposeOpen(false)} />
                      <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1 z-50 overflow-y-auto max-h-40">
                        {purposeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setEditPurpose(opt.value)
                              setIsEditPurposeOpen(false)
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

              {/* Other Source Text Input */}
              {editSourceOfPayment === 'Other' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Specify Source</label>
                  <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950">
                    <input
                      type="text"
                      required
                      placeholder="Specify custom source..."
                      value={editOtherSourceText}
                      onChange={(e) => setEditOtherSourceText(e.target.value)}
                      className="w-full h-12 md:h-10 px-3 text-zinc-900 dark:text-zinc-200 text-base md:text-xs bg-transparent outline-none border-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Other Purpose Text Input */}
              {editPurpose === 'Other' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Specify Category</label>
                  <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950">
                    <input
                      type="text"
                      required
                      placeholder="Specify custom category..."
                      value={editOtherPurposeText}
                      onChange={(e) => setEditOtherPurposeText(e.target.value)}
                      className="w-full h-10 px-3 text-zinc-900 dark:text-zinc-200 text-xs bg-transparent outline-none border-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Credited From Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Credited From</label>
                <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={editCreditedFrom}
                    onChange={(e) => setEditCreditedFrom(e.target.value)}
                    className="w-full h-10 px-3 text-zinc-900 dark:text-zinc-200 text-xs bg-transparent outline-none border-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Date Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Date</label>
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
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Note (Optional)</label>
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
                  className="flex-1 h-12 md:h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 text-base md:text-sm font-semibold cursor-pointer active:scale-[0.98] transition-all bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || editButtonState === 'saving'}
                  className={`flex-1 h-12 md:h-10 rounded-xl font-semibold transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    editButtonState === 'saving'
                      ? 'bg-zinc-200 dark:bg-zinc-850 text-zinc-500 border border-zinc-200 dark:border-zinc-800/80 cursor-not-allowed'
                      : editButtonState === 'saved'
                      ? 'bg-emerald-600 text-white'
                      : editButtonState === 'error'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200'
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

      {/* Delete Credit Modal */}
      {isDeleteOpen && deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-zinc-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-150 text-xs">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-500 animate-pulse" />
                Confirm Inflow Deletion
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">This operation is permanent. Please review the details below.</p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4.5 space-y-3 font-medium text-zinc-700 dark:text-zinc-300">
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
                <span className="text-zinc-500 font-normal">Amount:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">+₹{deletingRecord.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
                <span className="text-zinc-500 font-normal">Category / Purpose:</span>
                <span>{deletingRecord.Purpose}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
                <span className="text-zinc-500 font-normal">Credited From:</span>
                <span>{deletingRecord['Credited From']}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-normal">Date:</span>
                <span className="font-mono">{formatDate(deletingRecord.Date)}</span>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-450 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-200">Wallet Impact Warning</p>
                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Deleting this credit will reduce your wallet balance by <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">₹{deletingRecord.Amount.toLocaleString()}</span>. This change propagates to the unified cash flow ledger instantly.
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
                    ? 'bg-rose-900/40 text-rose-450/55 border border-rose-900/60 cursor-not-allowed'
                    : deleteButtonState === 'deleted'
                    ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500'
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-xs text-zinc-700 dark:text-zinc-300 custom-scrollbar">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Customize Inflow Presets
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
                          {preset.purpose}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Amount: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-500">₹{preset.amount}</span>
                        {preset.creditedFrom && ` • From: ${preset.creditedFrom}`}
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
                    placeholder="e.g. 💼 Salary"
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

              <div className="grid grid-cols-2 gap-3.5">
                {/* Preset Purpose / Category */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Purpose / Category</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsNewPresetPurposeOpen(!isNewPresetPurposeOpen)}
                      className="w-full h-10 px-3 text-left flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                    >
                      <span className="text-xs truncate">{newPresetPurpose}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {isNewPresetPurposeOpen && (
                      <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 overflow-y-auto max-h-40">
                        {purposeOptions.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setNewPresetPurpose(opt.value)
                              setIsNewPresetPurposeOpen(false)
                            }}
                            className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer font-medium"
                          >
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Credited From */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Credited From</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={newPresetCreditedFrom}
                    onChange={(e) => setNewPresetCreditedFrom(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-200 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Other Purpose Specifier */}
              {newPresetPurpose === 'Other' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Specify Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dividend"
                    value={newPresetOtherPurposeText}
                    onChange={(e) => setNewPresetOtherPurposeText(e.target.value)}
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