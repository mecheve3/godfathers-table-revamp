import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Volume2, VolumeX } from 'lucide-react'
import { useAudio } from '../features/game/AudioContext'
import { useLang } from '../context/LanguageContext'
import { useMatch } from '../features/match/MatchContext'
import FeedbackButton from '../components/FeedbackButton'

export default function StartScreen() {
  const navigate = useNavigate()
  const { setConfig } = useMatch()
  const { musicEnabled, toggleMusic } = useAudio()
  const { lang, setLang, t } = useLang()
  const prefersReduced = useReducedMotion() ?? false

  const [quickHover, setQuickHover] = useState(false)

  const handleQuickMatch  = () => { setConfig({ mode: 'quick'  }); navigate('/create') }
  const handleCreateMatch = () => { setConfig({ mode: 'create' }); navigate('/create') }
  const handleJoinMatch   = () => { setConfig({ mode: 'join'   }); navigate('/join')   }

  // Returns motion props for a fade-up entrance, or {} to skip animation
  const fadeUp = (delay: number) => prefersReduced ? {} : {
    initial:    { opacity: 0, y: 18 },
    animate:    { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: 'radial-gradient(125% 95% at 50% -10%, #3d2415 0%, #1f120b 44%, #100a06 100%)',
      }}
    >

      {/* ── Atmospheric layers ─────────────────────────────────────────── */}

      {/* Film grain — fractal noise overlay at ~5% */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1, mixBlendMode: 'overlay', opacity: 0.055 }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="film-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#film-grain)" />
        </svg>
      </div>

      {/* Lamp glow — warm amber bloom from top-center, candle-flickers */}
      <div
        className="candle-glow pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '65%',
          background: 'radial-gradient(ellipse 55% 75% at 50% -2%, rgba(245,172,14,0.26) 0%, rgba(180,90,15,0.09) 45%, transparent 100%)',
          zIndex: 2,
        }}
      />

      {/* Cigar smoke wisps */}
      <div
        className="smoke-drift-1 pointer-events-none absolute"
        style={{
          left: '36%', bottom: '38%',
          width: 260, height: 320,
          background: 'radial-gradient(ellipse, rgba(215,195,165,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(26px)',
          zIndex: 2,
        }}
      />
      <div
        className="smoke-drift-2 pointer-events-none absolute"
        style={{
          left: '57%', bottom: '30%',
          width: 190, height: 250,
          background: 'radial-gradient(ellipse, rgba(195,175,145,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(20px)',
          zIndex: 2,
        }}
      />

      {/* Vignette — edges collapse to near-black */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 42%, transparent 25%, rgba(4,2,1,0.50) 62%, rgba(4,2,1,0.93) 100%)',
          zIndex: 3,
        }}
      />

      {/* Poker table felt arc — bottom-anchored, curves up from floor */}
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140vw',
          height: '38%',
          background: 'radial-gradient(ellipse 100% 100% at 50% 100%, #1c4830 0%, #14372a 50%, #0c2218 100%)',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          zIndex: 4,
        }}
      >
        {/* Brass rim line along the curve */}
        <div style={{
          position: 'absolute',
          top: -1, left: 0, right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent 4%, #9a7730 15%, #c79a4a 35%, #e9cd86 50%, #c79a4a 65%, #9a7730 85%, transparent 96%)',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          boxShadow: '0 0 14px rgba(199,154,74,0.55), 0 -1px 6px rgba(233,205,134,0.25)',
        }} />
      </div>

      {/* ── Content stack ─────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center px-6 pb-4" style={{ zIndex: 10 }}>

        {/* Eyebrow */}
        <motion.p
          {...(prefersReduced ? {} : {
            initial:    { opacity: 0, y: -10 },
            animate:    { opacity: 1, y: 0 },
            transition: { delay: 0.45, duration: 0.8, ease: 'easeOut' },
          })}
          style={{
            fontFamily: "'Cinzel', 'Palatino Linotype', serif",
            fontSize: '0.57rem',
            letterSpacing: '0.55em',
            color: '#a07838',
            textTransform: 'uppercase',
            marginBottom: '0.9rem',
          }}
        >
          {t('landing.eyebrow')}
        </motion.p>

        {/* Wordmark — sheen sweep defined in index.css */}
        <motion.div
          {...(prefersReduced ? {} : {
            initial:    { opacity: 0, scale: 0.93 },
            animate:    { opacity: 1, scale: 1 },
            transition: { delay: 0.7, duration: 0.95, ease: [0.16, 1, 0.3, 1] },
          })}
          style={{ filter: 'drop-shadow(0 3px 12px rgba(0,0,0,1)) drop-shadow(0 0 50px rgba(233,205,134,0.18))' }}
        >
          <h1
            className="wordmark-sheen"
            style={{
              fontFamily: "'Cinzel', 'Palatino Linotype', serif",
              fontWeight: 700,
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              textAlign: 'center',
              marginBottom: '1.1rem',
            }}
          >
            {t('landing.title')}
          </h1>
        </motion.div>

        {/* Deco divider — rule · oxblood diamond · rule */}
        <motion.div
          {...(prefersReduced ? {} : {
            initial:    { opacity: 0, scaleX: 0.3 },
            animate:    { opacity: 1, scaleX: 1 },
            transition: { delay: 1.0, duration: 0.6, ease: 'easeOut' },
          })}
          className="flex items-center gap-3 mb-4"
          style={{ width: 'min(340px, 82vw)' }}
        >
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(199,154,74,0.65))' }} />
          <div style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: '#b23b2e', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(199,154,74,0.65))' }} />
        </motion.div>

        {/* Tagline */}
        <motion.p
          {...(prefersReduced ? {} : {
            initial:    { opacity: 0 },
            animate:    { opacity: 1 },
            transition: { delay: 1.1, duration: 0.9, ease: 'easeOut' },
          })}
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '1.05rem',
            color: '#9a7030',
            letterSpacing: '0.015em',
            marginBottom: '2.8rem',
            textAlign: 'center',
          }}
        >
          {t('landing.tagline')}
        </motion.p>

        {/* Quick Match — primary CTA */}
        <motion.div
          {...fadeUp(1.25)}
          className="flex flex-col items-center mb-5"
          style={{ width: 'min(420px, 90vw)' }}
        >
          <button
            onClick={handleQuickMatch}
            onMouseEnter={() => setQuickHover(true)}
            onMouseLeave={() => setQuickHover(false)}
            style={{
              width: '100%',
              padding: '14px 28px',
              background: 'linear-gradient(180deg, #f1d795 0%, #cba24f 100%)',
              color: '#1a0e04',
              border: 'none',
              borderRadius: '6px',
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transform: quickHover ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: quickHover
                ? '0 6px 22px rgba(199,154,74,0.55), 0 2px 8px rgba(0,0,0,0.5)'
                : '0 3px 12px rgba(0,0,0,0.45)',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
          >
            {t('menu.quick')}
          </button>
          <p style={{
            fontFamily: "'Oswald', 'Impact', sans-serif",
            fontWeight: 300,
            fontSize: '0.6rem',
            letterSpacing: '0.45em',
            color: '#7a5c30',
            textTransform: 'uppercase',
            marginTop: '0.6rem',
          }}>
            {t('landing.quick.caption')}
          </p>
        </motion.div>

        {/* Ghost pair — Create Match & Join Match */}
        <motion.div
          {...fadeUp(1.42)}
          className="flex gap-3"
          style={{ width: 'min(420px, 90vw)' }}
        >
          {([
            { label: t('menu.create'), handler: handleCreateMatch },
            { label: t('menu.join'),   handler: handleJoinMatch   },
          ] as const).map(({ label, handler }) => (
            <button
              key={label}
              onClick={handler}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                color: '#c79a4a',
                border: '1px solid rgba(199,154,74,0.35)',
                borderRadius: '6px',
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'border-color 0.18s ease, color 0.18s ease, background 0.18s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(199,154,74,0.7)'
                el.style.color = '#e9cd86'
                el.style.background = 'rgba(199,154,74,0.06)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(199,154,74,0.35)'
                el.style.color = '#c79a4a'
                el.style.background = 'transparent'
              }}
            >
              {label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* ── Fixed chrome ──────────────────────────────────────────────── */}

      <FeedbackButton />

      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
        aria-label={t('layout.lang_toggle')}
        className="fixed bottom-16 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          background: 'rgba(15,8,2,0.85)',
          border: '1px solid rgba(199,154,74,0.27)',
          backdropFilter: 'blur(4px)',
          color: '#c79a4a',
        }}
      >
        {lang === 'en' ? '🇪🇸' : '🇺🇸'}
      </button>

      {/* Music toggle */}
      <button
        onClick={toggleMusic}
        aria-label={musicEnabled ? t('layout.mute') : t('layout.unmute')}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: musicEnabled ? 'rgba(20,12,3,0.85)' : 'rgba(15,8,2,0.85)',
          border: `1px solid ${musicEnabled ? 'rgba(199,154,74,0.33)' : 'rgba(199,154,74,0.13)'}`,
          backdropFilter: 'blur(4px)',
          color: musicEnabled ? '#c79a4a' : '#6b4c2a',
        }}
      >
        {musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </div>
  )
}
