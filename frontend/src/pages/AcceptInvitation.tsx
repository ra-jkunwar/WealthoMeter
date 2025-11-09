import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Phone, User, CheckCircle, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check token immediately
    if (!token) {
      setTokenValid(false)
      setTokenError('No invitation token provided')
    } else {
      setTokenValid(true)
    }
  }, [token])
  
  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Invalid invitation link')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    
    setLoading(true)
    try {
      const response = await api.post('/auth/accept-invitation', {
        token,
        password,
        phone: phone.trim(),
        full_name: fullName.trim() || undefined,
      })
      
      // Store tokens
      const { access_token, refresh_token } = response.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      toast.success('Account activated successfully!')
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/app/dashboard'
      }, 1000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to accept invitation'
      toast.error(errorMessage)
      setTokenError(errorMessage)
      setTokenValid(false)
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <AuthLayout>
        <Toaster position="top-center" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (tokenValid === false) {
    return (
      <AuthLayout>
        <Toaster position="top-center" />
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="font-bold text-2xl text-foreground tracking-tight">
            Invalid Invitation
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tokenError || 'This invitation link is invalid or has expired.'}
          </p>
        </div>
        <div className="text-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:bg-primary/90"
          >
            Go to Login
          </a>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Toaster position="top-center" />
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="font-bold text-2xl text-foreground tracking-tight">
          Accept Invitation
        </h1>
        <p className="mt-2 text-muted-foreground">
          Set up your account to join the family on WealthoMeter
        </p>
      </div>
      <div className="relative overflow-hidden p-6">
        <div className="-top-40 -right-40 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl" />
        <div className="-bottom-40 -left-40 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl" />
        <div className="relative z-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-medium text-foreground" htmlFor="fullName">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 w-full rounded-md border-none bg-input pl-10 pr-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your name (optional)"
                  autoComplete="name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-medium text-foreground" htmlFor="phone">
                Phone number<span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-md border-none bg-input pl-10 pr-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-medium text-foreground" htmlFor="password">
                  Password<span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-md border-none bg-input px-3 pr-10 transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-0 right-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>
              <div className="space-y-2">
                <label className="font-medium text-foreground" htmlFor="confirmPassword">
                  Confirm password<span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-md border-none bg-input px-3 pr-10 transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-0 right-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="hover:-translate-y-0.5 relative h-11 w-full overflow-hidden rounded-md bg-primary text-primary-foreground text-sm shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Activating account...</span>
                  <span className="sm:hidden">Activating...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Activate Account</span>
                  <span className="sm:hidden">Activate</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in
          </a>
        </p>
      </div>
    </AuthLayout>
  )
}

