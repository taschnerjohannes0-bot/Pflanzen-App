export type Light = 'sonnig' | 'hell' | 'halbschattig' | 'schattig'
// Ausschnitt um die Pflanze, relativ zur Bildgröße (0–1).
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export type CutoutStatus = 'pending' | 'done' | 'failed'
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
  lastFertilizedAt?: string
  petSafe?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Photo {
  id?: number
  plantId: number
  blob: Blob
  // Freigestellte Pflanze als PNG mit transparentem Hintergrund.
  cutout?: Blob
  cutoutStatus?: CutoutStatus
  crop?: CropRect
  takenAt: string
  heightCm?: number
  note?: string
}
