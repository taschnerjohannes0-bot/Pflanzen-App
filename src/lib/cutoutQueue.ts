import { useSyncExternalStore } from 'react'
import { db } from '../db/db'
import { cutOutPlant } from './cutout'

export interface CutoutState {
  activePhotoId?: number
  // Fortschritt beim ersten Laden des Modells (0–1), danach liegt es im Cache.
  download?: number
}

let state: CutoutState = {}
let running = false
const listeners = new Set<() => void>()

function setState(next: CutoutState) {
  state = next
  listeners.forEach((l) => l())
}

// Arbeitet alle Fotos mit Status "pending" nacheinander ab. Mehrfache Aufrufe sind harmlos.
export async function processPendingCutouts(): Promise<void> {
  if (running) return
  running = true
  try {
    for (;;) {
      const photo = await db.photos.filter((p) => p.cutoutStatus === 'pending').first()
      if (!photo) break
      setState({ activePhotoId: photo.id })
      try {
        const cutout = await cutOutPlant(photo.blob, photo.crop, (loaded, total) =>
          setState({ activePhotoId: photo.id, download: loaded / total }),
        )
        await db.photos.update(photo.id!, { cutout, cutoutStatus: 'done' })
      } catch (error) {
        console.error('Freistellen fehlgeschlagen', error)
        await db.photos.update(photo.id!, { cutoutStatus: 'failed' })
      }
    }
  } finally {
    running = false
    setState({})
  }
}

export function useCutoutState(): CutoutState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
