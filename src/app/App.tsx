import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { router } from './routes'
import { UserProvider } from './context/UserContext'
import { MatchProvider } from './features/match/MatchContext'
import { AudioProvider } from './features/game/AudioContext'

export default function App() {
  return (
    <UserProvider>
      <MatchProvider>
        <AudioProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors />
        </AudioProvider>
      </MatchProvider>
    </UserProvider>
  )
}
