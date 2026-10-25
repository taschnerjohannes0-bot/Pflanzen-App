import { useRef, useState } from 'react'
import { addPhoto } from '../db/db'
import type { CropRect } from '../db/types'
import { resizeImage } from '../lib/image'
import { FrameEditor } from './FrameEditor'

interface Pending {
  blob: Blob
  takenAt: string
}

// Zwei versteckte Datei-Felder: eines öffnet direkt die Kamera, das andere die Galerie.
export function AddPhotoButtons({ plantId }: { plantId: number }) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [queue, setQueue] = useState<Pending[]>([])

  async function handleFiles(input: HTMLInputElement) {
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (files.length === 0) return
    setBusy(true)
    setError(undefined)
    try {
      const prepared: Pending[] = []
      for (const file of files) {
        // Bei Galeriebildern ist lastModified meist das Aufnahmedatum, bei Kamerafotos "jetzt".
        const takenAt = new Date(file.lastModified || Date.now()).toISOString()
        prepared.push({ blob: await resizeImage(file), takenAt })
      }
      setQueue(prepared)
    } catch {
      setError('Das Foto konnte nicht geladen werden.')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirm(crop: CropRect | null) {
    const [current, ...rest] = queue
    setQueue(rest)
    try {
      await addPhoto(plantId, current.blob, current.takenAt, crop)
    } catch {
      setError('Das Foto konnte nicht gespeichert werden.')
    }
  }

  return (
    <div className="photo-buttons">
      <button type="button" className="button button--primary" disabled={busy} onClick={() => cameraRef.current?.click()}>
        📷 Foto aufnehmen
      </button>
      <button type="button" className="button" disabled={busy} onClick={() => galleryRef.current?.click()}>
        🖼️ Aus Galerie
      </button>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFiles(e.currentTarget)} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.currentTarget)} />
      {busy && <p className="muted">Foto wird geladen …</p>}
      {error && <p className="error">{error}</p>}
      {queue.length > 0 && (
        <FrameEditor
          key={queue.length}
          photo={queue[0].blob}
          hint={queue.length > 1 ? `Rahmen um die Pflanze ziehen (noch ${queue.length} Fotos)` : undefined}
          onConfirm={handleConfirm}
          onCancel={() => setQueue((q) => q.slice(1))}
        />
      )}
    </div>
  )
}
