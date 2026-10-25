import Dexie, { type EntityTable } from 'dexie'
import type { Photo, Plant } from './types'

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
