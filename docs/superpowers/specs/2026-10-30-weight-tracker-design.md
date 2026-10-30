# Weight Tracker: Design Spec

**Date:** 2026-10-30
**Status:** Awaiting user review

## Purpose

A personal app for logging weight daily on an iPhone, graphing progress toward a goal weight, tracking weekly body measurements and an estimated body fat percentage, and receiving kind, data-aware encouragement.

**Success looks like:** logging takes about 5 seconds, progress is clear at a glance, off days feel supported rather than punished, and data is never lost through normal use.

**User and device:** one person, on an iPhone 17 running iOS 26.5 or later. No accounts, sharing or social features.

## Platform decision

An installable web app (PWA) with all data stored on the phone, hosted free on GitHub Pages. There is no server and no login. The app works fully offline once installed.

Chosen over a cloud-backed web app (unneeded complexity, health data on a third-party server) and a native iOS app (annual developer fee, build and distribution overhead).

**Accepted limits:**

- No built-in daily reminder. The user can set a recurring iPhone reminder.
- No Apple Health or smart-scale integration.
- Data is lost with the phone unless a backup was exported, so backup is a core feature.

## First-run setup

A short setup appears on first launch, with goal weight, weight unit, length unit, and optional height and biological sex. Everything can be changed later in Settings. The starting weight is the earliest weight entry.

## Screens

Navigation is a bottom tab bar with four tabs.

### Today (default)

- Large weight field and an optional note. Saving a second time on the same day updates that day's entry.
- Encouragement message (see Encouragement).
- Summary: change since start, percent to goal, current logging streak.
- Weekly measurements card (see Weekly measurements).
- Banner shown when the app is running in a Safari tab rather than installed, with Add to Home Screen instructions. It does not block use.
- Backup nudge when due (see Backup).

### Progress

- **Main graph:** daily weigh-ins as small dots, the 7-day trend as a line, and the goal as a dashed line. Ranges: 1 month, 3 months, 6 months, all time.
- **Stats:** current, starting and lowest weight; total lost; percent to goal; average loss per week; projected goal date; BMI (only when height is set).
- **Body fat graph:** estimated body fat over time and change since the first estimate, labelled as an estimate.
- **Measurement graphs:** one small graph per measurement with change since the first entry.

### History

A reverse-chronological list of weight entries with notes and measurement entries. The user can edit or delete any entry and add an entry for a past date.

### Settings

- Goal weight, kg/lb, cm/in, height, biological sex, measurement day.
- Export backup and import backup, with the last backup date shown.

## Weekly measurements

- **Measurements:** neck, chest, waist, hips, arm, thigh. Each is optional.
- **Measurement day:** Friday by default, changeable in Settings.
- **Card rule:** find the most recent occurrence of the measurement day, on or before today. The card shows if no measurement entry is dated on or after that day. A missed Friday therefore stays visible until logged, and a new user sees the card right after setup, which captures a baseline.
- The card opens a form dated today. One measurement entry per date; saving again on that date updates it.

## Calculations

All calculations are pure functions on stored data.

- **Trend:** for each logged date, the mean of all weights in the 7 calendar days ending on that date. Early dates use whatever data exists.
- **Current weight:** the most recent entry.
- **Percent to goal:** `(start - latest trend) / (start - goal)`, clamped to 0-100. Hidden when the goal is not below the starting weight.
- **Average loss per week:** the change in trend between the first and latest entries, divided by elapsed weeks. Hidden until entries span at least 7 days.
- **Projected goal date:** a least-squares line through trend values from the last 28 days, extended to the goal. Shown only when entries span at least 14 days, the slope is downward and the goal is not yet reached.
- **Streak:** consecutive calendar days with an entry, ending today or yesterday. A streak that ended yesterday still counts until today is over.
- **BMI:** `weight (kg) / height (m)^2`, using the latest trend value.
- **Body fat (US Navy method):** lengths in cm, using the entry's measurements and the height from Settings.
  - Male: `495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450`
  - Female: `495 / (1.29579 - 0.35004 * log10(waist + hips - neck) + 0.22100 * log10(height)) - 450`
  - Requires height, sex, waist and neck, plus hips for the female formula.
  - Calculated on display, not stored.
  - If the inputs are incomplete, the estimate is omitted and the app says what is missing.
  - If the log input is not positive or the result falls outside 2-70%, the estimate is omitted and the app asks the user to recheck the measurements.
  - The UI states that this is an estimate, typically within 3-4 points of a clinical scan, and that the trend matters most.

