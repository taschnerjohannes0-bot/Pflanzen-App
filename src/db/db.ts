import Dexie, { type EntityTable } from 'dexie'
import { processPendingCutouts } from '../lib/cutoutQueue'
import type { CropRect, Photo, Plant } from './types'

// Alles bleibt lokal im Browser (IndexedDB), Fotos werden als Blob gespeichert.
export const db = new Dexie('pflanzentagebuch') as Dexie & {
  plants: EntityTable<Plant, 'id'>
  photos: EntityTable<Photo, 'id'>
}

db.version(1).stores({
  plants: '++id, name, createdAt',
  photos: '++id, plantId, takenAt, [plantId+takenAt]',
})

export async function latestPhoto(plantId: number): Promise<Photo | undefined> {
  return db.photos
    .where('[plantId+takenAt]')
    .between([plantId, Dexie.minKey], [plantId, Dexie.maxKey])
    .last()
}

// Bittet den Browser, die Daten nicht automatisch zu löschen, wenn Speicher knapp wird.
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  return (await navigator.storage.persisted()) || navigator.storage.persist()
}

// crop = null heißt: nicht freistellen, Originalfoto zeigen.
export async function addPhoto(plantId: number, blob: Blob, takenAt: string, crop: CropRect | null): Promise<void> {
  await db.photos.add({ plantId, blob, takenAt, ...(crop ? { crop, cutoutStatus: 'pending' } : {}) })
  await db.plants.update(plantId, { updatedAt: new Date().toISOString() })
  processPendingCutouts()
}

export async function deletePlant(plantId: number): Promise<void> {
  await db.transaction('rw', db.plants, db.photos, async () => {
    await db.photos.where('plantId').equals(plantId).delete()
    await db.plants.delete(plantId)
  })
}

export async function retryCutout(photo: Photo): Promise<void> {
  await db.photos.update(photo.id!, { cutoutStatus: 'pending' })
  processPendingCutouts()
}

export async function reframePhoto(photo: Photo, crop: CropRect | null): Promise<void> {
  if (crop) {
    await db.photos.update(photo.id!, { crop, cutoutStatus: 'pending' })
    processPendingCutouts()
  } else {
    await db.photos.update(photo.id!, { crop: undefined, cutout: undefined, cutoutStatus: undefined })
  }
}
