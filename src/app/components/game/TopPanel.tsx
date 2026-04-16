import { useState, useRef, useEffect } from "react"
import { Menu, Music, MusicOff, Volume2, VolumeX } from "lucide-react"
import { useAudio } from "../../features/game/AudioContext"

interface TopPanelProps {
  onRestart: () => void
  onNewGame: () => void
}

export default function TopPanel({ onRestart, onNewGame }: TopPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useAudio()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="bg-gradient-to-b from-[#3D2314] to-[#2B1710] py-1.5 px-4 w-full sticky top-0 z-10 border-b border-zinc-700 flex items-center">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-white hover:bg-zinc-700 rounded"
        >
          <Menu className="h-6 w-6" />
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-zinc-800 rounded-md shadow-lg border border-zinc-700 overflow-hidden z-50">
            <div className="py-1">
              {/* Game actions */}
              <button
                onClick={() => { onRestart(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
              >
                Restart Game
              </button>
              <button
                onClick={() => { onNewGame(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
              >
                New Game
              </button>

              {/* Divider */}
              <div className="border-t border-zinc-700 my-1" />

              {/* Music toggle */}
              <button
                onClick={toggleMusic}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors"
                style={{ color: musicEnabled ? '#C9A84C' : '#6b6b6b' }}
              >
                {musicEnabled
                  ? <Music className="w-4 h-4 flex-shrink-0" />
                  : <MusicOff className="w-4 h-4 flex-shrink-0" />
                }
                <span>Music {musicEnabled ? 'On' : 'Off'}</span>
              </button>

              {/* SFX toggle */}
              <button
                onClick={toggleSfx}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors"
                style={{ color: sfxEnabled ? '#C9A84C' : '#6b6b6b' }}
              >
                {sfxEnabled
                  ? <Volume2 className="w-4 h-4 flex-shrink-0" />
                  : <VolumeX className="w-4 h-4 flex-shrink-0" />
                }
                <span>SFX {sfxEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <h1 className="text-xl font-bold text-[#F5AC0E] flex-1 text-center font-serif tracking-widest uppercase">
        Godfather's Table
      </h1>
      <div className="w-10" />
    </div>
  )
}
