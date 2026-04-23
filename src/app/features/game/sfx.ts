const SFX_PATH = "/sounds/sfx/"
let activeSounds = 0
const MAX_CONCURRENT = 3

/** Global toggle — checked before every play call */
export let sfxEnabled = true
export function setSfxEnabled(val: boolean) { sfxEnabled = val }

/**
 * Play a sound effect.
 * @param name   Filename without extension (e.g. "gun", "knife", "bank")
 * @param volume 0–1 (default 0.7)
 * @param delayMs Optional delay in ms before playing (default 0)
 * @param ext    File extension without dot (default "wav")
 */
export function playSFX(name: string, volume = 0.7, delayMs = 0, ext = "wav"): void {
  if (typeof window === "undefined") return

  const play = () => {
    if (!sfxEnabled) return
    if (activeSounds >= MAX_CONCURRENT) return
    const audio = new Audio(`${SFX_PATH}${name}.${ext}`)
    audio.volume = Math.max(0, Math.min(1, volume))
    activeSounds++
    audio.play().catch(() => {})
    audio.addEventListener("ended", () => { activeSounds-- }, { once: true })
    audio.addEventListener("error", () => { activeSounds-- }, { once: true })
  }

  if (delayMs > 0) {
    setTimeout(play, delayMs)
  } else {
    play()
  }
}
