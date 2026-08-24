import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLedger } from '../hooks/useLedger'
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  Trash2,
  CheckCircle,
  Calendar,
  AlertCircle,
  User,
  Clock,
  Check
} from 'lucide-react'

interface LoanRecord {
  id: string
  type: 'borrow' | 'lend' // 'borrow' = borrowed from someone (we owe them), 'lend' = lent to someone (they owe us)
  contact: string
  amount: number
  purpose: string
  date: string
  status: 'active' | 'settled'
  settledAt?: string
}

export function BorrowLendPage() {
  useEffect(() => {
    document.title = 'Borrow & Lend Ledger | FinTrack'
  }, [])

  const { email } = useAuth()
  const { addCredit, addDebit } = useLedger()

  // Storage key scoped by user email
  const storageKey = `fintrack_peer_loans_${email}`

  // State hooks
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active')
  
  // Form State
  const [type, setType] = useState<'borrow' | 'lend'>('lend')
  const [contact, setContact] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [purpose, setPurpose] = useState('')
  
  // UI states
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Settlement Confirmation Modal State
  const [settleTarget, setSettleTarget] = useState<LoanRecord | null>(null)
  const [isSettling, setIsSettling] = useState(false)

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<LoanRecord | null>(null)

  // Load loans on mount
  useEffect(() => {
    if (email) {
      const stored = localStorage.getItem(storageKey) || localStorage.getItem(`walletinsights_peer_loans_${email}`)
      if (stored) {
        try {
          setLoans(JSON.parse(stored))
        } catch (e) {
          console.error('Error parsing stored peer loans:', e)
          setLoans([])
        }
      } else {
        setLoans([])
      }
    }
  }, [email, storageKey])

  // Save loans to storage helper
  const saveLoans = (updatedList: LoanRecord[]) => {
    setLoans(updatedList)
    localStorage.setItem(storageKey, JSON.stringify(updatedList))
  }

  // Handle Form Submit
  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!contact.trim()) {
      setFormError('Please enter a peer or contact name.')
      return
    }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than zero.')
      return
    }
    if (!date) {
      setFormError('Please select a transaction date.')
      return
    }
    if (!purpose.trim()) {
      setFormError('Please enter a short purpose or description.')
      return
    }

    setIsSubmitting(true)

    try {
      const todayIso = new Date(date).toISOString()
      
      if (type === 'lend') {
        // Lent money -> outflow/Debit
        const success = await addDebit(
          parsedAmount,
          'Cash',
          `Lent / Loan: ${contact.trim()}`,
          purpose.trim(),
          todayIso
        )
        if (success === null) {
          throw new Error('Failed to record debit transaction in cloud database.')
        }
      } else {
        // Borrowed money -> inflow/Credit
        const success = await addCredit(
          parsedAmount,
          'Borrowed / Loan',
          contact.trim(),
          'Cash',
          purpose.trim(),
          todayIso
        )
        if (success === null) {
          throw new Error('Failed to record credit transaction in cloud database.')
        }
      }

      // Generate loan item
      const newLoan: LoanRecord = {
        id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        contact: contact.trim(),
        amount: parsedAmount,
        purpose: purpose.trim(),
        date,
        status: 'active'
      }

      // Save and clear form
      const updated = [newLoan, ...loans]
      saveLoans(updated)

      setContact('')
      setAmount('')
      setPurpose('')
      triggerToast(`Success: Logged ₹${parsedAmount} ${type === 'lend' ? 'lent to' : 'borrowed from'} ${newLoan.contact}. Balance updated.`)
    } catch (err: any) {
      console.error('Error logging peer loan:', err)
      setFormError(err.message || 'Failed to record loan. Please check your network and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Trigger Toast helper
  const triggerToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => {
      setSuccessToast(null)
    }, 4000)
  }

  // Settle Loan Confirmation Action
  const handleConfirmSettle = async () => {
    if (!settleTarget) return
    setIsSettling(true)

    try {
      const todayStr = new Date().toISOString().split('T')[0]
      
      if (settleTarget.type === 'borrow') {
        // You owed John Doe money -> You paid them back (outflow/Debit)
        await addDebit(
          settleTarget.amount,
          'Cash',
          `Settle: Borrowed from ${settleTarget.contact}`,
          `Settling original debt logged on ${settleTarget.date} for "${settleTarget.purpose}"`,
          todayStr
        )
      } else {
        // You lent Jane Smith money -> Jane pays you back (inflow/Credit)
        await addCredit(
          settleTarget.amount,
          `Settle: Lent to ${settleTarget.contact}`,
          settleTarget.contact,
          'Cash',
          `Settling original loan logged on ${settleTarget.date} for "${settleTarget.purpose}"`,
          todayStr
        )
      }

      // Mark settled in our local array
      const updated = loans.map((l) => {
        if (l.id === settleTarget.id) {
          return {
            ...l,
            status: 'settled' as const,
            settledAt: todayStr
          }
        }
        return l
      })

      saveLoans(updated)
      triggerToast(`Settled: ₹${settleTarget.amount} with ${settleTarget.contact} resolved. Balance updated.`)
      setSettleTarget(null)
    } catch (err: any) {
      console.error('Error settling peer loan:', err)
      setFormError('Failed to record settlement transaction. Please try again.')
    } finally {
      setIsSettling(false)
    }
  }

  // Delete Loan record
  const handleDeleteLoan = () => {
    if (!deleteTarget) return
    const updated = loans.filter((l) => l.id !== deleteTarget.id)
    saveLoans(updated)
    triggerToast(`Deleted: Loan record for ${deleteTarget.contact} removed.`)
    setDeleteTarget(null)
  }

  // Calculate Aggregates (Active items only)
  const activeLoans = loans.filter((l) => l.status === 'active')
  const settledLoans = loans.filter((l) => l.status === 'settled')

  const totalOwed = activeLoans
    .filter((l) => l.type === 'borrow')
    .reduce((sum, l) => sum + l.amount, 0)

  const totalLent = activeLoans
    .filter((l) => l.type === 'lend')
    .reduce((sum, l) => sum + l.amount, 0)

  const netDebtBalance = totalLent - totalOwed

  return (
    <div className="space-y-8 pb-12 text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-200">
      {/* Ambient glowing notifications */}
      {successToast && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-zinc-900 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3.5 animate-in slide-in-from-bottom duration-300 z-50 backdrop-blur-xl">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide">{successToast}</span>
        </div>
      )}

      {/* 1. Summary Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card A: Owed to you */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300 shadow-md dark:shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">You Lent (Owed to You)</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">₹{totalLent.toLocaleString('en-IN')}</h3>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed">
            Funds you lent out that remain outstanding from peer contacts.
          </p>
        </div>

        {/* Card B: Owe to others */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between group hover:border-rose-500/30 transition-all duration-300 shadow-md dark:shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown className="w-24 h-24 text-rose-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">You Borrowed (You Owe)</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">₹{totalOwed.toLocaleString('en-IN')}</h3>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed">
            Debts you recorded from borrowing that you still need to pay back.
          </p>
        </div>

        {/* Card C: Net debt status */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-300 shadow-md dark:shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Scale className="w-24 h-24 text-indigo-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Net Debt Balance</p>
              <h3 className={`text-2xl font-black tracking-tight mt-1 ${netDebtBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {netDebtBalance >= 0 ? '+' : ''}₹{netDebtBalance.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed font-mono">
            {netDebtBalance >= 0
              ? 'You are in a surplus position with peer lendings.'
              : 'You have a net deficit in outstanding balances.'}
          </p>
        </div>

      </div>

      {/* 2. Main Work Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form to log a loan */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md shadow-md dark:shadow-xl">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-wide mb-6">Log Peer Transaction</h2>
          
          <form onSubmit={handleAddLoan} className="space-y-5">
            {formError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            {/* Toggle Loan Type */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2 font-mono">Transaction Type</label>
              <div className="grid grid-cols-2 gap-3.5 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setType('lend')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    type === 'lend'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Lent to Someone
                </button>
                <button
                  type="button"
                  onClick={() => setType('borrow')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    type === 'borrow'
                      ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Borrowed from Peer
                </button>
              </div>
            </div>

            {/* Peer Name */}
            <div>
              <label htmlFor="contact" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2 font-mono">
                Peer Contact Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="contact"
                  placeholder="e.g. John Doe"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl h-12 md:h-11 pl-11 pr-4 text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2 font-mono">
                Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold text-xs font-mono">
                  ₹
                </div>
                <input
                  type="number"
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl h-12 md:h-11 pl-11 pr-4 text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium font-mono"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2 font-mono">
                Transaction Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl h-12 md:h-11 pl-11 pr-4 text-base md:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold font-mono"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label htmlFor="purpose" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2 font-mono">
                Description / Purpose
              </label>
              <input
                type="text"
                id="purpose"
                placeholder="e.g. Dinner share, office rent loan"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl h-12 md:h-11 px-4 text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 h-11 bg-zinc-900 dark:bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Log Loan Record</span>
            </button>

          </form>
        </div>

        {/* Right Column: List of logged loans */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col min-h-[500px] shadow-md dark:shadow-xl">
          
          {/* Header tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-4 mb-6 gap-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-wide">Lending Ledger</h2>
            
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800/60 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150 ${
                  activeTab === 'active'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                Active Outstanding ({activeLoans.length})
              </button>
              <button
                onClick={() => setActiveTab('settled')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150 ${
                  activeTab === 'settled'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                Settled History ({settledLoans.length})
              </button>
            </div>
          </div>

          {/* Table List Container */}
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            {activeTab === 'active' ? (
              activeLoans.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-800/40">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-300">No Active Loans Found</p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
                      Your ledger is completely settled! Log a borrowed or lent transaction using the form on the left.
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800/60 font-mono">
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-left">Actions</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Contact / Purpose</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Type</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {activeLoans.map((loan) => (
                      <tr key={loan.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="py-4 text-left">
                          <div className="flex items-center justify-start gap-2.5">
                            <button
                              onClick={() => setSettleTarget(loan)}
                              className="px-2.5 h-7 bg-zinc-100 dark:bg-zinc-950 hover:bg-indigo-600 hover:text-white border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(loan)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete loan row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center text-[11px] font-bold text-zinc-600 dark:text-zinc-400 font-mono shrink-0">
                              {loan.contact[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{loan.contact}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 truncate max-w-[200px]" title={loan.purpose}>
                                {loan.purpose}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase font-mono ${
                            loan.type === 'lend'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                          }`}>
                            {loan.type === 'lend' ? 'Lent (Owed)' : 'Borrow (Owe)'}
                          </span>
                          <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">{loan.date}</span>
                        </td>
                        <td className="py-4 text-right pr-4 font-bold text-xs font-mono text-zinc-900 dark:text-zinc-200">
                          ₹{loan.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              settledLoans.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-800/40">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-300">No Settled Loans Yet</p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
                      Outstanding loans settled in this panel will accumulate history records here for reference.
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800/60 font-mono">
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Contact / Purpose</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Type</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">Amount</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {settledLoans.map((loan) => (
                      <tr key={loan.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors opacity-80">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center text-[11px] font-bold text-zinc-600 dark:text-zinc-400 font-mono shrink-0">
                              {loan.contact[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{loan.contact}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 truncate max-w-[200px]">
                                {loan.purpose}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase font-mono bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                            {loan.type === 'lend' ? 'Lent' : 'Borrowed'}
                          </span>
                          <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">Logged: {loan.date}</span>
                        </td>
                        <td className="py-4 text-right pr-4 font-bold text-xs font-mono text-zinc-500 dark:text-zinc-400 line-through">
                          ₹{loan.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase font-mono bg-emerald-50 dark:bg-zinc-950 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/10">
                              <Check className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-mono">Res: {loan.settledAt}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>

        </div>

      </div>

      {/* 3. Confirm Settlement Modal overlay */}
      {settleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm" onClick={() => setSettleTarget(null)} />
          
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                <Scale className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Confirm Loan Settlement</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to resolve the outstanding amount of <strong className="text-zinc-900 dark:text-zinc-200 font-bold">₹{settleTarget.amount.toLocaleString('en-IN')}</strong> with <strong className="text-zinc-900 dark:text-zinc-200 font-bold">{settleTarget.contact}</strong>?
                </p>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-600 dark:text-zinc-400 font-mono space-y-1.5 mt-2">
                  <p>• Type: <span className="font-bold uppercase text-zinc-800 dark:text-zinc-300">{settleTarget.type === 'lend' ? 'Lent (Receiving Funds)' : 'Borrowed (Paying Back)'}</span></p>
                  <p>• Purpose: {settleTarget.purpose}</p>
                  <p>• Original Log: {settleTarget.date}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 pt-1">• Action: Automatically logs a corresponding {settleTarget.type === 'lend' ? 'Credit (Income)' : 'Debit (Expense)'} transaction to synchronize your running wallet balance in the cloud.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSettleTarget(null)}
                disabled={isSettling}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                disabled={isSettling}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSettling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Settling...</span>
                  </>
                ) : (
                  <span>Approve &amp; Settle</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Confirm Delete Modal overlay */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delete Loan Record?</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to permanently delete this loan of <strong className="text-zinc-900 dark:text-zinc-200">₹{deleteTarget.amount}</strong> for <strong className="text-zinc-900 dark:text-zinc-200">{deleteTarget.contact}</strong>?
                </p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Warning: Deleting this loan clears it from your peer tracker history. It does not generate any transaction ledger items.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLoan}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
