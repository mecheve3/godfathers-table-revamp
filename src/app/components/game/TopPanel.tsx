import { useState, useRef, useEffect } from "react"
import { Menu, Music, Music2, Volume2, VolumeOff, BookOpen, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useAudio } from "../../features/game/AudioContext"
import { useLang } from "../../context/LanguageContext"

interface TopPanelProps {
  onRestart: () => void
  onNewGame: () => void
  showRulebookOnMount?: boolean
}

// ── Chapter data ────────────────────────────────────────────────────────────

const CHAPTER_IDS = ['ch1', 'ch2', 'ch3', 'ch4'] as const

const CARD_KEYS = [
  { nameKey: "howto.card.KNIFE.name",         descKey: "howto.card.KNIFE.desc" },
  { nameKey: "howto.card.GUN.name",            descKey: "howto.card.GUN.desc" },
  { nameKey: "howto.card.ORDER_CAKE.name",     descKey: "howto.card.ORDER_CAKE.desc" },
  { nameKey: "howto.card.PASS_CAKE.name",      descKey: "howto.card.PASS_CAKE.desc" },
  { nameKey: "howto.card.EXPLODE_CAKE.name",   descKey: "howto.card.EXPLODE_CAKE.desc" },
  { nameKey: "howto.card.SLEEPING_PILL.name",  descKey: "howto.card.SLEEPING_PILL.desc" },
  { nameKey: "howto.card.POLICE_RAID.name",    descKey: "howto.card.POLICE_RAID.desc" },
  { nameKey: "howto.card.DISPLACEMENT.name",   descKey: "howto.card.DISPLACEMENT.desc" },
]

const GANGSTER_KEYS = [
  { nameKey: "howto.ch1.godfather.name",   descKey: "howto.ch1.godfather.desc" },
  { nameKey: "howto.ch1.gunman.name",      descKey: "howto.ch1.gunman.desc" },
  { nameKey: "howto.ch1.bladeslinger.name",descKey: "howto.ch1.bladeslinger.desc" },
  { nameKey: "howto.ch1.thug.name",        descKey: "howto.ch1.thug.desc" },
]

const TURN_KEYS = [
  { labelKey: "howto.turn.0.label", descKey: "howto.turn.0.desc" },
  { labelKey: "howto.turn.1.label", descKey: "howto.turn.1.desc" },
  { labelKey: "howto.turn.2.label", descKey: "howto.turn.2.desc" },
  { labelKey: "howto.turn.3.label", descKey: "howto.turn.3.desc" },
]

const INCOME_KEYS = [
  "howto.ch2.income.godfather",
  "howto.ch2.income.business",
  "howto.ch2.income.monopoly",
  "howto.ch2.income.register",
]

const END_RULE_KEYS = ["howto.end.rule.0", "howto.end.rule.1", "howto.end.rule.2"]

// ── HowToPlayModal ───────────────────────────────────────────────────────────

