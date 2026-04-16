import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'

interface BackButtonProps {
  to?: string
  onClick?: () => void
  className?: string
}

export function BackButton({ to, onClick, className = '' }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) onClick()
    else if (to) navigate(to)
    else navigate(-1)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Go back"
      className={`absolute left-12 bottom-12 flex items-center gap-2 transition-opacity duration-200 hover:opacity-60 ${className}`}
      style={{ color: '#C9A84C' }}
    >
      <ArrowLeft className="w-9 h-9" strokeWidth={1.5} />
    </button>
  )
}
