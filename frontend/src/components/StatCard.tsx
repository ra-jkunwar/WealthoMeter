import { memo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '../lib/utils'
import TrendArrow from './TrendArrow'
import TrendPercentage from './TrendPercentage'

interface MiniChartDataPoint {
  date: string
  value: number
}

interface Trend {
  change?: number
  current: number
  previous: number
  currentPeriod: { start: string; end: string }
  previousPeriod: { start: string; end: string }
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ElementType
  trend?: Trend | number
  trendLabel?: string
  isLoading?: boolean
  className?: string
  variant?: 'default' | 'success' | 'info' | 'warning' | 'danger'
  invertTrend?: boolean
  id?: string
  chartData?: MiniChartDataPoint[]
  showChart?: boolean
  formatChartValue?: (value: number) => string
}

const formatMetricNumber = (value: number): string => {
  if (value == null || Number.isNaN(value)) {
    return '0'
  }
  return Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

const MiniChart = memo(({ data, id, formatChartValue }: { data: MiniChartDataPoint[]; id: string; formatChartValue?: (value: number) => string }) => {
  const hasData = data && data.length > 0
  const hasVariation = hasData && data.some((d) => d.value !== data[0].value)

  if (!hasData) {
    return (
      <div className="flex h-7 items-center justify-center">
        <div className="text-muted-foreground text-xs">No data</div>
      </div>
    )
  }

  if (!hasVariation) {
    return (
      <div className="flex h-7 items-center">
        <div className="h-0.5 w-full rounded-full bg-primary/20" />
      </div>
    )
  }

  return (
    <div className="chart-container group/chart">
      <ResponsiveContainer height={28} width="100%">
        <AreaChart data={data} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
          <defs>
            <linearGradient id={`gradient-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-color)" stopOpacity={0.8} />
              <stop offset="50%" stopColor="var(--chart-color)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-color)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={['dataMin - 10%', 'dataMax + 10%']} hide />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.[0] && typeof payload[0].value === 'number' ? (
                <div className="rounded-lg border border-border/50 bg-background/95 p-3 text-xs shadow-xl backdrop-blur-sm">
                  <p className="mb-1 font-medium text-foreground">
                    {new Date(label).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: data.length > 30 ? 'numeric' : undefined,
                    })}
                  </p>
                  <p className="font-semibold text-primary">
                    {formatChartValue ? formatChartValue(payload[0].value) : formatMetricNumber(payload[0].value)}
                  </p>
                </div>
              ) : null
            }
            cursor={{ stroke: 'var(--chart-color)', strokeWidth: 1, strokeOpacity: 0.3 }}
          />
          <Area
            activeDot={{ r: 3, fill: 'var(--chart-color)', stroke: 'var(--background)', strokeWidth: 2 }}
            dataKey="value"
            dot={false}
            fill={`url(#gradient-${id})`}
            stroke="var(--chart-color)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

MiniChart.displayName = 'MiniChart'

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  isLoading = false,
  className,
  variant = 'default',
  invertTrend = false,
  id,
  chartData,
  showChart = false,
  formatChartValue,
}: StatCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-accent/10 border-accent/20'
      case 'info':
        return 'bg-accent/10 border-accent/20'
      case 'warning':
        return 'bg-muted border-border'
      case 'danger':
        return 'bg-destructive/10 border-destructive/20'
      default:
        return ''
    }
  }

  const trendValue = typeof trend === 'object' && trend !== null ? trend.change : trend

  if (isLoading) {
    return (
      <div
        className={cn(
          'group overflow-hidden pt-0 border-border/50 bg-card rounded border shadow-sm',
          className
        )}
        id={id}
      >
        <div className="relative p-3 sm:p-4">
          <div className="relative z-10 space-y-1.5 sm:space-y-2">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="h-[10px] w-20 bg-muted rounded-full sm:h-3" />
                <div className="mt-1 h-6 w-24 bg-muted rounded-md sm:h-8" />
              </div>
              {Icon && <div className="ml-1.5 flex-shrink-0 rounded-lg bg-muted/50 p-1 sm:ml-2 sm:p-1.5"><div className="h-3 w-3 bg-muted rounded-full sm:h-4 sm:w-4" /></div>}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 bg-muted rounded-full" />
              <div className="h-3 w-16 bg-muted rounded-full" />
            </div>
          </div>
        </div>
        {showChart && (
          <div className="-mb-0.5 sm:-mb-1 p-1">
            <div className="h-7 w-full bg-muted rounded-sm" />
          </div>
        )}
      </div>
    )
  }

  const displayValue =
    typeof value === 'string' || typeof value !== 'number'
      ? value.toString()
      : formatMetricNumber(value)

  const hasValidChartData = showChart && chartData && chartData.length > 0

  return (
    <div
      className={cn(
        'group overflow-hidden pt-0 border-border/50 hover:border-primary/20 bg-card rounded border shadow-sm',
        getVariantClasses(),
        className
      )}
      id={id}
      style={{ '--chart-color': 'var(--primary)' } as React.CSSProperties}
    >
      <div className="relative p-3 sm:p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100" />

        <div className="relative z-10 space-y-1.5 sm:space-y-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="line-clamp-1 font-semibold text-[9px] text-muted-foreground uppercase tracking-wider sm:text-[10px] md:text-xs">
                  {title}
                </p>
              </div>
              <div
                className={cn(
                  'font-bold text-foreground leading-tight group-hover:text-primary',
                  typeof value === 'string' && value.length > 8
                    ? 'text-base sm:text-lg md:text-xl'
                    : 'text-lg sm:text-xl md:text-2xl'
                )}
              >
                {displayValue}
              </div>
            </div>
            {Icon && (
              <div className="ml-1.5 flex-shrink-0 rounded-lg bg-primary/5 p-1 group-hover:bg-primary/10 sm:ml-2 sm:p-1.5">
                <Icon className="h-3 w-3 text-primary/70 group-hover:text-primary sm:h-4 sm:w-4" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs">
            <div className="flex min-h-[12px] items-center sm:min-h-[14px]">
              {trendValue !== undefined && !Number.isNaN(trendValue) ? (
                <div className="flex items-center">
                  <TrendArrow invertColor={invertTrend} value={trendValue} />
                  <TrendPercentage className="ml-0.5" invertColor={invertTrend} value={trendValue} />
                </div>
              ) : (
                description && <span className="font-medium text-muted-foreground">{description}</span>
              )}
            </div>
            {trendLabel && trendValue !== undefined && !Number.isNaN(trendValue) && (
              <span className="hidden text-right font-medium text-muted-foreground md:block">
                {trendLabel}
              </span>
            )}
          </div>

          {hasValidChartData && (
            <div className="-mb-0.5 sm:-mb-1" style={{ '--chart-color': 'var(--primary)' } as React.CSSProperties}>
              <MiniChart data={chartData} formatChartValue={formatChartValue} id={id || `chart-${Math.random()}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

