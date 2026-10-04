# Changelog

## [Unreleased]

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
