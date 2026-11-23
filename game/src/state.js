// state.js — the one shared mutable game state. Every module imports G
// and reads/writes its fields, so there are no circular imports.
import { ROAD_POS } from './city.js';

export const STATE = { TITLE: 'title', PLAYING: 'playing', PAUSED: 'paused', MENU: 'menu', END: 'end' };

export const G = {
  state: STATE.TITLE,
  endKind: null,        // 'complete' | 'arrested' | 'takenout' | 'failed'
  pendingEnd: null,     // set by rules/entities; the main loop turns it into endGame()
  timeSec: 0,
  cash: 500,
  wanted: 0,
  lastCrimeAt: -1e9,
  crimeCooldown: 0,
  bustedTimer: 0,
  player: {
    x: ROAD_POS[3], y: ROAD_POS[3] + 40, angle: -Math.PI / 2,
    speed: 0, onFoot: true, health: 100, car: null,
  },
  cars: [],             // NPC traffic
  peds: [],
  police: [],
  cam: { x: ROAD_POS[3], y: ROAD_POS[3] + 40 },
  toastTimer: 0,
  activeMission: null,  // { def, timeLeft, stage, marker, passenger, reached3 }
};

export function resetState() {
  G.state = STATE.TITLE;
  G.endKind = null;
  G.pendingEnd = null;
  G.timeSec = 0;
  G.cash = 500;
  G.wanted = 0;
  G.lastCrimeAt = -1e9;
  G.crimeCooldown = 0;
  G.bustedTimer = 0;
  G.player.x = ROAD_POS[3];
  G.player.y = ROAD_POS[3] + 40;
  G.player.angle = -Math.PI / 2;
  G.player.speed = 0;
  G.player.onFoot = true;
  G.player.health = 100;
  G.player.car = null;
  G.cars = [];
  G.peds = [];
  G.police = [];
  G.cam.x = G.player.x;
  G.cam.y = G.player.y;
  G.toastTimer = 0;
  G.activeMission = null;
}
