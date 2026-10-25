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

## Veröffentlichung

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Pages (`.github/workflows/deploy.yml`) unter
https://taschnerjohannes0-bot.github.io/Pflanzen-App/. Voraussetzung: In den Repository-Einstellungen unter Pages ist als Quelle „GitHub Actions“ gewählt.

## Freistellen

Fotos werden nach dem Speichern im Hintergrund freigestellt (ISNet-Modell über `@imgly/background-removal`, läuft komplett im Browser).
`npm run dev` und `npm run build` kopieren Modell und ONNX-Runtime vorher automatisch nach `public/bg-removal/` (nicht im Git).
Beim ersten Freistellen lädt die App das Modell (~55 MB) einmalig, danach funktioniert es offline.

Hinweis: `@imgly/background-removal` steht unter der AGPL-3.0.

## Pflege und Sicherung

- Fällige Gieß- und Düngetermine erscheinen auf der Startseite unter „Heute zu tun“; die installierte App zeigt die Anzahl am App-Symbol (Badging API).
- Unter Einstellungen lässt sich eine ZIP-Sicherung aller Pflanzen und Fotos erstellen und wiederherstellen.

## Aufbau

- `src/db/` – lokale Datenbank (Dexie) mit den Tabellen `plants` und `photos`
- `src/components/` – UI-Bausteine
- `src/lib/cutout.ts`, `src/lib/cutoutQueue.ts` – Freistellen und Warteschlange
- `vite.config.ts` – PWA-Manifest und Service Worker (vite-plugin-pwa)
