import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', style, onFocus, onBlur, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      <input
        ref={ref}
        className={[
          'stage-input h-14 px-5 font-serif text-xl tracking-widest',
          'transition-all duration-150 focus:outline-none',
          error ? 'ring-1 ring-red-500/40' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          background: 'linear-gradient(180deg, #0d0402 0%, #0f0602 100%)',
          border: error ? '1px solid #ef4444' : '1px solid #c79a4a',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          color: '#e9cd86',
          caretColor: '#e9cd86',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 0 2px rgba(199,154,74,0.20)'
          e.currentTarget.style.borderColor = '#e9cd86'
          onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)'
          e.currentTarget.style.borderColor = error ? '#ef4444' : '#c79a4a'
          onBlur?.(e)
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
