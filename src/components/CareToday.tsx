import { db } from '../db/db'
import type { Plant } from '../db/types'
import { CARE_LABEL, type CareKind, describeDue, dueTasks, markDone } from '../lib/care'
import { routeHref } from '../lib/router'

// Liste "Heute zu tun" auf der Startseite.
export function CareToday({ plants }: { plants: Plant[] }) {
  const items = plants
    .flatMap((plant) => dueTasks(plant).map((task) => ({ plant, task })))
    .sort((a, b) => a.task.dueInDays - b.task.dueInDays)

  if (items.length === 0) return null

  async function done(plant: Plant, kind: CareKind) {
    await db.plants.update(plant.id!, markDone(kind))
  }

  return (
    <section className="care-today">
      <h2>Heute zu tun</h2>
      <ul>
        {items.map(({ plant, task }) => (
          <li key={`${plant.id}-${task.kind}`}>
            <span className="care-today__icon" aria-hidden>
              {CARE_LABEL[task.kind].icon}
            </span>
            <a href={routeHref({ name: 'plant', id: plant.id! })}>
              <strong>
                {plant.name} {CARE_LABEL[task.kind].verb.toLowerCase()}
              </strong>
              <span className={task.dueInDays < 0 ? 'overdue' : 'muted'}>{describeDue(task.dueInDays)}</span>
            </a>
            <button type="button" className="button button--small" onClick={() => done(plant, task.kind)}>
              ✓ {CARE_LABEL[task.kind].done}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
