import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Toaster } from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Github, Chrome, Info } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'

export default function Register() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSocialLogin = (provider: 'github' | 'google') => {
    // TODO: Implement social login
    console.log(`Social login with ${provider}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      return
    }
    if (!acceptTerms) {
      return
    }
    setLoading(true)
    try {
      await register(email, phone, password, fullName)
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Toaster position="top-center" />
      <div className="mb-8 text-center">
        <h1 className="font-bold text-2xl text-foreground tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sign up to start tracking your family's wealth with WealthoMeter
        </p>
      </div>
      <div className="relative overflow-hidden p-6">
        <div className="-top-40 -right-40 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl" />
        <div className="-bottom-40 -left-40 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="space-y-4">
            <div className="-mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <button
                className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-background transition-all duration-200 hover:bg-primary/5"
                disabled={loading}
                onClick={() => handleSocialLogin('github')}
                type="button"
              >
                <Github className="mr-2 h-5 w-5" />
                <span>Sign up with GitHub</span>
              </button>
              <button
                className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-background transition-all duration-200 hover:bg-primary/5"
                disabled={loading}
                onClick={() => handleSocialLogin('google')}
                type="button"
              >
                <Chrome className="mr-2 h-5 w-5" />
                <span>Sign up with Google</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 font-medium text-muted-foreground text-sm">
                  or continue with email
                </span>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="font-medium text-foreground" htmlFor="fullName">
                  Full name<span className="text-primary">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium text-foreground" htmlFor="email">
                  Email address<span className="text-primary">*</span>
                </label>
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
              </div>
              <div className="space-y-2">
                <label className="font-medium text-foreground" htmlFor="phone">
                  Phone number<span className="text-primary">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="font-medium text-foreground" htmlFor="password">
                      Password<span className="text-primary">*</span>
                    </label>
                    <div title="Password must be at least 8 characters long">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
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
                </div>
                <div className="space-y-2">
                  <label className="whitespace-nowrap font-medium text-foreground" htmlFor="confirmPassword">
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
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 cursor-pointer rounded border-border bg-input text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <label className="text-muted-foreground text-xs leading-relaxed sm:text-sm cursor-pointer" htmlFor="terms">
                    <span className="hidden sm:inline">
                      I agree to the{' '}
                      <Link className="font-medium text-primary hover:text-primary/80" to="/terms" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link className="font-medium text-primary hover:text-primary/80" to="/privacy" target="_blank">
                        Privacy Policy
                      </Link>
                    </span>
                    <span className="sm:hidden">
                      I agree to{' '}
                      <Link className="font-medium text-primary hover:text-primary/80" to="/terms" target="_blank">
                        Terms
                      </Link>{' '}
                      &{' '}
                      <Link className="font-medium text-primary hover:text-primary/80" to="/privacy" target="_blank">
                        Privacy
                      </Link>
                    </span>
                  </label>
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
                    <span className="hidden sm:inline">Creating account...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Create account</span>
                    <span className="sm:hidden">Sign up</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link className="font-medium text-primary hover:text-primary/80" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
