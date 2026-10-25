import { registerPlugin } from '@capacitor/core'

interface SubjectLiftPlugin {
  isAvailable(): Promise<{ available: boolean }>
  liftSubject(options: { image: string }): Promise<{ image: string }>
}

// Eigenes Plugin in plugins/subject-lift (iOS Vision, wie „Motiv freistellen“ in Fotos).
const SubjectLift = registerPlugin<SubjectLiftPlugin>('SubjectLift')

export async function liftSubject(photo: Blob): Promise<Blob> {
  const { available } = await SubjectLift.isAvailable()
  if (!available) throw new Error('Freistellen benötigt iOS 17')
  const { image } = await SubjectLift.liftSubject({ image: await toBase64(photo) })
  const bytes = Uint8Array.from(atob(image), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: 'image/png' })
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
