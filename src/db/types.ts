export type Light = 'sonnig' | 'hell' | 'halbschattig' | 'schattig'

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
  heightCm?: number
  acquiredAt?: string
  lastWateredAt?: string
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
