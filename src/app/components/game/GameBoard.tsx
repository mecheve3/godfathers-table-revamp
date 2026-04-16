import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  initialGameState, initialGameState4, initialGameState5, initialGameState6,
  performAction, calculatePayment, initializeGame, dealCards, playCard,
  getValidGangstersForCard, getValidDisplacementPositions, getValidKnifeTargetPositions,
  getValidGunTargetPosition, hasCardOfType, getValidCakePositions, checkCakeExplosions,
  getValidCakesForPassing, getValidDirectionsForPassingCake, getValidCakesForExploding,
  shuffleDeck, isCardPlayable, getValidPillTargets, wakeUpSleepingGangsters,
  seatGangsterOnBoard, createManualSeatingInitialState, createManualSeatingInitialState4,
  createManualSeatingInitialState5, createManualSeatingInitialState6,
} from "../../features/game/game-logic"
import type { GameState, Action } from "../../features/game/types"
import { decideBotFirstPlay, decideBotSecondPlay, getRandomDiscardCard, decideBotSeating } from "../../features/game/botDecisionTree"
import { playSFX } from "../../features/game/sfx"
import { buildActionLog, buildExplosionLog, buildPaymentLog } from "../../features/game/logBuilder"
import type { LogEntry } from "../../features/game/types"
import ActionPanel from "./ActionPanel"
import BoardPosition from "./BoardPosition"
import TopPanel from "./TopPanel"
import BottomPanel from "./BottomPanel"

interface ActionSummary {
  seatIds: number[]
  animClass: string
  soundName: string
  soundDelay?: number
}

function computeActionSeats(action: Action, state: GameState): ActionSummary {
  const player = state.players.find((p) => p.id === action.playerId)
  switch (action.type) {
    case "KNIFE": {
      const gangster = player?.gangsters[action.gangsterId as number]
      const shooterSeat = gangster?.position ?? null
      const shooterPos = shooterSeat != null ? state.board.find((p) => p.id === shooterSeat) : null
      const targetSeat = action.direction === "left" ? (shooterPos?.leftId ?? null) : (shooterPos?.rightId ?? null)
      return { seatIds: [shooterSeat, targetSeat].filter((s): s is number => s != null), animClass: "seat-anim-danger", soundName: "knife" }
    }
    case "GUN": {
      const gangster = player?.gangsters[action.gangsterId as number]
      const shooterSeat = gangster?.position ?? null
      const shooterPos = shooterSeat != null ? state.board.find((p) => p.id === shooterSeat) : null
      const targetSeat = shooterPos?.frontId ?? null
      return { seatIds: [shooterSeat, targetSeat].filter((s): s is number => s != null), animClass: "seat-anim-danger", soundName: "gun", soundDelay: 75 }
    }
    case "DISPLACEMENT": {
      const gangster = player?.gangsters[action.gangsterId as number]
      return { seatIds: [gangster?.position ?? null, action.targetPositionId ?? null].filter((s): s is number => s != null), animClass: "seat-anim-neutral", soundName: "displacement" }
    }
    case "ORDER_CAKE": return { seatIds: [action.targetPositionId].filter((s): s is number => s != null), animClass: "seat-anim-utility", soundName: "ordercake" }
    case "PASS_CAKE": {
      const cake = state.cakes.find((c) => c.id === action.cakeId)
      const fromSeat = cake?.seatId ?? null
      const fromPos = fromSeat != null ? state.board.find((p) => p.id === fromSeat) : null
      const toSeat = action.direction === "left" ? (fromPos?.leftId ?? null) : (fromPos?.rightId ?? null)
      return { seatIds: [fromSeat, toSeat].filter((s): s is number => s != null), animClass: "seat-anim-neutral", soundName: "passcake" }
    }
    case "EXPLODE_CAKE": {
      const cake = state.cakes.find((c) => c.id === action.cakeId)
      const originSeat = cake?.seatId ?? null
      const originPos = originSeat != null ? state.board.find((p) => p.id === originSeat) : null
      return { seatIds: [originSeat, originPos?.leftId ?? null, originPos?.rightId ?? null].filter((s): s is number => s != null), animClass: "seat-anim-danger", soundName: "explodecake", soundDelay: 75 }
    }
    case "SLEEPING_PILLS": {
      const targetSeats = (action.pillTargetGangsterIds ?? []).map((gId) => {
        for (const pl of state.players) { const g = pl.gangsters.find((g) => g.id === gId); if (g?.position != null) return g.position }
        return null
      }).filter((s): s is number => s != null)
      return { seatIds: targetSeats, animClass: "seat-anim-sleep", soundName: "sleepingpills" }
    }
    case "POLICE_RAID": return { seatIds: [], animClass: "", soundName: "policeraid" }
    default: return { seatIds: [], animClass: "", soundName: "" }
  }
}

export interface GameBoardProps {
  playerCount: 3 | 4 | 5 | 6
  seatingType?: "automatic" | "manual"
  gameMode?: "hotseat" | "solo"
  playerNames?: string[]
  onReturnToHome: () => void
  onGameFinished?: (winnerId: string, winnerType: "HUMAN" | "CPU") => void
}

