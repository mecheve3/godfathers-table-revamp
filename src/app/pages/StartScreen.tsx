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

  // Quick Match: goes through same config as Create but skips lobby
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
    { label: t('menu.quick'), handler: handleQuickMatch, delay: 0.1 },
    { label: t('menu.create'), handler: handleCreateMatch, delay: 0.2 },
    { label: t('menu.join'), handler: handleJoinMatch, delay: 0.3 },
  ]

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <p
              className="text-xs uppercase tracking-[0.4em] mb-2 font-light font-serif"
              style={{ color: '#9b1c1c' }}
            >
              {t('landing.welcome')}
            </p>
            <h1
              className="text-6xl font-black uppercase tracking-widest font-serif"
              style={{
                color: '#C9A84C',
                textShadow: '0 0 30px rgba(201,168,76,0.4), 0 2px 4px rgba(0,0,0,1)',
              }}
            >
              {t('landing.title')}
            </h1>
            <Divider />
          </motion.div>

          {options.map(({ label, handler, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay }}
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
