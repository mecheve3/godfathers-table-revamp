import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { router } from './routes'
import { UserProvider } from './context/UserContext'
import { MatchProvider } from './features/match/MatchContext'
import { AudioProvider } from './features/game/AudioContext'
import { LanguageProvider } from './context/LanguageContext'
import FeedbackButton from './components/FeedbackButton'

export default function App() {
  return (
    <LanguageProvider>
      <UserProvider>
        <MatchProvider>
          <AudioProvider>
            <RouterProvider router={router} />
            <Toaster position="top-center" richColors />
            <FeedbackButton />
          </AudioProvider>
        </MatchProvider>
      </UserProvider>
    </LanguageProvider>
  )
}