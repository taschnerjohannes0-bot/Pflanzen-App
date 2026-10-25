import type { Photo } from '../db/types'
import { useObjectUrl } from '../lib/useObjectUrl'

// Zeigt die freigestellte Pflanze, solange es sie gibt, sonst das Originalfoto.
export function PhotoImage({ photo, alt }: { photo: Photo; alt: string }) {
  const url = useObjectUrl(photo.cutout ?? photo.blob)
  if (!url) return null
  return <img className={photo.cutout ? 'is-cutout' : undefined} src={url} alt={alt} />
}
