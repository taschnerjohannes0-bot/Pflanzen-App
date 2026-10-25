import { useLiveQuery } from 'dexie-react-hooks'
import { latestPhoto } from '../db/db'
import type { Plant } from '../db/types'
import { routeHref } from '../lib/router'
import { PhotoImage } from './PhotoImage'

export function PlantCard({ plant }: { plant: Plant }) {
  const photo = useLiveQuery(() => latestPhoto(plant.id!), [plant.id])

  return (
    <a className="plant-card" href={routeHref({ name: 'plant', id: plant.id! })}>
      <div className="plant-card__image">
        {photo ? <PhotoImage photo={photo} alt={plant.name} /> : <span aria-hidden>🌱</span>}
      </div>
      <div className="plant-card__name">{plant.name}</div>
      {plant.species && <div className="plant-card__species">{plant.species}</div>}
    </a>
  )
}
