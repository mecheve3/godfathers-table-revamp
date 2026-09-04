import { useState, useRef, useEffect } from "react"
import { Menu, Music, Music2, Volume2, VolumeOff, BookOpen, MessageSquare, Users } from "lucide-react"
import { useAudio } from "../../features/game/AudioContext"
import { useLang } from "../../context/LanguageContext"
import { FEEDBACK_URL } from "../../constants"
import { track } from "../../../lib/analytics"
import { HowToPlayModal } from "./HowToPlayModal"

interface TopPanelProps {
  onRestart: () => void
  onNewGame: () => void
  showRulebookOnMount?: boolean
  onRulesOpenChange?: (open: boolean) => void
  /** Mobile-only: called when the Players/Log icon is tapped */
  onOpenPlayers?: () => void
}

// ── TopPanel ─────────────────────────────────────────────────────────────────

export default function TopPanel({ onRestart, onNewGame, showRulebookOnMount = false, onRulesOpenChange, onOpenPlayers }: TopPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [howToPlayOpen, setHowToPlayOpen] = useState(showRulebookOnMount)

  useEffect(() => { onRulesOpenChange?.(howToPlayOpen) }, [howToPlayOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  const menuRef = useRef<HTMLDivElement>(null)
  const { musicEnabled, sfxEnabled, musicVolume, sfxVolume, toggleMusic, toggleSfx, setMusicVolume, setSfxVolume } = useAudio()
  const { lang, setLang, t } = useLang()

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
              <button
                onClick={() => { onRestart(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
              >
                {t("game.menu.restart")}
              </button>
              <button
                onClick={() => { onNewGame(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
              >
                {t("game.menu.new")}
              </button>

              <div className="border-t border-zinc-700 my-1" />

              <button
                onClick={() => { setHowToPlayOpen(true); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0 text-[#C9A84C]" />
                <span>{t("game.menu.howto")}</span>
              </button>

              <button
                onClick={() => {
                  track('feedback_clicked')
                  window.open(FEEDBACK_URL, '_blank', 'noopener,noreferrer')
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0 text-[#C9A84C]" />
                <span>{t("game.menu.feedback")}</span>
              </button>

              <div className="border-t border-zinc-700 my-1" />

              <div className="px-4 pt-2 pb-2.5">
                <button
                  onClick={toggleMusic}
                  className="w-full flex items-center gap-3 text-sm hover:opacity-75 transition-opacity mb-2"
                  style={{ color: musicEnabled ? '#C9A84C' : '#6b6b6b' }}
                >
                  {musicEnabled
                    ? <Music className="w-4 h-4 flex-shrink-0" />
                    : <Music2 className="w-4 h-4 flex-shrink-0" />}
                  <span className="flex-1 text-left">{musicEnabled ? t("game.menu.music_on") : t("game.menu.music_off")}</span>
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  disabled={!musicEnabled}
                  className="w-full h-1.5 accent-[#C9A84C] cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                />
              </div>

              <div className="px-4 pt-1 pb-2.5">
                <button
                  onClick={toggleSfx}
                  className="w-full flex items-center gap-3 text-sm hover:opacity-75 transition-opacity mb-2"
                  style={{ color: sfxEnabled ? '#C9A84C' : '#6b6b6b' }}
                >
                  {sfxEnabled
                    ? <Volume2 className="w-4 h-4 flex-shrink-0" />
                    : <VolumeOff className="w-4 h-4 flex-shrink-0" />}
                  <span className="flex-1 text-left">{sfxEnabled ? t("game.menu.sfx_on") : t("game.menu.sfx_off")}</span>
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(Number(e.target.value))}
                  disabled={!sfxEnabled}
                  className="w-full h-1.5 accent-[#C9A84C] cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                />
              </div>

              <div className="border-t border-zinc-700 my-1" />

              <button
                onClick={() => { setLang(lang === 'en' ? 'es' : 'en'); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                <span className="text-base">{lang === 'en' ? '🇪🇸' : '🇺🇸'}</span>
                <span>{lang === 'en' ? t("game.menu.lang.es") : t("game.menu.lang.en")}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <h1 className="text-xl font-bold text-[#F5AC0E] flex-1 text-center font-serif tracking-widest uppercase">
        {t("game.title")}
      </h1>
      {/* Right side: Players toggle on mobile, empty spacer on desktop (balances menu btn) */}
      <div className="w-10 flex items-center justify-center">
        {onOpenPlayers && (
          <button
            onClick={onOpenPlayers}
            className="lg:hidden p-2 text-zinc-400 hover:text-white active:text-white rounded transition-colors"
            style={{ minWidth: 40, minHeight: 40 }}
            aria-label="Players & Log"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>

      {howToPlayOpen && (
        <HowToPlayModal
          onClose={() => setHowToPlayOpen(false)}
          startChapter={showRulebookOnMount ? 0 : 0}
        />
      )}
    </div>
  )
}
