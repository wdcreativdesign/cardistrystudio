/**
 * Analytics — GA4 + Mixpanel
 *
 * GA4    : VITE_GA_ID in .env
 * Mixpanel : VITE_MIXPANEL_TOKEN in .env
 * Both are disabled in dev mode.
 */

import mixpanel from 'mixpanel-browser'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag:      (...args: unknown[]) => void
  }
}

const GA_ID    = import.meta.env.VITE_GA_ID            as string | undefined
const MP_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN   as string | undefined

/* ── Init ──────────────────────────────────────────────────────────── */
export function initGA() {
  if (!GA_ID || import.meta.env.DEV) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function (...args: unknown[]) { window.dataLayer.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: true })
}

export function initMixpanel() {
  if (!MP_TOKEN) return
  mixpanel.init(MP_TOKEN, { persistence: 'localStorage', track_pageview: true, debug: import.meta.env.DEV })
}

/* ── Event helper ──────────────────────────────────────────────────── */
export function trackEvent(
  name:    string,
  params?: Record<string, string | number | boolean>,
) {
  // GA4
  if (GA_ID && typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
  // Mixpanel
  if (MP_TOKEN) {
    mixpanel.track(name, params)
  }
}

/* ── Identity (à appeler après login) ─────────────────────────────── */
export function identifyUser(userId: string, email?: string) {
  if (!MP_TOKEN || import.meta.env.DEV) return
  mixpanel.identify(userId)
  if (email) mixpanel.people.set({ $email: email })
}

export function resetUser() {
  if (!MP_TOKEN || import.meta.env.DEV) return
  mixpanel.reset()
}

/* ── Typed event shortcuts ─────────────────────────────────────────── */

export function trackExport(format: string, scale: number) {
  trackEvent('export_card', { format, scale })
}

export function trackOpenBuyCredits() {
  trackEvent('view_buy_credits')
}

export function trackBeginCheckout(packName: string, priceCents: number) {
  trackEvent('begin_checkout', { pack: packName, value: priceCents / 100, currency: 'EUR' })
}

export function trackPurchase(packName: string, priceCents: number) {
  trackEvent('purchase', { pack: packName, value: priceCents / 100, currency: 'EUR' })
}

export function trackSignOut() {
  trackEvent('sign_out')
  resetUser()
}
