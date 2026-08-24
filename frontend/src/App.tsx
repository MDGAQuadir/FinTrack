import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import { AuthProvider } from './hooks/useAuth'
import { LedgerProvider } from './hooks/useLedger'
import { ProtectedRoute, PublicRoute } from './components/RouteGuard'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CreditsPage } from './pages/CreditsPage'
import { DebitsPage } from './pages/DebitsPage'
import { ProfilePage } from './pages/ProfilePage'
import { LandingPage } from './pages/LandingPage'
import { BorrowLendPage } from './pages/BorrowLendPage'
import { StatementPage } from './pages/StatementPage'
import { SupportPage } from './pages/SupportPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LedgerProvider>
          <BrowserRouter>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Onboarding/Auth Steps */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Protected Workspace Ledger Pages */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/credits" element={<CreditsPage />} />
                  <Route path="/debits" element={<DebitsPage />} />
                  <Route path="/debts" element={<BorrowLendPage />} />
                  <Route path="/statement" element={<StatementPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/support" element={<SupportPage />} />
                </Route>
              </Route>

              {/* Direct fallback redirecting to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </LedgerProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
