import type { Plant } from '../db/types'
import { CARE_LABEL, careTasks, type CareKind } from './care'
import { isNative } from './platform'
import { navigate } from './router'

const REMINDER_HOUR = 9

// Plant für jede Pflanze die nächste Gieß- und Düngeerinnerung (jeweils 9 Uhr) als lokale Benachrichtigung.
// Läuft nur in der iPhone-App; im Browser gibt es stattdessen „Heute zu tun“.
export async function syncCareNotifications(plants: Plant[]): Promise<void> {
  if (!isNative) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')

  let { display } = await LocalNotifications.checkPermissions()
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    if (!plants.some((p) => careTasks(p).length > 0)) return
    display = (await LocalNotifications.requestPermissions()).display
  }
  if (display !== 'granted') return

  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) await LocalNotifications.cancel({ notifications: pending.notifications })

  const now = new Date()
  const notifications = plants.flatMap((plant) =>
    careTasks(plant, now).map((task) => ({
      id: notificationId(plant.id!, task.kind),
      title: `${CARE_LABEL[task.kind].icon} ${plant.name}`,
      body: task.kind === 'water' ? `${plant.name} möchte gegossen werden.` : `Zeit, ${plant.name} zu düngen.`,
      schedule: { at: reminderDate(now, task.dueInDays), allowWhileIdle: true },
      extra: { plantId: plant.id },
    })),
  )
  // iOS erlaubt höchstens 64 geplante Benachrichtigungen.
  if (notifications.length > 0) await LocalNotifications.schedule({ notifications: notifications.slice(0, 64) })
}

export async function listenForNotificationTaps(): Promise<void> {
  if (!isNative) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
    const plantId = Number(notification.extra?.plantId)
    if (plantId) navigate({ name: 'plant', id: plantId })
  })
}

function notificationId(plantId: number, kind: CareKind): number {
  return plantId * 10 + (kind === 'water' ? 1 : 2)
}

function reminderDate(now: Date, dueInDays: number): Date {
  const at = new Date(now)
  at.setDate(at.getDate() + Math.max(0, dueInDays))
  at.setHours(REMINDER_HOUR, 0, 0, 0)
  // Schon fällig und 9 Uhr ist vorbei: in einer Stunde erinnern statt in der Vergangenheit.
  if (at <= now) return new Date(now.getTime() + 60 * 60 * 1000)
  return at
}
