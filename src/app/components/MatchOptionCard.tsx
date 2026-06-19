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
          ? 'linear-gradient(180deg, #1a1208 0%, #0f0a02 100%)'
          : 'linear-gradient(180deg, #16100a 0%, #0f0a02 100%)',
        border: selected ? '1px solid #c79a4a' : '1px solid rgba(199,154,74,0.18)',
        boxShadow: selected
          ? '0 0 18px rgba(199,154,74,0.30), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* bottom accent bar on selection */}
      {selected && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: '#c79a4a' }}
        />
      )}

      <span
        className={`${titleSize} font-serif font-black leading-tight text-center px-2 break-words`}
        style={{
          color: selected ? '#e9cd86' : '#7a5c28',
          textShadow: selected ? '0 0 14px rgba(233,205,134,0.45)' : 'none',
        }}
      >
        {title}
      </span>

      {subtitle && (
        <span
          className="text-xl font-serif uppercase tracking-wider mt-1"
          style={{ color: selected ? '#c79a4a' : '#4a3518' }}
        >
          {subtitle}
        </span>
      )}

      {children}
    </motion.button>
  )
}
