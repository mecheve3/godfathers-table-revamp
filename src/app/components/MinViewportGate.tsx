import { useEffect, useState, type ReactNode } from 'react'
import { useLang } from '../context/LanguageContext'

// The game targets PC/Mac and tablet for now. Real tablets (portrait or landscape) sit
// at 768px+ — this threshold must stay comfortably below that so tablets are never gated.
const MIN_WIDTH = 650

interface MinViewportGateProps {
  children: ReactNode
}

/** Blocks phone-width viewports with a friendly message instead of the (currently
 *  unsupported) narrow layout. Reacts live to resize/orientation changes, not just
 *  the width at mount. */
export function MinViewportGate({ children }: MinViewportGateProps) {
  const { t } = useLang()
  const [isTooNarrow, setIsTooNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MIN_WIDTH,
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MIN_WIDTH - 1}px)`)
    const update = () => setIsTooNarrow(mql.matches)
    update()
    mql.addEventListener('change', update)
    window.addEventListener('orientationchange', update)
    return () => {
      mql.removeEventListener('change', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  if (!isTooNarrow) return <>{children}</>

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-8 text-center"
      style={{
        background: 'radial-gradient(125% 95% at 50% -10%, #3d2415 0%, #1f120b 44%, #100a06 100%)',
      }}
    >
      <div style={{ maxWidth: 340 }}>
        <h1
          style={{
            fontFamily: "'Cinzel', 'Palatino Linotype', serif",
            fontWeight: 700,
            fontSize: '1.4rem',
            letterSpacing: '0.04em',
            color: '#C9A84C',
            textShadow: '0 2px 4px rgba(0,0,0,1)',
            marginBottom: '1rem',
          }}
        >
          {t('viewport.gate.title')}
        </h1>
        <p
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#c79a4a',
          }}
        >
          {t('viewport.gate.message')}
        </p>
      </div>
    </div>
  )
}
