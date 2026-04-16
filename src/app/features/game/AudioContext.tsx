import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { setSfxEnabled } from './sfx'

interface AudioContextType {
  musicEnabled: boolean
  sfxEnabled: boolean
  toggleMusic: () => void
  toggleSfx: () => void
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [sfxOn, setSfxOn] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startedRef = useRef(false)

  // Initialise audio element once
  useEffect(() => {
    const audio = new Audio('/sounds/music/gamemusic.mp3')
    audio.loop = true
    audio.volume = 0.35
    audioRef.current = audio

    const tryPlay = () => {
      if (!startedRef.current && musicEnabled) {
        audio.play().catch(() => {})
        startedRef.current = true
      }
      document.removeEventListener('click', tryPlay)
      document.removeEventListener('keydown', tryPlay)
    }
    document.addEventListener('click', tryPlay)
    document.addEventListener('keydown', tryPlay)

    return () => {
      audio.pause()
      document.removeEventListener('click', tryPlay)
      document.removeEventListener('keydown', tryPlay)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // React to musicEnabled changes after initial setup
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicEnabled) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [musicEnabled])

  // Sync sfx module flag
  useEffect(() => {
    setSfxEnabled(sfxOn)
  }, [sfxOn])

  const toggleMusic = () => setMusicEnabled((v) => !v)
  const toggleSfx = () => setSfxOn((v) => !v)

  return (
    <AudioCtx.Provider value={{ musicEnabled, sfxEnabled: sfxOn, toggleMusic, toggleSfx }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
