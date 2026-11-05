import { AudioLines, VolumeX } from 'lucide-react'
import { speak, useVoices, voiceQuality } from '../lib/speech'

const qualityStyle: Record<string, string> = {
  Natural: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Clear: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  Basic: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

/** Lets the learner choose which installed voice reads a language aloud. The best one is picked by default. */
export default function VoicePicker({ lang, sample, languageName }: { lang: string; sample: string; languageName: string }) {
  const { voices, hasVoice, selected, select } = useVoices(lang)

  if (hasVoice === null) return null

  if (!hasVoice) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-left text-xs text-sky-900 dark:bg-sky-500/10 dark:text-sky-200">
        <VolumeX className="mt-0.5 size-4 shrink-0" />
        This device has no {languageName} voice, so pronunciation may be off. For the best audio use Chrome or Edge, or add a {languageName} voice in your system's speech settings.
      </p>
    )
  }

  const quality = selected ? voiceQuality(selected) : 'Basic'

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
      <AudioLines className="size-4 text-slate-400" />
      <label htmlFor="voice-picker" className="text-slate-500 dark:text-slate-400">Voice</label>
      <select
        id="voice-picker"
        value={selected?.voiceURI}
        onChange={(e) => {
          select(e.target.value)
          window.setTimeout(() => speak(sample, lang), 0)
        }}
        className="max-w-56 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800"
      >
        {voices.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} ({v.lang})
          </option>
        ))}
      </select>
      <span className={`rounded-full px-2 py-0.5 font-semibold ${qualityStyle[quality]}`}>{quality}</span>
      {quality === 'Basic' && voices.length === 1 && (
        <span className="w-full text-center text-slate-400">Tip: Chrome and Edge include clearer online voices.</span>
      )}
    </div>
  )
}
