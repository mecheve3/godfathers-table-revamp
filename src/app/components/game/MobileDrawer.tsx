import { X } from "lucide-react"
import type { Player, GameState, LogEntry } from "../../features/game/types"
import PlayerDashboard from "./PlayerDashboard"
import GameLog from "./GameLog"
import { useLang } from "../../context/LanguageContext"

interface MobileDrawerProps {
  onClose: () => void
  gameState: GameState
  currentPlayer: Player
  playerCount: number
  logEntries: LogEntry[]
  seatingQueue?: Record<string, string[]>
  seatingCurrentPlayerId?: string
  seatingSelectedGangsterId?: string | null
  onSeatingGangsterSelect?: (gangsterId: string) => void
}

export default function MobileDrawer({
  onClose,
  gameState,
  currentPlayer,
  playerCount,
  logEntries,
  seatingQueue,
  seatingCurrentPlayerId,
  seatingSelectedGangsterId,
  onSeatingGangsterSelect,
}: MobileDrawerProps) {
  const { t } = useLang()
  const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      {/* Drawer — slides up from bottom */}
      <div
        className="drawer-slide-up fixed bottom-0 left-0 right-0 z-50 flex flex-col"
        style={{
          maxHeight: "78dvh",
          background: "linear-gradient(180deg, #3D2314 0%, #2B1710 100%)",
          borderTop: "2px solid #52392a",
          borderRadius: "10px 10px 0 0",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-0 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-600" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <span className="text-[#F5AC0E] font-semibold text-sm uppercase tracking-wider">
              Players
            </span>
            <span className="text-zinc-500 text-xs">
              {t("panel.bank")}:{" "}
              <span className="text-[#F5AC0E] font-bold">
                ${gameState.bankMoney.toLocaleString()}
              </span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
            style={{ minWidth: 36, minHeight: 36 }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: player dashboards (left) + game log (right) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Player dashboards */}
          <div className="flex-1 overflow-y-auto game-log-scroll p-3 space-y-2">
            {gameState.players.slice(0, playerCount).map((player, idx) => (
              <PlayerDashboard
                key={player.id}
                player={player}
                isCurrentPlayer={idx === currentPlayerIndex}
                isSeatingPlayer={player.id === seatingCurrentPlayerId}
                seatingGangsterIds={seatingQueue?.[player.id] ?? []}
                selectedSeatingGangsterId={
                  player.id === seatingCurrentPlayerId
                    ? seatingSelectedGangsterId
                    : null
                }
                onSeatingGangsterSelect={
                  player.id === seatingCurrentPlayerId
                    ? onSeatingGangsterSelect
                    : undefined
                }
              />
            ))}
          </div>

          {/* Game log */}
          <div className="w-52 border-l border-zinc-700 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-3 py-1.5 flex-shrink-0 border-b border-zinc-700/50">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                {t("panel.log")}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto game-log-scroll px-1 pb-2">
              <GameLog entries={logEntries} currentRound={gameState.turn} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