export default function GameBoard({ playerCount, seatingType = "automatic", gameMode = "hotseat", playerNames, onReturnToHome, onGameFinished }: GameBoardProps) {
  const botPlayerIds = gameMode === "solo"
    ? Array.from({ length: playerCount - 1 }, (_, i) => `player${i + 2}`)
    : []

  const getInitialState = (): GameState => {
    let base: GameState
    if (playerCount === 4) base = seatingType === "manual" ? createManualSeatingInitialState4() : initializeGame(initialGameState4)
    else if (playerCount === 5) base = seatingType === "manual" ? createManualSeatingInitialState5() : initializeGame(initialGameState5)
    else if (playerCount === 6) base = seatingType === "manual" ? createManualSeatingInitialState6() : initializeGame(initialGameState6)
    else base = seatingType === "manual" ? createManualSeatingInitialState() : initializeGame(initialGameState)

    // Apply custom player names if provided
    if (playerNames && playerNames.length > 0) {
      base = {
        ...base,
        players: base.players.map((p, i) => ({
          ...p,
          name: playerNames[i] ?? p.name,
        })),
      }
    }
    return base
  }

  const [gameState, setGameState] = useState<GameState>(getInitialState)
  const [seatingPlayerOrder, setSeatingPlayerOrder] = useState<string[]>([])
  const [seatingCurrentIdx, setSeatingCurrentIdx] = useState<number>(0)
  const [seatingQueue, setSeatingQueue] = useState<Record<string, string[]>>(() => {
    if (seatingType === "manual") return {}
    return {}
  })
  const [seatingSelectedGangsterId, setSeatingSelectedGangsterId] = useState<string | null>(null)
  const [isInitialSeating, setIsInitialSeating] = useState<boolean>(seatingType === "manual")
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0)
  const [selectedGangsterIndex, setSelectedGangsterIndex] = useState<number | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedDirection, setSelectedDirection] = useState<"left" | "right" | null>(null)
  const [targetPositionId, setTargetPositionId] = useState<number | null>(null)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [finalStandings, setFinalStandings] = useState<Array<{ player: string; money: number; rank: number; aliveGangsters?: number }>>([])
  const [validGangsters, setValidGangsters] = useState<number[]>([])
  const [validTargets, setValidTargets] = useState<number[]>([])
  const [validCakes, setValidCakes] = useState<string[]>([])
  const [validDirections, setValidDirections] = useState<("left" | "right")[]>([])
  const [secondActionTaken, setSecondActionTaken] = useState<boolean>(false)
  const [pillsApplied, setPillsApplied] = useState<number>(0)
  const [pendingPillTargetIds, setPendingPillTargetIds] = useState<string[]>([])
  const [validPillTargets, setValidPillTargets] = useState<string[]>([])
  const [botLog, setBotLog] = useState<string[]>([])
  const [seatAnimations, setSeatAnimations] = useState<Record<number, string>>({})
  const [policeRaidActive, setPoliceRaidActive] = useState(false)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  const addLogEntry = (data: Omit<LogEntry, "id" | "highlighted">) => {
    const id = `log-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const entry: LogEntry = { ...data, id, highlighted: true }
    setLogEntries((prev) => [...prev, entry])
    setTimeout(() => {
      setLogEntries((prev) => prev.map((e) => (e.id === id ? { ...e, highlighted: false } : e)))
    }, 2000)
  }

  const triggerSeatAnimation = (seatIds: number[], animClass: string, durationMs = 960) => {
    if (!seatIds.length || !animClass) return
    setSeatAnimations((prev) => { const next = { ...prev }; for (const id of seatIds) next[id] = animClass; return next })
    setTimeout(() => {
      setSeatAnimations((prev) => { const next = { ...prev }; for (const id of seatIds) delete next[id]; return next })
    }, durationMs)
  }

  const gameStateRef = useRef<GameState>(gameState)
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  useEffect(() => {
    const handleClick = () => playSFX("click", 0.3)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  useEffect(() => {
    if (seatingType === "manual" && gameState.currentPhase === "SEATING_SELECT_GANGSTER") {
      const order = gameState.players.map((p) => p.id)
      const queue: Record<string, string[]> = {}
      for (const p of gameState.players) queue[p.id] = p.gangsters.map((g) => g.id)
      setSeatingPlayerOrder(order)
      setSeatingCurrentIdx(0)
      setSeatingQueue(queue)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameOver && !["SEATING_SELECT_GANGSTER", "SEATING_SELECT_SEAT", "SEATING_CONFIRM"].includes(gameState.currentPhase)) {
      checkAndSkipPlayerWithNoGangsters()
    }
  }, [currentPlayerIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameState.currentPhase === "SELECT_CARD" && !gameOver) {
      const currentPlayer = gameState.players[currentPlayerIndex]
      const explodingCakes = gameState.cakes.filter((cake) => cake.ownerId === currentPlayer.id && cake.roundPlaced < gameState.turn)
      if (explodingCakes.length > 0) {
        const stateAfterExplosions = checkCakeExplosions(gameState, currentPlayer.id)
        setGameState(stateAfterExplosions)
        toast.error(`💥 ${explodingCakes.length} cake${explodingCakes.length > 1 ? "s" : ""} exploded!`)
        addLogEntry({ round: gameState.turn, playerId: currentPlayer.id, playerName: currentPlayer.name, message: buildExplosionLog(currentPlayer.name, currentPlayer.id, gameState, stateAfterExplosions), type: "explosion" })
      }
    }
  }, [currentPlayerIndex, gameState]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameState.currentPhase === "SELECT_CARD" && !gameOver) {
      const currentPlayer = gameState.players[currentPlayerIndex]
      const payment = calculatePayment(currentPlayer, gameState.board)
      if (payment > 0) {
        const updatedPlayers = [...gameState.players]
        updatedPlayers[currentPlayerIndex] = { ...currentPlayer, money: currentPlayer.money + payment }
        setGameState({ ...gameState, players: updatedPlayers, bankMoney: Math.max(0, gameState.bankMoney - payment) })
        if (gameMode !== "solo" || currentPlayer.id === "player1") playSFX("bank", 0.7)
        toast.success(`${currentPlayer.name} received $${payment.toLocaleString()}`)
        addLogEntry({ round: gameState.turn, playerId: currentPlayer.id, playerName: currentPlayer.name, message: buildPaymentLog(currentPlayer.name, payment), type: "payment" })
      }
    }
  }, [currentPlayerIndex, gameState.currentPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (["SEATING_SELECT_GANGSTER", "SEATING_SELECT_SEAT", "SEATING_CONFIRM"].includes(gameState.currentPhase)) return
    const playersWithGangsters = gameState.players.filter((p) => p.gangsters.some((g) => g.position !== null))
    if (gameState.bankMoney <= 0 || playersWithGangsters.length <= 1) {
      if (playersWithGangsters.length === 1 && gameState.bankMoney > 0) {
        const lastPlayer = playersWithGangsters[0]
        const updatedPlayers = gameState.players.map((p) =>
          p.id === lastPlayer.id ? { ...p, money: p.money + gameState.bankMoney } : p
        )
        setGameState({ ...gameState, players: updatedPlayers, bankMoney: 0 })
      }
      setGameOver(true)
      const sortedPlayers = [...gameState.players].sort((a, b) => b.money - a.money)
      if (sortedPlayers.length > 1 && sortedPlayers[0].money === sortedPlayers[1].money) {
        const tiedPlayers = sortedPlayers.filter((p) => p.money === sortedPlayers[0].money)
        tiedPlayers.sort((a, b) => b.gangsters.filter((g) => g.position !== null).length - a.gangsters.filter((g) => g.position !== null).length)
        sortedPlayers.splice(0, tiedPlayers.length, ...tiedPlayers)
      }
      const standings = sortedPlayers.map((p, i) => ({ player: p.name, money: p.money, aliveGangsters: p.gangsters.filter((g) => g.position !== null).length, rank: i + 1 }))
      setFinalStandings(standings)
      const winner = sortedPlayers[0]
      toast.success(`Game Over! ${winner.name} wins with $${winner.money.toLocaleString()}!`)
      const winnerType: "HUMAN" | "CPU" = botPlayerIds.includes(winner.id) ? "CPU" : "HUMAN"
      onGameFinished?.(winner.id, winnerType)
    }
  }, [gameState]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAndSkipPlayerWithNoGangsters = () => {
    const currentPlayer = gameState.players[currentPlayerIndex]
    if (!currentPlayer.gangsters.some((g) => g.position !== null)) {
      toast(`${currentPlayer.name} has no gangsters left — skipping turn`)
      setCurrentPlayerIndex(getNextActivePlayerIndex(currentPlayerIndex, gameState.players))
    }
  }

  const getNextActivePlayerIndex = (fromIdx: number, players: typeof gameState.players): number => {
    const total = players.length
    for (let i = 1; i <= total; i++) {
      const candidate = (fromIdx + i) % total
      if (players[candidate].gangsters.some((g) => g.position !== null)) return candidate
    }
    return (fromIdx + 1) % total
  }

  const executeSingleBotTurn = (state: GameState, playerIndex: number): { newState: GameState; nextPlayerIndex: number; logs: string[]; actionSummaries: ActionSummary[]; logEntryData: Omit<LogEntry, "id" | "highlighted">[] } => {
    const logs: string[] = []
    const actionSummaries: ActionSummary[] = []
    const logEntryData: Omit<LogEntry, "id" | "highlighted">[] = []
    const botPlayer = state.players[playerIndex]
    const botId = botPlayer.id
    let currentState = state

    const firstPlay = decideBotFirstPlay(currentState, botId)
    if (!firstPlay) {
      const discardId = getRandomDiscardCard(currentState, botId)
      if (discardId) {
        const newState: GameState = JSON.parse(JSON.stringify(currentState))
        const p = newState.players[playerIndex]
        const idx = p.hand.findIndex((c) => c.id === discardId)
        if (idx !== -1) {
          const [discarded] = p.hand.splice(idx, 1)
          newState.discardPile.push(discarded)
          if (newState.deck.length > 0) { const newCard = newState.deck.shift(); if (newCard) p.hand.push(newCard) }
          currentState = newState
          logs.push(`${botPlayer.name}: no valid play — discarded ${discarded.type.replace(/_/g, " ")}`)
        }
      }
    } else {
      actionSummaries.push(computeActionSeats(firstPlay.action, currentState))
      const preFirst = currentState
      currentState = playCard(currentState, botId, firstPlay.cardId)
      currentState = performAction(currentState, firstPlay.action)
      logEntryData.push({ round: state.turn, playerId: botId, playerName: botPlayer.name, message: buildActionLog(firstPlay.action, preFirst, currentState), type: "action" })
      logs.push(`${botPlayer.name}: ${firstPlay.log}`)
      const secondPlay = decideBotSecondPlay(currentState, botId)
      if (secondPlay) {
        actionSummaries.push(computeActionSeats(secondPlay.action, currentState))
        const preSecond = currentState
        currentState = playCard(currentState, botId, secondPlay.cardId)
        currentState = performAction(currentState, secondPlay.action)
        logEntryData.push({ round: state.turn, playerId: botId, playerName: botPlayer.name, message: buildActionLog(secondPlay.action, preSecond, currentState), type: "action" })
        logs.push(`${botPlayer.name} (2nd): ${secondPlay.log}`)
      }
    }

    let finalState = wakeUpSleepingGangsters(currentState, botId)
    finalState = dealCards(finalState)
    const nextPlayerIndex = getNextActivePlayerIndex(playerIndex, finalState.players)
    if (nextPlayerIndex <= playerIndex) finalState.turn += 1
    finalState.currentPhase = "SELECT_CARD"
    finalState.selectedCakeId = undefined
    return { newState: finalState, nextPlayerIndex, logs, actionSummaries, logEntryData }
  }

  useEffect(() => {
    if (gameMode !== "solo" || gameOver) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    if (!botPlayerIds.includes(currentPlayer.id)) return
    if (gameState.currentPhase !== "SELECT_CARD") return

    const timer = setTimeout(() => {
      const latestState = gameStateRef.current
      if (latestState.currentPhase !== "SELECT_CARD") return
      const { newState, nextPlayerIndex, logs, actionSummaries, logEntryData } = executeSingleBotTurn(latestState, currentPlayerIndex)
      for (const summary of actionSummaries) {
        if (summary.soundName === "policeraid") { playSFX("policeraid", 0.7); setPoliceRaidActive(true); setTimeout(() => setPoliceRaidActive(false), 1800) }
        else { triggerSeatAnimation(summary.seatIds, summary.animClass, 960); if (summary.soundName) playSFX(summary.soundName, 0.7, summary.soundDelay) }
      }
      for (const entry of logEntryData) addLogEntry(entry)
      setBotLog((prev) => [...prev.slice(-80), ...logs])
      setCurrentPlayerIndex(nextPlayerIndex)
      setGameState(newState)
      setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
      setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
      setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
      setSecondActionTaken(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [currentPlayerIndex, gameState.currentPhase, gameMode, gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameMode !== "solo") return
    if (gameState.currentPhase !== "SEATING_SELECT_GANGSTER") return
    const currentSeatingPlayerId = seatingPlayerOrder[seatingCurrentIdx]
    if (!currentSeatingPlayerId || !botPlayerIds.includes(currentSeatingPlayerId)) return
    const gangsterIdsToPlace = seatingQueue[currentSeatingPlayerId] ?? []
    if (gangsterIdsToPlace.length === 0) return

    const timer = setTimeout(() => {
      const state = gameStateRef.current
      if (state.currentPhase !== "SEATING_SELECT_GANGSTER") return
      const availableSeatIds = state.board.filter((p) => p.occupiedBy === null).map((p) => p.id)
      const decision = decideBotSeating(state, currentSeatingPlayerId, gangsterIdsToPlace, availableSeatIds)
      if (!decision) return

      const playerName = state.players.find((p) => p.id === currentSeatingPlayerId)?.name ?? currentSeatingPlayerId
      const newGameState = seatGangsterOnBoard(state, decision.gangsterId, decision.seatId)
      const newQueue = { ...seatingQueue }
      newQueue[currentSeatingPlayerId] = (newQueue[currentSeatingPlayerId] ?? []).filter((id) => id !== decision.gangsterId)
      setSeatingQueue(newQueue); setSeatingSelectedGangsterId(null); setTargetPositionId(null); setValidTargets([])
      toast(`${playerName} placed a gangster at seat #${decision.seatId}`)

      const allDone = Object.values(newQueue).every((q) => q.length === 0)
      if (allDone) {
        if (isInitialSeating) {
          const finalState = initializeGame(newGameState); finalState.currentPhase = "SELECT_CARD"
          setIsInitialSeating(false); setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(0); setGameState(finalState)
          toast.success("All gangsters seated! Game begins now!")
        } else {
          const raidingPlayerIdx = newGameState.players.findIndex((p) => p.id === seatingPlayerOrder[0])
          const nextIdx = getNextActivePlayerIndex(raidingPlayerIdx, newGameState.players)
          newGameState.currentPhase = "SELECT_CARD"; setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(nextIdx); setGameState(newGameState)
          toast.success("All gangsters re-seated! Normal play resumes.")
        }
        return
      }

      const total = seatingPlayerOrder.length
      let nextIdx = seatingCurrentIdx
      for (let i = 1; i <= total; i++) {
        const candidate = (seatingCurrentIdx + i) % total
        if ((newQueue[seatingPlayerOrder[candidate]] ?? []).length > 0) { nextIdx = candidate; break }
      }
      setSeatingCurrentIdx(nextIdx); newGameState.currentPhase = "SEATING_SELECT_GANGSTER"; setGameState(newGameState)
    }, 400)

    return () => clearTimeout(timer)
  }, [gameState.currentPhase, seatingCurrentIdx, gameMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectDiscardCard = () => {
    if (gameState.currentPhase !== "SELECT_CARD" || secondActionTaken) return
    setGameState({ ...gameState, currentPhase: "SELECT_DISCARD" })
    toast("Select a card to discard and draw a new one")
  }

  const handleDiscardCard = (cardId: string) => {
    if (gameState.currentPhase !== "SELECT_DISCARD") return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId)
    if (cardIndex === -1) return

    const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
    const [discardedCard] = newGameState.players[currentPlayerIndex].hand.splice(cardIndex, 1)
    newGameState.discardPile.push(discardedCard)
    if (newGameState.deck.length === 0 && newGameState.discardPile.length > 0) {
      newGameState.deck = shuffleDeck([...newGameState.discardPile])
      newGameState.discardPile = [discardedCard]
    }
    if (newGameState.deck.length > 0) { const newCard = newGameState.deck.shift(); if (newCard) newGameState.players[currentPlayerIndex].hand.push(newCard) }
    toast(`Discarded ${discardedCard.type.replace(/_/g, " ")} and drew a new card`)
    endTurn(newGameState)
  }

  const handleSelectCard = (cardId: string) => {
    if (gameOver) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const card = currentPlayer.hand.find((c) => c.id === cardId)
    if (!card) return

    if (gameState.currentPhase === "SELECT_DISCARD") { handleDiscardCard(cardId); return }
    if (gameState.currentPhase === "SELECT_CARD" && !isCardPlayable(gameState, currentPlayer.id, cardId)) {
      toast.error("This card has no valid targets at the moment"); return
    }
    setSelectedCardId(cardId)

    if (gameState.currentPhase === "SECOND_DISPLACEMENT") {
      if (card.type !== "DISPLACEMENT") { toast.error("You can only play a Displacement card for your second action"); return }
      const vg = getValidGangstersForCard(gameState, currentPlayer.id, "DISPLACEMENT")
      setValidGangsters(vg)
      if (vg.length === 0) { toast.error("No valid gangsters for displacement"); return }
      setGameState({ ...gameState, currentPhase: "SELECT_GANGSTER" })
      setSecondActionTaken(true)
      return
    }

    if (gameState.currentPhase === "SELECT_CARD") {
      if (card.type === "EXPLODE_CAKE") {
        const vc = getValidCakesForExploding(gameState); setValidCakes(vc)
        if (vc.length === 0) { toast.error("No cake bombs to explode"); return }
        if (vc.length === 1) { handleSelectCake(vc[0], cardId) } else { setGameState({ ...gameState, currentPhase: "SELECT_CAKE" }); toast("Select a cake bomb to explode") }
        return
      }
      if (card.type === "PASS_CAKE") {
        const vc = getValidCakesForPassing(gameState); setValidCakes(vc)
        if (vc.length === 0) { toast("No cake bombs to pass"); return }
        if (vc.length === 1) { handleSelectCake(vc[0], cardId) } else { setGameState({ ...gameState, currentPhase: "SELECT_CAKE" }); toast("Select a cake bomb to move") }
        return
      }
      if (card.type === "SLEEPING_PILLS") {
        const targets = getValidPillTargets(gameState, currentPlayer.id, [])
        if (targets.length === 0) { toast.error("No enemy gangsters at drink seats"); return }
        setSelectedCardId(cardId); setPillsApplied(0); setPendingPillTargetIds([])
        if (targets.length === 1) {
          const autoTarget = [targets[0]]; setPendingPillTargetIds(autoTarget); setPillsApplied(1)
          const nextTargets = getValidPillTargets(gameState, currentPlayer.id, autoTarget)
          setValidPillTargets(nextTargets); setGameState({ ...gameState, currentPhase: "SELECT_PILL_TARGET_2" })
          toast("Auto-selected 1 target. Select 2nd or skip.")
        } else { setValidPillTargets(targets); setGameState({ ...gameState, currentPhase: "SELECT_PILL_TARGET_1" }) }
        return
      }
      if (card.type === "POLICE_RAID") {
        setSelectedCardId(cardId); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
        toast.warning("Confirm to clear the board and force all gangsters to re-seat"); return
      }
      if (card.type === "ORDER_CAKE") {
        const vp = getValidCakePositions(gameState); setValidTargets(vp)
        if (vp.length === 0) { toast.error("No positions available for a cake"); return }
        setGameState({ ...gameState, currentPhase: "SELECT_TARGET" }); return
      }

      const vg = getValidGangstersForCard(gameState, currentPlayer.id, card.type)
      setValidGangsters(vg)
      if (vg.length === 0) { toast.error(`No valid gangsters for ${card.type.replace(/_/g, " ")}`); return }
      setGameState({ ...gameState, currentPhase: "SELECT_GANGSTER" })
    }
  }

  const handleSelectCake = (cakeId: string, overrideCardId?: string) => {
    const resolvedCardId = overrideCardId ?? selectedCardId
    if (gameOver || !resolvedCardId) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const card = currentPlayer.hand.find((c) => c.id === resolvedCardId)
    if (!card) return
    const cake = gameState.cakes.find((c) => c.id === cakeId)
    if (!cake) return

    setGameState({ ...gameState, selectedCakeId: cakeId, currentPhase: card.type === "PASS_CAKE" ? "SELECT_TARGET" : "CONFIRM_ACTION" })

    if (card.type === "PASS_CAKE") {
      const vd = getValidDirectionsForPassingCake(gameState, cakeId); setValidDirections(vd)
      const vp: number[] = []; const cakePosition = gameState.board.find((pos) => pos.id === cake.seatId)
      if (cakePosition) { if (vd.includes("left")) vp.push(cakePosition.leftId); if (vd.includes("right")) vp.push(cakePosition.rightId); setValidTargets(vp) }
      if (vd.length === 0) { toast.error("This cake cannot be moved in either direction"); return }
    }
  }

  const handleSelectGangster = (gangsterIndex: number) => {
    if (gameOver) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const gangster = currentPlayer.gangsters[gangsterIndex]
    if (!gangster || gangster.position === null || !selectedCardId) return
    const card = currentPlayer.hand.find((c) => c.id === selectedCardId)
    if (!card) return

    setSelectedGangsterIndex(gangsterIndex)
    let targets: number[] = []
    if (card.type === "KNIFE") targets = getValidKnifeTargetPositions(gameState, currentPlayer.id, gangsterIndex)
    else if (card.type === "GUN") { const t = getValidGunTargetPosition(gameState, currentPlayer.id, gangsterIndex); targets = t ? [t] : [] }
    else if (card.type === "DISPLACEMENT") targets = getValidDisplacementPositions(gameState)
    setValidTargets(targets)

    if (targets.length === 0) { toast.error(`No valid targets for ${card.type.replace(/_/g, " ")}`); return }
    setGameState({ ...gameState, currentPhase: "SELECT_TARGET" })
    toast(`${gangster.type} at position ${gangster.position} — select target`)
  }

  const handlePositionClick = (positionId: number) => {
    if (gameOver) return
    const position = gameState.board.find((pos) => pos.id === positionId)
    if (!position) return

    if (gameState.currentPhase === "SEATING_SELECT_SEAT") { handleSeatingPositionClick(positionId); return }
    if (gameState.currentPhase === "SEATING_SELECT_GANGSTER" || gameState.currentPhase === "SEATING_CONFIRM") return

    const currentPlayer = gameState.players[currentPlayerIndex]

    if (gameState.currentPhase === "SELECT_CAKE" && selectedCardId) {
      const cakesAtPosition = gameState.cakes.filter((cake) => cake.seatId === positionId)
      if (cakesAtPosition.length > 0) handleSelectCake(cakesAtPosition[0].id)
      return
    }
    if (gameState.currentPhase === "SELECT_GANGSTER") {
      const gi = currentPlayer.gangsters.findIndex((g) => g.position === positionId)
      if (gi !== -1 && validGangsters.includes(gi)) handleSelectGangster(gi)
      else if (gi !== -1) toast.error("This gangster cannot use the selected card")
      return
    }
    const pillPhases = ["SELECT_PILL_TARGET_1", "SELECT_PILL_TARGET_2", "SELECT_PILL_TARGET_3"] as const
    if ((pillPhases as readonly string[]).includes(gameState.currentPhase)) {
      const occupant = position.occupiedBy
      if (occupant && validPillTargets.includes(occupant.gangsterId)) handlePillTargetSelect(occupant.gangsterId)
      return
    }
    if (gameState.currentPhase === "SELECT_TARGET" && selectedCardId) {
      const card = currentPlayer.hand.find((c) => c.id === selectedCardId)
      if (!card) return
      if (card.type === "ORDER_CAKE") {
        if (validTargets.includes(positionId)) {
          setTargetPositionId(positionId); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
          toast(`Place cake at position ${positionId}?`)
        } else toast.error("Cannot place a cake at this position")
        return
      }
      if (card.type === "DISPLACEMENT" && selectedGangsterIndex !== null) {
        if (position.occupiedBy === null && validTargets.includes(positionId)) {
          setTargetPositionId(positionId); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
        } else if (position.occupiedBy !== null) toast.error("Can only displace to an empty seat")
        return
      }
      if (card.type === "KNIFE" && selectedGangsterIndex !== null && validTargets.includes(positionId)) {
        const gangster = currentPlayer.gangsters[selectedGangsterIndex]
        if (!gangster || gangster.position === null) return
        const gangsterPosition = gameState.board.find((pos) => pos.id === gangster.position)
        if (!gangsterPosition) return
        let direction: "left" | "right" | null = null
        if (gangsterPosition.leftId === positionId) direction = "left"
        else if (gangsterPosition.rightId === positionId) direction = "right"
        if (direction) { setSelectedDirection(direction); setTargetPositionId(positionId); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" }) }
      }
      if (card.type === "PASS_CAKE" && gameState.selectedCakeId) {
        const cake = gameState.cakes.find((c) => c.id === gameState.selectedCakeId)
        if (!cake) return
        const cakePosition = gameState.board.find((pos) => pos.id === cake.seatId)
        if (!cakePosition) return
        let direction: "left" | "right" | null = null
        if (cakePosition.leftId === positionId) direction = "left"
        else if (cakePosition.rightId === positionId) direction = "right"
        if (direction && validDirections.includes(direction)) { setSelectedDirection(direction); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" }) }
      }
    }
  }

  const handleDirectionSelect = (direction: "left" | "right") => {
    if (gameOver) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const card = selectedCardId ? currentPlayer.hand.find((c) => c.id === selectedCardId) : null
    if (!card) return

    if (card.type === "PASS_CAKE" && gameState.selectedCakeId) {
      if (!validDirections.includes(direction)) { toast.error("Cannot move the cake in that direction"); return }
      setSelectedDirection(direction); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" }); return
    }
    if (card.type === "KNIFE" && selectedGangsterIndex !== null) {
      const gangster = currentPlayer.gangsters[selectedGangsterIndex]
      if (!gangster || gangster.position === null) return
      const position = gameState.board.find((pos) => pos.id === gangster.position)
      if (!position) return
      const targetPosId = direction === "left" ? position.leftId : position.rightId
      if (!validTargets.includes(targetPosId)) { toast.error("No gangster in that direction"); return }
      setSelectedDirection(direction); setTargetPositionId(targetPosId); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
    }
  }

  const handleConfirmAction = () => {
    if (gameOver || !selectedCardId) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const card = currentPlayer.hand.find((c) => c.id === selectedCardId)
    if (!card) return

    let newGameState = playCard(gameState, currentPlayer.id, selectedCardId)
    const action: Action = { type: card.type, playerId: currentPlayer.id }

    if (card.type === "POLICE_RAID") {
      playSFX("policeraid", 0.7); setPoliceRaidActive(true); setTimeout(() => setPoliceRaidActive(false), 1800)
      const queue: Record<string, string[]> = {}
      const order = gameState.players.map((p) => p.id)
      const rotated = [...order.slice(currentPlayerIndex), ...order.slice(0, currentPlayerIndex)]
      for (const p of gameState.players) queue[p.id] = p.gangsters.filter((g) => g.position !== null).map((g) => g.id)
      newGameState = performAction(newGameState, action)
      setSeatingPlayerOrder(rotated); setSeatingCurrentIdx(0); setSeatingQueue(queue); setSeatingSelectedGangsterId(null); setIsInitialSeating(false)
      setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
      setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
      setGameState(newGameState); toast.warning("Police Raid! All gangsters cleared. Re-seat them."); return
    }

    if (card.type === "ORDER_CAKE") { if (targetPositionId) action.targetPositionId = targetPositionId }
    else if (card.type === "PASS_CAKE") { if (newGameState.selectedCakeId && selectedDirection) { action.cakeId = newGameState.selectedCakeId; action.direction = selectedDirection } }
    else if (card.type === "EXPLODE_CAKE") { if (newGameState.selectedCakeId) action.cakeId = newGameState.selectedCakeId }
    else if (card.type === "SLEEPING_PILLS") { action.pillTargetGangsterIds = pendingPillTargetIds }
    else if (selectedGangsterIndex !== null) {
      action.gangsterId = selectedGangsterIndex
      if (card.type === "KNIFE" && selectedDirection) action.direction = selectedDirection
      else if (card.type === "DISPLACEMENT" && targetPositionId) action.targetPositionId = targetPositionId
    } else { toast.error("Missing required parameters"); return }

    const feedback = computeActionSeats(action, gameState)
    triggerSeatAnimation(feedback.seatIds, feedback.animClass, 960)
    if (feedback.soundName) playSFX(feedback.soundName, 0.7, feedback.soundDelay)

    const preActionState = newGameState
    try { newGameState = performAction(newGameState, action) }
    catch (err) { toast.error("The action could not be completed."); return }

    addLogEntry({
      round: gameState.turn,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      message: buildActionLog(action, preActionState, newGameState),
      type: "action",
    })

    setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
    setValidCakes([]); setValidDirections([]); setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
    newGameState.selectedCakeId = undefined

    if (secondActionTaken) { endTurn(newGameState); return }

    const hasDisplacementCard = hasCardOfType(newGameState.players[currentPlayerIndex], "DISPLACEMENT")
    const hasEmptySeats = newGameState.board.some((p) => p.occupiedBy === null)
    if (hasDisplacementCard && hasEmptySeats) { newGameState.currentPhase = "SECOND_DISPLACEMENT"; setGameState(newGameState) }
    else endTurn(newGameState)
  }

  const handlePillTargetSelect = (gangsterId: string) => {
    if (!validPillTargets.includes(gangsterId)) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const newTargets = [...pendingPillTargetIds, gangsterId]
    setPendingPillTargetIds(newTargets); setPillsApplied(newTargets.length)
    const nextVt = getValidPillTargets(gameState, currentPlayer.id, newTargets); setValidPillTargets(nextVt)
    if (newTargets.length === 1) setGameState({ ...gameState, currentPhase: "SELECT_PILL_TARGET_2" })
    else if (newTargets.length === 2) setGameState({ ...gameState, currentPhase: "SELECT_PILL_TARGET_3" })
    else setGameState({ ...gameState, currentPhase: "CONFIRM_PILLS" })
  }

  const handleSkipPill = () => { if (pendingPillTargetIds.length === 0) return; setGameState({ ...gameState, currentPhase: "CONFIRM_PILLS" }) }

  const handleSeatingGangsterSelect = (gangsterId: string) => {
    const currentSeatingPlayerId = seatingPlayerOrder[seatingCurrentIdx]
    if (!currentSeatingPlayerId) return
    const queue = seatingQueue[currentSeatingPlayerId] ?? []
    if (!queue.includes(gangsterId)) return
    setSeatingSelectedGangsterId(gangsterId)
    setValidTargets(gameState.board.filter((p) => p.occupiedBy === null).map((p) => p.id))
    setGameState({ ...gameState, currentPhase: "SEATING_SELECT_SEAT" })
  }

  const handleSeatingPositionClick = (seatId: number) => {
    if (!seatingSelectedGangsterId) return
    const seat = gameState.board.find((p) => p.id === seatId)
    if (!seat || seat.occupiedBy !== null) return
    setTargetPositionId(seatId); setGameState({ ...gameState, currentPhase: "SEATING_CONFIRM" })
    toast(`Place gangster at seat #${seatId}?`)
  }

  const handleSeatingBack = () => {
    setSeatingSelectedGangsterId(null); setTargetPositionId(null); setValidTargets([])
    setGameState({ ...gameState, currentPhase: "SEATING_SELECT_GANGSTER" })
  }

  const handleSeatingConfirm = () => {
    if (!seatingSelectedGangsterId || !targetPositionId) return
    const currentSeatingPlayerId = seatingPlayerOrder[seatingCurrentIdx]
    const playerName = gameState.players.find((p) => p.id === currentSeatingPlayerId)?.name ?? currentSeatingPlayerId
    const newGameState = seatGangsterOnBoard(gameState, seatingSelectedGangsterId, targetPositionId)
    const newQueue = { ...seatingQueue }
    newQueue[currentSeatingPlayerId] = (newQueue[currentSeatingPlayerId] ?? []).filter((id) => id !== seatingSelectedGangsterId)
    setSeatingQueue(newQueue); setSeatingSelectedGangsterId(null); setTargetPositionId(null); setValidTargets([])
    toast(`${playerName} placed gangster at seat #${targetPositionId}`)

    const allDone = Object.values(newQueue).every((q) => q.length === 0)
    if (allDone) {
      if (isInitialSeating) {
        const finalState = initializeGame(newGameState); finalState.currentPhase = "SELECT_CARD"
        setIsInitialSeating(false); setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(0); setGameState(finalState)
        toast.success("All gangsters seated! Game begins now!")
      } else {
        const raidingPlayerIdx = newGameState.players.findIndex((p) => p.id === seatingPlayerOrder[0])
        const nextIdx = getNextActivePlayerIndex(raidingPlayerIdx, newGameState.players)
        newGameState.currentPhase = "SELECT_CARD"; setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(nextIdx); setGameState(newGameState)
        toast.success("All gangsters re-seated!")
      }
      return
    }
    const total = seatingPlayerOrder.length
    let nextIdx = seatingCurrentIdx
    for (let i = 1; i <= total; i++) {
      const candidate = (seatingCurrentIdx + i) % total
      if ((newQueue[seatingPlayerOrder[candidate]] ?? []).length > 0) { nextIdx = candidate; break }
    }
    setSeatingCurrentIdx(nextIdx); newGameState.currentPhase = "SEATING_SELECT_GANGSTER"; setGameState(newGameState)
    const nextPlayerName = gameState.players.find((p) => p.id === seatingPlayerOrder[nextIdx])?.name ?? ""
    if (nextPlayerName) toast(`${nextPlayerName}'s turn — choose a gangster to seat`)
  }

  const handleCancelAction = () => {
    setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
    setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
    setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
    if (secondActionTaken && gameState.currentPhase !== "SECOND_DISPLACEMENT") {
      setGameState({ ...gameState, currentPhase: "SECOND_DISPLACEMENT", selectedCakeId: undefined })
    } else {
      setGameState({ ...gameState, currentPhase: "SELECT_CARD", selectedCakeId: undefined })
      setSecondActionTaken(false)
    }
    toast("Action cancelled — select a different card")
  }

  const handleSkipSecondDisplacement = () => { endTurn(gameState) }

  const endTurn = (currentGameState: GameState) => {
    const stateAfterWakeup = wakeUpSleepingGangsters(currentGameState, currentGameState.players[currentPlayerIndex].id)
    const newGameState = dealCards(stateAfterWakeup)
    const nextPlayerIndex = getNextActivePlayerIndex(currentPlayerIndex, newGameState.players)
    setCurrentPlayerIndex(nextPlayerIndex)
    if (nextPlayerIndex <= currentPlayerIndex) newGameState.turn += 1
    newGameState.currentPhase = "SELECT_CARD"; newGameState.selectedCakeId = undefined
    setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
    setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
    setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([]); setSecondActionTaken(false)
    setGameState(newGameState)
  }

  const restartGame = () => {
    const newGameState = getInitialState()
    setGameState(newGameState); setCurrentPlayerIndex(0); setSelectedGangsterIndex(null); setSelectedCardId(null)
    setSelectedDirection(null); setTargetPositionId(null); setGameOver(false)
    setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
    setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
    setFinalStandings([]); setSecondActionTaken(false); setBotLog([]); setSeatAnimations([]); setPoliceRaidActive(false); setLogEntries([])
    setSeatingSelectedGangsterId(null); setSeatingCurrentIdx(0)
    if (seatingType === "manual") {
      const order = newGameState.players.map((p) => p.id)
      const queue: Record<string, string[]> = {}
      for (const p of newGameState.players) queue[p.id] = p.gangsters.map((g) => g.id)
      setSeatingPlayerOrder(order); setSeatingQueue(queue); setIsInitialSeating(true)
    } else { setSeatingPlayerOrder([]); setSeatingQueue({}); setIsInitialSeating(false) }
    toast.success("Game restarted!")
  }

  const canPlaySecondDisplacement = hasCardOfType(gameState.players[currentPlayerIndex], "DISPLACEMENT")
  const selectedGangster = selectedGangsterIndex !== null ? gameState.players[currentPlayerIndex].gangsters[selectedGangsterIndex] : null
  const selectedCard = selectedCardId ? gameState.players[currentPlayerIndex].hand.find((c) => c.id === selectedCardId) || null : null
  const selectedCake = gameState.selectedCakeId ? gameState.cakes.find((c) => c.id === gameState.selectedCakeId) || null : null

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#2B1710] to-[#3D2314]">
      {policeRaidActive && (
        <div className="fixed inset-0 pointer-events-none police-raid-overlay" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.35), rgba(59,130,246,0.35))", zIndex: 9999 }} />
      )}

      <div className="flex flex-row min-h-screen">
        <div className="flex flex-col flex-grow">
          <TopPanel onRestart={restartGame} onNewGame={onReturnToHome} />

          <div className="flex flex-col flex-grow">
            <div className="flex flex-col lg:flex-row flex-grow">
              {/* Game Board */}
              <div className="lg:w-[75%]">
                <div className="bg-gradient-to-b from-[#3D2314] to-[#2B1710] rounded-lg">
                  <div
                    className="relative w-full aspect-[100/50] rounded-lg overflow-hidden"
                    style={{
                      backgroundImage: "url('/images/game-board-background.png')",
                      backgroundSize: "contain",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundColor: "#2B1710",
                    }}
                  >
                    {gameState.board.map((position) => (
                      <BoardPosition
                        key={position.id}
                        position={position}
                        gameState={gameState}
                        selected={
                          (selectedGangsterIndex !== null && gameState.players[currentPlayerIndex].gangsters[selectedGangsterIndex].position === position.id) ||
                          (selectedCake != null && selectedCake.seatId === position.id)
                        }
                        highlighted={
                          (gameState.currentPhase === "SELECT_GANGSTER" && validGangsters.some((idx) => gameState.players[currentPlayerIndex].gangsters[idx].position === position.id)) ||
                          (gameState.currentPhase === "SELECT_TARGET" && validTargets.includes(position.id)) ||
                          (gameState.currentPhase === "SELECT_CAKE" && gameState.cakes.some((cake) => cake.seatId === position.id)) ||
                          position.id === targetPositionId ||
                          (["SELECT_PILL_TARGET_1", "SELECT_PILL_TARGET_2", "SELECT_PILL_TARGET_3"].includes(gameState.currentPhase) &&
                            validPillTargets.some((gangsterId) => { for (const p of gameState.players) { const g = p.gangsters.find((g) => g.id === gangsterId); if (g && g.position === position.id) return true } return false })) ||
                          (gameState.currentPhase === "SEATING_SELECT_SEAT" && validTargets.includes(position.id))
                        }
                        onClick={() => handlePositionClick(position.id)}
                        animClass={seatAnimations[position.id]}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="lg:w-[25%] flex flex-col">
                <ActionPanel
                  currentPlayer={gameState.players[currentPlayerIndex]}
                  selectedGangster={selectedGangster}
                  selectedGangsterIndex={selectedGangsterIndex}
                  selectedCard={selectedCard}
                  selectedCardId={selectedCardId}
                  selectedAction={selectedCard?.type || null}
                  selectedDirection={selectedDirection}
                  targetPositionId={targetPositionId}
                  selectedCake={selectedCake}
                  gamePhase={gameState.currentPhase}
                  onSelectCard={handleSelectCard}
                  onSelectGangster={handleSelectGangster}
                  onSelectTarget={handlePositionClick}
                  onSelectDirection={handleDirectionSelect}
                  onConfirmAction={handleConfirmAction}
                  onCancelAction={handleCancelAction}
                  onSkipSecondDisplacement={handleSkipSecondDisplacement}
                  onEndTurn={() => endTurn(gameState)}
                  onSelectDiscardCard={handleSelectDiscardCard}
                  gameOver={gameOver}
                  validGangsters={validGangsters}
                  validTargets={validTargets}
                  validDirections={validDirections}
                  canPlaySecondDisplacement={canPlaySecondDisplacement}
                  onRestartGame={restartGame}
                  gameState={gameState}
                  finalStandings={finalStandings}
                  playerCount={playerCount}
                  secondActionTaken={secondActionTaken}
                  seatingQueue={seatingQueue}
                  seatingCurrentPlayerId={seatingPlayerOrder[seatingCurrentIdx]}
                  seatingSelectedGangsterId={seatingSelectedGangsterId}
                  onSeatingGangsterSelect={handleSeatingGangsterSelect}
                  logEntries={logEntries}
                />
              </div>
            </div>

            {!gameOver && (
              <BottomPanel
                currentPlayer={gameState.players[currentPlayerIndex]}
                humanPlayer={gameMode === "solo" ? gameState.players.find((p) => p.id === "player1") : undefined}
                gameMode={gameMode}
                botLog={botLog}
                selectedGangster={selectedGangster}
                selectedCard={selectedCard}
                selectedCardId={selectedCardId}
                selectedDirection={selectedDirection}
                targetPositionId={targetPositionId}
                selectedCake={selectedCake}
                gamePhase={gameState.currentPhase}
                onSelectCard={handleSelectCard}
                onConfirmAction={handleConfirmAction}
                onCancelAction={handleCancelAction}
                onSkipSecondDisplacement={handleSkipSecondDisplacement}
                onSelectDiscardCard={handleSelectDiscardCard}
                gameOver={gameOver}
                validGangsters={validGangsters}
                validTargets={validTargets}
                canPlaySecondDisplacement={canPlaySecondDisplacement}
                gameState={gameState}
                secondActionTaken={secondActionTaken}
                pillsApplied={pillsApplied}
                pendingPillTargetIds={pendingPillTargetIds}
                onSkipPill={handleSkipPill}
                seatingCurrentPlayerName={gameState.players.find((p) => p.id === seatingPlayerOrder[seatingCurrentIdx])?.name}
                seatingSelectedGangsterId={seatingSelectedGangsterId}
                onSeatingConfirm={handleSeatingConfirm}
                onSeatingBack={handleSeatingBack}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
