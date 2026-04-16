import type { ReactNode } from 'react'

/**
 * Full-screen dark gradient wrapper used by every game screen.
 * Provides the consistent Godfather's Table background.
 */
export function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full flex flex-col"
      style={{
        background:
          'linear-gradient(160deg, #1a0a04 0%, #2B1710 40%, #3D2314 70%, #1a0a04 100%)',
      }}
    >
      {children}
    </div>
  )
}

/** Decorative gold/red divider line. */
export function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-red-800/70" />
      <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-red-800/70" />
    </div>
  )
}

/** Gold serif heading used at the top of each screen. */
export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-center">
      <h2
        className="text-4xl font-black uppercase tracking-widest font-serif"
        style={{
          color: '#C9A84C',
          textShadow: '0 0 20px rgba(201,168,76,0.35), 0 2px 4px rgba(0,0,0,1)',
        }}
      >
        {children}
      </h2>
      <Divider />
    </div>
  )
}
