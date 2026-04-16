import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { BackButton } from '../components/BackButton'
import { MatchOptionCard } from '../components/MatchOptionCard'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'

type Step = 'players' | 'seating'

const PLAYER_COUNTS = [3, 4, 5, 6] as const

export default function CreateMatch() {
  const navigate = useNavigate()
  const { config, setConfig } = useMatch()

  const isQuickMatch = config?.mode === 'quick'

  const [step, setStep] = useState<Step>('players')
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null)
  const [seating, setSeating] = useState<'automatic' | 'manual' | null>(null)

  const handleConfirm = () => {
    if (!maxPlayers || !seating) return

    if (isQuickMatch) {
      // Quick match: fill all seats with CPU except player 1 (host), navigate directly to game
      const cpuSlots = Array.from({ length: maxPlayers - 1 }, (_, i) => ({
        id: `cpu-${i + 2}`,
        name: `CPU ${i + 2}`,
        kind: 'cpu' as const,
      }))
      const slots = [
        { id: 'self', name: 'You', kind: 'host' as const },
        ...cpuSlots,
      ]
      setConfig({ ...config!, settings: { maxPlayers, seating, isPrivate: false }, slots })
      toast.success('Starting game with CPU opponents…')
      navigate('/game')
    } else {
      setConfig({ ...config!, settings: { maxPlayers, seating, isPrivate: false } })
      navigate('/lobby')
    }
  }

  const ctaLabel = isQuickMatch ? 'Start Game' : 'Create Lobby'
  const title = isQuickMatch ? 'Quick Match' : 'Create Match'

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center pt-24 pb-32 px-6 gap-14">
          <ScreenTitle>{title}</ScreenTitle>

          <AnimatePresence mode="wait">
            {step === 'players' && (
              <motion.div
                key="players"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="flex flex-col items-center gap-10"
              >
                <p
                  className="text-xs uppercase tracking-[0.35em] font-serif"
                  style={{ color: '#9b1c1c' }}
                >
                  Number of Players
                </p>

                <div className="flex gap-4">
                  {PLAYER_COUNTS.map((count) => (
                    <MatchOptionCard
                      key={count}
                      title={String(count)}
                      subtitle="Players"
                      selected={maxPlayers === count}
                      onClick={() => setMaxPlayers(count)}
                      className="h-40 w-40"
                    />
                  ))}
                </div>

                <Button
                  onClick={() => setStep('seating')}
                  disabled={!maxPlayers}
                  className="w-64"
                >
                  Next
                </Button>
              </motion.div>
            )}

            {step === 'seating' && (
              <motion.div
                key="seating"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="flex flex-col items-center gap-10"
              >
                <p
                  className="text-xs uppercase tracking-[0.35em] font-serif"
                  style={{ color: '#9b1c1c' }}
                >
                  Seating Arrangement
                </p>

                <div className="flex gap-6">
                  <MatchOptionCard
                    title="Automatic"
                    subtitle="Preset seating"
                    selected={seating === 'automatic'}
                    onClick={() => setSeating('automatic')}
                    className="h-44 w-56"
                  />
                  <MatchOptionCard
                    title="Manual"
                    subtitle="Choose your seat"
                    selected={seating === 'manual'}
                    onClick={() => setSeating('manual')}
                    className="h-44 w-56"
                  />
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={!seating}
                  className="w-64"
                >
                  {ctaLabel}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BackButton
          onClick={step === 'seating' ? () => setStep('players') : undefined}
          to={step === 'players' ? '/menu' : undefined}
        />
      </GameLayout>
    </PageTransition>
  )
}
