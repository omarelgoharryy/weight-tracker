# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person, the owner, on an iPhone 17 running iOS 26.5 or later. They weigh themselves and log the number, usually once a day, and take body measurements once a week. There are no accounts, sharing or social features.

## Product Purpose

A private installable app for logging weight daily, seeing progress toward a goal weight, tracking weekly body measurements and an estimated body fat percentage, and receiving kind, data-aware encouragement.

Success means logging takes about 5 seconds, progress is clear at a glance, off days feel supported rather than punished, and data is never lost through normal use.

## Positioning

The app reads the seven-day trend rather than the single day, and it never leaves the phone. A bad morning is treated as ordinary movement around a trend that is still heading somewhere.

## Operating Context

The daily use is short: open the app, enter one number, save, read how the trend is going. On opening, the screen gives the weigh-in first, and the trend answer comes right after saving. Weekly measurements are a longer form, on a chosen day (Friday by default). It runs as a home-screen app, often one-handed, offline, and follows the iPhone's light or dark setting. Both themes are first-class.

## Capabilities and Constraints

- Screens: first-run setup, Today, Progress, History, Settings, with a bottom tab bar of four tabs.
- Today: weight field, optional note, encouragement, summary, weekly measurements prompt, install banner, backup nudge, health note.
- Progress: weight graph with daily dots, 7-day trend and goal line, ranges of 1, 3 and 6 months and all time; stats; body fat estimate graph; one graph per measurement.
- History: edit, delete and add past weight and measurement entries.
- Settings: goal, units, height, sex, measurement day, backup export and import.
- All data is on the device in IndexedDB. There is no server or network dependency, and fonts and assets must be cached for offline use.
- Stack: TypeScript, Preact, Vite, vite-plugin-pwa, custom SVG charts, GitHub Pages under `/weight-tracker/`. No chart or UI library.
- Spec: `docs/superpowers/specs/2026-10-30-weight-tracker-design.md`.

## Brand Commitments

Name: Weight Tracker, shown on the home screen as "Weight". Voice: always kind, never shaming, focused on the trend rather than single days. Missed days are never scolded. The visual identity is Friendly Cards: warm, colourful and responsive to touch. The owner rejected two earlier looks for being static and monotone, so colour and motion are requirements, not polish.

The product must not feel clinical or medical. It must not read like a hospital chart or a health-insurance app. The user did not rule out warm, playful or data-rich treatments.

## Evidence on Hand

No real user data, photographs or testimonials are in the repository. User data never leaves the phone, so screenshots use synthetic data.

## Product Principles

1. The trend is the truth; a single day is only weather.
2. Five seconds to log, with nothing in the way.
3. Kind by default: no streak pressure, no scolding, no alarm colours on normal body changes.
4. It belongs to the person, like a private notebook rather than a medical record.
5. Their data is never at risk from normal use.

## Accessibility & Inclusion

Text meets WCAG AA contrast in both themes. Touch targets are at least 44px. Motion respects reduced-motion settings. Weight changes are never communicated by colour alone.
