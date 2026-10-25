export type Light = 'sonnig' | 'hell' | 'halbschattig' | 'schattig'
export type Humidity = 'niedrig' | 'mittel' | 'hoch'

export interface Plant {
  id?: number
  name: string
  species?: string
  location?: string
  light?: Light
  wateringIntervalDays?: number
  fertilizer?: string
  fertilizingIntervalDays?: number
  potSizeCm?: number
  substrate?: string
  humidity?: Humidity
  temperature?: string
  heightCm?: number
  acquiredAt?: string
  lastWateredAt?: string
  petSafe?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Photo {
  id?: number
  plantId: number
  blob: Blob
  takenAt: string
  heightCm?: number
  note?: string
}
