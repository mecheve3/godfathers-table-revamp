import { createContext, useContext, useState, type ReactNode } from 'react'
import type { MatchConfig } from './types'

interface MatchContextType {
  config: MatchConfig | null
  setConfig: (config: MatchConfig) => void
  clearConfig: () => void
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

export function MatchProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<MatchConfig | null>(null)

  return (
    <MatchContext.Provider
      value={{
        config,
        setConfig: setConfigState,
        clearConfig: () => setConfigState(null),
      }}
    >
      {children}
    </MatchContext.Provider>
  )
}

export function useMatch() {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used within MatchProvider')
  return ctx
}
