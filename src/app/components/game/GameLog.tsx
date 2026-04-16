import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronRight, ScrollText } from "lucide-react"
import type { LogEntry } from "../../features/game/types"

interface GameLogProps {
  entries: LogEntry[]
  currentRound: number
}

const TYPE_COLORS: Record<LogEntry["type"], string> = {
  action: "text-zinc-200",
  payment: "text-emerald-400",
  explosion: "text-red-400",
  system: "text-zinc-400",
}

const PLAYER_DOT_COLORS: Record<string, string> = {
  player1: "bg-red-500",
  player2: "bg-blue-500",
  player3: "bg-yellow-400",
  player4: "bg-green-500",
  player5: "bg-orange-500",
  player6: "bg-purple-500",
}

export default function GameLog({ entries, currentRound }: GameLogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set())
  const [newActivity, setNewActivity] = useState(false)

  // Auto-scroll only when already near the bottom; otherwise show "new activity" badge
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      setNewActivity(false)
    } else {
      setNewActivity(true)
    }
  }, [entries.length])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    setNewActivity(false)
  }

  // Clear badge when user scrolls to bottom manually
  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80
    if (isNearBottom) setNewActivity(false)
  }

  // Group entries by round
  const byRound = new Map<number, LogEntry[]>()
  for (const entry of entries) {
    const list = byRound.get(entry.round) ?? []
    list.push(entry)
    byRound.set(entry.round, list)
  }
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b)

  const toggleRound = (round: number) => {
    setCollapsedRounds((prev) => {
      const next = new Set(prev)
      if (next.has(round)) next.delete(round)
      else next.add(round)
      return next
    })
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-zinc-500 text-xs gap-2">
        <ScrollText className="w-5 h-5 opacity-40" />
        <span>Actions will appear here</span>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-0 flex-1">
      {newActivity && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-[10px] bg-[#C9A84C] text-[#2B1710] font-semibold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap"
        >
          New activity ↓
        </button>
      )}
    <div ref={containerRef} onScroll={handleScroll} className="overflow-y-auto flex-1 min-h-0 pr-1 space-y-0.5 text-xs">
      {rounds.map((round) => {
        const roundEntries = byRound.get(round) ?? []
        const isCurrentRound = round === currentRound
        const isCollapsed = collapsedRounds.has(round)
        // Previous rounds default to collapsed once a new round starts
        const showEntries = isCurrentRound || !isCollapsed

        return (
          <div key={round}>
            {/* Round header — clickable for previous rounds */}
            <button
              onClick={() => !isCurrentRound && toggleRound(round)}
              className={`w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-left transition-colors ${
                isCurrentRound
                  ? "text-[#C9A84C] font-semibold cursor-default"
                  : "text-zinc-500 hover:text-zinc-400 cursor-pointer"
              }`}
            >
              {!isCurrentRound && (
                isCollapsed
                  ? <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  : <ChevronDown className="w-3 h-3 flex-shrink-0" />
              )}
              <span>Round {round}</span>
              {!isCurrentRound && isCollapsed && (
                <span className="text-zinc-600 ml-1">({roundEntries.length})</span>
              )}
            </button>

            {/* Entries */}
            {showEntries && (
              <div className="space-y-0.5 mb-1">
                {roundEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-1.5 px-2 py-1 rounded transition-all duration-700 ${
                      entry.highlighted
                        ? "bg-[#C9A84C]/15 border-l-2 border-[#C9A84C]"
                        : "border-l-2 border-transparent"
                    }`}
                  >
                    {/* Player color dot */}
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        PLAYER_DOT_COLORS[entry.playerId] ?? "bg-zinc-500"
                      } ${entry.type === "system" ? "opacity-0" : ""}`}
                    />
                    <span className={TYPE_COLORS[entry.type]}>{entry.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
    </div>
  )
}