function HowToPlayModal({ onClose, startChapter = 0 }: { onClose: () => void; startChapter?: number }) {
  const { t } = useLang()
  const [chapter, setChapter] = useState(startChapter)
  const total = CHAPTER_IDS.length
  const isFirst = chapter === 0
  const isLast  = chapter === total - 1

  const chapterTitles = CHAPTER_IDS.map((_, i) => t(`howto.ch${i + 1}.title`))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <div
        className="bg-[#110806] border border-[#C9A84C]/50 rounded-lg w-full max-w-lg flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#C9A84C]/25 flex-shrink-0">
          <div>
            <p className="text-[#C9A84C] text-[10px] uppercase tracking-[0.3em] font-serif mb-0.5">
              {t("howto.chapter_label", { n: String(chapter + 1), total: String(total) })}
            </p>
            <h2 className="text-[#F5AC0E] font-serif font-bold text-base tracking-wide uppercase leading-tight">
              {chapterTitles[chapter]}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors ml-3 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter dot indicators */}
        <div className="flex gap-1.5 justify-center pt-3 pb-1 flex-shrink-0">
          {CHAPTER_IDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setChapter(i)}
              className="w-2 h-2 rounded-full transition-all duration-200"
              style={{ background: i === chapter ? '#C9A84C' : 'rgba(201,168,76,0.25)' }}
            />
          ))}
        </div>

        {/* Chapter content */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">

          {/* ── Chapter 1: Overview & Your Family ── */}
          {chapter === 0 && (
            <>
              <p className="text-zinc-300 text-sm leading-relaxed">{t("howto.ch1.objective")}</p>

              <div>
                <h3 className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-2.5">
                  {t("howto.ch1.family.title")}
                </h3>
                <ul className="space-y-2.5">
                  {GANGSTER_KEYS.map((g) => (
                    <li key={g.nameKey} className="text-sm flex gap-2">
                      <span className="text-[#F5AC0E] font-bold flex-shrink-0">◆</span>
                      <span>
                        <span className="text-[#F5AC0E] font-semibold">{t(g.nameKey)} — </span>
                        <span className="text-zinc-300 leading-relaxed">{t(g.descKey)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0e1f16]/60 border border-[#C9A84C]/20 rounded px-3.5 py-2.5 text-sm text-zinc-300 leading-relaxed">
                <span className="text-[#F5AC0E] font-semibold">{t("howto.ch1.tip.label")} </span>
                {t("howto.ch1.tip.body")}
              </div>
            </>
          )}

          {/* ── Chapter 2: Turn Sequence & Income ── */}
          {chapter === 1 && (
            <>
              <div>
                <h3 className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-2.5">
                  {t("howto.ch2.turn.title")}
                </h3>
                <ol className="space-y-2.5 list-none">
                  {TURN_KEYS.map((step, i) => (
                    <li key={step.labelKey} className="text-sm flex gap-2.5">
                      <span className="text-[#F5AC0E] font-bold flex-shrink-0 w-5 text-center">{i + 1}.</span>
                      <span>
                        <span className="text-[#F5AC0E] font-semibold">{t(step.labelKey)} — </span>
                        <span className="text-zinc-300 leading-relaxed">{t(step.descKey)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-2.5">
                  {t("howto.ch2.income.title")}
                </h3>
                <ul className="space-y-1.5">
                  {INCOME_KEYS.map((key) => (
                    <li key={key} className="text-sm flex gap-2 text-zinc-300">
                      <span className="text-[#C9A84C] flex-shrink-0">·</span>
                      <span className="leading-relaxed">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ── Chapter 3: Action Cards ── */}
          {chapter === 2 && (
            <ul className="space-y-3">
              {CARD_KEYS.map((c) => (
                <li key={c.nameKey} className="text-sm">
                  <span className="text-[#F5AC0E] font-semibold">{t(c.nameKey)}: </span>
                  <span className="text-zinc-300 leading-relaxed">{t(c.descKey)}</span>
                </li>
              ))}
            </ul>
          )}

          {/* ── Chapter 4: Winning ── */}
          {chapter === 3 && (
            <>
              <div>
                <h3 className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-2.5">
                  {t("howto.ch4.end.title")}
                </h3>
                <ol className="space-y-2 list-none">
                  {END_RULE_KEYS.map((key, i) => (
                    <li key={key} className="text-sm flex gap-2.5">
                      <span className="text-[#F5AC0E] font-bold flex-shrink-0 w-5 text-center">{i + 1}.</span>
                      <span className="text-zinc-300 leading-relaxed">{t(key)}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-[#0e1f16]/60 border border-[#C9A84C]/20 rounded px-3.5 py-2.5 space-y-1.5">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  <span className="text-[#F5AC0E] font-semibold">{t("howto.ch4.winner.label")} </span>
                  {t("howto.ch4.winner.body")}
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  <span className="text-[#C9A84C] font-semibold">{t("howto.ch4.tiebreaker.label")} </span>
                  {t("howto.ch4.tiebreaker.body")}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#C9A84C]/20 flex-shrink-0 gap-3">
          <button
            onClick={() => setChapter((c) => c - 1)}
            disabled={isFirst}
            className="flex items-center gap-1.5 text-sm font-serif uppercase tracking-wider transition-colors px-3 py-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: '#C9A84C' }}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("howto.nav.back")}
          </button>

          <button
            onClick={isLast ? onClose : () => setChapter((c) => c + 1)}
            className="flex items-center gap-1.5 text-sm font-serif uppercase tracking-wider transition-opacity px-3 py-1.5 rounded"
            style={{ color: '#F5AC0E' }}
          >
            {isLast ? t("howto.nav.start") : t("howto.nav.next")}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TopPanel ─────────────────────────────────────────────────────────────────

export default function TopPanel({ onRestart, onNewGame, showRulebookOnMount = false }: TopPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [howToPlayOpen, setHowToPlayOpen] = useState(showRulebookOnMount)
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

              <div className="border-t border-zinc-700 my-1" />

              <button
                onClick={toggleMusic}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors"
                style={{ color: musicEnabled ? '#C9A84C' : '#6b6b6b' }}
              >
                {musicEnabled
                  ? <Music className="w-4 h-4 flex-shrink-0" />
                  : <Music2 className="w-4 h-4 flex-shrink-0" />}
                <span>{musicEnabled ? t("game.menu.music_on") : t("game.menu.music_off")}</span>
              </button>

              <button
                onClick={toggleSfx}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors"
                style={{ color: sfxEnabled ? '#C9A84C' : '#6b6b6b' }}
              >
                {sfxEnabled
                  ? <Volume2 className="w-4 h-4 flex-shrink-0" />
                  : <VolumeOff className="w-4 h-4 flex-shrink-0" />}
                <span>{sfxEnabled ? t("game.menu.sfx_on") : t("game.menu.sfx_off")}</span>
              </button>

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
      <div className="w-10" />

      {howToPlayOpen && (
        <HowToPlayModal
          onClose={() => setHowToPlayOpen(false)}
          startChapter={showRulebookOnMount ? 0 : 0}
        />
      )}
    </div>
  )
}
