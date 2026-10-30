---
name: Weight Tracker
description: A warm, colourful daily weight log where every tap answers back.
colors:
  action: "#0d7f7d"
  action-night: "#2dd4c4"
  action-text: "#0a6b69"
  action-text-night: "#7be8dc"
  on-action: "#ffffff"
  on-action-night: "#04211f"
  card-day: "#ffffff"
  ink-day: "#12302f"
  muted-day: "#3f5f5d"
  ink-night: "#e9fbf8"
  muted-night: "#bfdeda"
  ground-today: "#cdf1ec"
  ground-progress: "#ffefc2"
  ground-history: "#e6f3c4"
  ground-settings: "#dcebff"
  ground-today-night: "#0c3336"
  ground-progress-night: "#362909"
  ground-history-night: "#26340c"
  ground-settings-night: "#12294a"
  card-today-night: "#124a4d"
  card-progress-night: "#4d3a12"
  card-history-night: "#384c14"
  card-settings-night: "#1d3d66"
  soft-today: "#9fe3da"
  soft-progress: "#ffdf8a"
  soft-history: "#cfe68f"
  soft-settings: "#bcd8fb"
  tint-1-night: "#14696b"
  tint-2-night: "#6f5414"
  tint-3-night: "#4a6a1a"
  tint-4-night: "#265a92"
  hue-neck: "#6a7d10"
  hue-chest: "#2a6fc4"
  hue-waist: "#0d7f7d"
  hue-hips: "#c23c86"
  hue-arm: "#a86a00"
  hue-thigh: "#2b8a4e"
  hue-fat: "#a8326b"
  hue-neck-night: "#c9dc6e"
  hue-chest-night: "#7db6ff"
  hue-waist-night: "#4fe0d0"
  hue-hips-night: "#f58cc4"
  hue-arm-night: "#f2c04f"
  hue-thigh-night: "#7fe0a0"
  hue-fat-night: "#f08ab8"
  alert-day: "#b4234a"
  alert-night: "#ffc0cf"
typography:
  reading:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "64px"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 1.15
  figure:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 1.15
  heading:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 900
    lineHeight: 1.25
  body:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.4
  control:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 500
  label:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  small:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  tab:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  axis:
    fontFamily: "Nunito Variable, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  bar: "8px"
  track: "6px"
  field: "14px"
  chip: "10px"
  card: "22px"
  sheet: "28px"
  control: "20px"
  full: "999px"
spacing:
  gutter: "16px"
  gap: "12px"
  card: "16px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.full}"
    height: "54px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.ground-today}"
    textColor: "{colors.ink-day}"
    rounded: "{rounded.full}"
    height: "46px"
    padding: "0 18px"
  input:
    backgroundColor: "{colors.ground-today}"
    textColor: "{colors.ink-day}"
    rounded: "{rounded.field}"
    height: "48px"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.card-day}"
    textColor: "{colors.ink-day}"
    rounded: "{rounded.card}"
    padding: "16px"
---

# Design System: Weight Tracker

## Overview

Friendly Cards: soft white cards on a flat colour ground, plain words, and a screen that reacts to every touch. The app is a private daily habit on an iPhone, used one-handed for a few seconds, in the morning light or in the dark. It should feel like a kind friend, never a hospital chart.

Two earlier looks were rejected for being static and monotone, so colour and motion are requirements. Every screen owns a colour, every pressable thing answers, and data arrives by moving.

## Colors

Each tab owns one ground: aqua for Today, honey for Progress, pistachio for History, sky for Settings. Dark mode keeps the same four hues as deep grounds with saturated cards, never a neutral grey. The ground crossfades when the tab changes and the status bar follows it. `--soft` and `--field` derive from the ground, so bars, selected states and fields shift with each screen.

Teal is the one action colour. It marks what can be pressed, the selected bar and the goal fill. Each measurement owns one hue on every screen, and stat tiles cycle through the four grounds as tints.

No red or alarm colour on normal weight change. A gain and a loss differ by their sign, never by colour alone.

## Typography

Nunito only, self-hosted so it works offline. Weight does the hierarchy: 900 for titles, headings and figures, 500 for reading. Its digits are all the same width, so numbers do not jitter while they count. The weigh-in figure is the largest thing on any screen at 64px.

## Layout

One column, 16px gutters, 12px between cards, at most 480px wide. Today follows the job: date and a kind line, weigh-in, the week, the goal. The bottom tab bar is always in thumb reach and clears the home indicator.

## Elevation & Depth

Flat. Cards separate from the ground by colour, with no resting shadow and no border. Rows split with a 1px line in the field colour. Sheets float by dimming the page behind them. There is no glass or blur on surfaces.

## Shapes

Large, soft and consistent: 22px cards, 14px fields, full pills for buttons, 28px on the top of sheets. Nested shapes step down in radius.

## Components

- **Primary button:** full-width teal pill, 54px. After saving it shows a drawn tick and "Saved", then settles back.
- **Week bars:** seven tappable bars, each showing that day's reading. Heights show the week's shape rather than absolute weight. Days without an entry show a quiet stub, and today's stub pulses gently. Missing days are never scolded.
- **Goal track:** 12px fill at the true percentage, labelled at both ends.
- **Stat tiles:** two columns of tinted tiles. An odd last tile takes the full width.
- **Segmented range:** a sliding marker on a card-coloured track.
- **Confirmation sheet:** slides up from the bottom, always in thumb reach.
- **Tab bar:** a pill marker slides between icons and takes the current tab's colour.

## Do's and Don'ts

Do:

- Give every pressable element `scale(0.97)` on press, 160ms.
- Use `--ease-out` for entrances, and keep the spring for things a finger moved plus the week bars.
- Stagger cards by 45ms, and slide a new screen in from the side its tab sits on.
- Fold a deleted row away before removing it.
- Keep sparks on save only. Saving happens once a day, so it can afford delight.
- Honour Reduced Motion: fades stay, travel and sparks go.
- Keep 4.5:1 contrast on every ground in both themes, and 44px touch targets.

Don't:

- Don't return to one colour across screens, or to grey dark-mode cards.
- Don't use reddish orange, peach or terracotta anywhere. The owner rejected them.
- Don't use the action colour on anything that can't be pressed, other than the selected bar and goal fill.
- Don't bounce entrances, and don't animate from `scale(0)`.
- Don't show streak pressure, scolding copy or alarm colours.
- Don't add gradients, glass, glows, kickers, or icons in tinted squares.
