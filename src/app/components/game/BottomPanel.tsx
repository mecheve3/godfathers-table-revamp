import type { Player, Gangster, GameState, Card, GamePhase, CakeBomb } from "../../features/game/types"
import { useState } from "react"
import PlayerHand from "./PlayerHand"
import { useLang } from "../../context/LanguageContext"

interface BottomPanelProps {
  currentPlayer: Player
  selectedGangster: Gangster | null
  selectedCard: Card | null
  selectedCardId: string | null
  selectedDirection?: "left" | "right" | null
  targetPositionId: number | null
  selectedCake: CakeBomb | null
  gamePhase: GamePhase
  onSelectCard: (cardId: string) => void
  onConfirmAction: () => void
  onCancelAction: () => void
  onSkipSecondDisplacement: () => void
  onSelectDiscardCard: () => void
  onConfirmDiscard?: () => void
  gameOver: boolean
  validGangsters: number[]
  validTargets: number[]
  canPlaySecondDisplacement: boolean
  gameState: GameState
  secondActionTaken: boolean
  pillsApplied: number
  pendingPillTargetIds: string[]
  onSkipPill: () => void
  seatingCurrentPlayerName?: string
  seatingSelectedGangsterId?: string | null
  onSeatingConfirm?: () => void
  onSeatingBack?: () => void
  humanPlayer?: Player
  gameMode?: "hotseat" | "solo" | "multiplayer"
  botLog?: string[]
  newlyDealtCardIds?: string[]
}

