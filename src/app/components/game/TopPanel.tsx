import { useState, useRef, useEffect } from "react"
import { Menu, Music, Music2, Volume2, VolumeOff, BookOpen, X } from "lucide-react"
import { useAudio } from "../../features/game/AudioContext"

interface TopPanelProps {
  onRestart: () => void
  onNewGame: () => void
}

const HOW_TO_PLAY = [
  { title: "Objective", body: "Be the richest player when the bank runs dry. Earn money by seating gangsters on Cash Register, Bar, Gambling House, and Strip Club seats." },
  { title: "Turn Structure", body: "On your turn: collect income from your seated gangsters, then play one card from your hand. After your card resolves, if you hold a Displacement card you may optionally use it as a free second action." },
  { title: "Elimination", body: "A gangster hit by Knife, Gun, or a Cake explosion is removed from the board. Eliminated gangsters lose their income seats but the player stays in the game until they run out of gangsters." },
  { title: "Cake Bombs", body: "Order Cake places a bomb that explodes automatically at the start of your NEXT turn — hitting the center seat and both neighbors. You can Pass Cake to reposition it, or Explode Cake to detonate it early." },
  { title: "Police Raid", body: "Clears the entire board. All players re-seat their surviving gangsters in turn order. The Police Raid card is permanently removed from the deck once played." },
  { title: "Sleeping Pills", body: "Targets enemies seated at drink spots (bar seats). Drugged gangsters skip their next turn but stay on the board — they wake up at the end of their owner's following turn." },
  { title: "Game End", body: "The game ends when the bank hits zero OR only one player has gangsters left on the board. The richest player wins. Ties are broken by number of surviving gangsters." },
]

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="bg-[#1a0c06] border border-[#C9A84C]/40 rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9A84C]/20">
          <h2 className="text-[#F5AC0E] font-serif font-bold text-lg tracking-wide uppercase">How to Play</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {HOW_TO_PLAY.map((section) => (
            <div key={section.title}>
              <h3 className="text-[#C9A84C] font-semibold text-sm mb-1">{section.title}</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TopPanel({ onRestart, onNewGame }: TopPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)
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
    <div className="bg-gradient-to-b from-[#3D2314] to-[#2B1710] py-1.5 px-4 w-full flex-shrink-0 border-b border-zinc-700 flex items-center z-10">
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

              {/* How to Play */}
              <button
                onClick={() => { setHowToPlayOpen(true); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0 text-[#C9A84C]" />
                <span>How to Play</span>
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
                  : <Music2 className="w-4 h-4 flex-shrink-0" />
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
                  : <VolumeOff className="w-4 h-4 flex-shrink-0" />
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
      {howToPlayOpen && <HowToPlayModal onClose={() => setHowToPlayOpen(false)} />}
    </div>
  )
}
