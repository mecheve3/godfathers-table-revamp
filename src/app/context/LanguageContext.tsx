import { createContext, useContext, useState, type ReactNode } from 'react'
import en from '../../locales/en.json'
import es from '../../locales/es.json'

type Lang = 'en' | 'es'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType>(null!)

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem('lang') as Lang | null
    if (stored === 'en' || stored === 'es') return stored
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('lang', l) } catch { /* ignore */ }
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dict = lang === 'es' ? es : en
    let str = (dict as Record<string, string>)[key] ?? (en as Record<string, string>)[key]
    if (!str) { console.warn(`[i18n] Missing key: "${key}"`); return key }
    if (vars) Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
    })
    return str
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export const useLang = () => useContext(LanguageContext)
