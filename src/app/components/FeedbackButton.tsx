import { useSyncExternalStore } from 'react'
import { MessageSquare } from 'lucide-react'
import { track } from '@/lib/analytics'
import { router } from '../routes'
import { FEEDBACK_URL } from '../constants'

// This button is mounted as a sibling of <RouterProvider> in App.tsx (so it can be
// hidden globally with one guard rather than wired into every page), which puts it
// outside the router's React context — so `useLocation()` isn't available here.
// Read the current path directly off the router instance instead.
function usePathname() {
  return useSyncExternalStore(
    (onChange) => router.subscribe(onChange),
    () => router.state.location.pathname,
  )
}

export default function FeedbackButton() {
  const pathname = usePathname()
  const handleClick = () => {
    track('feedback_clicked')
    window.open(FEEDBACK_URL, '_blank', 'noopener,noreferrer')
  }

  // The game screen has its own top-right players icon (below the `lg` breakpoint) that
  // this fixed top-right button would otherwise sit on top of — it's reachable from the
  // in-game hamburger menu instead (see TopPanel.tsx).
  if (pathname === '/game') return null

  return (
    <button
      onClick={handleClick}
      title="Give feedback"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        border: '1px solid #333',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        opacity: 0.85,
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
    >
      <MessageSquare size={14} />
      Feedback
    </button>
  )
}