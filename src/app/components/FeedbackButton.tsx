import { MessageSquare } from 'lucide-react'
import { track } from '@/lib/analytics'

const FEEDBACK_URL = 'https://forms.gle/oUbCwUqneq1Z9jF16'

export default function FeedbackButton() {
  const handleClick = () => {
    track('feedback_clicked')
    window.open(FEEDBACK_URL, '_blank', 'noopener,noreferrer')
  }

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