export default function BottomPanel({
  currentPlayer, selectedGangster, selectedCard, selectedCardId, selectedDirection,
  targetPositionId, selectedCake, gamePhase, onSelectCard, onConfirmAction,
  onCancelAction, onSkipSecondDisplacement, onSelectDiscardCard, onConfirmDiscard, gameOver,
  validGangsters, validTargets, canPlaySecondDisplacement, gameState, secondActionTaken,
  pillsApplied, pendingPillTargetIds, onSkipPill, seatingCurrentPlayerName,
  seatingSelectedGangsterId, onSeatingConfirm, onSeatingBack, humanPlayer, gameMode, botLog,
  newlyDealtCardIds = [],
}: BottomPanelProps) {
  const [logExpanded, setLogExpanded] = useState(false)
  const { t } = useLang()

  if (gameOver) return null

  const isBotTurn =
    gameMode === "multiplayer" ? (humanPlayer ? currentPlayer.id !== humanPlayer.id : false)
    : gameMode === "solo" ? currentPlayer.id !== "player1"
    : false
  const handPlayer = humanPlayer ?? currentPlayer

  const Btn = ({ onClick, disabled, children, variant = "primary" }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "secondary" }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === "primary"
          ? "bg-[#F5AC0E] text-[#2B1710] hover:bg-[#F5AC0E]/80"
          : "bg-zinc-700 text-white hover:bg-zinc-600"}`}
    >
      {children}
    </button>
  )

  return (
    <div className="bg-gradient-to-b from-[#3D2314] to-[#2B1710] border-t border-zinc-700 w-full flex-shrink-0 py-3 px-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {/* Left — hand + discard */}
        <div className="flex flex-row items-center gap-2">
          <PlayerHand
            cards={handPlayer.hand}
            onSelectCard={onSelectCard}
            selectedCardId={selectedCardId}
            newlyDealtCardIds={newlyDealtCardIds}
            disabled={
              isBotTurn ||
              (gamePhase !== "SELECT_CARD" && gamePhase !== "SELECT_DISCARD" && gamePhase !== "SECOND_DISPLACEMENT") ||
              ["SEATING_SELECT_GANGSTER", "SEATING_SELECT_SEAT", "SEATING_CONFIRM"].includes(gamePhase) ||
              handPlayer.gangsters.every((g) => g.position === null)
            }
            isDiscardMode={gamePhase === "SELECT_DISCARD"}
            gameState={gameState}
            playerId={handPlayer.id}
          />
          {!isBotTurn && gamePhase === "SELECT_CARD" && !secondActionTaken && (
            <div className="mt-2 md:mt-0 md:ml-2">
              <Btn onClick={onSelectDiscardCard}>{t("btn.discard")}</Btn>
            </div>
          )}
        </div>

        {/* Right — action interface */}
        <div className="md:w-1/2 max-w-[calc(25vw-1rem)]">
          <div className="mb-3 text-center">
            <span className="font-semibold text-[#F5AC0E]">{t("game.turn", { name: currentPlayer.name })}</span>
            {isBotTurn && gameMode !== "multiplayer" && <span className="ml-2 text-xs text-zinc-400 animate-pulse">{t("game.bot.thinking")}</span>}
            {isBotTurn && gameMode === "multiplayer" && <span className="ml-2 text-xs text-zinc-400 animate-pulse">{t("game.bot.waiting")}</span>}
          </div>

          <div className="p-3 bg-gradient-to-b from-[#3D2314] to-[#2B1710] rounded-md mb-3 text-[#F5AC0E] text-sm">
            {isBotTurn && gameMode !== "multiplayer" && <p className="text-center text-zinc-400">{t("game.bot.turn")}</p>}
            {isBotTurn && gameMode === "multiplayer" && <p className="text-center text-zinc-400">{t("game.mp.waiting", { name: currentPlayer.name })}</p>}
            {!isBotTurn && gamePhase === "SELECT_CARD" && <p className="text-center">{t("game.select_card")}</p>}
            {gamePhase === "SELECT_GANGSTER" && selectedCard && (
              <div className="space-y-1">
                <p className="text-center">{t("game.select_gangster", { card: t(`card.name.${selectedCard.type}`) })}</p>
                {validGangsters.length === 0 && <p className="text-center text-red-400 text-xs">{t("game.no_gangsters")}</p>}
              </div>
            )}
            {gamePhase === "SELECT_CAKE" && selectedCard && <p className="text-center">{selectedCard.type === "PASS_CAKE" ? t("game.select_cake_move") : t("game.select_cake_explode")}</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "KNIFE" && selectedGangster && <p className="text-center">{t("game.knife.target")}</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "GUN" && selectedGangster && <p className="text-center">{t("game.gun.confirm_target")}</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "DISPLACEMENT" && selectedGangster && <p className="text-center">{t("game.displacement.select")}</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "ORDER_CAKE" && <p className="text-center">{t("game.ordercake.select")}</p>}
            {gamePhase === "CONFIRM_ACTION" && selectedCard && (
              <div className="space-y-1">
                <p className="text-center">{t("game.confirm")}</p>
                {selectedCard.type === "KNIFE" && selectedGangster && <p className="text-center text-xs">{t("game.knife.detail", { dir: t(`dir.${selectedDirection}`), pos: String(selectedGangster.position) })}</p>}
                {selectedCard.type === "GUN" && selectedGangster && <p className="text-center text-xs">{t("game.gun.detail", { pos: String(selectedGangster.position) })}</p>}
                {selectedCard.type === "DISPLACEMENT" && selectedGangster && targetPositionId && <p className="text-center text-xs">{t("game.displacement.detail", { from: String(selectedGangster.position), to: String(targetPositionId) })}</p>}
                {selectedCard.type === "ORDER_CAKE" && targetPositionId && <p className="text-center text-xs">{t("game.ordercake.detail", { pos: String(targetPositionId) })}</p>}
                {selectedCard.type === "PASS_CAKE" && selectedCake && selectedDirection && <p className="text-center text-xs">{t("game.passcake.detail", { pos: String(selectedCake.seatId), dir: t(`dir.${selectedDirection}`) })}</p>}
                {selectedCard.type === "EXPLODE_CAKE" && selectedCake && <p className="text-center text-xs">{t("game.explodecake.detail", { pos: String(selectedCake.seatId) })}</p>}
              </div>
            )}
            {gamePhase === "SECOND_DISPLACEMENT" && (
              <div className="space-y-1">
                <p className="text-center">{t("game.second_disp")}</p>
                {!canPlaySecondDisplacement && <p className="text-center text-red-400 text-xs">{t("game.no_disp")}</p>}
              </div>
            )}
            {gamePhase === "SELECT_DISCARD" && !selectedCardId && <div><p className="text-center">{t("game.discard.select")}</p><p className="text-center text-xs text-gray-400">{t("game.discard.hint")}</p></div>}
            {gamePhase === "SELECT_DISCARD" && selectedCardId && <div><p className="text-center">{t("game.discard.confirm")}</p><p className="text-center text-xs text-gray-400">{selectedCard ? t(`card.name.${selectedCard.type}`) : ""}</p></div>}
            {gamePhase === "SELECT_PILL_TARGET_1" && <div><p className="text-center">{t("game.pills.1")}</p><p className="text-center text-xs text-gray-400">{t("game.pills.hint")}</p></div>}
            {gamePhase === "SELECT_PILL_TARGET_2" && <div><p className="text-center">{t("game.pills.2")}</p><p className="text-center text-xs text-gray-400">{t("game.pills.status", { count: String(pillsApplied) })}</p></div>}
            {gamePhase === "SELECT_PILL_TARGET_3" && <div><p className="text-center">{t("game.pills.3")}</p><p className="text-center text-xs text-gray-400">{t("game.pills.status", { count: String(pillsApplied) })}</p></div>}
            {gamePhase === "CONFIRM_PILLS" && <div><p className="text-center">{t("game.pills.confirm")}</p><p className="text-center text-xs text-gray-400">{t("game.pills.detail", { count: String(pendingPillTargetIds.length) })}</p></div>}
            {gamePhase === "SEATING_SELECT_GANGSTER" && <div><p className="text-center font-semibold">{seatingCurrentPlayerName ? `${seatingCurrentPlayerName}: ` : ""}{t("game.seating.gangster")}</p><p className="text-center text-xs text-gray-400">{t("game.seating.gangster.hint")}</p></div>}
            {gamePhase === "SEATING_SELECT_SEAT" && <div><p className="text-center font-semibold">{seatingCurrentPlayerName ? `${seatingCurrentPlayerName}: ` : ""}{t("game.seating.seat")}</p><p className="text-center text-xs text-gray-400">{t("game.seating.seat.hint")}</p></div>}
            {gamePhase === "SEATING_CONFIRM" && <div><p className="text-center font-semibold">{t("game.seating.confirm")}</p><p className="text-center text-xs text-gray-400">{t("game.seating.confirm.hint")}</p></div>}
          </div>

          <div className="space-y-2">
            {(gamePhase === "SELECT_GANGSTER" || gamePhase === "SELECT_CAKE") && (
              <Btn onClick={onCancelAction} variant="secondary">{t("btn.cancel")}</Btn>
            )}
            {gamePhase === "SELECT_TARGET" && (selectedCard?.type === "KNIFE" || selectedCard?.type === "ORDER_CAKE") && (
              <Btn onClick={onCancelAction} variant="secondary">{t("btn.cancel")}</Btn>
            )}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "GUN" && (
              <div className="grid grid-cols-1 gap-2">
                <Btn onClick={onConfirmAction} disabled={validTargets.length === 0}>{t("btn.fire")}</Btn>
                <Btn onClick={onCancelAction} variant="secondary">{t("btn.cancel")}</Btn>
              </div>
            )}
            {gamePhase === "CONFIRM_ACTION" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={onConfirmAction}>{t("btn.confirm")}</Btn>
                <Btn onClick={onCancelAction} variant="secondary">{t("btn.back")}</Btn>
              </div>
            )}
            {gamePhase === "SECOND_DISPLACEMENT" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={() => onSelectCard(currentPlayer.hand.find((c) => c.type === "DISPLACEMENT")?.id || "")} disabled={!canPlaySecondDisplacement}>{t("btn.play_displacement")}</Btn>
                <Btn onClick={onSkipSecondDisplacement} variant="secondary">{t("btn.skip")}</Btn>
              </div>
            )}
            {gamePhase === "SELECT_DISCARD" && !selectedCardId && (
              <Btn onClick={onCancelAction} variant="secondary">{t("btn.cancel")}</Btn>
            )}
            {gamePhase === "SELECT_DISCARD" && selectedCardId && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={() => onConfirmDiscard?.()}>{t("btn.confirm_discard")}</Btn>
                <Btn onClick={onCancelAction} variant="secondary">{t("btn.cancel")}</Btn>
              </div>
            )}
            {gamePhase === "SELECT_PILL_TARGET_1" && (
              <Btn onClick={onCancelAction} variant="secondary">{t("btn.cancel")}</Btn>
            )}
            {(gamePhase === "SELECT_PILL_TARGET_2" || gamePhase === "SELECT_PILL_TARGET_3") && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={onSkipPill}>{t("btn.done")}</Btn>
                <Btn onClick={onCancelAction} variant="secondary">{t("btn.cancel")}</Btn>
              </div>
            )}
            {gamePhase === "CONFIRM_PILLS" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={onConfirmAction}>{t("btn.confirm")}</Btn>
                <Btn onClick={onCancelAction} variant="secondary">{t("btn.back")}</Btn>
              </div>
            )}
            {gamePhase === "SEATING_SELECT_SEAT" && (
              <Btn onClick={() => onSeatingBack?.()} variant="secondary">{t("btn.back")}</Btn>
            )}
            {gamePhase === "SEATING_CONFIRM" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={() => onSeatingConfirm?.()}>{t("btn.confirm")}</Btn>
                <Btn onClick={() => onSeatingBack?.()} variant="secondary">{t("btn.back")}</Btn>
              </div>
            )}
          </div>
        </div>
      </div>

      {gameMode === "solo" && botLog && botLog.length > 0 && (
        <div className="border-t border-zinc-700 px-4 pt-2 pb-1">
          <button onClick={() => setLogExpanded((v) => !v)} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-widest w-full text-left flex items-center gap-1">
            <span>{logExpanded ? "▾" : "▸"}</span> {t("game.bot_log", { count: String(botLog.length) })}
          </button>
          {logExpanded && (
            <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5">
              {botLog.slice(-20).map((entry, i) => (
                <p key={i} className="font-mono text-[10px] text-zinc-400 leading-tight">{entry}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
