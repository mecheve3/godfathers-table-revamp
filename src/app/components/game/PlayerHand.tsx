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
    case "KNIFE":          return "Attack a gangster to your left or right."
    case "GUN":            return "Shoot the gangster directly in front of you."
    case "DISPLACEMENT":   return "Move one of your gangsters to any empty position on the board."
    case "ORDER_CAKE":     return "Place a cake bomb at any position. It will explode the following round."
    case "PASS_CAKE":      return "Move a cake bomb one position to the left or right."
    case "EXPLODE_CAKE":   return "Detonate a cake bomb immediately, eliminating gangsters in the blast."
    case "POLICE_RAID":    return "Clear the entire board — all surviving gangsters must be re-seated. This card is permanently removed from the deck."
    case "SLEEPING_PILLS": return "Put a gangster to sleep, preventing them from acting this round."
    default:               return "Unknown card."
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

export default function PlayerHand({ cards, onSelectCard, selectedCardId, disabled = false, isDiscardMode = false, gameState, playerId }: PlayerHandProps) {
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
