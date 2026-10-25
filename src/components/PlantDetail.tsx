import { useLiveQuery } from 'dexie-react-hooks'
import { db, deletePlant } from '../db/db'
import type { Plant } from '../db/types'
import { CARE_LABEL, careTasks, describeDue, markDone } from '../lib/care'
import { daysBetween, formatDate, formatDuration } from '../lib/format'
import { navigate, routeHref } from '../lib/router'
import { AddPhotoButtons } from './AddPhotoButtons'
import { PhotoImage } from './PhotoImage'
import { TimelineEntry } from './TimelineEntry'

export function PlantDetail({ id }: { id: number }) {
  const plant = useLiveQuery(() => db.plants.get(id), [id])
  const photos = useLiveQuery(
    () => db.photos.where('plantId').equals(id).reverse().sortBy('takenAt'),
    [id],
  )

  if (plant === undefined || photos === undefined) return null

  const latest = photos[0]
  const first = photos[photos.length - 1]
  const currentHeight = photos.find((p) => p.heightCm !== undefined)?.heightCm ?? plant.heightCm

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

      {latest && (
        <div className="hero">
          <PhotoImage photo={latest} alt={plant.name} />
        </div>
      )}

      <div className="stats">
        <div>
          <strong>{photos.length}</strong>
          <span>{photos.length === 1 ? 'Foto' : 'Fotos'}</span>
        </div>
        <div>
          <strong>{first && latest ? formatDuration(daysBetween(first.takenAt, latest.takenAt)) : '–'}</strong>
          <span>dokumentiert</span>
        </div>
        <div>
          <strong>{currentHeight !== undefined ? `${currentHeight} cm` : '–'}</strong>
          <span>Höhe</span>
        </div>
      </div>

      {photos.length >= 2 && (
        <a className="button button--primary button--block compare-button" href={routeHref({ name: 'compare', id })}>
          ⇆ Fortschritt vergleichen
        </a>
      )}

      {careTasks(plant).length > 0 && (
        <section>
          <h2>Pflege</h2>
          <ul className="care-list">
            {careTasks(plant).map((task) => (
              <li key={task.kind}>
                <span aria-hidden>{CARE_LABEL[task.kind].icon}</span>
                <span>
                  <strong>{CARE_LABEL[task.kind].verb}</strong>
                  <span className={task.dueInDays < 0 ? 'overdue' : 'muted'}>{describeDue(task.dueInDays)}</span>
                </span>
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => db.plants.update(id, markDone(task.kind))}
                >
                  ✓ {CARE_LABEL[task.kind].done}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Zeitstrahl</h2>
        <AddPhotoButtons plantId={id} />
        {photos.length === 0 ? (
          <p className="muted">Noch keine Fotos. Nimm das erste auf, um den Fortschritt festzuhalten.</p>
        ) : (
          <ol className="timeline">
            {photos.map((photo, i) => {
              const older = photos.slice(i + 1).find((p) => p.heightCm !== undefined)
              const delta =
                photo.heightCm !== undefined && older?.heightCm !== undefined ? photo.heightCm - older.heightCm : undefined
              return <TimelineEntry key={photo.id} photo={photo} heightDelta={delta} />
            })}
          </ol>
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

function PlantFacts({ plant }: { plant: Plant }) {
  const facts: [string, string | undefined][] = [
    ['Standort', plant.location],
    ['Licht', plant.light],
    ['Luftfeuchtigkeit', plant.humidity],
    ['Temperatur', plant.temperature],
    ['Gießen', plant.wateringIntervalDays ? `alle ${plant.wateringIntervalDays} Tage` : undefined],
    ['Zuletzt gegossen', plant.lastWateredAt && formatDate(plant.lastWateredAt)],
    ['Zuletzt gedüngt', plant.lastFertilizedAt && formatDate(plant.lastFertilizedAt)],
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
