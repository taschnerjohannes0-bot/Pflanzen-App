import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/db'
import type { Photo } from '../db/types'
import { daysBetween, formatDate, formatDuration, formatShortDate } from '../lib/format'
import { navigate, routeHref } from '../lib/router'
import { useObjectUrl } from '../lib/useObjectUrl'

export function ComparePage({ id, a, b }: { id: number; a?: number; b?: number }) {
  const plant = useLiveQuery(() => db.plants.get(id), [id])
  const photos = useLiveQuery(() => db.photos.where('plantId').equals(id).sortBy('takenAt'), [id])
  const [showOriginal, setShowOriginal] = useState(false)

  if (!plant || !photos) return null

  // Standard: ältestes gegen neuestes Foto.
  const left = photos.find((p) => p.id === a) ?? photos[0]
  const right = photos.find((p) => p.id === b) ?? photos[photos.length - 1]

  function select(side: 'a' | 'b', photo: Photo) {
    const next = side === 'a' ? { a: photo.id!, b: right?.id } : { a: left?.id, b: photo.id! }
    navigate({ name: 'compare', id, ...next }, { replace: true })
  }

  const days = left && right ? daysBetween(left.takenAt, right.takenAt) : 0
  const heightDiff =
    left?.heightCm !== undefined && right?.heightCm !== undefined ? right.heightCm - left.heightCm : undefined

  return (
    <div className="compare">
      <header className="page-header">
        <a className="icon-button" href={routeHref({ name: 'plant', id })} aria-label="Zurück">
          ←
        </a>
        <h1>{plant.name}</h1>
        <button type="button" className="button button--small" onClick={() => setShowOriginal((v) => !v)}>
          {showOriginal ? 'Freigestellt' : 'Original'}
        </button>
      </header>

      {photos.length < 2 ? (
        <p className="muted">Für einen Vergleich braucht es mindestens zwei Fotos.</p>
      ) : (
        <>
          <div className="compare__summary">
            <div>
              <strong>{formatDuration(days)}</strong>
              <span>dazwischen</span>
            </div>
            <div>
              <strong>{heightDiff !== undefined ? `${heightDiff > 0 ? '+' : ''}${heightDiff} cm` : '–'}</strong>
              <span>Höhe</span>
            </div>
          </div>

          <div className="compare__pair">
            <CompareSide photo={left} showOriginal={showOriginal} label="Vorher" />
            <CompareSide photo={right} showOriginal={showOriginal} label="Nachher" />
          </div>

          <PhotoStrip title="Vorher wählen" photos={photos} selected={left} onSelect={(p) => select('a', p)} />
          <PhotoStrip title="Nachher wählen" photos={photos} selected={right} onSelect={(p) => select('b', p)} />
        </>
      )}
    </div>
  )
}

function CompareSide({ photo, showOriginal, label }: { photo: Photo; showOriginal: boolean; label: string }) {
  const blob = showOriginal ? photo.blob : (photo.cutout ?? photo.blob)
  const url = useObjectUrl(blob)
  const isCutout = blob === photo.cutout

  return (
    <figure className="compare__side">
      <div className="compare__image">
        {url && <img className={isCutout ? 'is-cutout' : undefined} src={url} alt={`${label}: ${formatDate(photo.takenAt)}`} />}
        <span className="compare__label">{label}</span>
      </div>
      <figcaption>
        <strong>{formatDate(photo.takenAt)}</strong>
        {photo.heightCm !== undefined && <span>{photo.heightCm} cm</span>}
        {photo.note && <span className="muted">{photo.note}</span>}
      </figcaption>
    </figure>
  )
}

function PhotoStrip({
  title,
  photos,
  selected,
  onSelect,
}: {
  title: string
  photos: Photo[]
  selected: Photo
  onSelect: (photo: Photo) => void
}) {
  return (
    <section className="strip">
      <h2>{title}</h2>
      <div className="strip__items">
        {photos.map((photo) => (
          <StripItem key={photo.id} photo={photo} active={photo.id === selected.id} onClick={() => onSelect(photo)} />
        ))}
      </div>
    </section>
  )
}

function StripItem({ photo, active, onClick }: { photo: Photo; active: boolean; onClick: () => void }) {
  const url = useObjectUrl(photo.cutout ?? photo.blob)
  return (
    <button type="button" className={`strip__item${active ? ' is-active' : ''}`} onClick={onClick} aria-pressed={active}>
      {url && <img className={photo.cutout ? 'is-cutout' : undefined} src={url} alt="" />}
      <span>{formatShortDate(photo.takenAt)}</span>
    </button>
  )
}
