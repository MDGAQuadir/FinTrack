import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { user, step } = useAuth()
  const location = useLocation()

  // 1. If not authenticated, redirect to /login
  if (!user || step !== 'dashboard') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // 2. If authenticated but balance is unset, redirect/lock to /profile
  const isBalanceUnset = user.Balance === null || user.Balance === undefined
  if (isBalanceUnset && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace state={{ balanceWarning: true }} />
  }

  return <Outlet />
}

export function PublicRoute() {
  const { user, step } = useAuth()

  // If already authenticated, redirect to /dashboard
  if (user && step === 'dashboard') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
