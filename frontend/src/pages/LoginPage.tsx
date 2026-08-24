import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { ThemeToggle } from '../hooks/useTheme'
import { Link } from 'react-router-dom'
import {
  Mail,
  User,
  Phone,
  Briefcase,
  MapPin,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface EmailFormInputs {
  email: string
}

interface RegisterFormInputs {
  Name: string
  Phone: string
  Occupation: string
  City: string
}

export function LoginPage() {
  useEffect(() => {
    document.title = 'Login & Onboarding | FinTrack'
  }, [])

  const {
    email,
    loading: authLoading,
    error: authError,
    step,
    checkEmail,
    prepareRegister,
    setStep,
  } = useAuth()

  // Forms setup
  const { register: registerEmail, handleSubmit: handleEmailSubmit, setValue: setEmailValue, formState: { errors: emailErrors } } = useForm<EmailFormInputs>()
  const { register: registerFields, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = useForm<RegisterFormInputs>({
    defaultValues: {
      Name: '',
      Phone: '',
      Occupation: '',
      City: '',
    }
  })

  // Sync email input
  useEffect(() => {
    if (email) {
      setEmailValue('email', email)
    }
  }, [email, setEmailValue])

  const onEmailSubmit = (data: EmailFormInputs) => {
    checkEmail(data.email.trim())
  }

  const onRegisterSubmit = (data: RegisterFormInputs) => {
    prepareRegister({
      Email: email,
      ...data,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-x-hidden font-sans select-none transition-colors duration-200">
      
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 dark:bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Top Bar Navigation (Back to home + Theme toggle) */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 max-w-4xl mx-auto flex items-center justify-between z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Auth Screen Card Layout */}
      <div className="w-full max-w-md bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative z-10 flex flex-col gap-6 transition-colors duration-200 mt-12 sm:mt-0">
        
        {/* Step 1: Request Email */}
        {step === 'email' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">FinTrack Workspace</h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Enter your email address to access your secure ledger.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    disabled={authLoading}
                    {...registerEmail('email', { required: 'Email is required' })}
                    className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500/80 rounded-lg text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none transition-colors disabled:opacity-50 font-medium"
                  />
                </div>
                {emailErrors.email && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400">{emailErrors.email.message}</span>
                )}
              </div>

              {authError && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In / Continue'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Direct Register Form for New Users */}
        {step === 'register' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <button
                onClick={() => setStep('email')}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-2">Create Account</h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Welcome to FinTrack! Complete your profile to start tracking your records.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    disabled={authLoading}
                    {...registerFields('Name', { required: 'Name is required' })}
                    className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500/80 rounded-lg text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none transition-colors disabled:opacity-50 font-medium"
                  />
                </div>
                {registerErrors.Name && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400">{registerErrors.Name.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    disabled={authLoading}
                    {...registerFields('Phone')}
                    className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500/80 rounded-lg text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none transition-colors disabled:opacity-50 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Occupation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Software Engineer"
                    disabled={authLoading}
                    {...registerFields('Occupation')}
                    className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500/80 rounded-lg text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none transition-colors disabled:opacity-50 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Bangalore"
                    disabled={authLoading}
                    {...registerFields('City')}
                    className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500/80 rounded-lg text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none transition-colors disabled:opacity-50 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    readOnly
                    value={email}
                    className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-base md:text-sm text-zinc-600 dark:text-zinc-400 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {authError && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account & Open Workspace'
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
