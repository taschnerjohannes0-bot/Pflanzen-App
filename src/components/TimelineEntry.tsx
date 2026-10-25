import { useState } from 'react'
import { db, reframePhoto, retryCutout } from '../db/db'
import type { Photo } from '../db/types'
import { useCutoutState } from '../lib/cutoutQueue'
import { formatAgo, formatDate } from '../lib/format'
import { FrameEditor } from './FrameEditor'
import { PhotoEditDialog } from './PhotoEditDialog'
import { PhotoImage } from './PhotoImage'

export function TimelineEntry({ photo, heightDelta }: { photo: Photo; heightDelta?: number }) {
  const cutoutState = useCutoutState()
  const isActive = cutoutState.activePhotoId === photo.id
  const [reframing, setReframing] = useState(false)
  const [editing, setEditing] = useState(false)

  async function handleDelete() {
    if (confirm('Dieses Foto löschen?')) await db.photos.delete(photo.id!)
  }

  return (
    <li className="timeline__entry">
      <div className="timeline__date">
        <strong>{formatDate(photo.takenAt)}</strong>
        <span className="muted">{formatAgo(photo.takenAt)}</span>
      </div>
      <figure className="photo-tile">
        <div className="photo-tile__image">
          <PhotoImage photo={photo} alt={`Foto vom ${formatDate(photo.takenAt)}`} />
          {photo.cutoutStatus === 'pending' && (
            <span className="photo-tile__badge">
              {isActive && cutoutState.download !== undefined && cutoutState.download < 1
                ? `Lade Freisteller … ${Math.round(cutoutState.download * 100)} %`
                : isActive
                  ? 'Wird freigestellt …'
                  : 'Wartet …'}
            </span>
          )}
          {photo.cutoutStatus === 'failed' && (
            <button type="button" className="photo-tile__badge" onClick={() => retryCutout(photo)}>
              Freistellen fehlgeschlagen · erneut
            </button>
          )}
        </div>
        <figcaption>
          <span className="timeline__meta">
            {photo.heightCm !== undefined && (
              <span className="chip">
                {photo.heightCm} cm
                {heightDelta ? ` (${heightDelta > 0 ? '+' : ''}${heightDelta})` : ''}
              </span>
            )}
            {photo.note && <span className="timeline__note">{photo.note}</span>}
          </span>
          <span className="timeline__actions">
            <button type="button" className="link-button" onClick={() => setEditing(true)} aria-label="Foto bearbeiten">
              ✏️
            </button>
            <button type="button" className="link-button" onClick={() => setReframing(true)} aria-label="Freistellung anpassen">
              ✂️
            </button>
            <button type="button" className="link-button" onClick={handleDelete} aria-label="Foto löschen">
              ✕
            </button>
          </span>
        </figcaption>
      </figure>
      {editing && <PhotoEditDialog photo={photo} onClose={() => setEditing(false)} />}
      {reframing && (
        <FrameEditor
          photo={photo.blob}
          initial={photo.crop}
          onCancel={() => setReframing(false)}
          onConfirm={async (crop) => {
            setReframing(false)
            await reframePhoto(photo, crop)
          }}
        />
      )}
    </li>
  )
}
