import React, { useState } from 'react'
import axios from 'axios'
import {
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react'

interface WebhookSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string, amount: number, direction: string, updatedBalance: number) => void
}

interface PresetOption {
  title: string
  provider: 'razorpay' | 'stripe' | 'generic'
  direction: 'CREDIT' | 'DEBIT'
  amount: number
  merchant: string
  description: string
  eventType: string
}

const PRESETS: PresetOption[] = [
  {
    title: '⚡ Swiggy Food Refund',
    provider: 'razorpay',
    direction: 'CREDIT',
    amount: 450.0,
    merchant: 'Swiggy Bangalore',
    description: 'Refund for cancelled order #55441',
    eventType: 'payment.captured'
  },
  {
    title: '🎬 Netflix Subscription',
    provider: 'stripe',
    direction: 'DEBIT',
    amount: 649.0,
    merchant: 'Netflix India',
    description: 'Monthly premium subscription renewal',
    eventType: 'payment_intent.succeeded'
  },
  {
    title: '💼 Freelance UI/UX Client Inflow',
    provider: 'generic',
    direction: 'CREDIT',
    amount: 15000.0,
    merchant: 'Acme Digital Agency',
    description: 'Milestone 2 frontend development payment',
    eventType: 'upi.payment.success'
  },
  {
    title: '🛒 Amazon Shopping Purchase',
    provider: 'razorpay',
    direction: 'DEBIT',
    amount: 2499.0,
    merchant: 'Amazon Pay India',
    description: 'Electronics & household order',
    eventType: 'payment.captured'
  },
  {
    title: '🏢 Monthly Salary Credit',
    provider: 'generic',
    direction: 'CREDIT',
    amount: 85000.0,
    merchant: 'Tech Labs Global',
    description: 'August 2026 payroll direct deposit',
    eventType: 'ach.salary.credit'
  },
  {
    title: '☕ Starbucks Coffee & Snack',
    provider: 'generic',
    direction: 'DEBIT',
    amount: 380.0,
    merchant: 'Starbucks Indiranagar',
    description: 'In-store UPI QR payment',
    eventType: 'upi.pos.debit'
  }
]

export const WebhookSimulatorModal: React.FC<WebhookSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [provider, setProvider] = useState<'razorpay' | 'stripe' | 'generic'>('razorpay')
  const [direction, setDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [amount, setAmount] = useState('500')
  const [merchant, setMerchant] = useState('Swiggy Bangalore')
  const [description, setDescription] = useState('Refund for cancelled order')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<any | null>(null)

  if (!isOpen) return null

  const applyPreset = (preset: PresetOption) => {
    setProvider(preset.provider)
    setDirection(preset.direction)
    setAmount(preset.amount.toString())
    setMerchant(preset.merchant)
    setDescription(preset.description)
    setError(null)
  }

  const handleSimulate = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    if (!merchant.trim()) {
      setError('Please provide a merchant or payer name.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setLastResponse(null)

    try {
      const payload = {
        provider,
        eventType: `${provider}.simulated.event`,
        amount: numAmount,
        currency: 'INR',
        direction,
        merchantOrPayer: merchant.trim(),
        description: description.trim() || merchant.trim(),
        referenceNumber: `SIM-${provider.toUpperCase().substring(0, 3)}-${Date.now()}`
      }

      const res = await axios.post('/api/webhooks/payment/simulate', payload)

      if (res.data.success) {
        setLastResponse(res.data)
        onSuccess(
          res.data.message || 'Payment event received and processed!',
          numAmount,
          direction,
          res.data.updatedBalance || 0
        )
      } else {
        setError(res.data.error || 'Webhook simulation failed.')
      }
    } catch (err: any) {
      console.error('Webhook simulation error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to simulate payment webhook.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-zinc-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Real-Time Payment Webhook Simulator
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Event Stream
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Trigger real-time webhook events (Razorpay, Stripe, UPI) and observe live ledger updates.
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Simulation Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 hover:border-indigo-500 dark:hover:border-indigo-500 text-left transition-all group cursor-pointer"
                >
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {p.title}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-zinc-400 uppercase font-mono">{p.provider}</span>
                    <span className={`font-bold ${p.direction === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {p.direction === 'CREDIT' ? '+' : '-'}₹{p.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Form Controls */}
          <div className="space-y-4">
            
            {/* Provider & Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Payment Gateway
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setProvider('razorpay')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      provider === 'razorpay'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Razorpay
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('stripe')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      provider === 'stripe'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Stripe
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('generic')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      provider === 'generic'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    UPI / Direct
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Transaction Direction
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDirection('CREDIT')}
                    className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      direction === 'CREDIT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" /> + Inflow (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('DEBIT')}
                    className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      direction === 'DEBIT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> - Outflow (Debit)
                  </button>
                </div>
              </div>
            </div>

            {/* Amount & Merchant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Amount (₹ INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Merchant / Payer Name
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  placeholder="e.g. Swiggy, Netflix, Acme Corp"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Transaction Description / Narration
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Refund for cancelled order, Monthly Subscription"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Response Banner */}
          {lastResponse && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{lastResponse.message}</span>
              </div>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 font-mono">
                Event ID: {lastResponse.eventId} • New Balance: ₹{lastResponse.updatedBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Pipeline: HMAC Signature $\rightarrow$ Idempotency $\rightarrow$ Chronological Recalculation
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching Webhook...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Trigger Webhook Event
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
