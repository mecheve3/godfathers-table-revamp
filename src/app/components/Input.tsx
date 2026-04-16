import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      <input
        ref={ref}
        className={[
          'h-14 px-5 font-serif text-xl tracking-widest',
          'text-game-gold placeholder-game-text-muted',
          'border transition-all duration-150',
          'focus:outline-none focus:ring-1',
          error
            ? 'border-red-500 ring-red-500/40'
            : 'border-game-border focus:border-game-border-hi focus:ring-game-border-hi/40',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          background: 'linear-gradient(180deg, #0d0402 0%, #0f0602 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
        }}
        {...props}
      />
      {error && (
        <span className="text-red-400 text-sm ml-1">{error}</span>
      )}
    </div>
  )
)

Input.displayName = 'Input'
