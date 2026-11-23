# NEON BAY — Open-World Crime Game

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01) [![Rank](https://make.fun/badge/gta6-01/Elluddd/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01) [![Reward](https://make.fun/badge/gta6-01/Elluddd/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

A top-down open-world crime game in the spirit of GTA 6, built entirely
with static HTML/CSS/JavaScript — no dependencies, no build step, works
offline. Cruise Neon Bay on foot or behind the wheel, steal cars, dodge
(or outrun) the Neon Bay PD, and run three missions: a getaway, a taxi
rush, and losing the heat at 3 wanted stars.

## Run it

Option 1 — serve it locally (recommended):

```bash
node serve.ts        # serves game/ at http://localhost:8080/
# or: node serve.ts --port 3000
```

Option 2 — open `game/index.html` directly in a desktop browser.

## How to play

| Key | Action |
| --- | --- |
| WASD / Arrow keys | Move on foot / drive |
| E | Steal a car / exit car |
| Space | Handbrake |
| M | Missions menu (1/2/3 to start) |
| P | Pause |
| Enter | Start from the title screen |

**Saving** — the SAVE button in the HUD stores your cash, wanted level,
health, position and mission progress in the browser (localStorage).
Progress also auto-saves when a mission completes. On the title screen,
CONTINUE loads the save and drops you back in; a mission that was
in progress restarts with a fresh timer.

**Missions**
1. **Getaway** ($500, 90s) — steal a car and reach the yellow marker.
2. **Taxi Rush** ($800, 120s) — pick up the passenger, drop them at the marker.
3. **Lose the Heat** ($1000, 180s) — hit 3 wanted stars, then lose the cops.

**Wanted system** — stealing cars, hitting pedestrians, hit-and-runs and
speeding past police raise your wanted level (0–5 stars). Police cruisers
spawn and chase you; lay low and the heat cools off. Get caught on foot at
2+ stars and you're **ARRESTED**; crash too hard and you're **TAKEN OUT**.

The HUD shows cash, wanted stars, health, speed and your current objective,
plus a live minimap with roads, police and the mission marker.

## Files

- `main.ts` — the entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — tiny Node stdlib static server for local play
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `game/index.html` — page + HUD + screens
- `game/style.css` — all styling
- `game/src/` — the game, one job per file:
  - `util.js` (seeded RNG + math), `city.js` (map: roads, blocks, buildings),
    `state.js` (shared game state), `rules.js` (wanted system + damage),
    `entities.js` (player, traffic, pedestrians, police),
    `missions.js` (the three jobs), `render.js` (city + minimap drawing),
    `ui.js` (HUD + screens), `input.js` (keyboard + buttons),
    `main.js` (game loop + screen flow)
- `screenshots/` — real play-test captures (first by name is the cover)

## Built with [make.fun](https://make.fun/r/keyprgrc)

An original game: its city, names, characters and story are invented for
this entry. Not affiliated with Rockstar Games or any commercial game.
