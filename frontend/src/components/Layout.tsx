import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ThemeToggle, useTheme } from '../hooks/useTheme'
import {
  Sparkles,
  Layers,
  TrendingUp,
  TrendingDown,
  User,
  LogOut,
  Menu,
  X,
  Wallet,
  Handshake,
  FileText,
  HelpCircle,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon } from './SocialIcons'

export function Layout() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const isBalanceUnset = user?.Balance === null || user?.Balance === undefined

  // Determine page title based on path
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard':
        return 'Overview Ledger'
      case '/credits':
        return 'Credits (Income)'
      case '/debits':
        return 'Debits (Expenses)'
      case '/debts':
        return 'Borrow & Lend'
      case '/statement':
        return 'Statement & Export'
      case '/profile':
        return 'Workspace Profile'
      case '/support':
        return 'Contact Support'
      default:
        return 'FinTrack'
    }
  }

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'FT'
    const parts = name.split(' ')
    return parts.map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  }

  const navItems = [
    { to: '/dashboard', label: 'Overview Ledger', icon: Layers },
    { to: '/credits', label: 'Credits (Income)', icon: TrendingUp },
    { to: '/debits', label: 'Debits (Expenses)', icon: TrendingDown },
    { to: '/debts', label: 'Borrow & Lend', icon: Handshake },
    { to: '/statement', label: 'Statement & Export', icon: FileText },
    { to: '/profile', label: 'Profile Settings', icon: User },
    { to: '/support', label: 'Contact Support', icon: HelpCircle },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950/90 backdrop-blur-2xl border-r border-zinc-200 dark:border-zinc-800/80 shadow-xl dark:shadow-2xl dark:shadow-black transition-colors duration-200">
      
      {/* Brand logo area */}
      <div className="px-6 py-6 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-indigo-600/5 border border-indigo-100 dark:border-indigo-500/30 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm dark:shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">FinTrack</h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider uppercase font-mono mt-1.5">Workspace</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation menu list */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {isBalanceUnset ? (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-inner">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Wallet className="w-4 h-4" />
              <span className="text-[11px] font-bold tracking-wider uppercase">Balance Lock</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Initialize your wallet balance to unlock workspace ledger features.
            </p>
            <NavLink
              to="/profile"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`
              }
            >
              <User className="w-4 h-4" />
              Setup Balance
            </NavLink>
          </div>
        ) : (
          navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-zinc-900/90 text-indigo-600 dark:text-zinc-100 border border-indigo-100 dark:border-zinc-700 shadow-sm dark:shadow-md font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
                  }`
                }
              >
                <Icon className={`w-4 h-4 ${location.pathname === item.to ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span>{item.label}</span>
              </NavLink>
            )
          })
        )}
      </div>

      {/* Developer social links */}
      <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800/40 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
        <span className="text-[11px] font-mono font-medium">Developer</span>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/MDGAQuadir"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            title="GitHub Profile"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/md-gulam-abdul-quadir-554b7a273"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-zinc-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="LinkedIn Profile"
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Bottom user profile area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-950/50 space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10 px-1 py-1">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 flex items-center justify-center font-bold text-xs tracking-wide font-mono shrink-0 shadow-sm dark:shadow-inner">
            {getInitials(user?.Name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{user?.Name || 'User Account'}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1 tracking-wide uppercase">{user?.Occupation || 'Workspace Member'}</p>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2.5 px-4 h-9.5 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-zinc-800 hover:border-rose-300 dark:hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 border border-zinc-200 dark:border-zinc-800/80 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row relative overflow-hidden font-sans select-none transition-colors duration-200">
      
      {/* Structural Ambient Background Glows */}
      {isDark && (
        <>
          <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none z-0 mix-blend-screen" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[60%] rounded-full bg-emerald-600/5 blur-[140px] pointer-events-none z-0 mix-blend-screen" />
        </>
      )}

      {/* 1. Mobile Top Header Bar */}
      <div className="md:hidden w-full bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/60 px-4 sm:px-5 py-3.5 flex items-center justify-between z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">FinTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors active:scale-95 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop mask overlay */}
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)} />
          {/* Sidebar Drawer container */}
          <div className="relative w-[280px] max-w-[85vw] h-full flex flex-col animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 3. Desktop Docked Sidebar Panel */}
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] h-screen z-30 shrink-0 relative">
        {sidebarContent}
      </aside>

      {/* 4. Independent Scrollable Main Content Canvas */}
      <div className="flex-1 flex flex-col h-[calc(100vh-57px)] md:h-screen overflow-hidden z-10 relative">
        
        {/* Desktop Content Header */}
        <header className="hidden md:flex h-[76px] lg:h-[84px] bg-white/40 dark:bg-transparent backdrop-blur-sm border-b border-zinc-200/50 dark:border-transparent px-6 lg:px-8 items-center justify-between shrink-0 z-20 transition-colors">
          <div className="space-y-0.5">
            <h2 className="text-[10px] font-semibold text-zinc-500 font-mono tracking-wider uppercase">Workspace Platform</h2>
            <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{getPageTitle(location.pathname)}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle showLabel />
          </div>
        </header>

        {/* Dynamic Nested Content Area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 pb-10 pt-3 md:pt-4 scroll-smooth">
          <div className="w-full h-full max-w-7xl mx-auto animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setShowLogoutConfirm(false)} />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-500 shrink-0">
                <LogOut className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Sign Out</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to log out of your session? You will need to request a new OTP to sign back in.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer active:scale-[0.98] transition-all bg-transparent text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 h-10 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs cursor-pointer active:scale-[0.98] transition-all shadow-md shadow-rose-600/20"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}