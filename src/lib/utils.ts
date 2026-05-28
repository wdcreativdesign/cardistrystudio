import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns the relative luminance of a hex color (WCAG 2.1) */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Returns '#1a1a1a' or '#ffffff' depending on which gives
 * a contrast ratio ≥ 4.5:1 against the given background color.
 * Falls back to dark for transparent backgrounds.
 */
export function contrastColor(bgColor: string): '#1a1a1a' | '#ffffff' {
  if (!bgColor || bgColor === 'transparent' || !bgColor.startsWith('#')) return '#1a1a1a'
  const L = luminance(bgColor)
  const contrastWhite = 1.05 / (L + 0.05)
  const contrastBlack = (L + 0.05) / 0.05
  return contrastWhite >= contrastBlack ? '#ffffff' : '#1a1a1a'
}
