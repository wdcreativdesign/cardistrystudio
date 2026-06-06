import { useState, useRef, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'

function fmt(v: number, unit = '°') {
  const rounded = Math.round(v)
  return `${rounded > 0 ? '+' : ''}${rounded}${unit}`
}

export function SliderRow({ label, value, min, max, step = 1, unit = '°', format: fmtFn, onChange }: {
  label:    string
  value:    number
  min:      number
  max:      number
  step?:    number
  unit?:    string
  format?:  (v: number) => string
  onChange: (v: number) => void
}) {
  const [editing,  setEditing]  = useState(false)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const display = fmtFn ? fmtFn(value) : fmt(value, unit)

  function startEdit() { setInputVal(String(value)); setEditing(true) }
  function commitEdit(raw = inputVal) {
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)))
    setEditing(false)
  }

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [editing])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-white">{label}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={() => commitEdit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  { e.preventDefault(); commitEdit() }
              if (e.key === 'Escape') setEditing(false)
            }}
            className="text-[12px] font-medium text-white text-right w-16 h-6 rounded-[4px] px-1 bg-[#242424] border border-[#9ae600] focus:outline-none"
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={startEdit}
            onKeyDown={(e) => e.key === 'Enter' && startEdit()}
            title="Click to edit"
            className="text-[12px] font-medium text-white bg-[#242424] rounded-[4px] px-1 h-6 w-16 text-right cursor-text select-none hover:brightness-110 transition-colors inline-flex items-center justify-end"
          >
            {display}
          </span>
        )}
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}
