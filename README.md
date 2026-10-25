# Pflanzentagebuch

Web-App, um Fotos und Daten der eigenen Pflanzen festzuhalten und den Fortschritt zu vergleichen.
Sie läuft als installierbare PWA und speichert alles lokal im Browser (IndexedDB), ein Konto ist nicht nötig.
Später lässt sie sich mit Capacitor als native iOS- oder Android-App verpacken.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
npm run lint
```

## Aufbau

- `src/db/` – lokale Datenbank (Dexie) mit den Tabellen `plants` und `photos`
- `src/components/` – UI-Bausteine
- `vite.config.ts` – PWA-Manifest und Service Worker (vite-plugin-pwa)
