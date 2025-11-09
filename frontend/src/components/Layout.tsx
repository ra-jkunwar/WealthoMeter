import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Users, Wallet, Receipt, LogOut, Eye, Bell, Monitor, Info, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: Eye },
    { path: '/app/families', label: 'Families', icon: Users },
    { path: '/app/accounts', label: 'Accounts', icon: Wallet },
    { path: '/app/transactions', label: 'Transactions', icon: Receipt },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="h-screen overflow-hidden text-foreground">
      {/* Mobile Header */}
      <header className="fixed top-0 right-0 left-0 z-50 h-14 w-full border-b border-border bg-background shadow-sm md:hidden">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent active:bg-accent/80"
            >
              {isMobileOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
            <Link
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
              to="/app/dashboard"
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="font-semibold text-lg text-foreground">WealthoMeter</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent active:bg-accent/80"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Category Sidebar - Desktop only */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-40 w-12 border-r border-sidebar-border bg-sidebar-primary">
        <div className="flex h-full flex-col">
          <div className="flex h-12 items-center justify-center border-b border-sidebar-border">
            <Link
              className="relative flex-shrink-0 transition-opacity hover:opacity-80"
              to="/app/dashboard"
            >
              <div className="h-6 w-6 rounded bg-primary"></div>
            </Link>
          </div>
          <div className="flex-1" />
          <div className="space-y-2 border-t border-sidebar-border p-2 pb-4">
            <div className="flex justify-center">
              <button 
                onClick={toggleSidebar}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/50"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/70" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-sidebar-foreground/70" />
                )}
              </button>
            </div>
            <div className="flex justify-center">
              <button className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/50">
                <Bell className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
            </div>
            <div className="flex justify-center">
              <button className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/50">
                <Monitor className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
            </div>
            <div className="flex justify-center">
              <button className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/50">
                <Info className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/50"
              >
                <LogOut className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <nav
        className={`
          fixed inset-y-0 z-50 bg-sidebar
          border-r border-sidebar-border transition-all duration-300 ease-out
          left-0 md:left-12
          top-0 md:top-0
          ${isSidebarCollapsed ? 'w-0 md:w-0' : 'w-64 sm:w-72 md:w-64 lg:w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarCollapsed ? 'md:overflow-hidden' : ''}
          shadow-lg md:shadow-none
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={`border-b border-sidebar-border p-4 pt-14 md:pt-4 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sidebar-foreground truncate">WealthoMeter</h2>
                <p className="text-xs text-sidebar-foreground/70 mt-0.5 truncate">
                  {user?.full_name || user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSidebar}
                  className="hidden md:flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
                  aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="md:hidden flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent active:bg-sidebar-accent/80"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-sidebar-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className={`flex-1 overflow-y-auto ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
            <nav aria-label="Main navigation" className="flex flex-col">
              <div className="text-sm">
                {navItems.map((item) => {
                  const ItemIcon = item.icon
                  const active = isActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                        ${active
                          ? 'border-r-2 border-sidebar-ring bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                        }
                      `}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <ItemIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className={`relative h-screen transition-all duration-200 ease-out pt-14 md:pt-0 ${
        isSidebarCollapsed 
          ? 'pl-0 md:pl-12' 
          : 'pl-0 md:pl-[304px] lg:pl-[336px]'
      }`}>
        <div className="h-screen overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
