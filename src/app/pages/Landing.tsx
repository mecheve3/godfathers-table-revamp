import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { GameLayout, Divider } from '../components/GameLayout'
import { FEATURES } from '../features/auth/flags'
import { useLang } from '../context/LanguageContext'

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useLang()

  const AUTH_BUTTONS = [
    { label: t('landing.login'), path: '/login', delay: 0.4 },
    { label: t('landing.signup'), path: '/signup', delay: 0.5 },
    { label: t('landing.guest'), path: '/menu', delay: 0.6 },
  ]

  useEffect(() => {
    if (!FEATURES.AUTH_ENABLED) navigate('/menu', { replace: true })
  }, [navigate])

  if (!FEATURES.AUTH_ENABLED) return null

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-10"
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

          {AUTH_BUTTONS.map(({ label, path, delay }) => (
            <motion.div key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
              <Button onClick={() => navigate(path)} className="w-72">
                {label}
              </Button>
            </motion.div>
          ))}
        </div>
      </GameLayout>
    </PageTransition>
  )
}
