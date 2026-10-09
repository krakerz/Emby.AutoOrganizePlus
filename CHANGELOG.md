# Changelog

## [Unreleased]

## [1.3.0] — 2026-10-09

### Added
- Auto Organize+ menu entry has a name, icon and server menu section, and opens from the plugin's settings link

## [1.2.0] — 2026-10-04

### Changed
- Smart Matches and Absolute Episode Rules are collapsible sections, collapsed by default

### Fixed
- Smart match delete button shows a trash icon instead of a blank white box
- Absolute episode rule dialog shows the file names label and a styled Add range button

## [1.1.0] — 2026-10-04

### Added
- Organize dialog previews the full target path and file name from the current TV settings

## [1.0.1] — 2026-10-04

### Fixed
- Settings pages save to Auto Organize+'s own settings instead of the stock plugin's
- The "Organize new media files (Auto Organize+)" scheduled task is always listed, so it can be scheduled even with the stock plugin removed

## [1.0.0] — 2026-10-04

### Added
- Absolute episode rules: files without a season (e.g. `[ASW] Anime 13`) are mapped to a season and episode by per-series ranges
- "Remember as absolute episode rule" option in the manual Organize dialog
- Absolute Episode Rules section on the Smart Matches page to add, edit and delete rules
- Settings are imported from the stock Auto Organize plugin on first start

### Changed
- Renamed to Auto Organize+ with its own plugin ID, DLL, pages, API routes and scheduled task so it can be installed alongside the stock plugin
- Settings are stored separately from the stock plugin; the `fileorganization.db` database is still shared

### Fixed
- Decimal episodes like `05.5` are no longer treated as episode 5 for absolute-numbered files
