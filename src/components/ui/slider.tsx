import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center h-5', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-[8px] w-full grow rounded-full bg-[#2a2a2a] overflow-hidden">
      <SliderPrimitive.Range className="absolute h-full bg-[#9AE600]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-6 shrink-0 rounded-full bg-white shadow-md shadow-black/50 ring-0 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9AE600]/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
