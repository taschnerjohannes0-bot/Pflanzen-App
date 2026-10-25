import { type FormEvent, useState } from 'react'
import { db } from '../db/db'
import type { Photo } from '../db/types'
import { fromDateInput, toDateInput } from '../lib/format'

// Datum, Höhe und Notiz zu einem einzelnen Foto, damit sich der Verlauf vergleichen lässt.
export function PhotoEditDialog({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const [date, setDate] = useState(toDateInput(photo.takenAt))
  const [height, setHeight] = useState(photo.heightCm?.toString() ?? '')
  const [note, setNote] = useState(photo.note ?? '')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await db.photos.update(photo.id!, {
      takenAt: fromDateInput(date) ?? photo.takenAt,
      heightCm: height === '' ? undefined : Number(height),
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog plant-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h2>Foto bearbeiten</h2>
        <label>
          Aufgenommen am
          <input type="date" required value={date} onChange={(e) => setDate(e.currentTarget.value)} />
        </label>
        <label>
          Höhe der Pflanze an diesem Tag (cm)
          <input type="number" inputMode="decimal" min={0} value={height} onChange={(e) => setHeight(e.currentTarget.value)} />
        </label>
        <label>
          Notiz
          <textarea rows={3} placeholder="z. B. neues Blatt, umgetopft, gedüngt" value={note} onChange={(e) => setNote(e.currentTarget.value)} />
        </label>
        <div className="dialog__actions">
          <button type="button" className="button" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="button button--primary">
            Speichern
          </button>
        </div>
      </form>
    </div>
  )
}
