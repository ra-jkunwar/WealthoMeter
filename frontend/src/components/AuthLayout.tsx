import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Left Column - Blue Gradient Background */}
      <div className="relative hidden flex-col items-start justify-between overflow-hidden p-12 md:flex md:w-1/2">
        {/* Animated Blue Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>
        
        {/* Back Button */}
        <Link className="relative z-10 group" to="/">
          <button className="group scale-100 cursor-pointer rounded-md border border-white/10 bg-white/20 px-4 py-2 text-white transition-all duration-200 hover:scale-105 hover:bg-white/20">
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4 transition-all duration-200 group-hover:translate-x-[-4px]" />
              <span>Back</span>
            </div>
          </button>
        </Link>
        
        {/* Marketing Text */}
        <div className="relative z-10 text-white">
          <h1 className="mb-4 font-bold text-4xl leading-tight">
            Build better <br />
            products with <br />
            WealthoMeter
          </h1>
          <p className="max-w-md text-white/70">
            Connect your data sources, build insights, and share them with your
            team.
          </p>
        </div>
      </div>
      
      {/* Right Column - Form Content */}
      <div className="flex w-full flex-col overflow-auto bg-background md:w-1/2">
        {/* Logo */}
        <div className="flex justify-center p-6 pt-8 md:p-8 md:pt-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <span className="text-primary-foreground font-bold text-lg">W</span>
            </div>
            <span className="font-bold text-xl text-foreground">WealthoMeter</span>
          </Link>
        </div>
        
        {/* Form Content */}
        <div className="flex flex-1 items-center justify-center md:p-8 md:pt-0">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

