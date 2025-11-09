import { cn } from '../lib/utils'

interface TrendArrowProps {
  id?: string
  value: number
  invertColor?: boolean
  className?: string
}

export default function TrendArrow({ id, value, invertColor = false, className }: TrendArrowProps) {
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→'
  let colorClass = 'text-muted-foreground'

  if (value > 0) {
    colorClass = invertColor ? 'text-destructive' : 'text-success'
  }
  if (value < 0) {
    colorClass = invertColor ? 'text-success' : 'text-destructive'
  }

  return (
    <span className={cn(colorClass, className)} id={id}>
      {arrow}
    </span>
  )
}

