import { cn } from '@/lib/utils'

export function SegControl<T extends string>({ options, value, onChange }: {
  options:  { key: T; label: string }[]
  value:    T
  onChange: (v: T) => void
}) {
  const activeIndex = options.findIndex((o) => o.key === value)

  return (
    <div className="relative flex items-center bg-[#242424] rounded-full p-[4px] h-[40px] w-full">
      {/* Sliding indicator */}
      <div
        className="absolute top-[4px] bottom-[4px] rounded-full bg-[#141414] pointer-events-none"
        style={{
          width:      `calc((100% - 8px) / ${options.length})`,
          left:       `calc(4px + ${activeIndex} * (100% - 8px) / ${options.length})`,
          transition: 'left 200ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'relative flex-1 h-[32px] rounded-full text-[14px] font-medium transition-colors duration-200 z-10',
            value === key ? 'text-white' : 'text-[#999]',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
