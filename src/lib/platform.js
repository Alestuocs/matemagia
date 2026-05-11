// Platform detection helpers.
// Used to hide flows that don't work inside the Capacitor WebView yet
// (e.g. Google OAuth, which would redirect to https://localhost/ —
// not a registered redirect URI in the Google OAuth client).

export function isCapacitorApp() {
  if (typeof window === 'undefined') return false
  // Capacitor 6 injects window.Capacitor.isNativePlatform when running in
  // the Android/iOS WebView. As a fallback we detect the localhost host
  // that Capacitor's androidScheme uses.
  return Boolean(window.Capacitor?.isNativePlatform?.())
    || window.location.hostname === 'localhost'
}

export function isWeb() {
  return !isCapacitorApp()
}
