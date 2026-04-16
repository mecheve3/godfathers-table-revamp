import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { BackButton } from '../components/BackButton'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'

function validateCode(code: string): string {
  if (!code.trim()) return 'Room code is required'
  if (code.trim().length < 4) return 'Must be at least 4 characters'
  return ''
}

export default function JoinMatch() {
  const navigate = useNavigate()
  const { setConfig } = useMatch()

  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    const err = validateCode(roomCode)
    if (err) { setError(err); return }

    setIsLoading(true)
    // TODO: replace with real room-lookup API call
    await new Promise<void>((resolve) => setTimeout(resolve, 800))

    setConfig({ mode: 'join', roomCode: roomCode.trim() })
    toast.success('Joining match…')
    setIsLoading(false)
    navigate('/lobby')
  }

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">
          <ScreenTitle>Join Match</ScreenTitle>

          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
            <label
              className="text-xs uppercase tracking-[0.35em] font-serif"
              style={{ color: '#9b1c1c' }}
            >
              Room Code
            </label>

            <Input
              autoFocus
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="Enter code"
              error={error}
              maxLength={8}
              className="w-full text-center"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />

            <Button
              onClick={handleJoin}
              disabled={!roomCode.trim()}
              isLoading={isLoading}
              className="w-full"
            >
              Join
            </Button>
          </div>
        </div>

        <BackButton to="/menu" />
      </GameLayout>
    </PageTransition>
  )
}
