import { useState, useRef, useEffect } from "react"
import { Menu, Music, Music2, Volume2, VolumeOff, BookOpen, X } from "lucide-react"
import { useAudio } from "../../features/game/AudioContext"
import { useLang } from "../../context/LanguageContext"

interface TopPanelProps {
  onRestart: () => void
  onNewGame: () => void
}

const CARD_KEYS = [
  { nameKey: "howto.card.KNIFE.name", descKey: "howto.card.KNIFE.desc" },
  { nameKey: "howto.card.GUN.name", descKey: "howto.card.GUN.desc" },
  { nameKey: "howto.card.ORDER_CAKE.name", descKey: "howto.card.ORDER_CAKE.desc" },
  { nameKey: "howto.card.PASS_CAKE.name", descKey: "howto.card.PASS_CAKE.desc" },
  { nameKey: "howto.card.EXPLODE_CAKE.name", descKey: "howto.card.EXPLODE_CAKE.desc" },
  { nameKey: "howto.card.SLEEPING_PILL.name", descKey: "howto.card.SLEEPING_PILL.desc" },
  { nameKey: "howto.card.POLICE_RAID.name", descKey: "howto.card.POLICE_RAID.desc" },
  { nameKey: "howto.card.DISPLACEMENT.name", descKey: "howto.card.DISPLACEMENT.desc" },
]

const TURN_KEYS = [
  { labelKey: "howto.turn.0.label", descKey: "howto.turn.0.desc" },
  { labelKey: "howto.turn.1.label", descKey: "howto.turn.1.desc" },
  { labelKey: "howto.turn.2.label", descKey: "howto.turn.2.desc" },
  { labelKey: "howto.turn.3.label", descKey: "howto.turn.3.desc" },
]

const END_RULE_KEYS = ["howto.end.rule.0", "howto.end.rule.1", "howto.end.rule.2"]

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="bg-[#1a0c06] border border-[#C9A84C]/40 rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9A84C]/20">
          <h2 className="text-[#F5AC0E] font-serif font-bold text-lg tracking-wide uppercase">{t("howto.cards").split(" ")[0] === "Card" ? "How to Play" : t("game.menu.howto")}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-5">

          {/* Card Actions */}
          <div>
            <h3 className="text-[#C9A84C] font-semibold text-sm mb-2 uppercase tracking-wide">{t("howto.cards")}</h3>
            <ul className="space-y-2">
              {CARD_KEYS.map((c) => (
                <li key={c.nameKey} className="text-sm">
                  <span className="text-[#F5AC0E] font-semibold">{t(c.nameKey)}: </span>
                  <span className="text-zinc-300 leading-relaxed">{t(c.descKey)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Turn Sequence */}
          <div>
            <h3 className="text-[#C9A84C] font-semibold text-sm mb-2 uppercase tracking-wide">{t("howto.turn")}</h3>
            <ol className="space-y-2 list-none">
              {TURN_KEYS.map((step, i) => (
                <li key={step.labelKey} className="text-sm flex gap-2">
                  <span className="text-[#F5AC0E] font-bold flex-shrink-0">{i + 1}.</span>
                  <span>
                    <span className="text-[#F5AC0E] font-semibold">{t(step.labelKey)}: </span>
                    <span className="text-zinc-300 leading-relaxed">{t(step.descKey)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Game End */}
          <div>
            <h3 className="text-[#C9A84C] font-semibold text-sm mb-2 uppercase tracking-wide">{t("howto.end")}</h3>
            <p className="text-zinc-300 text-sm mb-2">{t("howto.end.when")}</p>
            <ol className="space-y-1 list-none">
              {END_RULE_KEYS.map((key, i) => (
                <li key={key} className="text-sm flex gap-2">
                  <span className="text-[#F5AC0E] font-bold flex-shrink-0">{i + 1}.</span>
                  <span className="text-zinc-300 leading-relaxed">{t(key)}</span>
                </li>
              ))}
            </ol>
            <p className="text-zinc-300 text-sm mt-3 leading-relaxed">
              {t("howto.end.winner", { winner: t("howto.end.winner_word") })}
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
              {/* Game actions */}
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

              {/* Divider */}
              <div className="border-t border-zinc-700 my-1" />

              {/* How to Play */}
              <button
                onClick={() => { setHowToPlayOpen(true); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0 text-[#C9A84C]" />
                <span>{t("game.menu.howto")}</span>
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
                <span>{musicEnabled ? t("game.menu.music_on") : t("game.menu.music_off")}</span>
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
                <span>{sfxEnabled ? t("game.menu.sfx_on") : t("game.menu.sfx_off")}</span>
              </button>

              {/* Divider */}
              <div className="border-t border-zinc-700 my-1" />

              {/* Language toggle */}
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
      <div className="w-10" />
      {howToPlayOpen && <HowToPlayModal onClose={() => setHowToPlayOpen(false)} />}
    </div>
  )
}
