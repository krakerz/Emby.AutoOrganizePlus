# Auto Organize+

Emby Server plugin for organizing TV and movies, with absolute episode number support for anime.

## Description

Auto Organize+ is a fork of Emby's stock [Auto Organize](https://github.com/MediaBrowser/Emby.AutoOrganize) plugin that automatically watches folders and moves or copies new TV episodes and movies into your library with configurable folder and file naming. It solves a key problem: the stock plugin only recognizes episodes with season numbers (e.g., `Anime - S01E01`), leaving absolute-numbered releases like `[ASW] Anime - 13 [1080p].mkv` unorganized. Auto Organize+ adds absolute episode rules to map file episode numbers to library seasons, then organizes files the same way as standard S##E## files. Files that already contain a season behave exactly as in the stock plugin.

## Features

- **Absolute episode mapping**: Link series by file name (e.g., `[ASW] Anime`) to library series with ranges that map file episode numbers to seasons and episode numbers
- **Remember from manual organize**: Tick "Remember as absolute episode rule" in the Activity Log's Organize dialog to turn a manual correction into a rule, with a live preview of the mapping
- **Rule editor**: Add, edit and delete rules on the Smart Matches page
- **Side-by-side coexistence**: Runs independently of the stock Auto Organize plugin with its own settings, API routes, and scheduled task
- **Shared database**: Uses the same activity log and smart match database as the stock plugin
- **Manual organize untouched**: One-off organizing still works exactly as before
- **Decimal episode safety**: Episodes like `05.5` are never auto-mapped; neither are files with no matching rule, episode numbers below the first range, or multi-episode files spanning two seasons. They stay in the Activity Log for manual organizing

## Installation

1. Download `Emby.AutoOrganizePlus-vX.Y.Z.zip` from [GitHub Releases](https://github.com/krakerz/Emby.AutoOrganizePlus/releases)
2. Extract `Emby.AutoOrganizePlus.dll` and place it in your Emby Server plugins folder:
   - **Linux package**: `/var/lib/emby/plugins`
   - **Docker**: `/config/plugins`
   - **Windows**: `%AppData%\Emby-Server\programdata\plugins`
3. Restart Emby Server
4. Open **Auto Organize+** from the Emby dashboard main menu

## Building from source

**Prerequisites**: .NET SDK 8 or newer

```bash
git clone https://github.com/krakerz/Emby.AutoOrganizePlus.git
cd Emby.AutoOrganizePlus
dotnet build Emby.AutoOrganize.sln -c Release
```

Output: `Emby.AutoOrganize/bin/Release/netstandard2.0/Emby.AutoOrganizePlus.dll`

GitHub Actions builds every push to `main` and creates a draft release from `CHANGELOG.md`. Preview release notes locally with:
```bash
scripts/release-notes.sh VERSION
```

## Usage

1. Open Auto Organize+ → TV tab
2. Enable organizing and set your watch folder
3. Configure naming patterns:
   - Season folder: e.g., `Season %0s`
   - Episode file: e.g., `S%0sE%0e - %fn.%ext`
4. For anime, go to **Smart Matches** → **Absolute Episode Rules** → Add rule
5. Enter the file series name (as shown in the Activity Log, e.g., `[ASW] Anime`)
6. Enter ranges like:
   - `1 → Season 1, starts at 1` (episodes 1+ map to Season 1, Episode 1+)
   - `13 → Season 2, starts at 1` (episodes 13+ map to Season 2, Episode 1)

Each range applies from its starting file episode until the next range begins; the mapped episode is `starts at + (file episode − from)`. With the ranges above and the episode pattern from step 3, `[ASW] Anime - 13 [1080p].mkv` becomes `Season 02/S02E01 - [ASW] Anime - 13 [1080p].mkv`. If your metadata provider keeps counting in season 2 (S02E13 rather than S02E01), use `13 → Season 2, starts at 13` instead.

Alternatively, organize one file manually from the Activity Log and tick "Remember as absolute episode rule": the season and episode you choose become a range for future files of the same name. Leave it unchecked for one-offs such as mapping an episode to Season 0 / Specials; Season 0 and decimal episodes are never remembered as rules.

## FAQ

**Can I run Auto Organize+ alongside the stock Auto Organize plugin?**

Yes. Both can be installed, but do not enable organizing for the same watch folders in both—they will race for the same files. Disable TV (and/or movie) organizing in the stock plugin to avoid conflicts.

**Why wasn't my `05.5` file sorted?**

Decimal episodes (like `05.5`) are treated as likely specials and are never auto-mapped. Organize them manually.

**My file wasn't picked up by the rule. What name do I enter?**

Enter the parsed series name as it appears in the Activity Log (e.g., `[ASW] Anime` for the file `[ASW] Anime - 13 [1080p].mkv`). Matching is case-insensitive but must be exact.

**Do I lose my stock Auto Organize settings?**

No. On first start, settings are copied once from the stock plugin's config if present. After that, each plugin maintains its own settings independently.

## License

MIT, see [LICENSE](LICENSE).

---

### Notes

Built and maintained with the help of AI.
