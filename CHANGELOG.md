# Changelog

All notable changes are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 0.3.0

### Added
- Onboarding wizard on first run (4 steps: welcome, profile, LLM setup, shortcuts overview)
- Global keyboard shortcut Cmd+Shift+N for quick-add from the clipboard URL
- Keyboard shortcuts inside the app: Cmd+N new entry, Cmd+F focus search, Cmd+S save form, Cmd+E export, Cmd+, settings, Esc close drawer
- Tray menu shows latest 5 candidates; click opens the job URL in the browser
- Follow-up reminder: native notification when an applied status is older than 7 days without change; click opens the application
- Candidates filter bar: search, source multi-select, status filter, sort by score or date or company, min score
- Sortable table headers for applications (status, match, company, location, salary)
- Dynamic badge on the Candidates tab showing count of new candidates; resets on tab click
- Interview tracking per application (string list, searchable, Accordion section with counter badge)
- Toggle switches for auto-import threshold and minimum salary in the scoring profile (instead of using 0 as "off")
- Empty-state call-to-action button on the applications table

### Changed
- Application form now uses Mantine Accordion for collapsible sections; sections auto-expand when they contain values
- Auto-import threshold defaults to 85 when the toggle is enabled, 0 (off) when disabled
- Quick-add listener reads URL from clipboard on trigger and prefills the form

### Fixed
- Drawer closed on Escape via new hotkey

## 0.2.1

### Fixed
- Infinite re-render loop in the status footer that pinned the renderer process at 100% CPU even when idle. `searchLabels` was stored in React state with itself as a `useEffect` dependency, causing the effect to refire and refetch on every run. Moved to a `useRef` and cleared the dependency array.
- `updater:currentVersion` and `updater:checkNow` IPC handlers were only registered when the app was packaged, so clicking "Check for update" in dev mode threw "No handler registered". Handlers are now always registered and return a dev sentinel when `app.isPackaged` is false.

## 0.2.0

### Added
- Multi-language UI (English and German) with a language switcher in Settings, including locale-aware Excel export
- Linux AppImage and deb builds in the release workflow
- macOS code signing and notarization support in the release workflow (env-var-driven, no-op when secrets are not set)
- `CHANGELOG.md` and automated release notes extraction in the workflow
- Light, dark and system theme switcher, persisted in localStorage
- Sticky top header with tabs that stay visible while scrolling
- Sticky status footer with live agent progress, Ollama status, and application counter
- Live updates in the Candidates tab while an agent is running (IPC events push new candidates into the list immediately)
- Cancel button for running agents
- Configurable schedule interval per search (manual, hourly, 3h, 6h, 12h, daily)
- Deduplication of candidates across sources via company and title
- Candidate age display ("found 2h ago")
- Favorite star toggle for candidates
- Bulk actions (star, dismiss) for multiple candidates at once
- Agent run log drawer showing history of runs with stats and errors
- Auto-import threshold in the scoring profile: candidates at or above the threshold become draft applications automatically
- TagsInput for desired stack and anti-stack in the scoring profile
- Target job sources expanded to GermanTechJobs (RSS), Remotive (API), Arbeitnow (API), RemoteOK (API), We Work Remotely (RSS) and single URLs
- Multi-select sources per search
- Screenshots added to the repository

### Changed
- All modals replaced with right-side drawers
- Agent run data persistence: runs are logged to a dedicated `agent_runs` table
- Application table polished: coloured status dots, match score badge with tooltip, location pin icon, remote badge, salary shown as "60-85k EUR"
- Default LLM model recommendation changed from `qwen2.5:7b-instruct` to `llama3.2:3b` for lower CPU load

### Fixed
- `agent_runs` table sometimes missing because an invalid `CREATE INDEX` statement aborted the init transaction; schema init is now split into individual `db.exec` calls
- Infinite loader on Matches list and Run log drawer when IPC calls failed
- Agent scraper returning zero results: replaced fragile HTML regex with RSS feeds and JSON APIs
- Light theme label in Settings segmented control wrapped to two lines
- Status footer badges clipped vertically due to too small footer height
- GitHub Actions release step failed with 403; added `contents: write` permission
- Electron-store v10 ESM incompatibility with CommonJS main process (downgraded to v8)
- Native module `better-sqlite3` rebuilt against Electron ABI via `postinstall`

## 0.1.1

### Fixed
- Release workflow permissions (403 on release creation)
- Data migration from legacy `bewerbungen-tracker` folder to `simple-application-tracker`
- README rewritten in English, em-dashes removed

## 0.1.0

### Added
- Initial release
- Application tracking with status flow, salary, contacts, notes, tags, priority
- Local LLM auto-fill from job URL
- Fit check button that scores the role against your profile
- Agent system with search scheduler
- Excel export
- Tray icon with quick-add
- Auto-updates via GitHub Releases
