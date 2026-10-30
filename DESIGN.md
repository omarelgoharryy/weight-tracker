---
name: Weight Tracker
description: A private daily weight log where the tide moves and the sea level tells the truth.
colors:
  harbour-teal: "#0f4c5c"
  deep-water: "#0b3a47"
  buoy-amber: "#f4b942"
  tide-light: "#7fc4c4"
  tide-day: "#3a7480"
  sea-mist: "#e6f0ee"
  mist-surface: "#f6faf9"
  mist-deep: "#cbe0dd"
  rule-day: "#c2d7d4"
  rule-night: "#2b6878"
  control-day: "#6f9491"
  control-night: "#6ea3ae"
  night-ink: "#0b1e24"
  foam: "#f1f7f6"
  muted-day: "#3a565c"
  muted-night: "#c0d8d8"
  alert-day: "#a8321b"
  alert-night: "#ffc9b8"
typography:
  reading:
    fontFamily: "Figtree Variable, system-ui, -apple-system, sans-serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Figtree Variable, system-ui, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
  heading:
    fontFamily: "Figtree Variable, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Figtree Variable, system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Figtree Variable, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  axis:
    fontFamily: "Figtree Variable, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  control: "10px"
  panel: "12px"
  pill: "999px"
spacing:
  gutter: "20px"
  section: "24px"
  field: "18px"
components:
  button-primary:
    backgroundColor: "{colors.buoy-amber}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 20px"
  button-secondary:
    textColor: "{colors.night-ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.mist-surface}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "10px 12px"
  panel:
    backgroundColor: "{colors.mist-surface}"
    rounded: "{rounded.panel}"
    padding: "16px"
---

# Design System: Weight Tracker

## Overview

**Creative North Star: "Mean Sea Level"**

Daily weight is the tide and the seven-day trend is the sea level. A high tide is not a flood. The whole system exists to show one number going up and down around a line that is quietly heading somewhere, so a heavy morning reads as ordinary water and never as a verdict.

It is a working phone app first: standard controls, four text tabs, one large number. The world enters through colour, one typeface, and the water drawn under the trend. Density stays low on Today and rises on Progress and History, where the full run of data is the point.

The system must not read as clinical or medical.

**Key Characteristics:**

- Harbour teal owns whole regions in both themes.
- Water is drawn: the area under the trend is a deep tone step.
- Flat surfaces separated by tone, with a shadow only on the dialog.
- One typeface, tabular figures everywhere.
- Motion is press feedback plus one ripple when a reading lands.

## Colors

Deep harbour water and sea mist, with one buoy-yellow accent.

### Primary

- **Harbour Teal:** the ground of the night theme, the weigh-in field on Today in both themes, and the setup screen.
- **Deep Water:** water under the trend, inputs and panels on teal, and the night tab bar.

### Secondary

- **Buoy Amber:** the one primary action, the sea level line at night, and the latest reading.

### Tertiary

- **Tide Light / Tide Day:** the daily reading line and dots at night and by day.

### Neutral

- **Sea Mist, Mist Surface, Mist Deep:** the day ground, its panels, and its water and tab bar.
- **Night Ink and Foam:** text by day and at night.
- **Muted Day and Muted Night:** labels and secondary text, each at AA contrast or better on its ground.
- **Rule and Control tones:** row rules, and the stronger edges of controls.

### Named Rules

**The Water Theme Rule.** Anything inside the weigh-in field or setup uses the night tokens in both themes, by overriding them explicitly on the container. `light-dark()` is not used, because the production CSS build rewrites it and breaks this override.

**The Weather Rule.** A gain is never red. The alert colour is for errors the person can fix, never for a change in their body.

**The One Buoy Rule.** Amber is for the one action on a screen and the data that matters. Selected options use ink, not amber.

## Typography

**Body Font:** Figtree Variable (with system-ui), bundled so it works offline.

**Character:** a friendly geometric sans that stays human at 72px and stays legible at 12px.

### Hierarchy

- **Reading** (700, 72px, 1.1): today's weight only.
- **Title** (600, 24px, 1.2): the screen's h1.
- **Heading** (600, 20px, 1.25): section titles; 17px at 600 for measurement names.
- **Body** (400, 17px, 1.45): sentences and values. Never below 17px in inputs, so iOS does not zoom.
- **Label** (500, 15px): field labels and tabs.
- **Axis** (400, 12px): chart ticks and goal labels.

### Named Rules

**The Tabular Rule.** Every figure uses tabular numerals, set once on the body.

## Layout

A single 560px-maximum column with 20px gutters, centred on wide screens. Colour fields and the Today chart break out of the column; on wide screens the Today chart stops at 560px and the teal field runs the full window. The bottom tab bar sits above the safe area. Forms use 18px between fields and screens use 24px between blocks. The chart meets the teal field with no gap.

## Elevation & Depth

Depth is tonal: ground, surface and deep are one family of steps. Nothing has a shadow at rest.

### Shadow Vocabulary

- **Dialog** (`box-shadow: 0 12px 32px rgb(11 30 36 / 30%)`): the only floating thing in the app.

### Named Rules

**The Tone Step Rule.** Separate surfaces by a step of tone, and use 1px rules only between table rows.

## Shapes

Pills for actions, gently curved controls (10px), and panels at 12px. Selected range and choice controls follow the control radius. Charts have no rounded corners: water runs to the edge.

## Components

### Buttons

- **Shape:** full pill (999px).
- **Primary:** Buoy Amber with Night Ink text, 52px tall, full width in forms.
- **Hover / Focus:** a lighter amber on pointer devices only, a 2px focus ring, and scale 0.97 on press over 160ms.
- **Secondary:** transparent with a control-tone edge, 44px tall.
- **Text action:** muted underlined text with a 44px hit area, used for Edit and Delete on list rows.

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** Mist Surface, or Deep Water on teal.
- **Shadow Strategy:** none.
- **Internal Padding:** 16px.

### Inputs / Fields

- **Style:** label above, 48px tall, 1px control-tone edge, 10px radius.
- **Focus:** 2px ring. The weigh-in line turns amber instead.
- **Error:** one sentence in the alert colour above the action.

### Navigation

Four text tabs on a deep-tone bar with no icons. The active tab goes to full ink at weight 700. Tabs do not animate.

### Tide Chart

The signature component. Deep water fills under the sea level line, the daily line swings across it, and the goal is a dashed line with a label. On Today it fills the width with no axes, and the latest reading is marked; saving drops the dot with one ripple. On Progress it has round-number axes, dots and a tap readout. Single-series measurement charts use the line and dots, without water.

## Do's and Don'ts

### Do:

- **Do** keep the sea level as the thickest mark on any weight chart.
- **Do** use the same tokens for both themes, and check both.
- **Do** run the ripple only when a reading is saved, and drop the travel under reduced motion.
- **Do** bundle every font and asset so the app works offline.

### Don't:

- **Don't** make the app read as clinical or medical.
- **Don't** colour a weight gain red, or any body change as an alert.
- **Don't** use `light-dark()` for tokens.
- **Don't** add resting shadows, gradients, glows or glass.
- **Don't** animate tabs, range switches or anything seen many times a day.
