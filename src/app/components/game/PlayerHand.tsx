import type { Card as CardType } from "../../features/game/types"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(...args))
import { useEffect, useState } from "react"
import { isCardPlayable } from "../../features/game/game-logic"
import { useLang } from "../../context/LanguageContext"

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

function CardInfoPopup({ card, onClose }: { card: CardType; onClose: () => void }) {
  const { t } = useLang()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#2B1710] border-2 border-[#F5AC0E] rounded-lg p-6 max-w-xs w-full mx-4 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[#F5AC0E] font-bold text-lg uppercase tracking-wide">{t(`card.name.${card.type}`)}</h2>
        <img src={getCardImage(card.type)} alt={card.type} className="w-40 h-56 object-contain rounded-md border border-[#F5AC0E]/40" />
        <p className="text-white/90 text-sm text-center leading-relaxed">{t(`card.desc.${card.type}`)}</p>
        <button onClick={onClose} className="px-5 py-1.5 bg-[#F5AC0E] text-[#2B1710] font-bold rounded-md hover:bg-[#F5AC0E]/80 transition-colors">
          {t("card.info.close")}
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
  const { t } = useLang()

  useEffect(() => {
    const status: Record<string, boolean> = {}
    cards.forEach((card) => { status[card.id] = isCardPlayable(gameState, playerId, card.id) })
    setPlayableCards(status)
  }, [cards, gameState, playerId])

  const infoCard = infoCardId ? cards.find((c) => c.id === infoCardId) ?? null : null

  return (
    <div className="w-full">
      {isDiscardMode && <h3 className="font-semibold mb-2 text-[#F5AC0E]">{t("game.discard.header")}</h3>}
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
                disabled={isSelected ? false : (disabled || (!isDiscardMode && (!playableCards[card.id] || isSecondDisplacementLocked)))}
                title={!isPlayable && !isDiscardMode ? t("game.no_gangsters") : ""}
                className={cn(
                  `w-20 h-28 rounded-md border-2 ${borderColor} overflow-hidden transition-all block`,
                  isSelected ? "ring-2 ring-white scale-105" : "",
                  isDiscardMode ? "hover:ring-2 hover:ring-red-500 cursor-pointer" : "",
                  !isPlayable && !isDiscardMode ? "opacity-50 grayscale cursor-not-allowed" : !isDiscardMode ? "hover:scale-105 cursor-pointer" : "",
                  isNewlyDealt ? "card-new-deal" : "",
                )}
              >
                {imageSrc ? (
                  <img src={imageSrc} alt={t(`card.name.${card.type}`)} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[#F5AC0E] text-xs font-bold p-1 text-center">
                    {t(`card.name.${card.type}`)}
                  </div>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setInfoCardId(card.id) }}
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#F5AC0E]/90 text-[#2B1710] text-[10px] font-bold flex items-center justify-center hover:bg-[#F5AC0E] transition-colors z-10 leading-none"
                title={t("card.info")}
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
