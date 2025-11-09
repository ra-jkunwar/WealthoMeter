import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  full_name: string
  is_verified: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      // Verify token and get user
      api.get('/auth/me')
        .then((response) => {
          setUser(response.data)
          setIsAuthenticated(true)
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setIsAuthenticated(false)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [navigate])

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        two_factor_code: twoFactorCode,
      })
      
      const { access_token, refresh_token } = response.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      // Get user info
      const userResponse = await api.get('/auth/me')
      setUser(userResponse.data)
      setIsAuthenticated(true)
      
      toast.success('Login successful')
      // Use window.location for reliable redirect
      window.location.href = '/app/dashboard'
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed')
      throw error
    }
  }

  const register = async (email: string, phone: string, password: string, fullName?: string) => {
    try {
      await api.post('/auth/register', {
        email,
        phone,
        password,
        full_name: fullName,
      })
      
      toast.success('Registration successful. Please login.')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
    // Use window.location for reliable redirect from any page
    window.location.href = '/login'
  }

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  }
}

