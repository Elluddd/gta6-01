// save.js — localStorage save / load for NEON BAY. Small by design:
// cash, wanted level, health, player position, and which missions are
// done. An in-progress mission is NOT resumed mid-timer — on load it
// restarts fresh with a full timer. Cars and police are not persisted;
// a player saved inside a car resumes on foot at the same spot.
import { G } from './state.js';
import { MISSIONS, startMission } from './missions.js';

const KEY = 'neonbay.save.v1';

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function saveGame() {
  try {
    const data = {
      v: 1,
      cash: G.cash,
      wanted: G.wanted,
      health: G.player.health,
      x: G.player.x,
      y: G.player.y,
      angle: G.player.angle,
      done: MISSIONS.filter(m => m.state === 'done').map(m => m.id),
      activeMission: G.activeMission ? G.activeMission.def.id : null,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadSave() {
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  if (!data || data.v !== 1) return null;
  G.cash = typeof data.cash === 'number' ? data.cash : 500;
  G.wanted = typeof data.wanted === 'number' ? data.wanted : 0;
  G.player.health = typeof data.health === 'number' ? data.health : 100;
  G.player.x = data.x;
  G.player.y = data.y;
  G.player.angle = typeof data.angle === 'number' ? data.angle : -Math.PI / 2;
  // Car positions are not persisted: resume on foot at the saved spot.
  G.player.onFoot = true;
  G.player.car = null;
  G.player.speed = 0;
  G.cam.x = data.x;
  G.cam.y = data.y;
  G.activeMission = null;
  (data.done || []).forEach(id => { if (MISSIONS[id]) MISSIONS[id].state = 'done'; });
  if (data.activeMission != null && MISSIONS[data.activeMission]
    && MISSIONS[data.activeMission].state !== 'done') {
    startMission(data.activeMission); // restarts fresh, full timer
  }
  return data;
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
