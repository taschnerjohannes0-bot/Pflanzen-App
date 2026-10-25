import { useRef, useState } from 'react'
import { addPhoto } from '../db/db'
import { resizeImage } from '../lib/image'

// Zwei versteckte Datei-Felder: eines öffnet direkt die Kamera, das andere die Galerie.
export function AddPhotoButtons({ plantId }: { plantId: number }) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function handleFiles(input: HTMLInputElement) {
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (files.length === 0) return
    setBusy(true)
    setError(undefined)
    try {
      for (const file of files) {
        // Bei Galeriebildern ist lastModified meist das Aufnahmedatum, bei Kamerafotos "jetzt".
        const takenAt = new Date(file.lastModified || Date.now()).toISOString()
        await addPhoto(plantId, await resizeImage(file), takenAt)
      }
    } catch {
      setError('Das Foto konnte nicht gespeichert werden.')
    } finally {
      setBusy(false)
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
      {busy && <p className="muted">Foto wird gespeichert …</p>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
