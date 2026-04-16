import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { MailCheck } from 'lucide-react'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { GameLayout, Divider } from '../components/GameLayout'

export default function EmailConfirmation() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <MailCheck className="w-12 h-12" style={{ color: '#C9A84C' }} />

            <h2
              className="text-3xl font-black uppercase tracking-widest font-serif"
              style={{ color: '#C9A84C', textShadow: '0 0 20px rgba(201,168,76,0.3)' }}
            >
              Check Your Email
            </h2>

            <Divider />

            <p
              className="text-sm font-serif tracking-wide max-w-xs"
              style={{ color: '#9b7060' }}
            >
              A confirmation link has been sent to your address. Click it to activate your account.
            </p>
          </motion.div>

          <Button onClick={() => navigate('/login')} className="w-full max-w-xs mt-4">
            Back to Login
          </Button>
        </div>
      </GameLayout>
    </PageTransition>
  )
}
