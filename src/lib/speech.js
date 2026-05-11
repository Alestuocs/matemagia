// Lightweight wrapper around Web Speech API for child accessibility (1°-3° básico).
// Falls back silently if the browser doesn't support it.

const SPEECH_PREF_KEY = 'mm_speech_enabled'

function isSupported() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function'
}

let cachedVoice = null
function pickSpanishVoice() {
  if (!isSupported()) return null
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  // Prefer es-CL > es-419 > es-* > any
  const score = (v) => {
    const lang = (v.lang || '').toLowerCase()
    if (lang.startsWith('es-cl')) return 5
    if (lang.startsWith('es-419')) return 4
    if (lang.startsWith('es-mx') || lang.startsWith('es-us')) return 3
    if (lang.startsWith('es')) return 2
    return 0
  }
  cachedVoice = [...voices].sort((a, b) => score(b) - score(a))[0] || null
  return cachedVoice
}

export function speechEnabled() {
  return localStorage.getItem(SPEECH_PREF_KEY) === '1'
}

export function setSpeechEnabled(on) {
  localStorage.setItem(SPEECH_PREF_KEY, on ? '1' : '0')
}

export function shouldAutoSpeak(grade) {
  // 1°-3° básico → auto-speak ON by default unless user disabled it.
  if (grade > 3) return speechEnabled()
  const v = localStorage.getItem(SPEECH_PREF_KEY)
  if (v === null) return true // default ON for early grades
  return v === '1'
}

export function speak(text, opts = {}) {
  if (!isSupported() || !text) return
  try {
    // Cancel any pending utterance so we don't queue up
    window.speechSynthesis.cancel()
    // Strip emojis & markdown asterisks for cleaner TTS
    const clean = String(text)
      .replace(/[*_`]/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .trim()
    if (!clean) return
    const u = new SpeechSynthesisUtterance(clean)
    u.lang = 'es-CL'
    u.rate = opts.rate ?? 0.95
    u.pitch = opts.pitch ?? 1.05
    const v = pickSpanishVoice()
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  } catch (_) {}
}

export function stopSpeaking() {
  if (!isSupported()) return
  try { window.speechSynthesis.cancel() } catch (_) {}
}

// Some browsers populate voices async; warm the cache.
if (typeof window !== 'undefined' && isSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    pickSpanishVoice()
  }
}
