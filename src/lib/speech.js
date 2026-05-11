// Lightweight Web Speech API wrapper.
// Works on Chrome/Edge desktop, Safari iOS, Chrome Android, and the
// Capacitor WebView (which inherits Android Chrome's voices).

const SPEECH_PREF_KEY = 'mm_speech_enabled'

function api() {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

function isSupported() {
  return Boolean(api()) && typeof window.SpeechSynthesisUtterance === 'function'
}

// Voices load asynchronously on most browsers. Wait until they exist
// (with a short timeout) so the very first utterance doesn't get a
// silent fallback voice.
let _voicesPromise = null
function getVoices() {
  if (_voicesPromise) return _voicesPromise
  _voicesPromise = new Promise((resolve) => {
    if (!isSupported()) return resolve([])
    const synth = api()
    const existing = synth.getVoices()
    if (existing && existing.length) return resolve(existing)
    const t = setTimeout(() => resolve(synth.getVoices() || []), 1500)
    synth.onvoiceschanged = () => {
      clearTimeout(t)
      resolve(synth.getVoices() || [])
    }
  })
  return _voicesPromise
}

function pickSpanishVoice(voices) {
  if (!voices?.length) return null
  const score = (v) => {
    const lang = (v.lang || '').toLowerCase()
    if (lang.startsWith('es-cl')) return 6
    if (lang.startsWith('es-419')) return 5
    if (lang.startsWith('es-mx')) return 4
    if (lang.startsWith('es-us')) return 3
    if (lang.startsWith('es')) return 2
    return 0
  }
  return [...voices].sort((a, b) => score(b) - score(a))[0] || null
}

export function speechEnabled() {
  return localStorage.getItem(SPEECH_PREF_KEY) !== '0'
}

export function setSpeechEnabled(on) {
  localStorage.setItem(SPEECH_PREF_KEY, on ? '1' : '0')
}

export function shouldAutoSpeak(grade) {
  // 1°-3° básico: read aloud by default. Older grades: opt-in.
  const v = localStorage.getItem(SPEECH_PREF_KEY)
  if (grade <= 3) return v !== '0'
  return v === '1'
}

function sanitize(text) {
  return String(text || '')
    .replace(/[*_`#]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function speak(text, opts = {}) {
  if (!isSupported() || !text) return
  const synth = api()
  const clean = sanitize(text)
  if (!clean) return
  try {
    // Cancel any pending or in-flight utterance.
    synth.cancel()
    const voices = await getVoices()
    const u = new SpeechSynthesisUtterance(clean)
    u.lang = 'es-CL'
    u.rate = opts.rate ?? 0.95
    u.pitch = opts.pitch ?? 1.05
    const v = pickSpanishVoice(voices)
    if (v) u.voice = v
    // iOS Safari sometimes pauses; resume defensively.
    synth.speak(u)
    if (synth.paused) synth.resume()
  } catch (e) {
    console.warn('speak failed:', e)
  }
}

export function stopSpeaking() {
  if (!isSupported()) return
  try { api().cancel() } catch (_) {}
}

// Warm the voice cache as soon as the module loads (so the very first
// speak() in the lesson doesn't hit the async wait).
if (typeof window !== 'undefined' && isSupported()) {
  getVoices()
}
