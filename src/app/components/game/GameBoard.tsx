import { useState, useEffect, useRef } from "react"
import {
  initialGameState, initialGameState4, initialGameState5, initialGameState6,
  performAction, calculatePayment, calculatePaymentBreakdown, initializeGame, dealCards, playCard,
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
import { useLang } from "../../context/LanguageContext"

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

/** Sprite image path for each card type — rendered as a blinking overlay on affected seats */
const CARD_SPRITE: Partial<Record<string, string>> = {
  KNIFE:        '/images/Sprites/knifesprite.png',
  GUN:          '/images/Sprites/gunsprite.png',
  PASS_CAKE:    '/images/Sprites/cake.png',
  EXPLODE_CAKE: '/images/Sprites/explosionsprite.png',
  DISPLACEMENT: '/images/Sprites/displacementsprite.png',
}

/** Shown on a seat when the occupant is eliminated (dedicated elimination sprite) */
const ELIMINATION_SPRITE = '/images/Sprites/eliminationsprite.png'

/** Per-action visual feedback included in sync payloads so receiving clients can replay animations and logs */
export interface SyncAction {
  playerId: string
  cardType: string
  logEntry: Omit<LogEntry, "id" | "highlighted">
  seatAnim?: { seatIds: number[]; animClass: string; durationMs?: number }
  /** Sprite overlay to blink on affected seats */
  spriteAnim?: { seatIds: number[]; imagePath: string }
  /** SFX to play on receiving clients — ensures audio sync in multiplayer */
  sound?: { name: string; vol?: number; delayMs?: number }
}

/** Full game sync payload — game state + seating state + action feedback, broadcast after every turn */
export interface GameSyncPayload {
  gameState: GameState
  currentPlayerIndex: number
  seatingPlayerOrder: string[]
  seatingCurrentIdx: number
  seatingQueue: Record<string, string[]>
  actions?: SyncAction[]
  /** True when this payload represents the very first seating phase (not a police raid re-seat) */
  isInitialSeating?: boolean
  /**
   * Pre-computed payment log for the next player's collection at the start of their turn.
   * Included so receiving clients can replay it in the correct position (after action logs)
   * rather than letting their local payment useEffect fire it synchronously out of order.
   */
  paymentLog?: Omit<LogEntry, "id" | "highlighted">
}

export interface GameBoardProps {
  playerCount: 3 | 4 | 5 | 6
  seatingType?: "automatic" | "manual"
  gameMode?: "hotseat" | "solo" | "multiplayer"
  playerNames?: string[]
  /** 0-based index of the local human player (set in multiplayer mode) */
  localPlayerIndex?: number
  /** Explicit list of CPU player IDs for bot AI (overrides solo-mode default) */
  cpuPlayerIds?: string[]
  /** Full sync payload pushed from the server (multiplayer) */
  incomingSync?: GameSyncPayload
  /** Called after every turn — broadcasts state to other clients */
  onTurnEnd?: (payload: GameSyncPayload) => void
  /** Called when local player restarts or quits in multiplayer */
  onAbandon?: (reason: 'restart' | 'quit', playerName: string) => void
  /** WebSocket connection status from parent — used to gate the initial state broadcast */
  socketStatus?: string
  onReturnToHome: () => void
  onGameFinished?: (winnerId: string, winnerType: "HUMAN" | "CPU") => void
}

export default function GameBoard({ playerCount, seatingType = "automatic", gameMode = "hotseat", playerNames, localPlayerIndex, cpuPlayerIds, incomingSync, onTurnEnd, onAbandon, socketStatus, onReturnToHome, onGameFinished }: GameBoardProps) {
  // In solo mode use default CPU IDs; in multiplayer use the explicit list from slots
  const botPlayerIds = cpuPlayerIds
    ?? (gameMode === "solo" ? Array.from({ length: playerCount - 1 }, (_, i) => `player${i + 2}`) : [])

  // In multiplayer, only the host (localPlayerIndex === 0) runs bot AI
  const shouldRunBots = gameMode !== "multiplayer" || localPlayerIndex === 0

  // Local player's game ID (e.g. "player2")
  const localPlayerId = localPlayerIndex !== undefined ? `player${localPlayerIndex + 1}` : undefined

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<null | 'restart' | 'quit'>(null)

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
  const [seatSpriteOverlays, setSeatSpriteOverlays] = useState<Record<number, string>>({})
  const [seatSpriteOverlaysLarge, setSeatSpriteOverlaysLarge] = useState<Record<number, boolean>>({})
  const [policeRaidActive, setPoliceRaidActive] = useState(false)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [activeBotPlayerId, setActiveBotPlayerId] = useState<string | null>(null)
  const [centerCard, setCenterCard] = useState<{ cardType: string; playerId: string } | null>(null)
  // Derived: total gangsters still waiting to be seated across all players.
  // Used as a dep for the bot-seating useEffect so it retriggers when the same
  // player's turn comes back around (seatingCurrentIdx unchanged but queue shrinks).
  const seatingTotalRemaining = Object.values(seatingQueue).reduce((sum, arr) => sum + arr.length, 0)
  const [newlyDealtCardIds, setNewlyDealtCardIds] = useState<string[]>([])
  const [draggingFromSeatId, setDraggingFromSeatId] = useState<number | null>(null)

  const addLogEntry = (data: Omit<LogEntry, "id" | "highlighted">) => {
    const id = `log-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const entry: LogEntry = { ...data, id, highlighted: true }
    setLogEntries((prev) => [...prev, entry])
    setTimeout(() => {
      setLogEntries((prev) => prev.map((e) => (e.id === id ? { ...e, highlighted: false } : e)))
    }, 2000)
  }

  const showCenterCard = (cardType: string, playerId: string) => {
    setCenterCard({ cardType, playerId })
    setTimeout(() => setCenterCard(null), 2000)
  }

  const triggerSeatAnimation = (seatIds: number[], animClass: string, durationMs = 960) => {
    if (!seatIds.length || !animClass) return
    setSeatAnimations((prev) => { const next = { ...prev }; for (const id of seatIds) next[id] = animClass; return next })
    setTimeout(() => {
      setSeatAnimations((prev) => { const next = { ...prev }; for (const id of seatIds) delete next[id]; return next })
    }, durationMs)
  }

  /** Show a sprite image blinking over the given seat(s) for durationMs. Pass large=true for oversized center-of-explosion sprite. */
  const triggerSeatSprite = (seatIds: number[], imagePath: string, durationMs = 800, large = false) => {
    if (!seatIds.length || !imagePath) return
    setSeatSpriteOverlays((prev) => { const next = { ...prev }; for (const id of seatIds) next[id] = imagePath; return next })
    if (large) setSeatSpriteOverlaysLarge((prev) => { const next = { ...prev }; for (const id of seatIds) next[id] = true; return next })
    setTimeout(() => {
      setSeatSpriteOverlays((prev) => { const next = { ...prev }; for (const id of seatIds) delete next[id]; return next })
      if (large) setSeatSpriteOverlaysLarge((prev) => { const next = { ...prev }; for (const id of seatIds) delete next[id]; return next })
    }, durationMs)
  }

  const gameStateRef = useRef<GameState>(gameState)
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  // Stores the first action of a two-action turn (displacement second play)
  const firstActionRef = useRef<SyncAction | null>(null)

  // Prevents the initial broadcast from firing more than once (even if socketStatus flaps)
  const initialBroadcastDone = useRef(false)

  // When true, the payment useEffect skips addLogEntry (state update still runs).
  // Set by the incomingSync handler when paymentLog is included in the payload;
  // the handler replays the log itself at the right position in the action sequence.
  const suppressPaymentLogRef = useRef(false)

  // ── Multiplayer: apply state pushed from server ────────────────────────────
  useEffect(() => {
    if (!incomingSync) return
    // Don't interrupt this client while they are mid-seating-action
    if (gameState.currentPhase === "SEATING_SELECT_SEAT" || gameState.currentPhase === "SEATING_CONFIRM") return

    // If the payload includes a pre-computed payment log, tell the payment useEffect
    // to skip addLogEntry — we'll replay it ourselves below in the correct order.
    if (incomingSync.paymentLog) suppressPaymentLogRef.current = true

    setGameState(incomingSync.gameState)
    setCurrentPlayerIndex(incomingSync.currentPlayerIndex)

    // Restore seating state if included (police raid / initial seating)
    if (incomingSync.seatingPlayerOrder.length > 0) {
      setSeatingPlayerOrder(incomingSync.seatingPlayerOrder)
      setSeatingCurrentIdx(incomingSync.seatingCurrentIdx)
      setSeatingQueue(incomingSync.seatingQueue)
      // Preserve the isInitialSeating flag so handleSeatingConfirm takes the right path
      setIsInitialSeating(incomingSync.isInitialSeating ?? false)
    } else {
      setSeatingPlayerOrder([])
      setSeatingQueue({})
      setSeatingCurrentIdx(0)
    }

    // Clear selection state
    setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
    setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
    setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
    setSecondActionTaken(false)
    setSeatingSelectedGangsterId(null)

    // Replay visual effects from the sender's turn so this client sees animations + log entries
    if (incomingSync.actions && incomingSync.actions.length > 0) {
      incomingSync.actions.forEach((act, i) => {
        setTimeout(() => {
          addLogEntry(act.logEntry)
          if (act.cardType === 'POLICE_RAID') {
            setPoliceRaidActive(true)
            setTimeout(() => setPoliceRaidActive(false), 1800)
          } else {
            showCenterCard(act.cardType, act.playerId)
          }
          if (act.seatAnim) {
            triggerSeatAnimation(
              act.seatAnim.seatIds,
              act.seatAnim.animClass,
              act.seatAnim.durationMs ?? (act.seatAnim.animClass === "seat-anim-danger" ? 2000 : 960),
            )
          }
          if (act.spriteAnim) {
            const { seatIds, imagePath } = act.spriteAnim
            if (act.cardType === "DISPLACEMENT" && seatIds.length >= 2) {
              triggerSeatSprite([seatIds[0]], imagePath, 900)
              setTimeout(() => triggerSeatSprite([seatIds[1]], imagePath, 900), 450)
            } else if (act.cardType === "KNIFE" || act.cardType === "GUN") {
              triggerSeatSprite([seatIds[0]], imagePath, 900)
              if (seatIds.length >= 2 && gameState.board.find((p) => p.id === seatIds[1])?.occupiedBy != null) {
                setTimeout(() => triggerSeatSprite([seatIds[1]], ELIMINATION_SPRITE, 1400), 500)
              }
            } else if (act.cardType === "PASS_CAKE") {
              triggerSeatSprite([seatIds[0]], imagePath, 900)
            } else if (act.cardType === "EXPLODE_CAKE") {
              triggerSeatSprite([seatIds[0]], imagePath, 900, true)
            } else {
              triggerSeatSprite(seatIds, imagePath, 900)
            }
          }
          if (act.sound) {
            if (act.sound.delayMs) {
              setTimeout(() => playSFX(act.sound!.name, act.sound!.vol ?? 0.7), act.sound.delayMs)
            } else {
              playSFX(act.sound.name, act.sound.vol ?? 0.7)
            }
          }
        }, i * 800)
      })
    }

    // Replay the next player's collection log AFTER all action logs so the order is:
    // [action1, action2, …] → [nextPlayer collects]
    // The payment useEffect will skip its own addLogEntry because suppressPaymentLogRef is set.
    if (incomingSync.paymentLog) {
      const delay = (incomingSync.actions?.length ?? 0) * 800
      const log = incomingSync.paymentLog
      setTimeout(() => { addLogEntry(log) }, delay)
    }
  }, [incomingSync]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Multiplayer: host broadcasts initial game state once the WebSocket is open ──
  // Gated on socketStatus === 'open' so the send is not silently dropped before the connection is ready.
  useEffect(() => {
    if (gameMode !== "multiplayer" || localPlayerIndex !== 0) return
    if (socketStatus !== 'open') return
    if (initialBroadcastDone.current) return
    initialBroadcastDone.current = true
    const firstBreakdown = seatingType !== "manual" ? calculatePaymentBreakdown(gameState.players[0], gameState.board) : null
    const firstPayment = firstBreakdown?.total ?? 0
    const paymentLogEntry: Omit<LogEntry, "id" | "highlighted"> | undefined = firstPayment > 0 && firstBreakdown
      ? { round: gameState.turn, playerId: gameState.players[0].id, playerName: gameState.players[0].name, message: buildPaymentLog(gameState.players[0].name, firstPayment, firstBreakdown), type: "payment" }
      : undefined
    onTurnEnd?.({
      gameState,
      currentPlayerIndex: 0,
      seatingPlayerOrder: seatingType === "manual" ? gameState.players.map((p) => p.id) : [],
      seatingCurrentIdx: 0,
      seatingQueue: seatingType === "manual"
        ? Object.fromEntries(gameState.players.map((p) => [p.id, p.gangsters.map((g) => g.id)]))
        : {},
      actions: [],
      isInitialSeating: seatingType === "manual",
      paymentLog: paymentLogEntry,
    })
  }, [socketStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tracks "playerId:turn" to prevent double-paying on phase changes (e.g. cancel)
  const paymentProcessedRef = useRef<string>("")

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
      const explodingCakes = gameState.cakes.filter((cake) => {
        if (cake.ownerId !== currentPlayer.id) return false
        if (cake.roundPlaced >= gameState.turn) return false
        // If the original owner has been fully eliminated (all gangsters gone), the cake
        // no longer auto-explodes — it can only be detonated manually by other players.
        const owner = gameState.players.find((p) => p.id === cake.ownerId)
        return owner?.gangsters.some((g) => g.position !== null) ?? false
      })
      if (explodingCakes.length > 0) {
        const stateAfterExplosions = checkCakeExplosions(gameState, currentPlayer.id)
        setGameState(stateAfterExplosions)
        // Play explosion SFX + seat animations + sprites for each cake blast
        for (const cake of explodingCakes) {
          playSFX("explodecake", 0.3)
          const cakePos = gameState.board.find((p) => p.id === cake.seatId)
          if (cakePos) {
            const blastSeats = [cakePos.id, cakePos.leftId, cakePos.rightId].filter((s): s is number => s != null)
            triggerSeatAnimation(blastSeats, "seat-anim-danger", 2500)
            // Sprite only on the center cake seat — blast radius seats are covered by seat animation.
            // Keeping center-only prevents the sprite from overwriting sprites from the previous turn.
            triggerSeatSprite([cakePos.id], CARD_SPRITE["EXPLODE_CAKE"]!, 900, true)
            // Elimination sprite for each gangster removed by this explosion
            const eliminatedByExplosion = blastSeats.filter(
              (id) => gameState.board.find((p) => p.id === id)?.occupiedBy !== null &&
                       stateAfterExplosions.board.find((p) => p.id === id)?.occupiedBy === null
            )
            if (eliminatedByExplosion.length > 0) {
              setTimeout(() => triggerSeatSprite(eliminatedByExplosion, ELIMINATION_SPRITE, 1400), 500)
            }
          }
        }
        addLogEntry({ round: gameState.turn, playerId: currentPlayer.id, playerName: currentPlayer.name, message: buildExplosionLog(currentPlayer.name, currentPlayer.id, gameState, stateAfterExplosions), type: "explosion" })
      }
    }
  }, [currentPlayerIndex, gameState]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameState.currentPhase === "SELECT_CARD" && !gameOver) {
      const currentPlayer = gameState.players[currentPlayerIndex]
      // Prevent duplicate payment when phase bounces back to SELECT_CARD (e.g. cancel action)
      const paymentKey = `${currentPlayer.id}:${gameState.turn}`
      if (paymentProcessedRef.current === paymentKey) return
      const breakdown = calculatePaymentBreakdown(currentPlayer, gameState.board)
      const payment = breakdown.total
      if (payment > 0) {
        paymentProcessedRef.current = paymentKey
        const updatedPlayers = [...gameState.players]
        updatedPlayers[currentPlayerIndex] = { ...currentPlayer, money: currentPlayer.money + payment }
        setGameState({ ...gameState, players: updatedPlayers, bankMoney: Math.max(0, gameState.bankMoney - payment) })
        if (gameMode !== "solo" || currentPlayer.id === "player1") playSFX("bank", 0.7)
        // In multiplayer, the incomingSync handler replays this log at the correct position
        // in the action sequence — suppress the local log to avoid ordering issues on P2+
        if (!suppressPaymentLogRef.current) {
          addLogEntry({ round: gameState.turn, playerId: currentPlayer.id, playerName: currentPlayer.name, message: buildPaymentLog(currentPlayer.name, payment, breakdown), type: "payment" })
        }
        suppressPaymentLogRef.current = false
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
      addLogEntry({ round: gameState.turn, playerId: winner.id, playerName: winner.name, message: `Game Over — ${winner.name} wins with $${winner.money.toLocaleString()}!`, type: "system" })
      const winnerType: "HUMAN" | "CPU" = botPlayerIds.includes(winner.id) ? "CPU" : "HUMAN"
      onGameFinished?.(winner.id, winnerType)
    }
  }, [gameState]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAndSkipPlayerWithNoGangsters = () => {
    const currentPlayer = gameState.players[currentPlayerIndex]
    if (!currentPlayer.gangsters.some((g) => g.position !== null)) {
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

  const executeSingleBotTurn = (state: GameState, playerIndex: number): { newState: GameState; nextPlayerIndex: number; logs: string[]; actionSummaries: ActionSummary[]; logEntryData: Omit<LogEntry, "id" | "highlighted">[]; playedCards: Array<{ cardType: string; playerId: string }>; stateAfterFirstAction: GameState | null } => {
    const logs: string[] = []
    const actionSummaries: ActionSummary[] = []
    const logEntryData: Omit<LogEntry, "id" | "highlighted">[] = []
    const playedCards: Array<{ cardType: string; playerId: string }> = []
    let stateAfterFirstAction: GameState | null = null
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
      playedCards.push({ cardType: firstPlay.action.type, playerId: botId })
      const preFirst = currentState
      currentState = playCard(currentState, botId, firstPlay.cardId)
      currentState = performAction(currentState, firstPlay.action)
      logEntryData.push({ round: state.turn, playerId: botId, playerName: botPlayer.name, message: buildActionLog(firstPlay.action, preFirst, currentState), type: "action" })
      logs.push(`${botPlayer.name}: ${firstPlay.log}`)
      stateAfterFirstAction = currentState  // snapshot for sequential board update
      const secondPlay = decideBotSecondPlay(currentState, botId)
      if (secondPlay) {
        actionSummaries.push(computeActionSeats(secondPlay.action, currentState))
        playedCards.push({ cardType: secondPlay.action.type, playerId: botId })
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
    return { newState: finalState, nextPlayerIndex, logs, actionSummaries, logEntryData, playedCards, stateAfterFirstAction }
  }

  useEffect(() => {
    if ((!shouldRunBots || gameMode === "hotseat") || gameOver) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    if (!botPlayerIds.includes(currentPlayer.id)) return
    if (gameState.currentPhase !== "SELECT_CARD") return

    // Show which bot is playing immediately — before the thinking delay
    setActiveBotPlayerId(currentPlayer.id)

    const timer = setTimeout(() => {
      const latestState = gameStateRef.current
      if (latestState.currentPhase !== "SELECT_CARD") return
      const { newState, nextPlayerIndex, logs, actionSummaries, logEntryData, playedCards, stateAfterFirstAction } = executeSingleBotTurn(latestState, currentPlayerIndex)

      // Timing constants
      const ACTION_STAGGER = 2800    // ms between each action's visual effects
      const DANGER_ANIM_MS = 2500   // duration of elimination animation (matches CSS)
      const OTHER_ANIM_MS  = 1200   // duration of non-danger animations

      // Stagger visual effects — animations play over the OLD board state so the
      // user can clearly see who is being shot / moved before the board updates.
      actionSummaries.forEach((summary, i) => {
        setTimeout(() => {
          if (summary.soundName === "policeraid") {
            playSFX("policeraid", 0.7); setPoliceRaidActive(true)
            setTimeout(() => setPoliceRaidActive(false), 1800)
          } else {
            const dur = summary.animClass === "seat-anim-danger" ? DANGER_ANIM_MS : OTHER_ANIM_MS
            triggerSeatAnimation(summary.seatIds, summary.animClass, dur)
            if (summary.soundName) {
              const vol = summary.soundName === "explodecake" ? 0.3 : 0.7
              playSFX(summary.soundName, vol, summary.soundDelay)
            }
            // Sprite overlays for bot actions — mirrors human-turn logic
            const cardType = playedCards[i]?.cardType
            const spritePath = cardType ? CARD_SPRITE[cardType] : undefined
            if (spritePath && summary.seatIds.length > 0) {
              if (cardType === "DISPLACEMENT" && summary.seatIds.length >= 2) {
                triggerSeatSprite([summary.seatIds[0]], spritePath, 900)
                setTimeout(() => triggerSeatSprite([summary.seatIds[1]], spritePath, 900), 450)
              } else if (cardType === "KNIFE" || cardType === "GUN") {
                triggerSeatSprite([summary.seatIds[0]], spritePath, 900)
                if (summary.seatIds.length >= 2) {
                  const targetId = summary.seatIds[1]
                  const preState = i === 0 ? latestState : (stateAfterFirstAction ?? latestState)
                  if (preState.board.find((p) => p.id === targetId)?.occupiedBy != null) {
                    setTimeout(() => triggerSeatSprite([targetId], ELIMINATION_SPRITE, 1400), 500)
                  }
                }
              } else if (cardType === "PASS_CAKE") {
                triggerSeatSprite([summary.seatIds[0]], spritePath, 900)
              } else if (cardType === "EXPLODE_CAKE") {
                triggerSeatSprite([summary.seatIds[0]], spritePath, 900, true)
                const preState = i === 0 ? latestState : (stateAfterFirstAction ?? latestState)
                const postState = stateAfterFirstAction && i === 0 ? stateAfterFirstAction : newState
                const eliminatedSeats = summary.seatIds.filter(
                  (id) => preState.board.find((p) => p.id === id)?.occupiedBy != null &&
                           postState.board.find((p) => p.id === id)?.occupiedBy === null
                )
                if (eliminatedSeats.length > 0) {
                  setTimeout(() => triggerSeatSprite(eliminatedSeats, ELIMINATION_SPRITE, 1400), 500)
                }
              } else {
                triggerSeatSprite(summary.seatIds, spritePath, 900)
              }
            }
          }
        }, i * ACTION_STAGGER)
      })
      playedCards.forEach((pc, i) => {
        setTimeout(() => showCenterCard(pc.cardType, pc.playerId), i * ACTION_STAGGER)
      })

      // Log entries don't need visual sync — write them immediately
      for (const entry of logEntryData) addLogEntry(entry)
      setBotLog((prev) => [...prev.slice(-80), ...logs])

      // Sequential board updates: after action 0 animation finishes, update the board
      // to show the result of action 0 so action 1's animation plays on the updated board.
      if (actionSummaries.length >= 2 && stateAfterFirstAction) {
        const anim0Dur = actionSummaries[0].animClass === "seat-anim-danger" ? DANGER_ANIM_MS : OTHER_ANIM_MS
        setTimeout(() => setGameState(stateAfterFirstAction), anim0Dur + 100)
      }

      // Final update after ALL animations finish
      const longestAnimMs = actionSummaries.length > 0
        ? (actionSummaries.length - 1) * ACTION_STAGGER + DANGER_ANIM_MS
        : 0

      setTimeout(() => {
        // Compute newly dealt cards for the next (human) player before updating state
        const prevHandIds = new Set(gameStateRef.current.players[nextPlayerIndex].hand.map((c) => c.id))
        setActiveBotPlayerId(null)
        setCurrentPlayerIndex(nextPlayerIndex)
        setGameState(newState)
        setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
        setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
        setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
        setSecondActionTaken(false)
        const newIds = newState.players[nextPlayerIndex].hand.filter((c) => !prevHandIds.has(c.id)).map((c) => c.id)
        if (newIds.length > 0) {
          setNewlyDealtCardIds(newIds)
          setTimeout(() => setNewlyDealtCardIds([]), 2500)
        }
        // Broadcast bot turn result (with action feedback) to other clients
        const botSyncActions: SyncAction[] = logEntryData.map((le, i) => ({
          playerId: le.playerId,
          cardType: playedCards[i]?.cardType ?? '',
          logEntry: le,
          seatAnim: actionSummaries[i]?.animClass
            ? { seatIds: actionSummaries[i].seatIds, animClass: actionSummaries[i].animClass }
            : undefined,
          sound: actionSummaries[i]?.soundName
            ? { name: actionSummaries[i].soundName, vol: actionSummaries[i].soundName === "explodecake" ? 0.3 : 0.7, delayMs: actionSummaries[i].soundDelay }
            : undefined,
        }))
        const botNextBreakdown = calculatePaymentBreakdown(newState.players[nextPlayerIndex], newState.board)
        const botNextPayment = botNextBreakdown.total
        const botPaymentLog: Omit<LogEntry, "id" | "highlighted"> | undefined = botNextPayment > 0
          ? { round: newState.turn, playerId: newState.players[nextPlayerIndex].id, playerName: newState.players[nextPlayerIndex].name, message: buildPaymentLog(newState.players[nextPlayerIndex].name, botNextPayment, botNextBreakdown), type: "payment" }
          : undefined
        onTurnEnd?.({ gameState: newState, currentPlayerIndex: nextPlayerIndex, seatingPlayerOrder: [], seatingCurrentIdx: 0, seatingQueue: {}, actions: botSyncActions, paymentLog: botPaymentLog })
      }, longestAnimMs)
    }, 4000)

    return () => { clearTimeout(timer); setActiveBotPlayerId(null) }
  }, [currentPlayerIndex, gameState.currentPhase, gameMode, gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Run CPU auto-seating in solo AND multiplayer (on the host who runs bots)
    // Hotseat has no bots so we skip it; shouldRunBots is false for non-host multiplayer clients
    if (!shouldRunBots || gameMode === "hotseat") return
    if (gameState.currentPhase !== "SEATING_SELECT_GANGSTER") return
    const currentSeatingPlayerId = seatingPlayerOrder[seatingCurrentIdx]
    if (!currentSeatingPlayerId || !botPlayerIds.includes(currentSeatingPlayerId)) return
    const gangsterIdsToPlace = seatingQueue[currentSeatingPlayerId] ?? []
    if (gangsterIdsToPlace.length === 0) return

    const timer = setTimeout(() => {
      let currentState = gameStateRef.current
      if (currentState.currentPhase !== "SEATING_SELECT_GANGSTER") return

      // Round-robin: place exactly ONE gangster this turn
      const currentQueue = { ...seatingQueue }
      const remaining = [...(currentQueue[currentSeatingPlayerId] ?? [])]
      if (remaining.length === 0) return

      const availableSeatIds = currentState.board.filter((p) => p.occupiedBy === null).map((p) => p.id)
      const decision = decideBotSeating(currentState, currentSeatingPlayerId, remaining, availableSeatIds)
      if (!decision) return
      currentState = seatGangsterOnBoard(currentState, decision.gangsterId, decision.seatId)
      currentQueue[currentSeatingPlayerId] = remaining.filter((id) => id !== decision.gangsterId)

      setSeatingQueue(currentQueue); setSeatingSelectedGangsterId(null); setTargetPositionId(null); setValidTargets([])

      const allDone = Object.values(currentQueue).every((q) => q.length === 0)
      if (allDone) {
        if (isInitialSeating) {
          const finalState = initializeGame(currentState); finalState.currentPhase = "SELECT_CARD"
          setIsInitialSeating(false); setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(0); setGameState(finalState)
        } else {
          const raidingPlayerIdx = currentState.players.findIndex((p) => p.id === seatingPlayerOrder[0])
          const nextIdx = getNextActivePlayerIndex(raidingPlayerIdx, currentState.players)
          currentState.currentPhase = "SELECT_CARD"; setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(nextIdx); setGameState(currentState)
        }
        return
      }

      // Round-robin advance: move to next player who still has gangsters
      const total = seatingPlayerOrder.length
      let nextIdx = (seatingCurrentIdx + 1) % total
      for (let skip = 0; skip < total; skip++) {
        if ((currentQueue[seatingPlayerOrder[nextIdx]] ?? []).length > 0) break
        nextIdx = (nextIdx + 1) % total
      }
      setSeatingCurrentIdx(nextIdx); currentState.currentPhase = "SEATING_SELECT_GANGSTER"; setGameState(currentState)
      onTurnEnd?.({ gameState: currentState, currentPlayerIndex: nextIdx, seatingPlayerOrder: seatingPlayerOrder, seatingCurrentIdx: nextIdx, seatingQueue: currentQueue, actions: [] })
    }, 400)

    return () => clearTimeout(timer)
  // seatingTotalRemaining ensures the effect retriggers when the same bot's turn
  // comes back around (seatingCurrentIdx unchanged but its queue shrunk by 1).
  }, [gameState.currentPhase, seatingCurrentIdx, seatingTotalRemaining, gameMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectDiscardCard = () => {
    if (gameState.currentPhase !== "SELECT_CARD" || secondActionTaken) return
    setSelectedCardId(null)
    setGameState({ ...gameState, currentPhase: "SELECT_DISCARD" })
  }

  const handleConfirmDiscard = () => {
    if (gameState.currentPhase !== "SELECT_DISCARD" || !selectedCardId) return
    handleDiscardCard(selectedCardId)
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
    endTurn(newGameState, [])
  }

  const handleSelectCard = (cardId: string) => {
    if (gameOver) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const card = currentPlayer.hand.find((c) => c.id === cardId)
    if (!card) return

    // Eliminated players (no alive gangsters) cannot play any card
    const hasAliveGangsters = currentPlayer.gangsters.some((g) => g.position !== null)
    if (!hasAliveGangsters && gameState.currentPhase !== "SELECT_DISCARD") return

    if (gameState.currentPhase === "SELECT_DISCARD") { setSelectedCardId(cardId); return }
    if (gameState.currentPhase === "SELECT_CARD" && !isCardPlayable(gameState, currentPlayer.id, cardId)) {
      return
    }
    setSelectedCardId(cardId)

    if (gameState.currentPhase === "SECOND_DISPLACEMENT") {
      if (card.type !== "DISPLACEMENT") { return }
      const vg = getValidGangstersForCard(gameState, currentPlayer.id, "DISPLACEMENT")
      setValidGangsters(vg)
      if (vg.length === 0) { return }
      setGameState({ ...gameState, currentPhase: "SELECT_GANGSTER" })
      setSecondActionTaken(true)
      return
    }

    if (gameState.currentPhase === "SELECT_CARD") {
      if (card.type === "EXPLODE_CAKE") {
        const vc = getValidCakesForExploding(gameState); setValidCakes(vc)
        if (vc.length === 0) { return }
        if (vc.length === 1) { handleSelectCake(vc[0], cardId) } else { setGameState({ ...gameState, currentPhase: "SELECT_CAKE" }) }
        return
      }
      if (card.type === "PASS_CAKE") {
        const vc = getValidCakesForPassing(gameState); setValidCakes(vc)
        if (vc.length === 0) { return }
        if (vc.length === 1) { handleSelectCake(vc[0], cardId) } else { setGameState({ ...gameState, currentPhase: "SELECT_CAKE" }) }
        return
      }
      if (card.type === "SLEEPING_PILLS") {
        const targets = getValidPillTargets(gameState, currentPlayer.id, [])
        if (targets.length === 0) { return }
        setSelectedCardId(cardId); setPillsApplied(0); setPendingPillTargetIds([])
        if (targets.length === 1) {
          const autoTarget = [targets[0]]; setPendingPillTargetIds(autoTarget); setPillsApplied(1)
          const nextTargets = getValidPillTargets(gameState, currentPlayer.id, autoTarget)
          setValidPillTargets(nextTargets); setGameState({ ...gameState, currentPhase: "SELECT_PILL_TARGET_2" })
        } else { setValidPillTargets(targets); setGameState({ ...gameState, currentPhase: "SELECT_PILL_TARGET_1" }) }
        return
      }
      if (card.type === "POLICE_RAID") {
        setSelectedCardId(cardId); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
        return
      }
      if (card.type === "ORDER_CAKE") {
        const vp = getValidCakePositions(gameState); setValidTargets(vp)
        if (vp.length === 0) { return }
        setGameState({ ...gameState, currentPhase: "SELECT_TARGET" }); return
      }

      const vg = getValidGangstersForCard(gameState, currentPlayer.id, card.type)
      setValidGangsters(vg)
      if (vg.length === 0) { return }
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
      if (vd.length === 0) { return }
    }
  }

  /** Direct cake click — allows selecting a specific cake when multiple occupy the same seat */
  const handleDirectCakeClick = (cakeId: string) => {
    if (gameOver || !selectedCardId) return
    if (gameState.currentPhase === "SELECT_CAKE") {
      const validForCard = selectedCardId
        ? (gameState.players[currentPlayerIndex].hand.find((c) => c.id === selectedCardId)?.type === "PASS_CAKE"
            ? getValidCakesForPassing(gameState)
            : getValidCakesForExploding(gameState))
        : []
      if (validForCard.includes(cakeId)) handleSelectCake(cakeId)
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

    if (targets.length === 0) { return }

    // Auto-confirm when there's only one possible target
    if (card.type === "GUN" && targets.length === 1) {
      setTargetPositionId(targets[0])
      setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
      return
    }
    if (card.type === "KNIFE" && targets.length === 1) {
      const gangster = currentPlayer.gangsters[gangsterIndex]
      const pos = gameState.board.find((p) => p.id === gangster.position)
      if (pos) {
        const dir: "left" | "right" = pos.leftId === targets[0] ? "left" : "right"
        setSelectedDirection(dir)
        setTargetPositionId(targets[0])
        setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
        return
      }
    }

    setGameState({ ...gameState, currentPhase: "SELECT_TARGET" })
  }

  const handleDragDrop = (fromPositionId: number, toPositionId: number) => {
    if (gameOver || !selectedCardId) return
    const currentPlayer = gameState.players[currentPlayerIndex]
    const card = currentPlayer.hand.find((c) => c.id === selectedCardId)
    if (!card || card.type !== "DISPLACEMENT") return
    const gangsterIndex = currentPlayer.gangsters.findIndex((g) => g.position === fromPositionId)
    if (gangsterIndex === -1 || !validGangsters.includes(gangsterIndex)) return
    const targets = getValidDisplacementPositions(gameState)
    if (!targets.includes(toPositionId)) return
    setSelectedGangsterIndex(gangsterIndex)
    setValidTargets(targets)
    setTargetPositionId(toPositionId)
    setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
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
        }
        return
      }
      if (card.type === "DISPLACEMENT" && selectedGangsterIndex !== null) {
        if (position.occupiedBy === null && validTargets.includes(positionId)) {
          setTargetPositionId(positionId); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" })
        }
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
      if (!validDirections.includes(direction)) { return }
      setSelectedDirection(direction); setGameState({ ...gameState, currentPhase: "CONFIRM_ACTION" }); return
    }
    if (card.type === "KNIFE" && selectedGangsterIndex !== null) {
      const gangster = currentPlayer.gangsters[selectedGangsterIndex]
      if (!gangster || gangster.position === null) return
      const position = gameState.board.find((pos) => pos.id === gangster.position)
      if (!position) return
      const targetPosId = direction === "left" ? position.leftId : position.rightId
      if (!validTargets.includes(targetPosId)) { return }
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
      const policeRaidLogEntry: Omit<LogEntry, "id" | "highlighted"> = { round: gameState.turn, playerId: currentPlayer.id, playerName: currentPlayer.name, message: `${currentPlayer.name} triggers Police Raid — all gangsters cleared! Re-seating begins.`, type: "system" }
      addLogEntry(policeRaidLogEntry)
      // Broadcast immediately so other clients enter seating mode at the same time
      onTurnEnd?.({ gameState: newGameState, currentPlayerIndex: currentPlayerIndex, seatingPlayerOrder: rotated, seatingCurrentIdx: 0, seatingQueue: queue, actions: [{ playerId: currentPlayer.id, cardType: 'POLICE_RAID', logEntry: policeRaidLogEntry }] })
      setGameState(newGameState); return
    }

    if (card.type === "ORDER_CAKE") { if (targetPositionId) action.targetPositionId = targetPositionId }
    else if (card.type === "PASS_CAKE") { if (newGameState.selectedCakeId && selectedDirection) { action.cakeId = newGameState.selectedCakeId; action.direction = selectedDirection } }
    else if (card.type === "EXPLODE_CAKE") { if (newGameState.selectedCakeId) action.cakeId = newGameState.selectedCakeId }
    else if (card.type === "SLEEPING_PILLS") { action.pillTargetGangsterIds = pendingPillTargetIds }
    else if (selectedGangsterIndex !== null) {
      action.gangsterId = selectedGangsterIndex
      if (card.type === "KNIFE" && selectedDirection) action.direction = selectedDirection
      else if (card.type === "DISPLACEMENT" && targetPositionId) action.targetPositionId = targetPositionId
    } else { return }

    const feedback = computeActionSeats(action, gameState)
    const feedbackDur = feedback.animClass === "seat-anim-danger" ? 2500 : 1200
    triggerSeatAnimation(feedback.seatIds, feedback.animClass, feedbackDur)
    if (feedback.soundName) {
      const vol = feedback.soundName === "explodecake" ? 0.3 : 0.7
      playSFX(feedback.soundName, vol, feedback.soundDelay)
    }

    // Sprite overlays — action sprite on attacker/source, elimination sprite on victim
    const spritePath = CARD_SPRITE[card.type]
    if (spritePath && feedback.seatIds.length > 0) {
      if (card.type === "DISPLACEMENT" && feedback.seatIds.length >= 2) {
        triggerSeatSprite([feedback.seatIds[0]], spritePath, 900)
        setTimeout(() => triggerSeatSprite([feedback.seatIds[1]], spritePath, 900), 450)
      } else if (card.type === "KNIFE" || card.type === "GUN") {
        // Action sprite on attacker; schedule elimination sprite on victim if occupied
        triggerSeatSprite([feedback.seatIds[0]], spritePath, 900)
        if (feedback.seatIds.length >= 2 && gameState.board.find((p) => p.id === feedback.seatIds[1])?.occupiedBy != null) {
          setTimeout(() => triggerSeatSprite([feedback.seatIds[1]], ELIMINATION_SPRITE, 1400), 500)
        }
      } else if (card.type === "PASS_CAKE") {
        triggerSeatSprite([feedback.seatIds[0]], spritePath, 900)
      } else if (card.type === "EXPLODE_CAKE") {
        // Explosion sprite on center cake seat only; blast radius is covered by seat animation
        triggerSeatSprite([feedback.seatIds[0]], spritePath, 900, true)
      } else {
        triggerSeatSprite(feedback.seatIds, spritePath, 900)
      }
    }

    const preActionState = newGameState
    try { newGameState = performAction(newGameState, action) }
    catch (err) { return }

    // Elimination sprite for EXPLODE_CAKE and SLEEPING_PILLS (overdose) kills
    if (card.type === "EXPLODE_CAKE" || card.type === "SLEEPING_PILLS") {
      const eliminatedSeats = preActionState.board
        .filter((pos) => pos.occupiedBy !== null && newGameState.board.find((p) => p.id === pos.id)?.occupiedBy === null)
        .map((pos) => pos.id)
      if (eliminatedSeats.length > 0) {
        setTimeout(() => triggerSeatSprite(eliminatedSeats, ELIMINATION_SPRITE, 1400), 500)
      }
    }

    const actionLogEntry: Omit<LogEntry, "id" | "highlighted"> = {
      round: gameState.turn,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      message: buildActionLog(action, preActionState, newGameState),
      type: "action",
    }
    addLogEntry(actionLogEntry)

    showCenterCard(card.type, currentPlayer.id)

    const currentSyncAction: SyncAction = {
      playerId: currentPlayer.id,
      cardType: card.type,
      logEntry: actionLogEntry,
      seatAnim: feedback.animClass ? { seatIds: feedback.seatIds, animClass: feedback.animClass } : undefined,
      spriteAnim: spritePath && feedback.seatIds.length > 0 ? { seatIds: feedback.seatIds, imagePath: spritePath } : undefined,
      sound: feedback.soundName ? { name: feedback.soundName, vol: feedback.soundName === "explodecake" ? 0.3 : 0.7, delayMs: feedback.soundDelay } : undefined,
    }

    setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
    setValidCakes([]); setValidDirections([]); setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
    newGameState.selectedCakeId = undefined

    if (secondActionTaken) {
      const allActions = [firstActionRef.current, currentSyncAction].filter((a): a is SyncAction => a !== null)
      firstActionRef.current = null
      endTurn(newGameState, allActions)
      return
    }

    const hasDisplacementCard = hasCardOfType(newGameState.players[currentPlayerIndex], "DISPLACEMENT")
    const hasEmptySeats = newGameState.board.some((p) => p.occupiedBy === null)
    if (hasDisplacementCard && hasEmptySeats) {
      firstActionRef.current = currentSyncAction
      newGameState.currentPhase = "SECOND_DISPLACEMENT"; setGameState(newGameState)
    } else {
      firstActionRef.current = null
      endTurn(newGameState, [currentSyncAction])
    }
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
    // In multiplayer, only the player whose turn it is can select gangsters
    if (localPlayerId && currentSeatingPlayerId !== localPlayerId) return
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

    const allDone = Object.values(newQueue).every((q) => q.length === 0)
    if (allDone) {
      if (isInitialSeating) {
        const finalState = initializeGame(newGameState); finalState.currentPhase = "SELECT_CARD"
        setIsInitialSeating(false); setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(0); setGameState(finalState)
        onTurnEnd?.({ gameState: finalState, currentPlayerIndex: 0, seatingPlayerOrder: [], seatingCurrentIdx: 0, seatingQueue: {}, actions: [] })
      } else {
        const raidingPlayerIdx = newGameState.players.findIndex((p) => p.id === seatingPlayerOrder[0])
        const nextIdx = getNextActivePlayerIndex(raidingPlayerIdx, newGameState.players)
        newGameState.currentPhase = "SELECT_CARD"; setSeatingQueue({}); setSeatingPlayerOrder([]); setCurrentPlayerIndex(nextIdx); setGameState(newGameState)
        onTurnEnd?.({ gameState: newGameState, currentPlayerIndex: nextIdx, seatingPlayerOrder: [], seatingCurrentIdx: 0, seatingQueue: {}, actions: [] })
      }
      return
    }
    // Round-robin: always advance to next player after placing one gangster
    const total = seatingPlayerOrder.length
    let nextIdx = (seatingCurrentIdx + 1) % total
    for (let skip = 0; skip < total; skip++) {
      if ((newQueue[seatingPlayerOrder[nextIdx]] ?? []).length > 0) break
      nextIdx = (nextIdx + 1) % total
    }
    setSeatingCurrentIdx(nextIdx); newGameState.currentPhase = "SEATING_SELECT_GANGSTER"; setGameState(newGameState)
    onTurnEnd?.({ gameState: newGameState, currentPlayerIndex: nextIdx, seatingPlayerOrder: seatingPlayerOrder, seatingCurrentIdx: nextIdx, seatingQueue: newQueue, actions: [] })
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
  }

  const handleSkipSecondDisplacement = () => {
    const acts = firstActionRef.current ? [firstActionRef.current] : []
    firstActionRef.current = null
    endTurn(gameState, acts)
  }

  const endTurn = (currentGameState: GameState, actions: SyncAction[] = []) => {
    const stateAfterWakeup = wakeUpSleepingGangsters(currentGameState, currentGameState.players[currentPlayerIndex].id)
    const prevHandIds = new Set(stateAfterWakeup.players.map((p) => p.hand.map((c) => c.id)).flat())
    const newGameState = dealCards(stateAfterWakeup)
    const nextPlayerIndex = getNextActivePlayerIndex(currentPlayerIndex, newGameState.players)

    // Highlight cards that were just drawn for the next player
    const nextPlayer = newGameState.players[nextPlayerIndex]
    const newIds = nextPlayer.hand.filter((c) => !prevHandIds.has(c.id)).map((c) => c.id)
    if (newIds.length > 0) {
      setNewlyDealtCardIds(newIds)
      setTimeout(() => setNewlyDealtCardIds([]), 2500)
    }

    setCurrentPlayerIndex(nextPlayerIndex)
    if (nextPlayerIndex <= currentPlayerIndex) newGameState.turn += 1
    newGameState.currentPhase = "SELECT_CARD"; newGameState.selectedCakeId = undefined
    setSelectedCardId(null); setSelectedGangsterIndex(null); setSelectedDirection(null); setTargetPositionId(null)
    setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
    setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([]); setSecondActionTaken(false)
    setGameState(newGameState)

    // Pre-compute next player's collection so receiving clients can replay the log
    // in the correct order (after action logs) instead of firing it synchronously
    const nextBreakdown = calculatePaymentBreakdown(newGameState.players[nextPlayerIndex], newGameState.board)
    const nextPayment = nextBreakdown.total
    const paymentLogEntry: Omit<LogEntry, "id" | "highlighted"> | undefined = nextPayment > 0
      ? { round: newGameState.turn, playerId: newGameState.players[nextPlayerIndex].id, playerName: newGameState.players[nextPlayerIndex].name, message: buildPaymentLog(newGameState.players[nextPlayerIndex].name, nextPayment, nextBreakdown), type: "payment" }
      : undefined

    // Broadcast state to other clients in multiplayer
    onTurnEnd?.({ gameState: newGameState, currentPlayerIndex: nextPlayerIndex, seatingPlayerOrder: [], seatingCurrentIdx: 0, seatingQueue: {}, actions, paymentLog: paymentLogEntry })
  }

  const restartGame = () => {
    const newGameState = getInitialState()
    setGameState(newGameState); setCurrentPlayerIndex(0); setSelectedGangsterIndex(null); setSelectedCardId(null)
    setSelectedDirection(null); setTargetPositionId(null); setGameOver(false)
    setValidGangsters([]); setValidTargets([]); setValidCakes([]); setValidDirections([])
    setPillsApplied(0); setPendingPillTargetIds([]); setValidPillTargets([])
    setFinalStandings([]); setSecondActionTaken(false); setBotLog([]); setSeatAnimations([]); setPoliceRaidActive(false); setLogEntries([]); setActiveBotPlayerId(null); setCenterCard(null); setNewlyDealtCardIds([]); setSeatSpriteOverlaysLarge({})
    setSeatingSelectedGangsterId(null); setSeatingCurrentIdx(0)
    if (seatingType === "manual") {
      const order = newGameState.players.map((p) => p.id)
      const queue: Record<string, string[]> = {}
      for (const p of newGameState.players) queue[p.id] = p.gangsters.map((g) => g.id)
      setSeatingPlayerOrder(order); setSeatingQueue(queue); setIsInitialSeating(true)
    } else { setSeatingPlayerOrder([]); setSeatingQueue({}); setIsInitialSeating(false) }
  }

  const canPlaySecondDisplacement = hasCardOfType(gameState.players[currentPlayerIndex], "DISPLACEMENT")
  const selectedGangster = selectedGangsterIndex !== null ? gameState.players[currentPlayerIndex].gangsters[selectedGangsterIndex] : null
  const selectedCard = selectedCardId ? gameState.players[currentPlayerIndex].hand.find((c) => c.id === selectedCardId) || null : null
  const selectedCake = gameState.selectedCakeId ? gameState.cakes.find((c) => c.id === gameState.selectedCakeId) || null : null

  // Lock body scroll while game is active
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const { t } = useLang()
  const PLAYER_COLORS: Record<string, string> = {
    player1: '#ef4444', player2: '#3b82f6', player3: '#facc15',
    player4: '#22c55e', player5: '#f97316', player6: '#a855f7',
  }
  const RANK_LABELS = [t('rank.1'), t('rank.2'), t('rank.3'), t('rank.4'), t('rank.5'), t('rank.6')]

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-[#2B1710] to-[#3D2314]">
      {policeRaidActive && (
        <div className="fixed inset-0 pointer-events-none police-raid-overlay" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.35), rgba(59,130,246,0.35))", zIndex: 9999 }} />
      )}

      {/* ── Final Results Modal ──────────────────────────────────────────────── */}
      {gameOver && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md flex flex-col gap-6 p-8 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, #0d0402 0%, #1a0c06 100%)',
              border: '1px solid #C9A84C66',
              boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,168,76,0.15)',
            }}
          >
            {/* Title */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.4em] font-serif mb-1" style={{ color: '#9b1c1c' }}>
                {t('results.subtitle')}
              </p>
              <h2 className="text-3xl font-serif uppercase tracking-widest" style={{ color: '#C9A84C' }}>
                {t('results.title')}
              </h2>
            </div>

            {/* Rankings */}
            <div className="flex flex-col gap-2">
              {finalStandings.map((standing, i) => {
                const playerId = gameState.players.find((p) => p.name === standing.player)?.id ?? ''
                const color = PLAYER_COLORS[playerId] ?? '#9b7060'
                const isWinner = i === 0
                return (
                  <div
                    key={standing.rank}
                    className="flex items-center gap-4 px-4 py-3 rounded"
                    style={{
                      background: isWinner ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isWinner ? '#C9A84C55' : '#3f151522'}`,
                    }}
                  >
                    <span
                      className="w-8 text-center text-sm font-serif font-bold uppercase tracking-wide flex-shrink-0"
                      style={{ color: isWinner ? '#C9A84C' : '#6b4c2a' }}
                    >
                      {RANK_LABELS[i] ?? `${i + 1}.`}
                    </span>
                    <span
                      className="flex-1 font-serif uppercase tracking-wider text-base"
                      style={{ color }}
                    >
                      {standing.player}
                    </span>
                    {standing.aliveGangsters !== undefined && standing.aliveGangsters > 0 && (
                      <span className="text-xs font-serif" style={{ color: '#6b4c2a' }}>
                        {t('results.alive', { count: String(standing.aliveGangsters) })}
                      </span>
                    )}
                    <span
                      className="font-serif font-bold text-base flex-shrink-0"
                      style={{ color: isWinner ? '#C9A84C' : '#9b7060' }}
                    >
                      ${standing.money.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (gameMode === 'multiplayer') {
                    const localName = localPlayerIndex !== undefined ? gameState.players[localPlayerIndex]?.name : gameState.players[currentPlayerIndex]?.name
                    onAbandon?.('quit', localName ?? 'A player')
                  }
                  onReturnToHome()
                }}
                className="flex-1 py-3 rounded text-sm font-serif uppercase tracking-widest transition-colors"
                style={{ background: '#3f1515', color: '#C9A84C', border: '1px solid #C9A84C44' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#5a1f1f' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#3f1515' }}
              >
                {t('results.new_game')}
              </button>
              <button
                onClick={() => {
                  if (gameMode === 'multiplayer') {
                    const localName = localPlayerIndex !== undefined ? gameState.players[localPlayerIndex]?.name : gameState.players[currentPlayerIndex]?.name
                    onAbandon?.('restart', localName ?? 'A player')
                  }
                  restartGame()
                }}
                className="flex-1 py-3 rounded text-sm font-serif uppercase tracking-widest transition-colors"
                style={{ background: '#1a2a1a', color: '#4ade80', border: '1px solid #4ade8044' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#22382a' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1a2a1a' }}
              >
                {t('results.restart')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <TopPanel
        onRestart={() => setConfirmAction('restart')}
        onNewGame={() => setConfirmAction('quit')}
      />
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-sm flex flex-col gap-5 p-7 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, #0d0402 0%, #1a0c06 100%)',
              border: '1px solid #C9A84C66',
              boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,168,76,0.15)',
            }}
          >
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.4em] font-serif mb-1" style={{ color: '#9b1c1c' }}>
                {confirmAction === 'restart' ? t('confirm.restart.sub') : t('confirm.leave.sub')}
              </p>
              <h2 className="text-2xl font-serif uppercase tracking-widest" style={{ color: '#C9A84C' }}>
                {confirmAction === 'restart' ? t('confirm.restart.title') : t('confirm.leave.title')}
              </h2>
            </div>
            <p className="text-sm text-center leading-relaxed" style={{ color: '#a07850' }}>
              {gameMode === 'multiplayer'
                ? t('confirm.mp.msg')
                : confirmAction === 'restart'
                  ? t('confirm.restart.msg')
                  : t('confirm.leave.msg')
              }
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  const currentName = gameState.players[currentPlayerIndex]?.name ?? 'A player'
                  if (gameMode === 'multiplayer') onAbandon?.(confirmAction, currentName)
                  if (confirmAction === 'restart') restartGame()
                  else onReturnToHome()
                  setConfirmAction(null)
                }}
                className="flex-1 py-2.5 rounded text-sm font-serif uppercase tracking-widest transition-colors"
                style={{ background: '#3f1515', color: '#C9A84C', border: '1px solid #C9A84C44' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#5a1f1f' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#3f1515' }}
              >
                {confirmAction === 'restart' ? t('confirm.restart.btn') : t('confirm.leave.btn')}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded text-sm font-serif uppercase tracking-widest transition-colors"
                style={{ background: '#1a2a1a', color: '#C9A84C', border: '1px solid #C9A84C44' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#243a24' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1a2a1a' }}
              >
                {t('confirm.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
              {/* Game Board */}
              <div className="lg:w-[75%] flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 bg-gradient-to-b from-[#3D2314] to-[#2B1710] rounded-lg flex items-center overflow-hidden">
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
                    {/* CPU turn indicator — shows which bot is playing */}
                    {activeBotPlayerId && (() => {
                      const botPlayer = gameState.players.find((p) => p.id === activeBotPlayerId)
                      const colorMap: Record<string, string> = { player1: "#ef4444", player2: "#3b82f6", player3: "#facc15", player4: "#22c55e", player5: "#f97316", player6: "#a855f7" }
                      const color = colorMap[activeBotPlayerId] ?? "#9ca3af"
                      return (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-sm" style={{ border: `1.5px solid ${color}` }}>
                          <span className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-white font-semibold text-sm leading-none">{botPlayer?.name ?? "CPU"}</span>
                          <span className="text-zinc-400 text-xs leading-none">is playing…</span>
                        </div>
                      )
                    })()}

                    {/* Card play center animation */}
                    {centerCard && (() => {
                      const colorMap: Record<string, string> = { player1: "#ef4444", player2: "#3b82f6", player3: "#facc15", player4: "#22c55e", player5: "#f97316", player6: "#a855f7" }
                      const color = colorMap[centerCard.playerId] ?? "#9ca3af"
                      const imgSrc = `/images/cards/${centerCard.cardType.toLowerCase().replace(/_/g, "")}.png`
                      return (
                        <div
                          key={`${centerCard.playerId}-${centerCard.cardType}`}
                          className="card-play-flash rounded-md overflow-hidden shadow-2xl z-30"
                          style={{ border: `3px solid ${color}`, width: "10%", aspectRatio: "5/7" }}
                        >
                          <img src={imgSrc} alt={centerCard.cardType} className="w-full h-full object-cover" draggable={false} />
                        </div>
                      )
                    })()}

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
                        spriteOverlay={seatSpriteOverlays[position.id]}
                        spriteLarge={seatSpriteOverlaysLarge[position.id] ?? false}
                        onCakeClick={gameState.currentPhase === "SELECT_CAKE" ? handleDirectCakeClick : undefined}
                        draggable={
                          gameState.currentPhase === "SELECT_GANGSTER" &&
                          selectedCardId !== null &&
                          (() => { const card = gameState.players[currentPlayerIndex].hand.find(c => c.id === selectedCardId); return card?.type === "DISPLACEMENT" })() &&
                          validGangsters.some((idx) => gameState.players[currentPlayerIndex].gangsters[idx].position === position.id)
                        }
                        onDragStart={() => setDraggingFromSeatId(position.id)}
                        onDragOver={(e) => {
                          if (draggingFromSeatId !== null) e.preventDefault()
                        }}
                        onDrop={() => {
                          if (draggingFromSeatId !== null) {
                            handleDragDrop(draggingFromSeatId, position.id)
                            setDraggingFromSeatId(null)
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="lg:w-[25%] flex flex-col min-h-0 overflow-hidden">
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
                humanPlayer={
                  localPlayerIndex !== undefined
                    ? gameState.players[localPlayerIndex]       // multiplayer: always local player
                    : gameMode === "solo"
                      ? gameState.players.find((p) => p.id === "player1")  // solo: player1
                      : undefined
                }
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
                onConfirmDiscard={handleConfirmDiscard}
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
                newlyDealtCardIds={newlyDealtCardIds}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
