import { useLiveQuery } from 'dexie-react-hooks'
import { type FormEvent, useState } from 'react'
import { db } from '../db/db'
import type { Humidity, Light, Plant } from '../db/types'
import { fromDateInput, toDateInput } from '../lib/format'
import { navigate } from '../lib/router'

type Draft = Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>

const LIGHT_OPTIONS: Light[] = ['sonnig', 'hell', 'halbschattig', 'schattig']
const HUMIDITY_OPTIONS: Humidity[] = ['niedrig', 'mittel', 'hoch']

export function PlantForm({ id }: { id?: number }) {
  const existing = useLiveQuery(() => (id ? db.plants.get(id) : undefined), [id])
  if (id && !existing) return null
  return <PlantFormInner key={id ?? 'new'} existing={existing} />
}

function PlantFormInner({ existing }: { existing?: Plant }) {
  const [draft, setDraft] = useState<Draft>(() => existing ?? { name: '' })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const text = (key: 'name' | 'species' | 'location' | 'fertilizer' | 'substrate' | 'temperature' | 'notes') => ({
    value: draft[key] ?? '',
    onChange: (e: { currentTarget: { value: string } }) => set(key, e.currentTarget.value || undefined),
  })

  const num = (key: 'wateringIntervalDays' | 'fertilizingIntervalDays' | 'potSizeCm' | 'heightCm') => ({
    type: 'number',
    inputMode: 'decimal' as const,
    min: 0,
    value: draft[key] ?? '',
    onChange: (e: { currentTarget: { value: string } }) =>
      set(key, e.currentTarget.value === '' ? undefined : Number(e.currentTarget.value)),
  })

  const date = (key: 'acquiredAt' | 'lastWateredAt' | 'lastFertilizedAt') => ({
    type: 'date',
    value: toDateInput(draft[key]),
    onChange: (e: { currentTarget: { value: string } }) => set(key, fromDateInput(e.currentTarget.value)),
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.name?.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const data = { ...draft, name: draft.name.trim() }
    if (existing?.id) {
      await db.plants.update(existing.id, { ...data, updatedAt: now })
      history.back()
    } else {
      const newId = await db.plants.add({ ...data, createdAt: now, updatedAt: now })
      navigate({ name: 'plant', id: newId! }, { replace: true })
    }
  }

  return (
    <form className="plant-form" onSubmit={handleSubmit}>
      <header className="page-header">
        <button type="button" className="icon-button" onClick={() => history.back()} aria-label="Zurück">
          ←
        </button>
        <h1>{existing ? 'Pflanze bearbeiten' : 'Neue Pflanze'}</h1>
      </header>

      <fieldset>
        <legend>Allgemein</legend>
        <label>
          Name *
          <input required autoFocus={!existing} placeholder="z. B. Monstera im Wohnzimmer" {...text('name')} />
        </label>
        <label>
          Art / botanischer Name
          <input placeholder="z. B. Monstera deliciosa" {...text('species')} />
        </label>
        <label>
          Standort
          <input placeholder="z. B. Wohnzimmer, Südfenster" {...text('location')} />
        </label>
        <label>
          Im Besitz seit
          <input {...date('acquiredAt')} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Umgebung</legend>
        <label>
          Licht
          <select value={draft.light ?? ''} onChange={(e) => set('light', (e.currentTarget.value || undefined) as Light)}>
            <option value="">–</option>
            {LIGHT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          Luftfeuchtigkeit
          <select
            value={draft.humidity ?? ''}
            onChange={(e) => set('humidity', (e.currentTarget.value || undefined) as Humidity)}
          >
            <option value="">–</option>
            {HUMIDITY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          Temperatur
          <input placeholder="z. B. 18–24 °C" {...text('temperature')} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Pflege</legend>
        <div className="form-row">
          <label>
            Gießen alle … Tage
            <input {...num('wateringIntervalDays')} />
          </label>
          <label>
            Zuletzt gegossen
            <input {...date('lastWateredAt')} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Dünger
            <input placeholder="z. B. Grünpflanzendünger" {...text('fertilizer')} />
          </label>
          <label>
            Düngen alle … Tage
            <input {...num('fertilizingIntervalDays')} />
          </label>
        </div>
        <label>
          Zuletzt gedüngt
          <input {...date('lastFertilizedAt')} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Topf und Größe</legend>
        <div className="form-row">
          <label>
            Topfgröße (cm)
            <input {...num('potSizeCm')} />
          </label>
          <label>
            Höhe der Pflanze (cm)
            <input {...num('heightCm')} />
          </label>
        </div>
        <label>
          Erde / Substrat
          <input placeholder="z. B. Aroid-Mix mit Pinienrinde" {...text('substrate')} />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={draft.petSafe ?? false} onChange={(e) => set('petSafe', e.currentTarget.checked)} />
          Ungiftig für Haustiere
        </label>
      </fieldset>

      <fieldset>
        <legend>Notizen</legend>
        <textarea rows={4} placeholder="Alles, was du dir merken willst" {...text('notes')} />
      </fieldset>

      <button type="submit" className="button button--primary button--block" disabled={saving || !draft.name?.trim()}>
        {existing ? 'Speichern' : 'Pflanze anlegen'}
      </button>
    </form>
  )
}
