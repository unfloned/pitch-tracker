# Simple Application Tracker

Offline-Desktop-App zum Tracken von Jobbewerbungen. Keine Cloud, keine Login, alle Daten lokal. Mit lokaler LLM-Integration für Auto-Fill aus URLs, Passungs-Scoring und automatischen Such-Agenten über Job-Portale.

![platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue)
![electron](https://img.shields.io/badge/electron-33-47848f)
![license](https://img.shields.io/badge/license-MIT-green)

## Features

- **Bewerbungen tracken** — Status-Flow (Entwurf → Beworben → In Prüfung → Gespräch → Angebot), Gehalt, Stack, Kontakte, Notizen, Tags
- **Anforderungen & Benefits** als getaggte Listen pro Bewerbung
- **Auto-Fill aus URL** — Lokale Ollama holt die Seite, extrahiert Firma/Titel/Stack/Profil/Benefits als JSON
- **Passungs-Check** — LLM bewertet die Stelle gegen dein Profil (0–100 Score + Begründung)
- **Agent-System** — Definierbare Job-Suchen (GermanTechJobs, Join.com, einzelne URLs), laufen alle 6h im Hintergrund, neue Funde werden LLM-gescored und im Vorschläge-Tab angezeigt
- **Excel-Export** — Vollständiger .xlsx-Export aller Bewerbungen
- **Tray-Icon** in der Menüleiste mit Quick-Add
- **Drawer-UI** (Bearbeitungsfenster von rechts, nicht Modal)
- **Auto-Updates** via GitHub Releases (electron-updater)
- **100% offline** — SQLite lokal in `~/Library/Application Support/simple-application-tracker/`

## Installation

### Download (empfohlen)

Releases: https://github.com/unfloned/simple-application-tracker/releases

- **macOS:** `.dmg` — DMG öffnen, App in Applications ziehen
- **Windows:** `.exe` — Installer ausführen

### Aus Quellcode

```bash
git clone https://github.com/unfloned/simple-application-tracker.git
cd simple-application-tracker
npm install
npm run dev
```

## LLM-Setup (für Auto-Fill und Scoring)

Die App ist ohne LLM voll nutzbar — Auto-Fill, Passungs-Check und Agent-Scoring brauchen Ollama.

```bash
brew install ollama           # macOS
# oder Desktop-App von https://ollama.com/download
ollama pull llama3.2:3b       # empfohlen für Geschwindigkeit
```

In den App-Einstellungen: Status prüfen, ggf. "Ollama starten" + "Modell herunterladen".

## Stack

- Electron 33 + electron-vite
- React 18 + Mantine 7 (UI)
- better-sqlite3 (lokale Datenbank)
- @deepkit/type (Typdefinitionen)
- exceljs (Excel-Export)
- electron-updater (Auto-Updates via GitHub)
- Ollama-API (lokale LLM)

## Architektur

```
src/
├── shared/              Type-Definitionen (Application, JobSearch, JobCandidate)
├── main/                Electron Main Process
│   ├── index.ts         Window + Tray
│   ├── db.ts            SQLite CRUD
│   ├── llm.ts           Ollama-Client (extract, assessFit, status, start)
│   ├── agents/          Scraper, Scorer, Scheduler
│   ├── updater.ts       electron-updater gegen GitHub
│   ├── ipc.ts           IPC-Handler
│   └── export.ts        Excel-Export
├── preload/             contextBridge API
└── renderer/            React-UI (Mantine)
    ├── App.tsx          AppShell + Tabs
    ├── pages/           Vorschläge-Seite (Agenten)
    └── components/      Drawer, List, Settings, UpdateBanner
```

## Build

```bash
npm run build             # Code-Build
npm run package:mac       # .dmg (unsigniert)
npm run package:win       # .exe (unsigniert)
npm run package:linux     # .AppImage
```

Release über Git Tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions baut dann automatisch macOS + Windows Artefakte und veröffentlicht als Draft-Release.

## Daten-Ort

- SQLite-Datenbanken (Bewerbungen + Agent-Daten): `~/Library/Application Support/simple-application-tracker/`
- Config (Ollama URL/Modell, Agent-Profil): gleicher Ordner

## Roadmap

- [ ] Multi-Language (DE/EN) via i18next
- [ ] Mail-Agent via SMTP — automatische Versendung wenn Passung stimmt
- [ ] Formular-Auto-Fill via Browser-Extension
- [ ] Kanban-View zusätzlich zur Tabelle
- [ ] Kalender-Integration (Interviews)
- [ ] Import/Export als JSON für Backup

## Lizenz

MIT — siehe [LICENSE](LICENSE).
