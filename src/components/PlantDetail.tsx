import { useLiveQuery } from 'dexie-react-hooks'
import { db, deletePlant, retryCutout } from '../db/db'
import type { Photo, Plant } from '../db/types'
import { formatDate } from '../lib/format'
import { navigate, routeHref } from '../lib/router'
import { useCutoutState } from '../lib/cutoutQueue'
import { AddPhotoButtons } from './AddPhotoButtons'
import { PhotoImage } from './PhotoImage'

export function PlantDetail({ id }: { id: number }) {
  const plant = useLiveQuery(() => db.plants.get(id), [id])
  const photos = useLiveQuery(
    () => db.photos.where('plantId').equals(id).reverse().sortBy('takenAt'),
    [id],
  )

  if (plant === undefined || photos === undefined) return null

  async function handleDelete() {
    if (!confirm(`„${plant!.name}“ und alle Fotos wirklich löschen?`)) return
    await deletePlant(id)
    navigate({ name: 'home' }, { replace: true })
  }

  return (
    <div className="plant-detail">
      <header className="page-header">
        <a className="icon-button" href={routeHref({ name: 'home' })} aria-label="Zurück">
          ←
        </a>
        <h1>{plant.name}</h1>
        <a className="button button--small" href={routeHref({ name: 'edit', id })}>
          Bearbeiten
        </a>
      </header>
      {plant.species && <p className="muted species">{plant.species}</p>}

      <section>
        <h2>Fotos ({photos.length})</h2>
        <AddPhotoButtons plantId={id} />
        {photos.length === 0 ? (
          <p className="muted">Noch keine Fotos. Nimm das erste auf, um den Fortschritt festzuhalten.</p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <PhotoTile key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Daten</h2>
        <PlantFacts plant={plant} />
      </section>

      <button type="button" className="button button--danger button--block" onClick={handleDelete}>
        Pflanze löschen
      </button>
    </div>
  )
}

function PhotoTile({ photo }: { photo: Photo }) {
  const cutoutState = useCutoutState()
  const isActive = cutoutState.activePhotoId === photo.id

  async function handleDelete() {
    if (confirm('Dieses Foto löschen?')) await db.photos.delete(photo.id!)
  }

  return (
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
        <span>{formatDate(photo.takenAt)}</span>
        <button type="button" className="link-button" onClick={handleDelete} aria-label="Foto löschen">
          ✕
        </button>
      </figcaption>
    </figure>
  )
}

function PlantFacts({ plant }: { plant: Plant }) {
  const facts: [string, string | undefined][] = [
    ['Standort', plant.location],
    ['Licht', plant.light],
    ['Luftfeuchtigkeit', plant.humidity],
    ['Temperatur', plant.temperature],
    ['Gießen', plant.wateringIntervalDays ? `alle ${plant.wateringIntervalDays} Tage` : undefined],
    ['Zuletzt gegossen', plant.lastWateredAt && formatDate(plant.lastWateredAt)],
    ['Dünger', plant.fertilizer],
    ['Düngen', plant.fertilizingIntervalDays ? `alle ${plant.fertilizingIntervalDays} Tage` : undefined],
    ['Topfgröße', plant.potSizeCm ? `${plant.potSizeCm} cm` : undefined],
    ['Höhe', plant.heightCm ? `${plant.heightCm} cm` : undefined],
    ['Erde / Substrat', plant.substrate],
    ['Haustiere', plant.petSafe ? 'ungiftig' : undefined],
    ['Im Besitz seit', plant.acquiredAt && formatDate(plant.acquiredAt)],
  ]
  const shown = facts.filter(([, v]) => v)

  return (
    <>
      {shown.length > 0 ? (
        <dl className="facts">
          {shown.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted">Noch keine Daten eingetragen.</p>
      )}
      {plant.notes && <p className="notes">{plant.notes}</p>}
    </>
  )
}
