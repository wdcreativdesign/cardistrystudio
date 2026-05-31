/**
 * Google Analytics 4 — lightweight wrapper
 *
 * Set VITE_GA_ID in your .env (or Vercel env vars) to enable tracking.
 * Analytics is automatically disabled in dev mode (import.meta.env.DEV).
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag:      (...args: unknown[]) => void
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined

/* ── Init ──────────────────────────────────────────────────────────── */
export function initGA() {
  if (!GA_ID || import.meta.env.DEV) return

  // Inject gtag.js script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  // Bootstrap dataLayer + gtag function
  window.dataLayer = window.dataLayer ?? []
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    send_page_view: true,   // track initial page load
  })
}

/* ── Event helper ──────────────────────────────────────────────────── */
export function trackEvent(
  name:    string,
  params?: Record<string, string | number | boolean>,
) {
  if (!GA_ID || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

/* ── Typed event shortcuts ─────────────────────────────────────────── */

/** User exported a card image */
export function trackExport(format: string, scale: number) {
  trackEvent('export_card', { format, scale })
}

/** User opened the "Buy credits" modal */
export function trackOpenBuyCredits() {
  trackEvent('view_buy_credits')
}

/** User was redirected to Stripe checkout */
export function trackBeginCheckout(packName: string, priceCents: number) {
  trackEvent('begin_checkout', { pack: packName, value: priceCents / 100, currency: 'EUR' })
}

/** User returned from Stripe with credits=ok */
export function trackPurchase(packName: string, priceCents: number) {
  trackEvent('purchase', { pack: packName, value: priceCents / 100, currency: 'EUR' })
}

/** User signed out */
export function trackSignOut() {
  trackEvent('sign_out')
}
