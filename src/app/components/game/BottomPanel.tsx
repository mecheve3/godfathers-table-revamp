import type { Player, Gangster, GameState, Card, GamePhase, CakeBomb } from "../../features/game/types"
import { useState } from "react"
import PlayerHand from "./PlayerHand"

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
  gameMode?: "hotseat" | "solo"
  botLog?: string[]
}

export default function BottomPanel({
  currentPlayer, selectedGangster, selectedCard, selectedCardId, selectedDirection,
  targetPositionId, selectedCake, gamePhase, onSelectCard, onConfirmAction,
  onCancelAction, onSkipSecondDisplacement, onSelectDiscardCard, gameOver,
  validGangsters, validTargets, canPlaySecondDisplacement, gameState, secondActionTaken,
  pillsApplied, pendingPillTargetIds, onSkipPill, seatingCurrentPlayerName,
  seatingSelectedGangsterId, onSeatingConfirm, onSeatingBack, humanPlayer, gameMode, botLog,
}: BottomPanelProps) {
  const [logExpanded, setLogExpanded] = useState(false)

  if (gameOver) return null

  const isBotTurn = gameMode === "solo" && currentPlayer.id !== "player1"
  const handPlayer = (gameMode === "solo" && humanPlayer) ? humanPlayer : currentPlayer

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
            disabled={
              isBotTurn ||
              (gamePhase !== "SELECT_CARD" && gamePhase !== "SELECT_DISCARD" && gamePhase !== "SECOND_DISPLACEMENT") ||
              ["SEATING_SELECT_GANGSTER", "SEATING_SELECT_SEAT", "SEATING_CONFIRM"].includes(gamePhase)
            }
            isDiscardMode={gamePhase === "SELECT_DISCARD"}
            gameState={gameState}
            playerId={handPlayer.id}
          />
          {!isBotTurn && gamePhase === "SELECT_CARD" && !secondActionTaken && (
            <div className="mt-2 md:mt-0 md:ml-2">
              <Btn onClick={onSelectDiscardCard}>Discard</Btn>
            </div>
          )}
        </div>

        {/* Right — action interface */}
        <div className="md:w-1/2 max-w-[calc(25vw-1rem)]">
          <div className="mb-3 text-center">
            <span className="font-semibold text-[#F5AC0E]">{currentPlayer.name}'s Turn</span>
            {isBotTurn && <span className="ml-2 text-xs text-zinc-400 animate-pulse">🤖 thinking...</span>}
          </div>

          <div className="p-3 bg-gradient-to-b from-[#3D2314] to-[#2B1710] rounded-md mb-3 text-[#F5AC0E] text-sm">
            {isBotTurn && <p className="text-center text-zinc-400">Bot is taking its turn...</p>}
            {!isBotTurn && gamePhase === "SELECT_CARD" && <p className="text-center">Select a card from your hand to play</p>}
            {gamePhase === "SELECT_GANGSTER" && selectedCard && (
              <div className="space-y-1">
                <p className="text-center">Select one of your gangsters to use the {selectedCard.type.replace(/_/g, " ").toLowerCase()} card</p>
                {validGangsters.length === 0 && <p className="text-center text-red-400 text-xs">No valid gangsters. Cancel and try another card.</p>}
              </div>
            )}
            {gamePhase === "SELECT_CAKE" && selectedCard && <p className="text-center">Select a cake bomb to {selectedCard.type === "PASS_CAKE" ? "move" : "explode"}</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "KNIFE" && selectedGangster && <p className="text-center">Select a target on the board to attack</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "GUN" && selectedGangster && <p className="text-center">Confirm to shoot the gangster in front</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "DISPLACEMENT" && selectedGangster && <p className="text-center">Select an empty position to move your gangster</p>}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "ORDER_CAKE" && <p className="text-center">Select a position to place a cake bomb</p>}
            {gamePhase === "CONFIRM_ACTION" && selectedCard && (
              <div className="space-y-1">
                <p className="text-center">Confirm your action</p>
                {selectedCard.type === "KNIFE" && selectedGangster && <p className="text-center text-xs">Attack to the {selectedDirection} of position {selectedGangster.position}</p>}
                {selectedCard.type === "GUN" && selectedGangster && <p className="text-center text-xs">Shoot gangster in front of position {selectedGangster.position}</p>}
                {selectedCard.type === "DISPLACEMENT" && selectedGangster && targetPositionId && <p className="text-center text-xs">Move from {selectedGangster.position} to {targetPositionId}</p>}
                {selectedCard.type === "ORDER_CAKE" && targetPositionId && <p className="text-center text-xs">Place cake at position {targetPositionId}</p>}
                {selectedCard.type === "PASS_CAKE" && selectedCake && selectedDirection && <p className="text-center text-xs">Move cake from {selectedCake.seatId} to the {selectedDirection}</p>}
                {selectedCard.type === "EXPLODE_CAKE" && selectedCake && <p className="text-center text-xs">Explode cake at position {selectedCake.seatId}</p>}
              </div>
            )}
            {gamePhase === "SECOND_DISPLACEMENT" && (
              <div className="space-y-1">
                <p className="text-center">Play a displacement card as your second action?</p>
                {!canPlaySecondDisplacement && <p className="text-center text-red-400 text-xs">No displacement cards in hand.</p>}
              </div>
            )}
            {gamePhase === "SELECT_DISCARD" && <div><p className="text-center">Select a card to discard</p><p className="text-center text-xs text-gray-400">You'll draw a new card to replace it</p></div>}
            {gamePhase === "SELECT_PILL_TARGET_1" && <div><p className="text-center">Select a gangster to put to sleep (1 of up to 3)</p><p className="text-center text-xs text-gray-400">Click a highlighted gangster on the board</p></div>}
            {gamePhase === "SELECT_PILL_TARGET_2" && <div><p className="text-center">Select a second gangster (optional)</p><p className="text-center text-xs text-gray-400">{pillsApplied} selected — skip to end here</p></div>}
            {gamePhase === "SELECT_PILL_TARGET_3" && <div><p className="text-center">Select a third gangster (optional)</p><p className="text-center text-xs text-gray-400">{pillsApplied} selected — skip to end here</p></div>}
            {gamePhase === "CONFIRM_PILLS" && <div><p className="text-center">Confirm sleeping pills action</p><p className="text-center text-xs text-gray-400">{pendingPillTargetIds.length} gangster{pendingPillTargetIds.length !== 1 ? "s" : ""} will be put to sleep</p></div>}
            {gamePhase === "SEATING_SELECT_GANGSTER" && <div><p className="text-center font-semibold">{seatingCurrentPlayerName ? `${seatingCurrentPlayerName}: ` : ""}Choose a gangster to place</p><p className="text-center text-xs text-gray-400">Click a blinking gangster icon in the panel on the right</p></div>}
            {gamePhase === "SEATING_SELECT_SEAT" && <div><p className="text-center font-semibold">{seatingCurrentPlayerName ? `${seatingCurrentPlayerName}: ` : ""}Choose an empty seat</p><p className="text-center text-xs text-gray-400">Click a highlighted seat on the board</p></div>}
            {gamePhase === "SEATING_CONFIRM" && <div><p className="text-center font-semibold">Confirm placement?</p><p className="text-center text-xs text-gray-400">Place the gangster in the selected seat</p></div>}
          </div>

          <div className="space-y-2">
            {(gamePhase === "SELECT_GANGSTER" || gamePhase === "SELECT_CAKE") && (
              <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Cancel and select different card</Btn>
            )}
            {gamePhase === "SELECT_TARGET" && (selectedCard?.type === "KNIFE" || selectedCard?.type === "ORDER_CAKE") && (
              <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Cancel</Btn>
            )}
            {gamePhase === "SELECT_TARGET" && selectedCard?.type === "GUN" && (
              <div className="grid grid-cols-1 gap-2">
                <Btn onClick={onConfirmAction} disabled={validTargets.length === 0}><span>🔫</span> Fire Gun</Btn>
                <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Cancel</Btn>
              </div>
            )}
            {gamePhase === "CONFIRM_ACTION" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={onConfirmAction}><span>✅</span> Confirm</Btn>
                <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Back</Btn>
              </div>
            )}
            {gamePhase === "SECOND_DISPLACEMENT" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={() => onSelectCard(currentPlayer.hand.find((c) => c.type === "DISPLACEMENT")?.id || "")} disabled={!canPlaySecondDisplacement}><span>🚶</span> Play Displacement</Btn>
                <Btn onClick={onSkipSecondDisplacement} variant="secondary"><span>⏭️</span> Skip</Btn>
              </div>
            )}
            {gamePhase === "SELECT_DISCARD" && (
              <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Cancel discard</Btn>
            )}
            {gamePhase === "SELECT_PILL_TARGET_1" && (
              <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Cancel</Btn>
            )}
            {(gamePhase === "SELECT_PILL_TARGET_2" || gamePhase === "SELECT_PILL_TARGET_3") && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={onSkipPill}><span>⏭️</span> Skip</Btn>
                <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Cancel</Btn>
              </div>
            )}
            {gamePhase === "CONFIRM_PILLS" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={onConfirmAction}><span>✅</span> Confirm</Btn>
                <Btn onClick={onCancelAction} variant="secondary"><span>↩️</span> Back</Btn>
              </div>
            )}
            {gamePhase === "SEATING_SELECT_SEAT" && (
              <Btn onClick={() => onSeatingBack?.()} variant="secondary"><span>↩️</span> Back — re-select gangster</Btn>
            )}
            {gamePhase === "SEATING_CONFIRM" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={() => onSeatingConfirm?.()}><span>✅</span> Confirm</Btn>
                <Btn onClick={() => onSeatingBack?.()} variant="secondary"><span>↩️</span> Back</Btn>
              </div>
            )}
          </div>
        </div>
      </div>

      {gameMode === "solo" && botLog && botLog.length > 0 && (
        <div className="border-t border-zinc-700 px-4 pt-2 pb-1">
          <button onClick={() => setLogExpanded((v) => !v)} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-widest w-full text-left flex items-center gap-1">
            <span>{logExpanded ? "▾" : "▸"}</span> Bot Log ({botLog.length})
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
