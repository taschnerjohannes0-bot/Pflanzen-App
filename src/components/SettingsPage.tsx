import { useEffect, useRef, useState } from 'react'
import { createBackup, restoreBackup, shareOrDownload } from '../lib/backup'
import { processPendingCutouts } from '../lib/cutoutQueue'
import { isNative } from '../lib/platform'
import { routeHref } from '../lib/router'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} MB`
  return `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} GB`
}

export function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [storage, setStorage] = useState<{ usage: number; quota: number; persisted: boolean }>()

  useEffect(() => {
    Promise.all([navigator.storage?.estimate?.(), navigator.storage?.persisted?.()]).then(([estimate, persisted]) => {
      if (estimate) setStorage({ usage: estimate.usage ?? 0, quota: estimate.quota ?? 0, persisted: !!persisted })
    })
  }, [])

  async function handleExport() {
    setBusy(true)
    setStatus('Sicherung wird erstellt …')
    try {
      const file = await createBackup()
      await shareOrDownload(file)
      setStatus(`Sicherung erstellt (${formatBytes(file.size)}).`)
    } catch {
      setStatus('Die Sicherung konnte nicht erstellt werden.')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(input: HTMLInputElement) {
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!confirm('Alle aktuellen Pflanzen und Fotos werden durch die Sicherung ersetzt. Fortfahren?')) return
    setBusy(true)
    setStatus('Sicherung wird wiederhergestellt …')
    try {
      const { plants, photos } = await restoreBackup(file)
      setStatus(`Wiederhergestellt: ${plants} ${plants === 1 ? 'Pflanze' : 'Pflanzen'}, ${photos} ${photos === 1 ? 'Foto' : 'Fotos'}.`)
      processPendingCutouts()
    } catch {
      setStatus('Die Datei ist keine gültige Pflanzentagebuch-Sicherung.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings">
      <header className="page-header">
        <a className="icon-button" href={routeHref({ name: 'home' })} aria-label="Zurück">
          ←
        </a>
        <h1>Einstellungen</h1>
      </header>

      <section className="card">
        <h2>Sicherung</h2>
        <p className="muted">
          Deine Pflanzen und Fotos liegen nur auf diesem Gerät. Erstelle regelmäßig eine Sicherung, zum Beispiel in
          iCloud oder Google Drive, damit bei einem Gerätewechsel nichts verloren geht.
        </p>
        <div className="settings__actions">
          <button type="button" className="button button--primary" disabled={busy} onClick={handleExport}>
            ⬇️ Sicherung erstellen
          </button>
          <button type="button" className="button" disabled={busy} onClick={() => fileRef.current?.click()}>
            ⬆️ Wiederherstellen
          </button>
          <input ref={fileRef} type="file" accept=".zip,application/zip" hidden onChange={(e) => handleImport(e.currentTarget)} />
        </div>
        {status && <p className="settings__status">{status}</p>}
      </section>

      {storage && (
        <section className="card">
          <h2>Speicher</h2>
          <p>
            {formatBytes(storage.usage)} belegt
            {storage.quota > 0 && <span className="muted"> von {formatBytes(storage.quota)} verfügbar</span>}
          </p>
          <p className="muted">
            {storage.persisted
              ? 'Der Browser hält deine Daten dauerhaft vor.'
              : 'Tipp: Installiere die App auf dem Home-Bildschirm, damit der Browser deine Daten nicht automatisch löscht.'}
          </p>
        </section>
      )}

      <section className="card">
        <h2>Erinnerungen</h2>
        <p className="muted">
          {isNative
            ? 'Du bekommst um 9 Uhr eine Benachrichtigung, wenn eine Pflanze gegossen oder gedüngt werden möchte. Fällige Pflege steht außerdem auf der Startseite unter „Heute zu tun“.'
            : 'Fällige Pflege steht auf der Startseite unter „Heute zu tun“, und das App-Symbol zeigt die Anzahl, wenn die App installiert ist. Benachrichtigungen gibt es in der iPhone-App.'}
        </p>
      </section>
    </div>
  )
}
