import type { ReactNode } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useAudio } from '../features/game/AudioContext'
import { useLang } from '../context/LanguageContext'

/**
 * Full-screen dark gradient wrapper used by every game screen.
 * Provides the consistent Godfather's Table background and a
 * persistent music toggle in the bottom-right corner.
 */
export function GameLayout({ children }: { children: ReactNode }) {
  const { musicEnabled, toggleMusic } = useAudio()
  const { lang, setLang, t } = useLang()

  return (
    <div
      className="relative min-h-screen w-full flex flex-col"
      style={{
        background:
          'linear-gradient(160deg, #1a0a04 0%, #2B1710 40%, #3D2314 70%, #1a0a04 100%)',
      }}
    >
      {children}

      {/* Language toggle — fixed bottom-right, above music */}
      <button
        onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
        aria-label={t('layout.lang_toggle')}
        className="fixed bottom-16 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors text-sm font-bold"
        style={{
          background: 'rgba(30,10,5,0.85)',
          border: '1px solid #C9A84C44',
          backdropFilter: 'blur(4px)',
          color: '#C9A84C',
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
          background: musicEnabled ? 'rgba(63,21,21,0.85)' : 'rgba(30,10,5,0.85)',
          border: `1px solid ${musicEnabled ? '#C9A84C55' : '#6b4c2a44'}`,
          backdropFilter: 'blur(4px)',
          color: musicEnabled ? '#C9A84C' : '#6b4c2a',
        }}
      >
        {musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </div>
  )
}

/** Decorative gold/red divider line. */
export function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-red-800/70" />
      <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-red-800/70" />
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
          color: '#C9A84C',
          textShadow: '0 0 20px rgba(201,168,76,0.35), 0 2px 4px rgba(0,0,0,1)',
        }}
      >
        {children}
      </h2>
      <Divider />
    </div>
  )
}
