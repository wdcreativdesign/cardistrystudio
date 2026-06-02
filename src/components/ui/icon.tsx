import { cn } from '@/lib/utils'

interface IconProps {
  name: string
  size?: number
  filled?: boolean
  className?: string
}

/**
 * Google Material Symbols Rounded icon.
 * @param name  - Material Symbol name (e.g. "close", "download", "account_circle")
 * @param size  - Font size in px (default 20)
 * @param filled - Use filled variant (default false = outlined)
 */
export function Icon({ name, size = 20, filled = false, className }: IconProps) {
  return (
    <span
      className={cn('material-symbols-rounded select-none leading-none', className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        display: 'inline-block',
        lineHeight: 1,
        verticalAlign: 'middle',
      }}
    >
      {name}
    </span>
  )
}
