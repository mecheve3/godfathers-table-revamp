import { motion } from 'motion/react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  isLoading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      disabled={isDisabled}
      className={[
        'relative overflow-hidden transition-all duration-200',
        'border border-game-border',
        'font-serif uppercase tracking-widest text-base font-bold',
        isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-game-border-hi',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: variant === 'ghost'
          ? 'transparent'
          : 'linear-gradient(180deg, #1a0a04 0%, #0d0402 50%, #1a0a04 100%)',
        boxShadow: isDisabled ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 16px rgba(120,10,10,0.3)',
        color: '#C9A84C',
      }}
      {...props}
    >
      {/* hover glow */}
      {!isDisabled && (
        <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-red-900/10 pointer-events-none" />
      )}

      {isLoading ? (
        <span className="flex items-center justify-center gap-3 px-8 py-4">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading…
        </span>
      ) : (
        <span className="px-8 py-4 block">{children}</span>
      )}
    </motion.button>
  )
}
