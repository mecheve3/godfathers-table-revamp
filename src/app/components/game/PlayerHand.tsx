import type { Card as CardType } from "../../features/game/types"
import { cn } from "../ui/utils"
import { useEffect, useState } from "react"
import { isCardPlayable } from "../../features/game/game-logic"

interface PlayerHandProps {
  cards: CardType[]
  onSelectCard: (cardId: string) => void
  selectedCardId: string | null
  disabled?: boolean
  isDiscardMode?: boolean
  gameState: any
  playerId: string
  newlyDealtCardIds?: string[]
}

const getCardImage = (type: string): string => {
  switch (type) {
    case "KNIFE":          return "/images/cards/knife.png"
    case "GUN":            return "/images/cards/gun.png"
    case "DISPLACEMENT":   return "/images/cards/displacement.png"
    case "ORDER_CAKE":     return "/images/cards/ordercake.png"
    case "PASS_CAKE":      return "/images/cards/passcake.png"
    case "EXPLODE_CAKE":   return "/images/cards/explodecake.png"
    case "POLICE_RAID":    return "/images/cards/policeraid.png"
    case "SLEEPING_PILLS": return "/images/cards/sleepingpills.png"
    default:               return ""
  }
}

const getCardDescription = (type: string): string => {
  switch (type) {
    case "KNIFE":
      return "Slash a gangster immediately to your left or right. If the adjacent seat is occupied by an enemy, they are eliminated and removed from the board. Your gangster must be alive and seated to use this card."
    case "GUN":
      return "Shoot the gangster sitting directly across the table from yours. If the opposite seat is occupied, they are eliminated. If the seat is empty, the shot misses — but the card is still spent."
    case "DISPLACEMENT":
      return "Move one of your gangsters from their current seat to any unoccupied seat on the board. Can also be used as a second action after your first play — if you have a Displacement card in hand after playing another card, you get the option to move."
    case "ORDER_CAKE":
      return "Place a cake bomb on any seat on the board. The bomb is armed this round and will automatically explode at the start of your NEXT turn, eliminating anyone seated to the left, right, and center of the blast. Plan ahead — your own gangsters can be caught in the blast."
    case "PASS_CAKE":
      return "Nudge an existing cake bomb one seat to the left or right. Use this to redirect a bomb toward an enemy, or push it away from your own gangsters before it explodes."
    case "EXPLODE_CAKE":
      return "Manually trigger a cake bomb right now — no waiting for next round. The explosion hits the center seat and both adjacent seats. Any gangster caught in the blast is eliminated. Great for a surprise strike."
    case "POLICE_RAID":
      return "The cops show up and clear the entire board. Every gangster is removed and all players must re-seat their gang from scratch, in turn order starting with you. Powerful for disrupting strong positions. WARNING: this card is permanently removed from the deck once played — it will not be reshuffled."
    case "SLEEPING_PILLS":
      return "Drug up to 3 enemy gangsters sitting at bar or drink seats. Sleeping gangsters skip their turn but stay on the board. They wake up at the end of their owner's next turn. Useful for neutralizing threats without eliminating them."
    default:
      return "Unknown card."
  }
}

const formatCardName = (type: string): string => type.replace(/_/g, " ")

function CardInfoPopup({ card, onClose }: { card: CardType; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#2B1710] border-2 border-[#F5AC0E] rounded-lg p-6 max-w-xs w-full mx-4 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[#F5AC0E] font-bold text-lg uppercase tracking-wide">{formatCardName(card.type)}</h2>
        <img src={getCardImage(card.type)} alt={card.type} className="w-40 h-56 object-contain rounded-md border border-[#F5AC0E]/40" />
        <p className="text-white/90 text-sm text-center leading-relaxed">{getCardDescription(card.type)}</p>
        <button onClick={onClose} className="px-5 py-1.5 bg-[#F5AC0E] text-[#2B1710] font-bold rounded-md hover:bg-[#F5AC0E]/80 transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}

const getPlayerBorderColor = (playerId: string): string => {
  switch (playerId) {
    case "player1": return "border-red-500"
    case "player2": return "border-blue-500"
    case "player3": return "border-yellow-400"
    case "player4": return "border-green-500"
    case "player5": return "border-orange-500"
    case "player6": return "border-purple-500"
    default:        return "border-gray-500"
  }
}

export default function PlayerHand({ cards, onSelectCard, selectedCardId, disabled = false, isDiscardMode = false, gameState, playerId, newlyDealtCardIds = [] }: PlayerHandProps) {
  const [playableCards, setPlayableCards] = useState<Record<string, boolean>>({})
  const [infoCardId, setInfoCardId] = useState<string | null>(null)
  const borderColor = getPlayerBorderColor(playerId)

  useEffect(() => {
    const status: Record<string, boolean> = {}
    cards.forEach((card) => { status[card.id] = isCardPlayable(gameState, playerId, card.id) })
    setPlayableCards(status)
  }, [cards, gameState, playerId])

  const infoCard = infoCardId ? cards.find((c) => c.id === infoCardId) ?? null : null

  return (
    <div className="w-full">
      {isDiscardMode && <h3 className="font-semibold mb-2 text-[#F5AC0E]">Select a Card to Discard</h3>}
      <div className="flex flex-wrap gap-2 justify-center">
        {cards.map((card) => {
          const isSecondDisplacementLocked = gameState.currentPhase === "SECOND_DISPLACEMENT" && card.type !== "DISPLACEMENT"
          const isPlayable = isDiscardMode || (playableCards[card.id] && !isSecondDisplacementLocked)
          const isSelected = selectedCardId === card.id
          const isNewlyDealt = newlyDealtCardIds.includes(card.id)
          const imageSrc = getCardImage(card.type)

          return (
            <div key={card.id} className="relative flex-shrink-0">
              <button
                onClick={() => onSelectCard(card.id)}
                disabled={disabled || (!isDiscardMode && (!playableCards[card.id] || isSecondDisplacementLocked))}
                title={!isPlayable && !isDiscardMode ? "No valid targets for this card" : ""}
                className={cn(
                  `w-20 h-28 rounded-md border-2 ${borderColor} overflow-hidden transition-all block`,
                  isSelected ? "ring-2 ring-white scale-105" : "",
                  isDiscardMode ? "hover:ring-2 hover:ring-red-500 cursor-pointer" : "",
                  !isPlayable && !isDiscardMode ? "opacity-50 grayscale cursor-not-allowed" : !isDiscardMode ? "hover:scale-105 cursor-pointer" : "",
                  isNewlyDealt ? "card-new-deal" : "",
                )}
              >
                {imageSrc ? (
                  <img src={imageSrc} alt={formatCardName(card.type)} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[#F5AC0E] text-xs font-bold p-1 text-center">
                    {formatCardName(card.type)}
                  </div>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setInfoCardId(card.id) }}
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#F5AC0E]/90 text-[#2B1710] text-[10px] font-bold flex items-center justify-center hover:bg-[#F5AC0E] transition-colors z-10 leading-none"
                title="Card info"
              >
                ?
              </button>
            </div>
          )
        })}
      </div>
      {infoCard && <CardInfoPopup card={infoCard} onClose={() => setInfoCardId(null)} />}
    </div>
  )
}
