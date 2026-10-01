# ClipWithPaho v2

Eine lokale, schwarze Desktop-Clipping-App im Stil moderner Game-Clip-Launcher:

- Kein Login / kein Account
- schwarzes UI
- `ClipWithPaho` mittig in der Topbar
- linke Navigation
- Clip-Länge direkt links wählbar
- globaler Hotkey
- Replay-Buffer mit Bildschirm-/Fensteraufnahme
- Clips werden lokal als WebM gespeichert
- Clip-Bestätigung oben rechts
- Clips-Galerie
- Einstellungen
- Render-Landingpage

## Desktop starten

```bash
cd desktop
npm install
npm start
```

Standard-Hotkey: `Ctrl+Shift+X`

## Render

`web/` ist eine statische Landingpage. Auf Render als Static Site deployen:

- Root Directory: `web`
- Build Command: leer
- Publish Directory: `.`

## Hinweis

Eine Browser-Seite allein kann keinen echten globalen Hotkey und zuverlässiges Desktop-Capture bereitstellen. Deshalb macht die Electron-App das eigentliche Clipping lokal. Die Render-Seite dient als Start-/Download-Seite.
