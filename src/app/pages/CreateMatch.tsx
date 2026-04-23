import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { BackButton } from '../components/BackButton'
import { MatchOptionCard } from '../components/MatchOptionCard'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'
import { createRoom } from '../features/multiplayer/api'
import { useLang } from '../context/LanguageContext'

type Step = 'players' | 'seating' | 'name'

const PLAYER_COUNTS = [3, 4, 5, 6] as const
const TEAM_COLORS = ["Blue", "Yellow", "Green", "Orange", "Purple"] as const

export default function CreateMatch() {
  const navigate = useNavigate()
  const { config, setConfig } = useMatch()

  const isQuickMatch = config?.mode === 'quick'

  const { t } = useLang()
  const [step, setStep] = useState<Step>('players')
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null)
  const [seating, setSeating] = useState<'automatic' | 'manual' | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'name') setTimeout(() => nameInputRef.current?.focus(), 50)
  }, [step])

  const handleSeatingConfirm = () => {
    if (!maxPlayers || !seating) return
    // Both paths need a name — show the name step
    setStep('name')
  }

  /** Quick match: start immediately with CPU fill */
  const handleStartQuickGame = () => {
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

  /** Lobby match: create room via Worker, then navigate to lobby */
  const handleCreateLobby = async () => {
    if (!maxPlayers || !seating) return
    const finalName = playerName.trim() || 'Red Team'
    const hostId = `host-${Date.now()}`

    setIsLoading(true)
    try {
      const { roomCode } = await createRoom({ maxPlayers, hostId, hostName: finalName, seating: seating! })
      setConfig({
        ...config!,
        mode: 'create',
        roomCode,
        playerName: finalName,
        hostId,
        settings: { maxPlayers, seating, isPrivate: false },
      })
      navigate('/lobby')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameSubmit = () => {
    if (isQuickMatch) handleStartQuickGame()
    else handleCreateLobby()
  }

  const title = isQuickMatch ? t('setup.title.quick') : t('setup.title.create')

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
                <p className="text-xs uppercase tracking-[0.35em] font-serif" style={{ color: '#9b1c1c' }}>
                  {t('setup.players')}
                </p>
                <div className="flex gap-4">
                  {PLAYER_COUNTS.map((count) => (
                    <MatchOptionCard
                      key={count}
                      title={String(count)}
                      subtitle={t('setup.players.label')}
                      selected={maxPlayers === count}
                      onClick={() => setMaxPlayers(count)}
                      className="h-40 w-40"
                    />
                  ))}
                </div>
                <Button onClick={() => setStep('seating')} disabled={!maxPlayers} className="w-64">
                  {t('setup.next')}
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
                <p className="text-xs uppercase tracking-[0.35em] font-serif" style={{ color: '#9b1c1c' }}>
                  {t('setup.seating')}
                </p>
                <div className="flex gap-6">
                  <MatchOptionCard
                    title={t('setup.seating.preset')}
                    subtitle={t('setup.seating.preset.sub')}
                    selected={seating === 'automatic'}
                    onClick={() => setSeating('automatic')}
                    className="h-44 w-56"
                    titleSize="text-3xl"
                  />
                  <MatchOptionCard
                    title={t('setup.seating.manual')}
                    subtitle={t('setup.seating.manual.sub')}
                    selected={seating === 'manual'}
                    onClick={() => setSeating('manual')}
                    className="h-44 w-56"
                    titleSize="text-3xl"
                  />
                </div>
                <Button onClick={handleSeatingConfirm} disabled={!seating} className="w-64">
                  {t('setup.next')}
                </Button>
              </motion.div>
            )}

            {step === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="flex flex-col items-center gap-8 w-full max-w-xs"
              >
                <p className="text-xs uppercase tracking-[0.35em] font-serif" style={{ color: '#9b1c1c' }}>
                  {t('setup.name')}
                </p>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit() }}
                  placeholder={t('setup.name.placeholder')}
                  maxLength={20}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#F5AC0E] text-center text-lg"
                />
                <Button onClick={handleNameSubmit} isLoading={isLoading} className="w-full">
                  {isQuickMatch ? t('setup.start') : t('setup.create_lobby')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BackButton
          onClick={
            step === 'seating' ? () => setStep('players') :
            step === 'name'    ? () => setStep('seating') :
            undefined
          }
          to={step === 'players' ? '/menu' : undefined}
        />
      </GameLayout>
    </PageTransition>
  )
}
