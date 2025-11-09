import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Toaster } from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Github, Chrome, Sparkles } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUsed, setLastUsed] = useState<string | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    setLastUsed(localStorage.getItem('lastUsedLogin'))
  }, [])

  const handleSocialLogin = (provider: 'github' | 'google') => {
    // TODO: Implement social login
    console.log(`Social login with ${provider}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(email && password)) {
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      localStorage.setItem('lastUsedLogin', 'email')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Toaster position="top-center" />
      <div className="-mt-8 mb-8 text-center">
        <h1 className="font-bold text-2xl text-foreground">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to your account to continue your journey with WealthoMeter
        </p>
      </div>
      <div className="relative overflow-hidden p-6">
        <div className="-top-40 -right-40 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl" />
        <div className="-bottom-40 -left-40 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="space-y-6">
            <div className="-mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className="relative flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-background transition-all duration-200 hover:bg-primary/5"
                disabled={loading}
                onClick={() => handleSocialLogin('github')}
                type="button"
              >
                <Github className="mr-2 h-5 w-5" />
                <span>Sign in with GitHub</span>
                {lastUsed === 'github' && (
                  <span className="-top-4 -right-0.5 absolute inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs">
                    Last used
                  </span>
                )}
              </button>
              <button
                className="relative flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-background transition-all duration-200 hover:bg-primary/5"
                disabled={loading}
                onClick={() => handleSocialLogin('google')}
                type="button"
              >
                <Chrome className="mr-2 h-5 w-5" />
                <span>Sign in with Google</span>
                {lastUsed === 'google' && (
                  <span className="-top-4 -right-0.5 absolute inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs">
                    Last used
                  </span>
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 font-medium text-muted-foreground text-sm">
                  or continue with
                </span>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="font-medium text-foreground" htmlFor="email">
                  Email<span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  {lastUsed === 'email' && (
                    <span className="-translate-y-1/2 absolute top-1/2 right-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs sm:px-2">
                      <span className="hidden sm:inline">Last used</span>
                      <span className="sm:hidden">★</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-foreground" htmlFor="password">
                    Password<span className="text-primary">*</span>
                  </label>
                  <Link
                    className="h-auto cursor-pointer p-0 text-primary text-xs sm:text-sm hover:text-primary/80"
                    to="/login/forgot"
                  >
                    <span className="hidden sm:inline">Forgot password?</span>
                    <span className="sm:hidden">Forgot?</span>
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-md border-none bg-input px-3 pr-10 transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-0 right-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="hover:-translate-y-0.5 relative h-11 w-full overflow-hidden rounded-md bg-primary text-primary-foreground shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
              <Link to="/login/magic">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-center rounded-md font-medium text-primary hover:text-primary/80 hover:no-underline"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sign in with magic link
                </button>
              </Link>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{' '}
          <Link className="font-medium text-primary hover:text-primary/80" to="/register">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
