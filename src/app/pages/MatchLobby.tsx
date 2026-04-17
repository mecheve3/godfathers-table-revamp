import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Copy, CheckCircle2, User, Bot, Clock, Wifi, WifiOff } from 'lucide-react'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { BackButton } from '../components/BackButton'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'
import { useRoomSocket } from '../features/multiplayer/useRoomSocket'
import type { RoomState, RoomPlayer } from '../features/multiplayer/types'

const PLAYER_COLOR: Record<number, string> = {
  0: '#c9a84c',
  1: '#6888e8',
  2: '#e8c044',
  3: '#44c868',
  4: '#e87844',
  5: '#a044e8',
}

function PlayerRow({ player, index }: { player: RoomPlayer; index: number }) {
  const color = PLAYER_COLOR[index] ?? '#c9a84c'
  return (
    <motion.div
      key={player.id}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="flex items-center gap-3 py-2 border-b last:border-b-0"
      style={{ borderColor: '#2a0808' }}
    >
      <span style={{ color }}>
        {player.type === 'CPU' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </span>
      <span
        className="text-base font-serif uppercase tracking-wider flex-1"
        style={{ color }}
      >
        {player.name}
      </span>
      {player.isHost && (
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: '#3f1515', color: '#c9a84c' }}>
          host
        </span>
      )}
      {player.type === 'CPU' && (
        <span className="text-xs uppercase tracking-wider" style={{ color: '#6b4c2a' }}>CPU</span>
      )}
      {player.type === 'HUMAN' && !player.isConnected && (
        <span className="text-xs uppercase tracking-wider" style={{ color: '#6b4c2a' }}>away</span>
      )}
    </motion.div>
  )
}

function EmptySlot() {
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: '#2a0808' }}>
      <Clock className="w-4 h-4 opacity-30" style={{ color: '#4a3020' }} />
      <span className="text-base font-serif italic tracking-wider" style={{ color: '#4a3020' }}>
        Empty seat
      </span>
    </div>
  )
}

export default function MatchLobby() {
  const navigate = useNavigate()
  const { config, setConfig } = useMatch()

  const [room, setRoom] = useState<RoomState | null>(null)
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const roomCode   = config?.roomCode ?? ''
  const playerId   = config?.hostId ?? ''
  const playerName = config?.playerName ?? 'Player'
  const isHost     = config?.mode === 'create'
  // Use server's authoritative maxPlayers once room state arrives; fall back to config while connecting
  const maxPlayers = room?.maxPlayers ?? config?.settings?.maxPlayers ?? 4

  // ── WebSocket ────────────────────────────────────────────────────────────

  const handleRoomState = useCallback((r: RoomState) => setRoom(r), [])

  const handleGameStarted = useCallback((r: RoomState) => {
    setRoom(r)
    toast.success('Game starting!')
    const slots = r.players.map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.isHost ? 'host' as const : p.type === 'CPU' ? 'cpu' as const : 'human' as const,
    }))
    // Find which slot index the local player occupies — this becomes their player identity in-game
    const localPlayerIndex = r.players.findIndex((p) => p.id === playerId)
    setConfig({
      ...config!,
      slots,
      localPlayerIndex: localPlayerIndex >= 0 ? localPlayerIndex : 0,
      // Ensure settings.maxPlayers is always set correctly for both host and joiner
      settings: {
        maxPlayers: r.maxPlayers,
        seating: config?.settings?.seating ?? 'automatic',
        isPrivate: false,
      },
    })
    navigate('/game')
  }, [config, playerId, navigate, setConfig])

  const handleError = useCallback((msg: string) => toast.error(msg), [])

  const { status, send, disconnect } = useRoomSocket({
    roomCode,
    playerId,
    playerName,
    onRoomState: handleRoomState,
    onGameStarted: handleGameStarted,
    onError: handleError,
  })

  // ── Derived state ────────────────────────────────────────────────────────

  const humanCount = room?.players.filter((p) => p.type === 'HUMAN').length ?? 1
  const emptyCount = maxPlayers - (room?.players.length ?? 1)

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = () => {
    setIsStarting(true)
    send({ type: 'START_GAME' })
    // Navigation happens when server sends GAME_STARTED
    setTimeout(() => setIsStarting(false), 3000) // safety reset
  }

  const handleBack = () => {
    disconnect()
    navigate('/menu')
  }

  // ── Connection badge ─────────────────────────────────────────────────────

  const connectionEl = (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: status === 'open' ? '#4ade80' : '#ef4444' }}>
      {status === 'open' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {status === 'connecting' ? 'Connecting…' : status === 'open' ? 'Connected' : 'Disconnected'}
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center pt-16 pb-32 px-6 gap-8">
          <div className="flex flex-col items-center gap-2">
            <ScreenTitle>Match Lobby</ScreenTitle>
            {connectionEl}
          </div>

          {/* Room code */}
          <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Copy room code"
            className="flex items-center gap-3 group"
          >
            <span className="text-xl font-serif uppercase tracking-widest" style={{ color: '#9b7060' }}>
              Room Code:
            </span>
            <strong className="text-2xl font-serif uppercase tracking-widest" style={{ color: '#C9A84C' }}>
              {roomCode}
            </strong>
            {copied
              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
              : <Copy className="w-5 h-5 opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: '#C9A84C' }} />
            }
          </motion.button>

          {/* Player list */}
          <div
            className="w-full max-w-md border p-6 flex flex-col gap-3"
            style={{
              background: 'linear-gradient(180deg, #0d0402 0%, #0f0602 100%)',
              borderColor: '#3f1515',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
            }}
          >
            <p className="text-xs uppercase tracking-[0.35em] font-serif mb-2" style={{ color: '#9b1c1c' }}>
              Players ({(room?.players.length ?? 1)}/{maxPlayers})
            </p>

            <AnimatePresence>
              {(room?.players ?? []).map((p, i) => (
                <PlayerRow key={p.id} player={p} index={i} />
              ))}
              {Array.from({ length: emptyCount }).map((_, i) => (
                <EmptySlot key={`empty-${i}`} />
              ))}
            </AnimatePresence>
          </div>

          {/* Status hint */}
          {emptyCount > 0 && !isHost && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-serif text-center animate-pulse"
              style={{ color: '#9b7060' }}
            >
              Waiting for the host to start the game…
            </motion.p>
          )}

          {emptyCount > 0 && isHost && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-serif text-center"
              style={{ color: '#9b7060' }}
            >
              {`Waiting for players… Start now to fill ${emptyCount} seat${emptyCount > 1 ? 's' : ''} with CPU opponents.`}
            </motion.p>
          )}

          {/* Start button — host only */}
          {isHost && (
            <Button
              onClick={handleStartGame}
              isLoading={isStarting}
              disabled={status !== 'open'}
              className="w-64"
            >
              Start Game
            </Button>
          )}
        </div>

        <BackButton onClick={handleBack} />
      </GameLayout>
    </PageTransition>
  )
}
