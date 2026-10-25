import type { CropRect } from '../db/types'

const MAX_SIDE = 1024
// Halbtransparente Reste unter NOISE_ALPHA werden entfernt, der Zuschnitt richtet sich nach CROP_ALPHA.
const NOISE_ALPHA = 64
const CROP_ALPHA = 128
// Flächen kleiner als dieser Anteil der größten Fläche gelten als Störung.
const MIN_COMPONENT_SHARE = 0.03
const SOLID_ALPHA = 220
const PADDING = 0.04

export type CutoutProgress = (loaded: number, total: number) => void

// Stellt die Pflanze frei (direkt auf dem Gerät) und schneidet auf die Pflanze zu.
export async function cutOutPlant(photo: Blob, crop?: CropRect, onDownload?: CutoutProgress): Promise<Blob> {
  // Vorher auf den gewählten Rahmen zuschneiden: Nachbarpflanzen und Möbel stören sonst die Erkennung.
  const isFull = !crop || (crop.x <= 0 && crop.y <= 0 && crop.w >= 1 && crop.h >= 1)
  const input = isFull ? photo : await cropImage(photo, crop)
  // In der iPhone-App übernimmt iOS das Freistellen. Die Bedingung steht bewusst direkt hier,
  // damit der Build die Web-Bibliothek (AGPL) für die App komplett weglässt.
  const removed =
    import.meta.env.VITE_NATIVE === '1'
      ? await (await import('./subjectLift')).liftSubject(input)
      : await removeWithModel(input, onDownload)
  return cropToContent(removed)
}

async function removeWithModel(input: Blob, onDownload?: CutoutProgress): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal')
  return removeBackground(input, {
    publicPath: new URL('bg-removal/', location.origin + import.meta.env.BASE_URL).href,
    model: 'isnet_quint8',
    device: 'cpu',
    output: { format: 'image/png' },
    progress: (key, current, total) => {
      if (key.startsWith('fetch:')) onDownload?.(current, total)
    },
  })
}

async function cropImage(photo: Blob, crop: CropRect): Promise<Blob> {
  const bitmap = await createImageBitmap(photo)
  const sx = Math.round(crop.x * bitmap.width)
  const sy = Math.round(crop.y * bitmap.height)
  const sw = Math.max(1, Math.round(crop.w * bitmap.width))
  const sh = Math.max(1, Math.round(crop.h * bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  canvas.getContext('2d')!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Zuschnitt fehlgeschlagen'))), 'image/jpeg', 0.92),
  )
}

async function cropToContent(png: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(png)
  const { width, height } = bitmap
  const source = document.createElement('canvas')
  source.width = width
  source.height = height
  const ctx = source.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const image = ctx.getImageData(0, 0, width, height)
  const keep = mainComponents(image.data, width, height)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (!keep[i]) {
        image.data[i * 4 + 3] = 0
      } else if (image.data[i * 4 + 3] >= CROP_ALPHA) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) throw new Error('Keine Pflanze erkannt')
  ctx.putImageData(image, 0, 0)

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * PADDING)
  const x = Math.max(0, minX - pad)
  const y = Math.max(0, minY - pad)
  const w = Math.min(width, maxX + pad + 1) - x
  const h = Math.min(height, maxY + pad + 1) - y
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h))

  const target = document.createElement('canvas')
  target.width = Math.round(w * scale)
  target.height = Math.round(h * scale)
  target.getContext('2d')!.drawImage(source, x, y, w, h, 0, 0, target.width, target.height)

  return new Promise((resolve, reject) =>
    target.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Freistellen fehlgeschlagen'))), 'image/png'),
  )
}

// Behält nur die großen zusammenhängenden Flächen (die Pflanze) und verwirft kleine Krümel.
function mainComponents(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const size = width * height
  const label = new Int32Array(size)
  const areas = [0]
  const stack: number[] = []

  for (let start = 0; start < size; start++) {
    if (label[start] || data[start * 4 + 3] < NOISE_ALPHA) continue
    const id = areas.length
    // Gezählt werden nur fast deckende Pixel: halbtransparente "Geister" (Möbel, Deko) fallen so heraus.
    let area = 0
    label[start] = id
    stack.push(start)
    while (stack.length) {
      const i = stack.pop()!
      if (data[i * 4 + 3] >= SOLID_ALPHA) area++
      const x = i % width
      const neighbours = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]
      for (const n of neighbours) {
        if (n >= 0 && n < size && !label[n] && data[n * 4 + 3] >= NOISE_ALPHA) {
          label[n] = id
          stack.push(n)
        }
      }
    }
    areas.push(area)
  }

  const minArea = areas.reduce((a, b) => Math.max(a, b), 0) * MIN_COMPONENT_SHARE
  const keep = new Uint8Array(size)
  for (let i = 0; i < size; i++) if (label[i] && areas[label[i]] >= minArea) keep[i] = 1
  return keep
}
