import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'

// Global Axios Request Interceptor for JWT Authorization
axios.interceptors.request.use(
  (config) => {
    const saved = localStorage.getItem('fintrack_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`
        }
      } catch (err) {
        console.error('Error parsing token from localStorage:', err)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Global Axios Response Interceptor to clear stale/expired tokens on 401/403
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const url = error.config?.url || ''
      if (!url.includes('/api/auth/check') && !url.includes('/api/auth/verify') && !url.includes('/api/auth/register')) {
        console.warn('Authentication expired or invalid. Resetting session token.')
      }
    }
    return Promise.reject(error)
  }
)

export interface UserProfile {
  _id?: string
  Name: string
  Email: string
  Phone: string
  Occupation: string
  City: string
  Balance?: number
  Address?: string
  Zipcode?: string
  State?: string
  Country?: string
  OTP?: string
  token?: string
}

export type AuthStep = 'email' | 'otp' | 'register' | 'register-otp' | 'dashboard'

export interface AuthContextType {
  email: string
  user: UserProfile | null
  loading: boolean
  error: string | null
  step: AuthStep
  checkEmail: (email: string) => Promise<void>
  prepareRegister: (formData: Omit<UserProfile, '_id' | 'Balance'>) => Promise<void>
  verifyOtpCode: (otp: string) => Promise<boolean>
  updateStartingBalance: (balance: number) => Promise<boolean>
  updateProfile: (formData: Omit<UserProfile, 'Email' | '_id' | 'Balance' | 'OTP'>) => Promise<boolean>
  refreshUser: () => Promise<void>
  setStep: (step: AuthStep) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Persistence: initialize state from localStorage if it exists
  const [email, setEmail] = useState<string>(() => {
    const saved = localStorage.getItem('fintrack_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile
        return parsed.Email || ''
      } catch {
        return ''
      }
    }
    return ''
  })

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fintrack_user')
    if (saved) {
      try {
        return JSON.parse(saved) as UserProfile
      } catch {
        return null
      }
    }
    return null
  })

  const [step, setStep] = useState<AuthStep>(() => {
    const saved = localStorage.getItem('fintrack_user')
    return saved ? 'dashboard' : 'email'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Check Email API call (Direct Instant Login if user exists)
  const checkEmail = async (inputEmail: string) => {
    setLoading(true)
    setError(null)
    setEmail(inputEmail)

    try {
      const response = await axios.post('/api/auth/check', { email: inputEmail })
      const { exists, token, user: returnedUser } = response.data

      if (exists && token && returnedUser) {
        const userWithToken = { ...returnedUser, token }
        setUser(userWithToken)
        localStorage.setItem('fintrack_user', JSON.stringify(userWithToken))
        setStep('dashboard')
      } else {
        setStep('register')
      }
    } catch (err: any) {
      console.error('Check Email Client Error:', err)
      setError(err.response?.data?.message || err.message || 'An error occurred while checking email.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Prepare register flow (Direct Instant Registration)
  const prepareRegister = async (formData: Omit<UserProfile, '_id' | 'Balance'>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/register', formData)
      if (response.data?.success && response.data?.token) {
        const createdUser = response.data.user
        const token = response.data.token
        const userWithToken = { ...createdUser, token }
        setUser(userWithToken)
        localStorage.setItem('fintrack_user', JSON.stringify(userWithToken))
        setStep('dashboard')
      } else {
        throw new Error('Registration failed to return a valid user.')
      }
    } catch (err: any) {
      console.error('Register Client Error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to initialize registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Verify OTP code (instructs backend to verify OTP code)
  const verifyOtpCode = async (enteredOtp: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/verify', {
        email,
        otp: enteredOtp,
      })

      if (response.data?.success) {
        const verifiedUser = response.data.user
        const token = response.data.token
        const userWithToken = { ...verifiedUser, token }
        setUser(userWithToken)

        // Save to localStorage for session persistence
        localStorage.setItem('fintrack_user', JSON.stringify(userWithToken))

        setStep('dashboard')
        return true
      }
      return false
    } catch (err: any) {
      console.error('Verify OTP Client Error:', err)
      setError(err.response?.data?.message || err.message || 'Verification failed.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 4. Update Starting Balance (hits local proxy backend)
  const updateStartingBalance = async (newBalance: number): Promise<boolean> => {
    if (!user?._id) return false
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('/api/auth/balance', {
        userRowId: user._id,
        balance: newBalance,
      })
      if (response.data?.success) {
        const returnedUser = response.data.user
        setUser((prev) => {
          const updated = { ...prev, ...returnedUser }
          localStorage.setItem('fintrack_user', JSON.stringify(updated))
          return updated
        })
        return true
      }
      return false
    } catch (err: any) {
      console.error('Update Starting Balance Client Error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to set starting balance.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 5. Update Profile Details (hits local proxy backend)
  const updateProfile = async (updatedFields: Omit<UserProfile, 'Email' | '_id' | 'Balance' | 'OTP'>): Promise<boolean> => {
    if (!user?._id) return false
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('/api/auth/profile', {
        userRowId: user._id,
        ...updatedFields,
      })
      if (response.data?.success) {
        const returnedUser = response.data.user
        setUser((prev) => {
          const updated = { ...prev, ...returnedUser }
          localStorage.setItem('fintrack_user', JSON.stringify(updated))
          return updated
        })
        return true
      }
      return false
    } catch (err: any) {
      console.error('Update Profile Client Error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update profile.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 6. Refresh User details from the database
  const refreshUser = useCallback(async () => {
    try {
      const response = await axios.post('/api/auth/me')
      const { success, user: foundUser } = response.data
      if (success && foundUser) {
        const currentUser = localStorage.getItem('fintrack_user')
        let token = ''
        if (currentUser) {
          try {
            token = JSON.parse(currentUser).token || ''
          } catch { }
        }
        const updatedUser = { ...foundUser, token }
        setUser(updatedUser)
        localStorage.setItem('fintrack_user', JSON.stringify(updatedUser))
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err)
    }
  }, [])

  // Log out
  const logout = () => {
    setUser(null)
    setEmail('')
    localStorage.removeItem('fintrack_user')
    setStep('email')
  }

  return (
    <AuthContext.Provider
      value={{
        email,
        user,
        loading,
        error,
        step,
        checkEmail,
        prepareRegister,
        verifyOtpCode,
        updateStartingBalance,
        updateProfile,
        refreshUser,
        setStep,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
