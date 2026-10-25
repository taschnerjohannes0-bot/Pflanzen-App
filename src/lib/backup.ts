import { strFromU8, strToU8, unzip, zip } from 'fflate'
import { db } from '../db/db'
import { isNative } from './platform'
import type { Photo, Plant } from '../db/types'

const FORMAT = 'pflanzentagebuch-backup'
const VERSION = 1

type PhotoMeta = Omit<Photo, 'blob' | 'cutout'> & { file: string; cutoutFile?: string }

interface Manifest {
  format: typeof FORMAT
  version: number
  exportedAt: string
  plants: Plant[]
  photos: PhotoMeta[]
}

// Packt alle Pflanzen und Fotos in eine ZIP-Datei (Fotos als einzelne Bilddateien).
export async function createBackup(): Promise<File> {
  const [plants, photos] = await Promise.all([db.plants.toArray(), db.photos.toArray()])
  const files: Record<string, Uint8Array> = {}
  const metas: PhotoMeta[] = []

  for (const { blob, cutout, ...meta } of photos) {
    const file = `fotos/${meta.id}.jpg`
    files[file] = new Uint8Array(await blob.arrayBuffer())
    let cutoutFile: string | undefined
    if (cutout) {
      cutoutFile = `freigestellt/${meta.id}.png`
      files[cutoutFile] = new Uint8Array(await cutout.arrayBuffer())
    }
    metas.push({ ...meta, file, cutoutFile })
  }

  const manifest: Manifest = { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), plants, photos: metas }
  files['pflanzentagebuch.json'] = strToU8(JSON.stringify(manifest, null, 2))

  // Bilder sind schon komprimiert, deshalb nur speichern (level 0) – das geht viel schneller.
  const data = await new Promise<Uint8Array>((resolve, reject) =>
    zip(files, { level: 0 }, (err, out) => (err ? reject(err) : resolve(out))),
  )
  const date = new Date().toISOString().slice(0, 10)
  return new File([data as BlobPart], `pflanzentagebuch-${date}.zip`, { type: 'application/zip' })
}

export async function restoreBackup(file: Blob): Promise<{ plants: number; photos: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
    unzip(bytes, (err, out) => (err ? reject(err) : resolve(out))),
  )
  const raw = entries['pflanzentagebuch.json']
  if (!raw) throw new Error('Keine Pflanzentagebuch-Sicherung')
  const manifest = JSON.parse(strFromU8(raw)) as Manifest
  if (manifest.format !== FORMAT || manifest.version > VERSION) throw new Error('Unbekanntes Format')

  const photos: Photo[] = manifest.photos.map(({ file, cutoutFile, ...meta }) => {
    const image = entries[file]
    if (!image) throw new Error(`${file} fehlt in der Sicherung`)
    const cutout = cutoutFile && entries[cutoutFile]
    return {
      ...meta,
      blob: new Blob([image as BlobPart], { type: 'image/jpeg' }),
      ...(cutout ? { cutout: new Blob([cutout as BlobPart], { type: 'image/png' }) } : {}),
    }
  })

  await db.transaction('rw', db.plants, db.photos, async () => {
    await db.photos.clear()
    await db.plants.clear()
    await db.plants.bulkAdd(manifest.plants)
    await db.photos.bulkAdd(photos)
  })
  return { plants: manifest.plants.length, photos: photos.length }
}

// Am Handy über das Teilen-Menü (z. B. in iCloud/Google Drive sichern), sonst als Download.
export async function shareOrDownload(file: File): Promise<void> {
  if (isNative) return shareNative(file)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// In der iPhone-App: Datei in den Cache schreiben und das iOS-Teilen-Menü öffnen (Dateien, iCloud, AirDrop …).
async function shareNative(file: File): Promise<void> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ])
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const { uri } = await Filesystem.writeFile({ path: file.name, data, directory: Directory.Cache })
  try {
    await Share.share({ title: file.name, files: [uri] })
  } catch (error) {
    if (!String(error).toLowerCase().includes('cancel')) throw error
  }
}
