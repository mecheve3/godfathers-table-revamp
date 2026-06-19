import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { GameLayout, Divider } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'
import { useLang } from '../context/LanguageContext'

export default function StartScreen() {
  const navigate = useNavigate()
  const { setConfig } = useMatch()
  const { t } = useLang()

  const handleQuickMatch = () => {
    setConfig({ mode: 'quick' })
    navigate('/create')
  }

  const handleCreateMatch = () => {
    setConfig({ mode: 'create' })
    navigate('/create')
  }

  const handleJoinMatch = () => {
    setConfig({ mode: 'join' })
    navigate('/join')
  }

  const options = [
    { label: t('menu.quick'), handler: handleQuickMatch, delay: 0.15 },
    { label: t('menu.create'), handler: handleCreateMatch, delay: 0.25 },
    { label: t('menu.join'), handler: handleJoinMatch, delay: 0.35 },
  ]

  return (
    <PageTransition>
      <GameLayout>
        <div className="relative flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">

          {/* Poker table felt oval — decorative background element */}
          <div
            className="pointer-events-none absolute"
            style={{
              top: '58%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '520px',
              height: '270px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, #1f4a32 0%, #163827 60%, #0f2a1d 100%)',
              border: '3px solid #c79a4a',
              boxShadow: '0 0 50px rgba(199,154,74,0.10), inset 0 0 60px rgba(0,0,0,0.45)',
              zIndex: 0,
            }}
          />

          {/* Title block */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center mb-4"
          >
            <p
              className="text-xs uppercase tracking-[0.45em] mb-3 font-light font-serif"
              style={{ color: '#c79a4a', letterSpacing: '0.45em' }}
            >
              {t('landing.welcome')}
            </p>
            <h1
              className="text-6xl font-black uppercase tracking-widest font-serif"
              style={{
                color: '#e9cd86',
                textShadow: '0 0 40px rgba(233,205,134,0.35), 0 2px 6px rgba(0,0,0,1)',
              }}
            >
              {t('landing.title')}
            </h1>
            <Divider />
          </motion.div>

          {/* Action buttons */}
          {options.map(({ label, handler, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.35 }}
              className="relative z-10"
            >
              <Button onClick={handler} className="w-72">
                {label}
              </Button>
            </motion.div>
          ))}
        </div>
      </GameLayout>
    </PageTransition>
  )
}
