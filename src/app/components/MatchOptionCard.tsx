import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface MatchOptionCardProps {
  title: string
  subtitle?: string
  selected?: boolean
  onClick: () => void
  children?: ReactNode
  className?: string
  /** Override the title font size class (default "text-5xl") — use for long translated strings */
  titleSize?: string
}

export function MatchOptionCard({
  title,
  subtitle,
  selected = false,
  onClick,
  children,
  className = '',
  titleSize = 'text-5xl',
}: MatchOptionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={[
        'relative flex flex-col items-center justify-center transition-all duration-150 select-none overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: selected
          ? 'linear-gradient(180deg, #3d0c0c 0%, #2a0808 100%)'
          : 'linear-gradient(180deg, #1a0a04 0%, #0f0602 100%)',
        border: selected ? '1px solid #b91c1c' : '1px solid #3f1515',
        boxShadow: selected
          ? '0 0 14px rgba(185,28,28,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* bottom accent bar on selection */}
      {selected && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-700" />
      )}

      <span
        className={`${titleSize} font-serif font-black leading-tight text-center px-2 break-words`}
        style={{
          color: selected ? '#C9A84C' : '#6b4c2a',
          textShadow: selected ? '0 0 12px rgba(201,168,76,0.5)' : 'none',
        }}
      >
        {title}
      </span>

      {subtitle && (
        <span
          className="text-xl font-serif uppercase tracking-wider mt-1"
          style={{ color: selected ? '#a87840' : '#4a3020' }}
        >
          {subtitle}
        </span>
      )}

      {children}
    </motion.button>
  )
}
