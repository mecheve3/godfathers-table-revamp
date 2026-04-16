import { createBrowserRouter, redirect } from 'react-router'
import { FEATURES } from './features/auth/flags'

// Pages — active flow
import Landing from './pages/Landing'
import StartScreen from './pages/StartScreen'
import CreateMatch from './pages/CreateMatch'
import JoinMatch from './pages/JoinMatch'
import MatchLobby from './pages/MatchLobby'
import Game from './pages/Game'

// Pages — auth (disabled until AUTH_ENABLED = true)
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import EmailConfirmation from './pages/EmailConfirmation'

/** Redirect to /menu when auth is disabled. */
const authGuard = () => (!FEATURES.AUTH_ENABLED ? redirect('/menu') : null)

export const router = createBrowserRouter([
  // ── Entry ──────────────────────────────────────────────────────
  { path: '/', Component: Landing },

  // ── Auth (feature-flagged) ─────────────────────────────────────
  { path: '/login', loader: authGuard, Component: Login },
  { path: '/signup', loader: authGuard, Component: SignUp },
  { path: '/email-confirmation', loader: authGuard, Component: EmailConfirmation },

  // ── Active match flow ──────────────────────────────────────────
  { path: '/menu', Component: StartScreen },
  { path: '/create', Component: CreateMatch },
  { path: '/join', Component: JoinMatch },
  { path: '/lobby', Component: MatchLobby },
  { path: '/game', Component: Game },
])
