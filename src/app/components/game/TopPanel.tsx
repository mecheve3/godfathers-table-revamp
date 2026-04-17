import { useState, useRef, useEffect } from "react"
import { Menu, Music, Music2, Volume2, VolumeOff, BookOpen, X } from "lucide-react"
import { useAudio } from "../../features/game/AudioContext"

interface TopPanelProps {
  onRestart: () => void
  onNewGame: () => void
}

const CARD_ACTIONS = [
  { name: "Knife", desc: "Allows you to eliminate an opponent to the left or right of one of your Blade Slingers, or an opponent to the left or right of a gangster sitting in front of a knife icon." },
  { name: "Gun", desc: "Used to eliminate an opponent directly facing one of your Gunmen, or an opponent facing a gangster who has a revolver icon in front of them." },
  { name: "Order a Cake", desc: "Place your cake on any spot, even if occupied by a gangster." },
  { name: "Pass Cake", desc: "Move an opponent's cake one spot to the left or right of your own cake." },
  { name: "Explode Cake", desc: "Explode an opponent's cake, eliminating all gangsters immediately to its left, right, or facing it." },
  { name: "Sleeping Pill", desc: "Place a sleeping pill token in front of up to three opponents who have a glass icon in front of them. A second sleeping pill eliminates the gangster permanently." },
  { name: "Police Raid", desc: "All players remove their gangsters from the board and then reposition them. The player who played the card starts the repositioning." },
  { name: "Displacement", desc: "Move one of your gangsters to a free spot. You can play this after an action card or play two move cards in one turn." },
]

const TURN_STEPS = [
  { label: "Explode your cake", desc: "If you placed a cake on your previous turn, it explodes now, eliminating gangsters in front, to the left, and to the right of it." },
  { label: "Receive Cash", desc: "Collect income based on your board presence: $1,000 if your Godfather is alive and awake · $1,000 for each business (Bars, Restaurants, Casinos) you control · $4,000 for a monopoly (two spots of the same business type) · Income is doubled if a gang member is at the Cash Register. Sleeping gangsters bring in nothing." },
  { label: "Play Cards", desc: "Play one action card and optionally one move card. Then, automatically draw back up to a hand of five cards." },
  { label: "Wake up!", desc: "Sleeping pill tokens are removed from your gang members to bring them back into play." },
]

const GAME_END_RULES = [
  "Only one player remains (they collect all remaining money on the table).",
  "There is no money left on the table.",
  "The last gangsters are all eliminated by an explosion.",
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
        <div className="px-5 py-4 space-y-5">

          {/* Card Actions */}
          <div>
            <h3 className="text-[#C9A84C] font-semibold text-sm mb-2 uppercase tracking-wide">Card Actions</h3>
            <ul className="space-y-2">
              {CARD_ACTIONS.map((c) => (
                <li key={c.name} className="text-sm">
                  <span className="text-[#F5AC0E] font-semibold">{c.name}: </span>
                  <span className="text-zinc-300 leading-relaxed">{c.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Turn Sequence */}
          <div>
            <h3 className="text-[#C9A84C] font-semibold text-sm mb-2 uppercase tracking-wide">Turn Sequence</h3>
            <ol className="space-y-2 list-none">
              {TURN_STEPS.map((step, i) => (
                <li key={step.label} className="text-sm flex gap-2">
                  <span className="text-[#F5AC0E] font-bold flex-shrink-0">{i + 1}.</span>
                  <span>
                    <span className="text-[#F5AC0E] font-semibold">{step.label}: </span>
                    <span className="text-zinc-300 leading-relaxed">{step.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Game End */}
          <div>
            <h3 className="text-[#C9A84C] font-semibold text-sm mb-2 uppercase tracking-wide">Ending the Game and Winning</h3>
            <p className="text-zinc-300 text-sm mb-2">The game ends when:</p>
            <ol className="space-y-1 list-none">
              {GAME_END_RULES.map((rule, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-[#F5AC0E] font-bold flex-shrink-0">{i + 1}.</span>
                  <span className="text-zinc-300 leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
            <p className="text-zinc-300 text-sm mt-3 leading-relaxed">
              The <span className="text-[#F5AC0E] font-semibold">winner</span> is the player who has collected the most money, even if they were eliminated before the game ended. In case of a tie, the player whose gangsters survived the longest wins.
            </p>
          </div>

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
