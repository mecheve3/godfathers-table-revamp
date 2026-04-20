import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { BackButton } from '../components/BackButton'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useMatch } from '../features/match/MatchContext'
import { fetchRoom } from '../features/multiplayer/api'
import { useLang } from '../context/LanguageContext'

export default function JoinMatch() {
  const navigate = useNavigate()
  const { setConfig } = useMatch()
  const { t } = useLang()

  const validateCode = (code: string): string => {
    if (!code.trim()) return t('join.error.required')
    if (code.trim().length < 4) return t('join.error.length')
    return ''
  }

  const [step, setStep] = useState<'code' | 'name'>('code')
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'name') setTimeout(() => nameInputRef.current?.focus(), 50)
  }, [step])

  const handleCheckCode = async () => {
    const err = validateCode(roomCode)
    if (err) { setError(err); return }

    setIsLoading(true)
    try {
      const room = await fetchRoom(roomCode.trim())
      if (room.status !== 'LOBBY') {
        setError(t('join.error.started'))
        return
      }
      if (room.players.filter((p) => p.type === 'HUMAN').length >= room.maxPlayers) {
        setError(t('join.error.full'))
        return
      }
      setStep('name')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('join.error.notfound'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = () => {
    const finalName = playerName.trim() || t('join.name.placeholder')
    const playerId = `player-${Date.now()}`
    setConfig({ mode: 'join', roomCode: roomCode.trim().toUpperCase(), playerName: finalName, hostId: playerId })
    toast.success('Joining match…')
    navigate('/lobby')
  }

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">
          <ScreenTitle>{t('join.title')}</ScreenTitle>

          {step === 'code' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              <label className="text-xs uppercase tracking-[0.35em] font-serif" style={{ color: '#9b1c1c' }}>
                {t('join.code')}
              </label>
              <Input
                autoFocus
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                placeholder={t('join.code.placeholder')}
                error={error}
                maxLength={8}
                className="w-full text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleCheckCode()}
              />
              <Button onClick={handleCheckCode} disabled={!roomCode.trim()} isLoading={isLoading} className="w-full">
                {t('join.find')}
              </Button>
            </div>
          )}

          {step === 'name' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              <label className="text-xs uppercase tracking-[0.35em] font-serif" style={{ color: '#9b1c1c' }}>
                {t('join.name')}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoin() }}
                placeholder={t('join.name.placeholder')}
                maxLength={20}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#F5AC0E] text-center text-lg"
              />
              <Button onClick={handleJoin} className="w-full">
                {t('join.join')}
              </Button>
            </div>
          )}
        </div>

        <BackButton
          onClick={step === 'name' ? () => setStep('code') : undefined}
          to={step === 'code' ? '/menu' : undefined}
        />
      </GameLayout>
    </PageTransition>
  )
}
