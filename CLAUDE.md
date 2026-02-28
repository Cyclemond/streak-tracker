# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Streek** — a mobile-first PWA habit streak tracker, installable on Android via "Add to Home Screen". Live at `https://cyclemond.github.io/streak-tracker/` (GitHub Pages, auto-deploys from `main`).

No build step, no dependencies, no framework. Open `index.html` directly in a browser to develop.

## Git workflow

Every change must be committed with a clear message and pushed to GitHub immediately:

```bash
git add <files>
git commit -m "Short imperative summary"
git push
```

Never batch unrelated changes into one commit. Commit each logical change separately.

## Architecture

All logic lives in `app.js` as a single IIFE. There is no module system.

**Data model** — one `habits` key in `localStorage`:
```json
[{ "id": "abc123", "name": "Exercise", "lastCheckIn": "2026-02-27", "streak": 5, "bestStreak": 12 }]
```

**Rendering** — fully imperative. `renderGrid(pulseId?)` clears and rebuilds `#grid` from scratch on every state change. `makeCard(habit, pulseId)` constructs and returns a card DOM element with its event listeners attached inline.

**Streak logic** — `lastCheckIn` is a `YYYY-MM-DD` string. On check-in: if `lastCheckIn === yesterdayStr()` → streak+1, else → reset to 1. `displayStreak()` returns 0 for display if the streak is already broken (lastCheckIn is neither today nor yesterday), without modifying stored data.

**Overlays** — two overlay patterns used:
- `modal-backdrop` (centered): add/rename habit, toggled via `.open` class
- `sheet-backdrop` (bottom sheet slide-up): three-dot action menu per card, toggled via `.open` class

**PWA / offline** — `sw.js` uses a cache-first strategy. The cache name is `streak-v2`. **Bump the version string whenever cached assets change** so existing installs pick up updates.

## Icons

`gen_icons.py` generates `icon-192.png` and `icon-512.png` using only Python stdlib (no Pillow or ImageMagick needed). Run it from the project root after any icon design changes:

```bash
python3 gen_icons.py
```

Icons are full-bleed (no dark border) so Android's launcher shape mask applies cleanly. The checkmark is sized to stay within the PWA maskable safe zone (inner 80%).
