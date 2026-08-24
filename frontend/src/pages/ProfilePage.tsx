import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLedger } from '../hooks/useLedger'
import { useForm } from 'react-hook-form'
import {
  User,
  Phone,
  Briefcase,
  MapPin,
  Mail,
  IndianRupee,
  UserCheck,
  Loader2,
  AlertCircle,
  Home,
  Globe,
  Map,
  Hash
} from 'lucide-react'
import { useLocation } from 'react-router-dom'

interface ProfileFormInputs {
  Name: string
  Phone: string
  Occupation: string
  City: string
  Address: string
  Zipcode: string
  State: string
  Country: string
}

export function ProfilePage() {
  useEffect(() => {
    document.title = 'Profile & Workspace Settings | FinTrack'
  }, [])

  const {
    user,
    loading: authLoading,
    error: authError,
    updateStartingBalance,
    updateProfile,
  } = useAuth()

  const {
    loading: ledgerLoading,
    error: ledgerError,
    setBalance,
  } = useLedger()

  const location = useLocation()
  const hasWarning = location.state?.balanceWarning

  const [initialBalanceInput, setInitialBalanceInput] = useState('')
  const [balanceInput, setBalanceInput] = useState('')
  const [balanceSuccessMsg, setBalanceSuccessMsg] = useState(false)
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false)

  // React Hook Form for profile details
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormInputs>({
    defaultValues: {
      Name: '',
      Phone: '',
      Occupation: '',
      City: '',
      Address: '',
      Zipcode: '',
      State: '',
      Country: '',
    }
  })

  // Sync profile details
  useEffect(() => {
    if (user) {
      setValue('Name', user.Name || '')
      setValue('Phone', user.Phone || '')
      setValue('Occupation', user.Occupation || '')
      setValue('City', user.City || '')
      setValue('Address', user.Address || '')
      setValue('Zipcode', user.Zipcode || '')
      setValue('State', user.State || '')
      setValue('Country', user.Country || '')
      setBalanceInput(user.Balance !== undefined && user.Balance !== null ? user.Balance.toString() : '')
    }
  }, [user, setValue])

  const isGlobalLoading = authLoading || ledgerLoading
  const globalError = authError || ledgerError

  const handleSetInitialBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(initialBalanceInput)
    if (isNaN(amt)) return

    const success = await updateStartingBalance(amt)
    if (success) {
      setBalance(amt)
      setInitialBalanceInput('')
    }
  }

  const onProfileSubmit = async (data: ProfileFormInputs) => {
    const success = await updateProfile(data)
    if (success) {
      setProfileSuccessMsg(true)
      setTimeout(() => setProfileSuccessMsg(false), 3000)
    }
  }

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(balanceInput)
    if (isNaN(amt)) return
    const success = await updateStartingBalance(amt)
    if (success) {
      setBalance(amt)
      setBalanceSuccessMsg(true)
      setTimeout(() => setBalanceSuccessMsg(false), 3000)
    }
  }

  const isBalanceUnset = user?.Balance === null || user?.Balance === undefined

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-200">
      
      {/* Alert Message for API Errors */}
      {globalError && (
        <div className="max-w-2xl mx-auto flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{globalError}</span>
        </div>
      )}

      {isBalanceUnset ? (
        /* Onboarding View: Force Set Initial Balance */
        <div className="p-8 max-w-md mx-auto my-12 bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl space-y-6 shadow-xl shadow-black/5 dark:shadow-black/40 relative animate-in zoom-in-95 duration-300">
          
          {hasWarning && (
            <div className="absolute -top-12 left-0 w-full text-center text-xs text-indigo-600 dark:text-indigo-300 font-medium tracking-wide uppercase bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 py-2.5 rounded-xl backdrop-blur-md animate-pulse">
              Please initialize your wallet balance first
            </div>
          )}
          
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 shadow-inner">
              <UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Initialize Wallet</h3>
            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[90%] mx-auto">
              Welcome to your new workspace profile! Before logging income or expenses, configure your starting ledger balance.
            </p>
          </div>

          <form onSubmit={handleSetInitialBalanceSubmit} className="space-y-5 text-xs pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase block">
                Starting Balance (₹) <span className="text-indigo-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                <IndianRupee className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={initialBalanceInput}
                  onChange={(e) => setInitialBalanceInput(e.target.value)}
                  disabled={isGlobalLoading}
                  className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGlobalLoading || !initialBalanceInput}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGlobalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                'Set Starting Balance'
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Profile & Settings Layout */
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Wallet Balance Edit Card */}
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-md dark:shadow-xl dark:shadow-black/40">
            <div className="flex items-center gap-3.5 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-inner">
                <IndianRupee className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Wallet Balance Settings</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Directly adjust your current starting/total ledger balance.</p>
              </div>
            </div>

            <form onSubmit={handleBalanceSubmit} className="space-y-6 text-xs">
              <div className="space-y-1.5 max-w-sm">
                <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Wallet Balance (₹)</label>
                <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                  <IndianRupee className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    disabled={isGlobalLoading}
                    className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800/80">
                <div className="w-full sm:w-auto h-11 flex items-center">
                  {balanceSuccessMsg && (
                    <div className="flex items-center gap-2.5 px-4 h-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-left-2 duration-300 w-full sm:w-auto">
                      <UserCheck className="w-4 h-4" />
                      Wallet balance updated successfully.
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isGlobalLoading || !balanceInput}
                  className="w-full sm:w-auto px-8 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGlobalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Balance'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Profile Details Card */}
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-8 shadow-md dark:shadow-xl dark:shadow-black/40">
            <div className="flex items-center gap-3.5 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-inner">
                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Profile & Workspace</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage your personal details and account configurations.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Full Name</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      disabled={isGlobalLoading}
                      {...register('Name', { required: 'Name is required' })}
                      className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  {errors.Name && <span className="text-[11px] text-rose-500">{errors.Name.message}</span>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Phone Number</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      disabled={isGlobalLoading}
                      {...register('Phone', { required: 'Phone is required' })}
                      className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  {errors.Phone && <span className="text-[11px] text-rose-500">{errors.Phone.message}</span>}
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Occupation</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <Briefcase className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Software Developer"
                      disabled={isGlobalLoading}
                      {...register('Occupation', { required: 'Occupation is required' })}
                      className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  {errors.Occupation && <span className="text-[11px] text-rose-500">{errors.Occupation.message}</span>}
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">City</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <MapPin className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Bengaluru"
                      disabled={isGlobalLoading}
                      {...register('City', { required: 'City is required' })}
                      className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  {errors.City && <span className="text-[11px] text-rose-500">{errors.City.message}</span>}
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">State / Province</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <Map className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Karnataka"
                      disabled={isGlobalLoading}
                      {...register('State')}
                      className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Street Address</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <Home className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Block, building, apartment..."
                      disabled={isGlobalLoading}
                      {...register('Address')}
                      className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Zipcode */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Zipcode</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <Hash className="absolute left-3 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="560001"
                      disabled={isGlobalLoading}
                      {...register('Zipcode')}
                      className="w-full py-3 md:py-2.5 pl-8 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Country</label>
                  <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-150 shadow-inner flex items-center">
                    <Globe className="absolute left-3 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="India"
                      disabled={isGlobalLoading}
                      {...register('Country')}
                      className="w-full py-3 md:py-2.5 pl-8 pr-3.5 text-zinc-900 dark:text-zinc-100 text-base md:text-sm bg-transparent outline-none border-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* System Identifiers Divider */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-5">
                <span className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase flex items-center gap-2">
                  System Identifiers <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800/80" />
                </span>
                
                <div className="grid grid-cols-1 gap-5 opacity-60 grayscale-[20%] pointer-events-none">
                  {/* Email (Read Only) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">Authentication Email</label>
                    <div className="relative w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-900 shadow-inner flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        readOnly
                        disabled
                        value={user?.Email || ''}
                        className="w-full py-3 md:py-2.5 pl-10 pr-3.5 text-zinc-500 dark:text-zinc-400 text-base md:text-sm bg-transparent outline-none border-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area & Toasts */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800/80">
                <div className="w-full sm:w-auto h-11 flex items-center">
                  {profileSuccessMsg && (
                    <div className="flex items-center gap-2.5 px-4 h-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-left-2 duration-300 w-full sm:w-auto">
                      <UserCheck className="w-4 h-4" />
                      Profile details synced successfully.
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isGlobalLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGlobalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Footer Metadata */}
      <footer className="mt-12 text-center flex flex-col items-center justify-center gap-2 relative z-10 opacity-70 hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 font-medium">
          <span>Ledger Workspace Client</span>
          <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <span className="flex items-center gap-1.5 font-mono text-zinc-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            REST Nodes Active
          </span>
        </div>
      </footer>

    </div>
  )
}