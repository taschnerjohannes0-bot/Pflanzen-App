import type { Plant } from '../db/types'
import { daysBetween } from './format'

export type CareKind = 'water' | 'fertilize'

export interface CareTask {
  kind: CareKind
  // Negativ = überfällig, 0 = heute, positiv = in so vielen Tagen.
  dueInDays: number
}

const FIELDS = {
  water: { interval: 'wateringIntervalDays', last: 'lastWateredAt' },
  fertilize: { interval: 'fertilizingIntervalDays', last: 'lastFertilizedAt' },
} as const

export function careTasks(plant: Plant, now = new Date()): CareTask[] {
  const tasks: CareTask[] = []
  for (const kind of ['water', 'fertilize'] as const) {
    const interval = plant[FIELDS[kind].interval]
    if (!interval) continue
    const last = plant[FIELDS[kind].last]
    // Ohne bekanntes letztes Datum gilt die Pflege als heute fällig.
    const dueInDays = last ? interval - daysBetween(last, now.toISOString()) : 0
    tasks.push({ kind, dueInDays })
  }
  return tasks
}

export function dueTasks(plant: Plant, now = new Date()): CareTask[] {
  return careTasks(plant, now).filter((t) => t.dueInDays <= 0)
}

export const CARE_LABEL: Record<CareKind, { icon: string; verb: string; done: string }> = {
  water: { icon: '💧', verb: 'Gießen', done: 'Gegossen' },
  fertilize: { icon: '🌱', verb: 'Düngen', done: 'Gedüngt' },
}

export function describeDue(days: number): string {
  if (days < -1) return `seit ${-days} Tagen fällig`
  if (days === -1) return 'seit gestern fällig'
  if (days === 0) return 'heute fällig'
  if (days === 1) return 'morgen'
  return `in ${days} Tagen`
}

export function markDone(kind: CareKind): Partial<Plant> {
  const now = new Date().toISOString()
  return kind === 'water' ? { lastWateredAt: now, updatedAt: now } : { lastFertilizedAt: now, updatedAt: now }
}
