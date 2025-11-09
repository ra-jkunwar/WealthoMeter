import { Link } from 'react-router-dom'
import { TrendingUp, Shield, Zap, Users, Download, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  WealthoMeter
                </span>
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">How it Works</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a>
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">Sign In</Link>
              <Link 
                to="/register" 
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
              <span className="text-xs text-gray-400">Privacy-first Family Wealth Tracking</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="text-white">Track your</span>
              <br />
              <span className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent">
                family wealth
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Consolidate all your family's financial accounts in one secure place. Track net worth, 
              manage accounts, and gain insights—all with bank-level encryption.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-base font-medium transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a 
                href="#features" 
                className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-lg text-base font-medium transition-all border border-white/10"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-gray-500">Encrypted</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">Real-time</div>
                <div className="text-sm text-gray-500">Sync</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">Multi-user</div>
                <div className="text-sm text-gray-500">Families</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">Zero</div>
                <div className="text-sm text-gray-500">Data Sharing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need to track your wealth
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built for families who value privacy and want complete control over their financial data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Bank-Level Security',
                description: 'End-to-end encryption with AES-256. Your data is encrypted at rest and in transit.'
              },
              {
                icon: Users,
                title: 'Family Accounts',
                description: 'Share financial views with family members while maintaining individual privacy controls.'
              },
              {
                icon: TrendingUp,
                title: 'Real-time Tracking',
                description: 'Automatic sync with banks, mutual funds, and investment accounts for up-to-date balances.'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Built with modern tech stack for blazing-fast performance and real-time updates.'
              },
              {
                icon: Download,
                title: 'Export & Reports',
                description: 'Generate detailed PDF and CSV reports for tax filing and financial planning.'
              },
              {
                icon: Shield,
                title: 'Privacy First',
                description: 'No data selling, no tracking, no third-party access. Your data belongs to you.'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-green-600/30 transition-all group"
              >
                <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600/20 transition-all">
                  <feature.icon className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple to get started
            </h2>
            <p className="text-xl text-gray-400">Three steps to financial clarity</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Family',
                description: 'Sign up and create a family account. Invite family members with customizable permissions.'
              },
              {
                step: '02',
                title: 'Link Accounts',
                description: 'Connect your bank accounts, investments, and assets securely through Account Aggregator.'
              },
              {
                step: '03',
                title: 'Track & Grow',
                description: 'Monitor your net worth, analyze spending, and make informed financial decisions.'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-green-600/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 w-full h-px bg-gradient-to-r from-green-600/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Start tracking your wealth today
              </h2>
              <p className="text-xl text-green-50 mb-8">
                Join families who trust WealthoMeter for their financial tracking
              </p>
              <Link 
                to="/register"
                className="inline-flex items-center justify-center bg-white text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-base font-medium transition-all shadow-lg"
              >
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  WealthoMeter
                </span>
              </h3>
              <p className="text-gray-500 text-sm">
                Privacy-first family wealth tracking for the modern family.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-500 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-500 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 WealthoMeter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

