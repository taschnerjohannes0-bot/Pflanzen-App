import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo } from 'react'
import { latestPhoto } from '../db/db'
import type { Plant } from '../db/types'

export function PlantCard({ plant }: { plant: Plant }) {
  const photo = useLiveQuery(() => latestPhoto(plant.id!), [plant.id])
  const url = useMemo(() => (photo ? URL.createObjectURL(photo.blob) : undefined), [photo])

  useEffect(() => {
    if (url) return () => URL.revokeObjectURL(url)
  }, [url])

  return (
    <button className="plant-card" type="button">
      <div className="plant-card__image">
        {url ? <img src={url} alt={plant.name} /> : <span aria-hidden>🌱</span>}
      </div>
      <div className="plant-card__name">{plant.name}</div>
      {plant.species && <div className="plant-card__species">{plant.species}</div>}
    </button>
  )
}
