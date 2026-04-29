# Changelog

All notable changes are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 0.6.0

### Added
- **Inbound replies in the application detail view**: suggestion banner above the body when an inbound mail is linked to the open application; the email history block lists sent and inbound mails together
- **Inline status change on the detail pane**: status dropdown above the stage progress applies the change immediately
- **Auto-fill of "Applied at"**: switching an application from `draft` to `applied` (or any later status) backfills the date when it was empty; switching back to `draft` clears it
- **Settings sidebar with deep links**: tabbed nav (Allgemein · Profil · E-Mail · Ollama · Backup · Über) and `#hash` URLs survive reloads. Replaces the masonry layout
- **Ollama model browser** in Settings: per-row Use / Download / Trash-hint actions, grouped by family (Llama, Qwen, Gemma, Mistral, Phi, DeepSeek R1) plus an Andere section for manually-installed names. Free-text custom-pull field at the bottom
- **Streaming pulls with cancel**: model downloads stream `/api/pull` events; UI shows live percent + bytes per layer with an indeterminate pulse during the manifest phase. Cancel button aborts the stream
- **Running-agents indicator** on the Vorschläge page: pulsing accent badge near the count when one or more agent searches are in flight, click jumps to the agents page
- **Parallel scoring per agent search**: configurable 1-4 concurrent LLM requests, slider in the search form with `OLLAMA_NUM_PARALLEL` hint, live `×N` badge on the search row
- **Stop-button feedback**: clicking Stop on a running search now flips into a `STOPPT…` badge with a disabled spinner button until the abort propagates between scorings
- **Draggable splitview** on Applications with persisted width, drag handle between list and detail, double-click resets to default

### Changed
- **Sidebar nav** uses Tabler icons instead of monospaced text tags so the labels are not duplicated
- **Selection highlight** in the Applications table: dedicated `--row-selected` token plus 3px accent strip on the left edge, distinct in light and dark mode
- **Application form drawer**: wider (`min(900px, 92vw)`), responsive grid columns in the Core / Contact / Salary sections, RichTextEditor toolbar wraps to the next line on narrow widths instead of forcing a horizontal scrollbar
- **List loaders only show on first load**: Applications, Agents and Vorschläge pages keep the previous data on screen during background refreshes instead of flashing empty
- **Internal: typed IPC channel map** so a typo or shape mismatch between main and renderer is now a compile error instead of a silent listener miss

### Fixed
- Selection highlight on rows was barely distinguishable from hover in dark mode
- Application form drawer cut off content on smaller windows because the inner grids did not collapse

## 0.5.0

### Added
- **Mail inbox** (new workspace tab): IMAP fetch of unread replies, local-LLM classification that suggests a status and note per application, one-click apply that updates the status and prepends the note. IMAP credentials in the Settings profile, encrypted via OS keychain
- **Structured scoring output**: every candidate now gets keyFacts, concerns and redFlags alongside the score and short verdict. Prominent red-flag panel in the drawer
- **Agent profile steering**: natural-language hard exclude list and a free-text LLM instruction field that rides along on every scoring call
- **Re-score action**: per-candidate button in the drawer and bulk re-score from the candidates list
- **Candidate buckets**: split tabs for suggestions and dismissed with counts, restore and permanent-delete actions
- **Bulk actions on candidates**: favorite, dismiss, restore, hard-delete, and a "delete all below 50" cleanup shortcut
- **Column visibility toggle** on the Applications list (ID, salary, location, match, source, updated)
- **Filter persistence** on Candidates and Applications (min-score, source, status, sort, bucket, columns survive reload)
- **Ollama model catalog**: grouped picker with ~25 curated models (Llama, Qwen, Gemma, Mistral, Phi, DeepSeek R1) plus free-text entry; pull timeout removed so 70B-class downloads do not abort
- **Fit-check in the form header**: compact bar with score, short verdict and a single re-check icon. Replaces the old collapsable section at the bottom of the form
- **Adjustable UI text size**: independent sliders for sidebar and main content in Settings

### Changed
- Job extraction prompt asks for substantial descriptions (4-8 sentences) instead of 1-2; wider context window (16k tokens) and higher output token budget (2048) so long pages no longer truncate the JSON
- HTML stripping for scraped job pages keeps paragraph and list structure so the LLM can see sections instead of one blob
- Scraper summaries slice at 3000 chars instead of 400 so the local scorer has enough context without fetching the full job URL
- Summary block in the candidate drawer collapses past 600 chars with Show more / Show less
- Native window.confirm replaced by Mantine confirm modals for bulk delete and cleanup actions
- Sidebar layout reworked so the Textgröße Sidebar slider scales only the text, not the navbar box
- Remaining German-only strings in the candidate UI, agent profile drawer, settings and confirmations moved into the en/de translation files

### Fixed
- Candidate scoring would truncate structured JSON responses at Ollama's 128-token default output cap
- Padding around the content area no longer scales with the Textgröße Inhalt slider

## 0.4.0

Renamed from "Simple Application Tracker" to **Pitch Tracker**. First public release.

### Added
- **User profile** in Settings: full name, email, phone, signature, CV file picker
- **Email sending** via your own SMTP (Gmail, Outlook, your own host). Pre-filled template with profile variables (company, jobTitle, contactName, name, signature). Optional CV attachment. Test-connection button
- **SMTP password encrypted via OS keychain** (Electron safeStorage: macOS Keychain, Windows DPAPI, Linux libsecret). Existing plaintext passwords are migrated on first launch
- **Rich-text notes** for applications (bold, italic, headings, lists, links, undo/redo) via Mantine Tiptap
- **Backup and restore**: one-click ZIP export/import of all data (apps, agents, profile, CV, config)
- **AI Assistant page**: chat with tool-calling against your local data. Tools: list_applications, count_by_status, stats, list_candidates, search_applications. Default uses llama3.2:3b for low CPU
- **Analytics page**: KPI tiles (total, active, avg match, offers), applications per week (last 12), status donut, match-score distribution, remote/onsite split. Charts via Mantine Charts + recharts
- **CV is copied into app data** on pick (not just referenced by path), so moving the source file doesn't break the email attachment. Included in backup
- Vitest unit tests for the HTML-strip utility used by Excel export. CI now runs tests in addition to build

### Changed
- Excel export **strips HTML from rich-text notes** for clean output
- Sidebar includes Assistant and Analytics entries
- App title, product name, Electron window title, tray tooltip, DMG title all renamed to "Pitch Tracker"
- Bundle identifier changed from `com.chiostudios.simple-application-tracker` to `com.chiostudios.pitch-tracker`
- userData folder renamed from "Simple Application Tracker" to "Pitch Tracker" (migration runs on first launch)
- Applications view toggle labels no longer wrap under the icon

### Fixed
- "List" / "Board" toggle buttons in the Applications page wrapping labels onto a second line

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
