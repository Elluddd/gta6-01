// city.js — Neon Bay's map: a grid of roads, the blocks between them,
// the buildings on those blocks, and two parks. Pure data + geometry.
// Depends only on util.js.
import { rand, pick } from './util.js';

export const WORLD = 2400;           // the city is WORLD x WORLD px
export const ROAD_W = 84;            // road width
export const VIEW_W = 960, VIEW_H = 600;
export const ROAD_POS = [120, 480, 840, 1200, 1560, 1920, 2280]; // road centre lines

export const CAR_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#ecf0f1', '#2ecc71'];
export const PED_COLORS = ['#ff9ff3', '#feca57', '#48dbfb', '#ff6b6b', '#c8d64f', '#a29bfe', '#fd79a8'];
export const BUILDING_COLORS = ['#3d5a80', '#5d6d7e', '#7b6d8d', '#4a6b5d', '#6b4a5a', '#566573', '#707b7c', '#8a6d3b'];

// Buildings fill the blocks between roads: 1-2 per block.
export const buildings = []; // {x, y, w, h, color}
for (let i = 0; i < ROAD_POS.length - 1; i++) {
  for (let j = 0; j < ROAD_POS.length - 1; j++) {
    const x0 = ROAD_POS[i] + ROAD_W / 2 + 14;
    const y0 = ROAD_POS[j] + ROAD_W / 2 + 14;
    const x1 = ROAD_POS[i + 1] - ROAD_W / 2 - 14;
    const y1 = ROAD_POS[j + 1] - ROAD_W / 2 - 14;
    const bw = x1 - x0, bh = y1 - y0;
    if (rand() < 0.55) {
      buildings.push({ x: x0, y: y0, w: bw, h: bh, color: pick(BUILDING_COLORS) });
    } else if (rand() < 0.5) {
      const cut = x0 + bw * (0.35 + rand() * 0.3);
      buildings.push({ x: x0, y: y0, w: cut - x0 - 10, h: bh, color: pick(BUILDING_COLORS) });
      buildings.push({ x: cut + 10, y: y0, w: x1 - cut - 10, h: bh, color: pick(BUILDING_COLORS) });
    } else {
      const cut = y0 + bh * (0.35 + rand() * 0.3);
      buildings.push({ x: x0, y: y0, w: bw, h: cut - y0 - 10, color: pick(BUILDING_COLORS) });
      buildings.push({ x: x0, y: cut + 10, w: bw, h: y1 - cut - 10, color: pick(BUILDING_COLORS) });
    }
  }
}

// Two parks: green blocks with no buildings.
export const parks = [
  { x: ROAD_POS[2] + 56, y: ROAD_POS[2] + 56, w: 232, h: 232 },
  { x: ROAD_POS[4] + 56, y: ROAD_POS[0] + 56, w: 232, h: 232 },
];
for (const p of parks) {
  for (let i = buildings.length - 1; i >= 0; i--) {
    const b = buildings[i];
    if (b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y) buildings.splice(i, 1);
  }
}

export function onRoad(x, y) {
  for (const r of ROAD_POS) {
    if (Math.abs(x - r) < ROAD_W / 2) return true;
    if (Math.abs(y - r) < ROAD_W / 2) return true;
  }
  return false;
}

export function hitsBuilding(x, y, r) {
  for (const b of buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}

export function nearestRoadAxis(x, y) {
  let best = null, bestD = 1e9;
  for (const r of ROAD_POS) {
    const d = Math.min(Math.abs(x - r), Math.abs(y - r));
    if (d < bestD) {
      bestD = d;
      best = Math.abs(x - r) < Math.abs(y - r) ? { axis: 'v', road: r } : { axis: 'h', road: r };
    }
  }
  return best;
}

// A point on a random road, with the road it sits on.
export function randomRoadPoint() {
  const r = pick(ROAD_POS);
  if (rand() < 0.5) return { x: r, y: 80 + rand() * (WORLD - 160), axis: 'v', road: r };
  return { x: 80 + rand() * (WORLD - 160), y: r, axis: 'h', road: r };
}
