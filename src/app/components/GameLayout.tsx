import type { ReactNode } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useAudio } from '../features/game/AudioContext'
import { useLang } from '../context/LanguageContext'

/**
 * Full-screen dark wrapper used by every setup screen.
 * Deep near-black background with a slow ambient candlelight glow at the top.
 */
export function GameLayout({ children }: { children: ReactNode }) {
  const { musicEnabled, toggleMusic } = useAudio()
  const { lang, setLang, t } = useLang()

  return (
    <div
      className="relative min-h-screen w-full flex flex-col overflow-hidden"
      style={{ background: '#170d08' }}
    >
      {/* Ambient candlelight glow — emanates from top-center */}
      <div
        className="candle-glow pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '55%',
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(233,205,134,0.95) 0%, transparent 100%)',
          zIndex: 0,
        }}
      />

      {/* Content layer above glow */}
      <div className="relative z-10 flex flex-col flex-1">
        {children}
      </div>

      {/* Language toggle — fixed bottom-right, above music */}
      <button
        onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
        aria-label={t('layout.lang_toggle')}
        className="fixed bottom-16 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors text-sm font-bold"
        style={{
          background: 'rgba(15,8,2,0.85)',
          border: '1px solid #c79a4a44',
          backdropFilter: 'blur(4px)',
          color: '#c79a4a',
        }}
      >
        {lang === 'en' ? '🇪🇸' : '🇺🇸'}
      </button>

      {/* Music toggle — fixed bottom-right over all setup/lobby screens */}
      <button
        onClick={toggleMusic}
        aria-label={musicEnabled ? t('layout.mute') : t('layout.unmute')}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{
          background: musicEnabled ? 'rgba(20,12,3,0.85)' : 'rgba(15,8,2,0.85)',
          border: `1px solid ${musicEnabled ? '#c79a4a55' : '#c79a4a22'}`,
          backdropFilter: 'blur(4px)',
          color: musicEnabled ? '#c79a4a' : '#6b4c2a',
        }}
      >
        {musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </div>
  )
}

/** Decorative gold divider with a crimson diamond accent. */
export function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(199,154,74,0.5))' }} />
      <div className="w-2 h-2 rotate-45" style={{ background: '#b23b2e' }} />
      <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(199,154,74,0.5))' }} />
    </div>
  )
}

/** Gold serif heading used at the top of each screen. */
export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-center">
      <h2
        className="text-4xl font-black uppercase tracking-widest font-serif"
        style={{
          color: '#e9cd86',
          textShadow: '0 0 24px rgba(233,205,134,0.30), 0 2px 4px rgba(0,0,0,1)',
        }}
      >
        {children}
      </h2>
      <Divider />
    </div>
  )
}
