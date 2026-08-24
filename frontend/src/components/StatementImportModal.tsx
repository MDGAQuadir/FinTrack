import React, { useState, useRef } from 'react'
import axios from 'axios'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  X,
  Search,
  CheckSquare,
  Square
} from 'lucide-react'

export interface ParsedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  category: string
  referenceNumber?: string
  balance?: number
  isDuplicate: boolean
  duplicateReason?: string
  selected: boolean
}

export interface StatementPreviewData {
  success: boolean
  message: string
  filename: string
  detectedFormat: string
  totalParsed: number
  totalDebits: number
  totalCredits: number
  duplicatesCount: number
  inflowAmount: number
  outflowAmount: number
  transactions: ParsedTransaction[]
}

interface StatementImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (count: number) => void
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Housing',
  'Financial Services',
  'Salary',
  'Investment',
  'Freelancing',
  'Refunds',
  'UPI Inflow',
  'General Expense',
  'Other Income'
]

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [previewData, setPreviewData] = useState<StatementPreviewData | null>(null)
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'DUPLICATES'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0])
    }
  }

  const processSelectedFile = async (selectedFile: File) => {
    setError(null)
    setIsUploading(true)
    setPreviewData(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await axios.post<StatementPreviewData>('/api/statement/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success && res.data.transactions) {
        setPreviewData(res.data)
        setTransactions(res.data.transactions)
      } else {
        setError(res.data.message || 'Unable to parse statement. Please check file format.')
      }
    } catch (err: any) {
      console.error('Import preview error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to upload and parse statement.')
    } finally {
      setIsUploading(false)
    }
  }

  // Toggle single transaction selection
  const toggleSelect = (id: string) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, selected: !t.selected } : t))
    )
  }

  // Update category
  const updateCategory = (id: string, category: string) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, category } : t))
    )
  }

  // Update type (DEBIT / CREDIT)
  const toggleType = (id: string) => {
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextType: 'DEBIT' | 'CREDIT' = t.type === 'DEBIT' ? 'CREDIT' : 'DEBIT'
          return {
            ...t,
            type: nextType,
            category: nextType === 'CREDIT' ? 'UPI Inflow' : 'General Expense'
          }
        }
        return t
      })
    )
  }

  // Select all / Deselect all
  const selectAll = (select: boolean) => {
    setTransactions(prev => prev.map(t => ({ ...t, selected: select })))
  }

  // Deselect duplicates only
  const deselectDuplicates = () => {
    setTransactions(prev =>
      prev.map(t => (t.isDuplicate ? { ...t, selected: false } : t))
    )
  }

  // Commit selected transactions to backend
  const handleCommit = async () => {
    const selected = transactions.filter(t => t.selected)
    if (selected.length === 0) {
      setError('Please select at least one transaction to import.')
      return
    }

    setIsCommitting(true)
    setError(null)

    try {
      const res = await axios.post('/api/statement/import/commit', {
        transactions: selected
      })

      if (res.data.success) {
        onSuccess(res.data.importedCount || selected.length)
        onClose()
      } else {
        setError(res.data.message || 'Failed to commit imported transactions.')
      }
    } catch (err: any) {
      console.error('Commit import error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to import transactions to ledger.')
    } finally {
      setIsCommitting(false)
    }
  }

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'CREDIT' && t.type !== 'CREDIT') return false
    if (filterType === 'DEBIT' && t.type !== 'DEBIT') return false
    if (filterType === 'DUPLICATES' && !t.isDuplicate) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchDesc = t.description.toLowerCase().includes(q)
      const matchCat = t.category.toLowerCase().includes(q)
      const matchDate = t.date.toLowerCase().includes(q)
      const matchAmt = t.amount.toString().includes(q)
      if (!matchDesc && !matchCat && !matchDate && !matchAmt) return false
    }

    return true
  })

  const selectedCount = transactions.filter(t => t.selected).length
  const selectedInflow = transactions
    .filter(t => t.selected && t.type === 'CREDIT')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const selectedOutflow = transactions
    .filter(t => t.selected && t.type === 'DEBIT')
    .reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Smart Bank Statement Auto-Importer
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">
                  AI Normalizer
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Upload your HDFC, SBI, ICICI, Axis, Paytm, or Generic PDF/CSV bank statement.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Upload Area (Shown when no preview yet or as compact header) */}
          {!previewData && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-zinc-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                ) : (
                  <FileText className="w-8 h-8" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {isUploading ? 'Analyzing and extracting statement tables...' : 'Click to select or drag & drop your Bank Statement file'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Supported formats: <strong>PDF Statements</strong>, <strong>CSV Exports</strong>, or <strong>Tab-Delimited TXT</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium">
                  HDFC / SBI / ICICI / Axis
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium">
                  Paytm / GPay / PhonePe
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium">
                  Standard CSV
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-bold">Import Warning</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Preview State */}
          {previewData && (
            <div className="space-y-5">
              
              {/* File details banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-xs">
                    {previewData.filename}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-mono">
                    {previewData.detectedFormat}
                  </span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Upload different file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Extracted
                  </span>
                  <span className="text-xl font-bold text-zinc-900 dark:text-white mt-1 block">
                    {previewData.totalParsed}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {selectedCount} selected for import
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Total Inflow
                  </span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    ₹{previewData.inflowAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                    {previewData.totalCredits} credits
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30">
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Total Outflow
                  </span>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                    ₹{previewData.outflowAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                    {previewData.totalDebits} debits
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Duplicates
                  </span>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                    {previewData.duplicatesCount}
                  </span>
                  <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                    auto-unchecked by default
                  </span>
                </div>
              </div>

              {/* Filter & Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filterType === 'ALL'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    onClick={() => setFilterType('CREDIT')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filterType === 'CREDIT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'
                    }`}
                  >
                    Inflow ({previewData.totalCredits})
                  </button>
                  <button
                    onClick={() => setFilterType('DEBIT')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filterType === 'DEBIT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600'
                    }`}
                  >
                    Outflow ({previewData.totalDebits})
                  </button>
                  {previewData.duplicatesCount > 0 && (
                    <button
                      onClick={() => setFilterType('DUPLICATES')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        filterType === 'DUPLICATES'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                      }`}
                    >
                      Duplicates ({previewData.duplicatesCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                    />
                  </div>

                  <button
                    onClick={() => selectAll(true)}
                    className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => selectAll(false)}
                    className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    Deselect All
                  </button>
                  {previewData.duplicatesCount > 0 && (
                    <button
                      onClick={deselectDuplicates}
                      className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Exclude Duplicates
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions Preview Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-10">
                      <tr className="text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-10 text-center">Import</th>
                        <th className="p-3 w-28">Date</th>
                        <th className="p-3">Narration / Description</th>
                        <th className="p-3 w-24">Type</th>
                        <th className="p-3 w-36">Category</th>
                        <th className="p-3 w-28 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900/40">
                      {filteredTransactions.map(t => (
                        <tr
                          key={t.id}
                          className={`transition-colors ${
                            !t.selected
                              ? 'opacity-40 bg-zinc-50/50 dark:bg-zinc-950/20'
                              : t.isDuplicate
                              ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60'
                              : 'hover:bg-indigo-50/20 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelect(t.id)}
                              className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                            >
                              {t.selected ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-400" />
                              )}
                            </button>
                          </td>

                          <td className="p-3 font-mono font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                            {t.date}
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 max-w-sm truncate">
                              {t.description}
                            </div>
                            {t.isDuplicate && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{t.duplicateReason || 'Potential duplicate match'}</span>
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => toggleType(t.id)}
                              title="Click to toggle Inflow / Outflow"
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                                t.type === 'CREDIT'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {t.type === 'CREDIT' ? '+ Inflow' : '- Outflow'}
                            </button>
                          </td>

                          <td className="p-3">
                            <select
                              value={t.category}
                              onChange={e => updateCategory(t.id, e.target.value)}
                              className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                            <span
                              className={
                                t.type === 'CREDIT'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {t.type === 'CREDIT' ? '+' : '-'}₹
                              {t.amount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                            No transactions match the current filter or search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {previewData ? (
              <span>
                Ready to commit <strong>{selectedCount}</strong> transactions: Inflow{' '}
                <strong className="text-emerald-600">+₹{selectedInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>, Outflow{' '}
                <strong className="text-rose-600">-₹{selectedOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </span>
            ) : (
              <span>Upload a file to preview transactions before importing</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isCommitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {previewData && (
              <button
                onClick={handleCommit}
                disabled={isCommitting || selectedCount === 0}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synchronizing Ledger...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Import {selectedCount} Transactions to Ledger
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
