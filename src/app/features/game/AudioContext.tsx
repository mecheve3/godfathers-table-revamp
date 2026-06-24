import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { setSfxEnabled, setSfxVolumeMultiplier } from './sfx'

interface AudioContextType {
  musicEnabled: boolean
  sfxEnabled: boolean
  musicVolume: number
  sfxVolume: number
  toggleMusic: () => void
  toggleSfx: () => void
  setMusicVolume: (v: number) => void
  setSfxVolume: (v: number) => void
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined)

const DEFAULT_MUSIC_VOLUME = 0.15

export function AudioProvider({ children }: { children: ReactNode }) {
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [sfxOn, setSfxOn] = useState(true)
  const [musicVolume, setMusicVolumeState] = useState(DEFAULT_MUSIC_VOLUME)
  const [sfxVolume, setSfxVolumeState] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startedRef = useRef(false)
  // Ref mirror so tryPlay can read the latest value after React state settles
  const musicEnabledRef = useRef(true)

  useEffect(() => { musicEnabledRef.current = musicEnabled }, [musicEnabled])

  // Initialise audio element once
  useEffect(() => {
    const audio = new Audio('/sounds/music/gamemusic.mp3')
    audio.loop = true
    audio.volume = DEFAULT_MUSIC_VOLUME
    audioRef.current = audio

    const tryPlay = () => {
      document.removeEventListener('click', tryPlay)
      document.removeEventListener('keydown', tryPlay)
      // Defer 20ms so React state updates (e.g. toggleMusic) settle before we
      // decide whether to start playback. Prevents the first-click-on-speaker bug
      // where tryPlay starts audio then the toggle's useEffect immediately pauses it.
      setTimeout(() => {
        if (!startedRef.current && musicEnabledRef.current) {
          audio.play().catch(() => {})
          startedRef.current = true
        }
      }, 20)
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

  // Apply music volume changes live
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = musicVolume
  }, [musicVolume])

  // Sync sfx module flags
  useEffect(() => { setSfxEnabled(sfxOn) }, [sfxOn])
  useEffect(() => { setSfxVolumeMultiplier(sfxVolume) }, [sfxVolume])

  const toggleMusic = () => setMusicEnabled((v) => !v)
  const toggleSfx = () => setSfxOn((v) => !v)
  const setMusicVolume = (v: number) => setMusicVolumeState(Math.max(0, Math.min(1, v)))
  const setSfxVolume = (v: number) => setSfxVolumeState(Math.max(0, Math.min(1, v)))

  return (
    <AudioCtx.Provider value={{ musicEnabled, sfxEnabled: sfxOn, musicVolume, sfxVolume, toggleMusic, toggleSfx, setMusicVolume, setSfxVolume }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
