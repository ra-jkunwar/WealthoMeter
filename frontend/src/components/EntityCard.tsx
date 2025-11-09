import { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface EntityCardProps {
  title: string
  subtitle?: string
  value: string | number
  icon?: React.ElementType
  onClick?: () => void
  className?: string
  children?: ReactNode
}

export default function EntityCard({
  title,
  subtitle,
  value,
  icon: Icon,
  onClick,
  className,
  children,
}: EntityCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group overflow-hidden rounded border border-border/50 bg-card p-4 shadow-sm transition-all duration-200',
        'hover:border-primary/20 hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {title}
              </p>
              <p className="mt-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {typeof value === 'number' 
                  ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : String(value)}
              </p>
              {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {Icon && (
              <div className="ml-2 flex-shrink-0 rounded-lg bg-primary/5 p-2 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
            )}
          </div>
          {children && (
            <div className="mt-3 pt-3 border-t border-border/50">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

