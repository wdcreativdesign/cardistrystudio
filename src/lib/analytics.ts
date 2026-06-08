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
    // GA4 requires the native `arguments` object — do not use rest params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void
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
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: true })
}

export function initMixpanel() {
  if (!MP_TOKEN) return
  mixpanel.init(MP_TOKEN, {
    persistence: 'localStorage',
    track_pageview: true,
    debug: import.meta.env.DEV,
    api_host: 'https://api-eu.mixpanel.com',
  })
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

/* ── Debounced event helper (pour sliders/color pickers) ────────── */
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function trackEventDebounced(
  name:    string,
  params?: Record<string, string | number | boolean>,
  delay = 800,
) {
  const key = name + JSON.stringify(params ? Object.keys(params) : [])
  const existing = _debounceTimers.get(key)
  if (existing) clearTimeout(existing)
  _debounceTimers.set(key, setTimeout(() => {
    trackEvent(name, params)
    _debounceTimers.delete(key)
  }, delay))
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

export function trackMagicLinkSent() {
  trackEvent('magic_link_sent')
}

export function trackBuyWideScreenClick() {
  trackEvent('buy_wide_screen_click')
}

export function trackRandomize() {
  trackEvent('randomize')
}

export function trackReset() {
  trackEvent('reset_card')
}

export function trackDisplayCountChange(count: number) {
  trackEvent('display_count_change', { count })
}

export function trackOrientationChange(orientation: string) {
  trackEvent('orientation_change', { orientation })
}

export function trackImageUpload(side: 'front' | 'back' | 'paste') {
  trackEvent('image_upload', { side })
}

export function trackTabSwitch(tab: string) {
  trackEvent('tab_switch', { tab })
}

export function trackCameraModeChange(mode: string) {
  trackEvent('camera_mode_change', { mode })
}

export function trackAddWorkspace() {
  trackEvent('page_add')
}

/* ── Pages ─────────────────────────────────────────────────────────── */

export function trackDeletePage() {
  trackEvent('page_delete')
}

export function trackRenamePage() {
  trackEvent('page_rename')
}

export function trackReorderPages() {
  trackEvent('page_reorder')
}

/* ── Layers ─────────────────────────────────────────────────────────── */

export function trackLayerAdd(face: 'front' | 'back') {
  trackEvent('layer_add', { face })
}

export function trackLayerDelete(face: 'front' | 'back') {
  trackEvent('layer_delete', { face })
}

export function trackLayerRename() {
  trackEvent('layer_rename')
}

export function trackLayerReorder(face: 'front' | 'back') {
  trackEvent('layer_reorder', { face })
}

export function trackLayerBlendMode(mode: string) {
  trackEvent('layer_blend_mode_change', { mode })
}

export function trackLayerOpacity(opacity: number) {
  trackEventDebounced('layer_opacity_change', { opacity })
}

/* ── Card colors ───────────────────────────────────────────────────── */

export function trackCardColorChange() {
  trackEventDebounced('card_color_change')
}

export function trackEdgeColorChange() {
  trackEventDebounced('edge_color_change')
}

/* ── Texture / Finish ──────────────────────────────────────────────── */

export function trackTextureChange(finish: string) {
  trackEvent('texture_change', { finish })
}

/* ── Lights & Shadow ───────────────────────────────────────────────── */

export function trackLightIntensityChange(value: number) {
  trackEventDebounced('light_intensity_change', { value })
}

export function trackLightAngleChange(value: number) {
  trackEventDebounced('light_angle_change', { value })
}

export function trackShadowChange(param: 'opacity' | 'blur', value: number) {
  trackEventDebounced('shadow_change', { param, value })
}

/* ── Tab switch (Face) ─────────────────────────────────────────────── */

export function trackFaceSwitchLayer(face: 'front' | 'back') {
  trackEvent('layer_face_switch', { face })
}
