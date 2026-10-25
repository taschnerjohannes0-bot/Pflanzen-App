import { useLiveQuery } from 'dexie-react-hooks'
import { latestPhoto } from '../db/db'
import type { Plant } from '../db/types'
import { CARE_LABEL, dueTasks } from '../lib/care'
import { routeHref } from '../lib/router'
import { PhotoImage } from './PhotoImage'

export function PlantCard({ plant }: { plant: Plant }) {
  const photo = useLiveQuery(() => latestPhoto(plant.id!), [plant.id])
  const due = dueTasks(plant)

  return (
    <a className="plant-card" href={routeHref({ name: 'plant', id: plant.id! })}>
      <div className="plant-card__image">
        {photo ? <PhotoImage photo={photo} alt={plant.name} /> : <span aria-hidden>🌱</span>}
        {due.length > 0 && (
          <span className="plant-card__due" title="Pflege fällig">
            {due.map((t) => CARE_LABEL[t.kind].icon).join('')}
          </span>
        )}
      </div>
      <div className="plant-card__name">{plant.name}</div>
      {plant.species && <div className="plant-card__species">{plant.species}</div>}
    </a>
  )
}