## Encouragement

- Messages come from a local library, selected by rules based on the user's data. No network or AI service is involved.
- **Tone:** always kind, never shaming, and focused on the trend rather than single days.
- **Situations covered:** first entry, down day, up day while the trend is down, up trend, plateau, active streak, return after missed days, milestone reached.
- **Missed days:** never scolded. Returning gets a warm welcome back.
- The chosen message stays stable for the day and updates after a new entry is saved.

**Milestones:** every 5 kg lost (10 lb when using lb); 25%, 50% and 75% to goal; goal reached. Evaluated on the trend so a single low reading does not trigger them. Each is celebrated once.

**Health note:** if the trend shows loss above 1% of body weight per week for each of the last 3 weeks, the app shows a gentle note suggesting easing off or checking with a doctor. It can be dismissed and reappears at most once a week while the condition holds. The wording is supportive and not a medical diagnosis.

## Technical design

- **Stack:** TypeScript, Preact, Vite. `vite-plugin-pwa` provides the manifest and offline caching. Graphs are a custom lightweight SVG component.
- **Hosting:** GitHub Pages from a public repository. The code is public. User data is never in the repository and never leaves the phone.
- **Appearance:** follows iPhone light and dark mode, respects safe areas and is designed for one-handed use.

### Units

**Storage:** weights are stored in kg and lengths in cm. Input and display are converted, so changing units never alters data.

**Dates:** entries are keyed by local calendar date (`YYYY-MM-DD`), so travel across time zones does not move them.

### Structure

Separate units with clear boundaries:

- `calc`: pure functions for trend, stats, projection, BMI, body fat, streak and milestones.
- `encouragement`: message rules and library.
- `db`: all IndexedDB access.
- `backup`: export, validation and import.
- `screens` and `components`: the UI, with no calculation logic.

### Data model (IndexedDB)

- `weights`: `date` (key), `kg`, `note?`
- `measurements`: `date` (key), `neckCm?`, `chestCm?`, `waistCm?`, `hipsCm?`, `armCm?`, `thighCm?`
- `settings`: `goalKg`, `weightUnit`, `lengthUnit`, `heightCm?`, `sex?`, `measurementDay`, `lastBackupAt?`, `celebratedMilestones`, `healthNoteDismissedAt?`

The app requests persistent storage with `navigator.storage.persist()` where available.

### Backup

- **Export:** creates a JSON file with `version`, `exportedAt`, `settings`, `weights` and `measurements`, offered through the iPhone share sheet so it can be saved to iCloud Drive or Files.
- **Import:** validates the file's structure and values, shows what it contains, and replaces existing data only after confirmation. An invalid file changes nothing and shows a clear error.
- **Nudge:** a gentle prompt on Today when entries exist and the last backup is more than 30 days old, or no backup has ever been made and the first entry is over 30 days old.

### Validation and errors

- **Hard limits:** weight 20-400 kg; each measurement 10-250 cm; height 100-250 cm. Values outside these limits are rejected with a clear message. Future dates are rejected.
- **Typo check:** a weight 5 kg or more away from the most recent earlier entry asks for confirmation.
- **Storage failure:** a save failure tells the user the entry was not saved and keeps their input on screen.

## iPhone behaviours to communicate

- Removing the home-screen icon deletes the app's data. iOS and app updates do not.
- Safari tabs and the installed app keep separate data, so the app should be installed before logging begins.

## Testing

- Unit tests (Vitest) for all `calc`, `encouragement` and `backup` logic, including edge cases such as a single entry, gaps in logging and invalid backup files.
- Browser tests (Playwright) at iPhone size for logging, the measurement card, editing, unit switching, and a backup round trip.
- Final manual check on the user's iPhone: install, log, go offline, export and import. This cannot be automated.

## Out of scope

Daily reminders, Apple Health or smart-scale integration, cloud sync, multiple users, photo tracking, manual body fat entry, calorie or exercise tracking.
