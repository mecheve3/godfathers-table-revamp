import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Copy, CheckCircle2, User, Bot, Clock } from 'lucide-react'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { BackButton } from '../components/BackButton'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'
import type { LobbySlot } from '../features/match/types'

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function buildInitialSlots(maxPlayers: number): LobbySlot[] {
  return [
    { id: 'self', name: 'You', kind: 'host' },
    ...Array.from({ length: maxPlayers - 1 }, (_, i) => ({
      id: `slot-${i + 2}`,
      name: '',
      kind: 'empty' as const,
    })),
  ]
}

const SLOT_ICON = {
  host:  <User className="w-4 h-4" />,
  human: <User className="w-4 h-4" />,
  cpu:   <Bot className="w-4 h-4" />,
  empty: <Clock className="w-4 h-4 opacity-40" />,
}

export default function MatchLobby() {
  const navigate = useNavigate()
  const { config, clearConfig } = useMatch()

  const maxPlayers = config?.settings?.maxPlayers ?? 4
  const isJoining = config?.mode === 'join'

  // Stable room code — generated once on mount
  const roomCode = useRef(config?.roomCode ?? generateRoomCode()).current

  const [slots, setSlots] = useState<LobbySlot[]>(() => buildInitialSlots(maxPlayers))
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const emptyCount = slots.filter((s) => s.kind === 'empty').length
  const isLobbyFull = emptyCount === 0

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = async () => {
    setIsStarting(true)

    // Fill every empty seat with a CPU player before starting
    const filledSlots = slots.map((slot, i) =>
      slot.kind === 'empty'
        ? { ...slot, name: `CPU ${i + 1}`, kind: 'cpu' as const }
        : slot
    )
    setSlots(filledSlots)

    // Store filled slots in context so Game.tsx can read them
    setConfig({ ...config!, slots: filledSlots })

    await new Promise<void>((resolve) => setTimeout(resolve, 400))
    toast.success('Starting game!')
    setIsStarting(false)
    navigate('/game')
  }

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center pt-16 pb-32 px-6 gap-10">
          <ScreenTitle>Match Lobby</ScreenTitle>

          {/* Room code */}
          <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Copy room code"
            className="flex items-center gap-3 group"
          >
            <span
              className="text-xl font-serif uppercase tracking-widest"
              style={{ color: '#9b7060' }}
            >
              Room Code:
            </span>
            <strong
              className="text-2xl font-serif uppercase tracking-widest"
              style={{ color: '#C9A84C' }}
            >
              {roomCode}
            </strong>
            {copied
              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
              : <Copy className="w-5 h-5 opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: '#C9A84C' }} />
            }
          </motion.button>

          {/* Player slots */}
          <div
            className="w-full max-w-md border p-6 flex flex-col gap-3"
            style={{
              background: 'linear-gradient(180deg, #0d0402 0%, #0f0602 100%)',
              borderColor: '#3f1515',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
            }}
          >
            <p
              className="text-xs uppercase tracking-[0.35em] font-serif mb-2"
              style={{ color: '#9b1c1c' }}
            >
              Players ({slots.filter((s) => s.kind !== 'empty').length}/{maxPlayers})
            </p>

            <AnimatePresence>
              {slots.map((slot) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 py-2 border-b last:border-b-0"
                  style={{ borderColor: '#2a0808' }}
                >
                  <span style={{ color: slot.kind === 'empty' ? '#4a3020' : '#C9A84C' }}>
                    {SLOT_ICON[slot.kind]}
                  </span>
                  <span
                    className="text-base font-serif uppercase tracking-wider"
                    style={{
                      color: slot.kind === 'empty' ? '#4a3020' : '#C9A84C',
                      fontStyle: slot.kind === 'empty' ? 'italic' : 'normal',
                    }}
                  >
                    {slot.kind === 'empty' ? 'Empty seat' : slot.name}
                  </span>
                  {slot.kind === 'cpu' && (
                    <span className="ml-auto text-xs uppercase tracking-wider" style={{ color: '#6b4c2a' }}>
                      CPU
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* CPU fill hint */}
          {!isJoining && emptyCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-serif text-center"
              style={{ color: '#9b7060' }}
            >
              {isLobbyFull
                ? 'All seats filled — ready to start.'
                : `Waiting for players… Start now to fill ${emptyCount} seat${emptyCount > 1 ? 's' : ''} with CPU opponents.`
              }
            </motion.p>
          )}

          {/* Start game — host only */}
          {!isJoining && (
            <Button onClick={handleStartGame} isLoading={isStarting} className="w-64">
              Start Game
            </Button>
          )}

          {/* Joiner view */}
          {isJoining && (
            <p
              className="text-sm font-serif text-center animate-pulse"
              style={{ color: '#9b7060' }}
            >
              Waiting for the host to start the game…
            </p>
          )}
        </div>

        <BackButton to="/menu" />
      </GameLayout>
    </PageTransition>
  )
}
