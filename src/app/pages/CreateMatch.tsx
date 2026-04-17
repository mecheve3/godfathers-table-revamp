import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { BackButton } from '../components/BackButton'
import { MatchOptionCard } from '../components/MatchOptionCard'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'

type Step = 'players' | 'seating'

const PLAYER_COUNTS = [3, 4, 5, 6] as const
const TEAM_COLORS = ["Blue", "Yellow", "Green", "Orange", "Purple"] as const

export default function CreateMatch() {
  const navigate = useNavigate()
  const { config, setConfig } = useMatch()

  const isQuickMatch = config?.mode === 'quick'

  const [step, setStep] = useState<Step>('players')
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null)
  const [seating, setSeating] = useState<'automatic' | 'manual' | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showNameModal) setTimeout(() => nameInputRef.current?.focus(), 50)
  }, [showNameModal])

  const handleConfirm = () => {
    if (!maxPlayers || !seating) return

    if (isQuickMatch) {
      setShowNameModal(true)
    } else {
      setConfig({ ...config!, settings: { maxPlayers, seating, isPrivate: false } })
      navigate('/lobby')
    }
  }

  const handleStartGame = () => {
    if (!maxPlayers || !seating) return
    const finalName = playerName.trim() || 'Red Team'
    const cpuSlots = Array.from({ length: maxPlayers - 1 }, (_, i) => ({
      id: `cpu-${i + 2}`,
      name: `${TEAM_COLORS[i]} Team`,
      kind: 'cpu' as const,
    }))
    const slots = [
      { id: 'self', name: finalName, kind: 'host' as const },
      ...cpuSlots,
    ]
    setConfig({ ...config!, settings: { maxPlayers, seating, isPrivate: false }, slots })
    navigate('/game')
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
                    title="Preset"
                    subtitle="Fixed positions"
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

      {/* Player name modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-[#1a0c06] border border-[#C9A84C]/40 rounded-lg w-full max-w-sm p-6 flex flex-col gap-5">
            <h2 className="text-[#F5AC0E] font-serif font-bold text-lg tracking-wide text-center">What's your name?</h2>
            <input
              ref={nameInputRef}
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStartGame() }}
              placeholder="Red Team"
              maxLength={20}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#F5AC0E] text-center text-lg"
            />
            <Button onClick={handleStartGame} className="w-full">
              Start Game
            </Button>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
