import { useEffect, useState } from 'react'

/* ---------- Speech synthesis ---------- */

const VOICE_PREFS_KEY = 'linguawealth.voices'

/** Language codes that devices also publish under an older or alternative tag */
const aliases: Record<string, string[]> = {
  nb: ['nb', 'no', 'nn'],
  he: ['he', 'iw'],
  id: ['id', 'in'],
  fil: ['fil', 'tl'],
  ms: ['ms', 'id'],
}

const baseOf = (tag: string) => tag.toLowerCase().replace('_', '-').split('-')[0]

/** macOS novelty voices and other robotic engines that mangle real speech */
const novelty = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy|espeak)\b/i

/** Higher is better: exact accent first, then natural/neural/online voices over compact ones */
function scoreVoice(v: SpeechSynthesisVoice, lang: string) {
  const want = lang.toLowerCase()
  const have = v.lang.toLowerCase().replace('_', '-')
  let score = have === want ? 50 : 30
  const name = v.name
  if (/natural|neural/i.test(name)) score += 40
  if (/premium|enhanced|siri/i.test(name)) score += 30
  if (/google/i.test(name)) score += 25
  if (/online/i.test(name)) score += 15
  if (!v.localService) score += 5
  if (/compact/i.test(name)) score -= 15
  if (novelty.test(name)) score -= 80
  return score
}

function allVoices() {
  return 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []
}

/** Every voice that can speak this language, best first */
export function voicesFor(lang: string): SpeechSynthesisVoice[] {
  const base = baseOf(lang)
  const accepted = aliases[base] ?? [base]
  return allVoices()
    .filter((v) => accepted.includes(baseOf(v.lang)))
    .sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang))
}

/** Rough label for the voice picker */
export function voiceQuality(v: SpeechSynthesisVoice) {
  if (/natural|neural|premium|enhanced|siri/i.test(v.name)) return 'Natural'
  if (/google|online/i.test(v.name) || !v.localService) return 'Clear'
  return 'Basic'
}

function readPrefs(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(VOICE_PREFS_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function setPreferredVoice(lang: string, voiceURI: string) {
  localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify({ ...readPrefs(), [lang]: voiceURI }))
}

/** The learner's chosen voice for this language, or the best one available */
export function pickVoice(lang: string) {
  const voices = voicesFor(lang)
  const chosen = readPrefs()[lang]
  return voices.find((v) => v.voiceURI === chosen) ?? voices[0]
}

/** Tidy phrase text so the engine reads it naturally (e.g. "baat / chaa" becomes two words with a pause) */
const speakable = (text: string) => text.replace(/\s*\/\s*/g, ', ').trim()

/** Normal and slow speaking rates. A touch below 1 keeps every syllable clear for learners. */
export const RATE_NORMAL = 0.85
export const RATE_SLOW = 0.55

/** Read text aloud with the best voice this device has for the language */
export function speak(text: string, lang: string, rate = RATE_NORMAL, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    onEnd?.()
    return
  }
  const synth = window.speechSynthesis
  const u = new SpeechSynthesisUtterance(speakable(text))
  const voice = pickVoice(lang)
  if (voice) {
    u.voice = voice
    u.lang = voice.lang
  } else {
    u.lang = lang
  }
  u.rate = rate
  u.pitch = 1
  if (onEnd) {
    u.onend = () => onEnd()
    u.onerror = () => onEnd()
  }
  // Chrome sometimes drops an utterance queued right after cancel(), so give it a beat
  const busy = synth.speaking || synth.pending
  synth.cancel()
  if (busy) window.setTimeout(() => synth.speak(u), 80)
  else synth.speak(u)
}

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

/** Voices for a language that update when the browser finishes loading them */
export function useVoices(lang: string) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const update = () => setTick((t) => t + 1)
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  const voices = voicesFor(lang)
  const loaded = allVoices().length > 0
  return {
    voices,
    /** null while the browser is still loading voices */
    hasVoice: loaded ? voices.length > 0 : null,
    selected: pickVoice(lang),
    select: (voiceURI: string) => {
      setPreferredVoice(lang, voiceURI)
      setTick((t) => t + 1)
    },
  }
}

/** Whether this device has a voice for the language (voices load asynchronously) */
export function useHasVoice(lang: string) {
  return useVoices(lang).hasVoice
}

/* ---------- Speech recognition (Chrome, Edge, Safari) ---------- */

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: RecognitionResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const canRecognize = () => !!recognitionCtor()

/** Listen once and resolve with every transcript alternative the browser heard */
export function listenOnce(lang: string): { promise: Promise<string[]>; stop: () => void } {
  const Ctor = recognitionCtor()
  if (!Ctor) return { promise: Promise.reject(new Error('unsupported')), stop: () => {} }
  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = false
  rec.maxAlternatives = 5
  const promise = new Promise<string[]>((resolve, reject) => {
    let heard: string[] = []
    rec.onresult = (e) => {
      const first = e.results[0]
      heard = Array.from({ length: first.length }, (_, i) => first[i].transcript)
    }
    rec.onerror = (e) => reject(new Error(e.error))
    rec.onend = () => resolve(heard)
  })
  rec.start()
  return { promise, stop: () => rec.stop() }
}
