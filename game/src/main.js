// main.js — wires everything together: screen flow, the game loop,
// reset / end-game, and the debug hooks the play-test uses.
// This is the only module index.html loads; the rest come via imports.
import { WORLD, ROAD_POS } from './city.js';
import { G, STATE, resetState } from './state.js';
import { decayWanted, addWanted } from './rules.js';
import { spawnTraffic, spawnPeds, updatePlayer, updateTraffic, updatePeds, updatePolice, tryEnterExitCar } from './entities.js';
import { MISSIONS, startMission, updateMission } from './missions.js';
import { drawWorld, drawMinimap } from './render.js';
import * as ui from './ui.js';
import { bindInput, keys, openMissionMenu, closeMissionMenu } from './input.js';
import { saveGame, loadSave, hasSave } from './save.js';
import { toast } from './ui.js';

/* ---------------- Screen flow ---------------- */
function startGame() {
  ui.hideTitle();
  ui.showHUD();
  G.state = STATE.PLAYING;
  toast('Welcome to Neon Bay. Press M for missions.');
}
function togglePause() {
  if (G.state === STATE.PLAYING) { G.state = STATE.PAUSED; ui.showPause(); }
  else if (G.state === STATE.PAUSED) { G.state = STATE.PLAYING; ui.hidePause(); }
}
function toggleMissionMenu() {
  if (G.state === STATE.PLAYING) { G.state = STATE.MENU; openMissionMenu(); }
  else if (G.state === STATE.MENU) closeMissionMenuFn();
}
function closeMissionMenuFn() {
  closeMissionMenu();
  if (G.state === STATE.MENU) G.state = STATE.PLAYING;
}
function startMissionIdx(idx) {
  if (startMission(idx)) closeMissionMenuFn();
}
function continueFromEnd() {
  ui.hideEnd();
  G.endKind = null;
  G.state = STATE.PLAYING;
}
// Resume from a localStorage save: fresh world, then saved cash /
// wanted / position / mission progress on top, then straight into play.
function continueSave() {
  resetGame();
  const data = loadSave();
  if (!data) { toast('No save found.'); return; }
  startGame();
  toast('Save loaded — welcome back to Neon Bay.');
}

function resetGame() {
  resetState();
  MISSIONS.forEach(m => { m.state = 'available'; });
  spawnTraffic(14);
  spawnPeds(18);
}

// Busted / taken out / mission over: show the screen, settle the bill,
// and respawn the player with the heat cleared.
function endGame(kind, text) {
  G.endKind = kind;
  G.state = STATE.END;
  if (kind === 'arrested') {
    const fine = Math.min(G.cash, 200);
    text = 'The Neon Bay PD caught you. Your cash was seized ($' + fine + ' fine).';
    G.cash = Math.max(0, G.cash - 200);
  } else if (kind === 'takenout') {
    text = 'You got taken out. The hospital bill cost you $150.';
    G.cash = Math.max(0, G.cash - 150);
  }
  ui.showEnd(kind, text);
  if (kind === 'arrested' || kind === 'takenout') {
    G.wanted = 0;
    G.police = [];
    G.player.health = 100;
    G.player.x = ROAD_POS[3];
    G.player.y = ROAD_POS[3] + 40;
    if (G.player.car) { G.cars.push(G.player.car); G.player.car = null; }
    G.player.onFoot = true;
    G.player.speed = 0;
  }
}

bindInput({
  startGame, togglePause, toggleMissionMenu,
  closeMissionMenu: closeMissionMenuFn,
  startMission: startMissionIdx,
  resetGame,
  continueFromEnd,
  continueSave,
  saveGame: () => { if (saveGame()) toast('Progress saved.'); else toast('Save failed — storage unavailable.'); },
});

/* ---------------- Main loop ---------------- */
let lastT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (G.state === STATE.PLAYING) {
    G.timeSec += dt;
    updatePlayer(dt, keys);
    updateTraffic(dt);
    updatePeds(dt);
    updatePolice(dt);
    decayWanted(dt);
    const result = updateMission(dt);
    if (result) {
      endGame(result.type, result.text);
      if (result.type === 'complete') saveGame(); // auto-save on mission complete
    }
    if (G.pendingEnd) { endGame(G.pendingEnd, ''); G.pendingEnd = null; }
    ui.updateHUD();
    drawMinimap();
    drawWorld();
  } else if (G.state === STATE.TITLE) {
    // Attract mode: slow camera pan over the city behind the title.
    G.timeSec += dt;
    G.cam.x = WORLD / 2 + Math.sin(G.timeSec * 0.05) * 500;
    G.cam.y = WORLD / 2 + Math.cos(G.timeSec * 0.04) * 400;
    const px = G.player.x, py = G.player.y;
    G.player.x = G.cam.x; G.player.y = G.cam.y;
    drawWorld();
    G.player.x = px; G.player.y = py;
  }
}

/* ---------------- Init ---------------- */
resetGame();
if (hasSave()) ui.$('continue-btn').classList.remove('hidden');
requestAnimationFrame(loop);

/* Debug / play-test hooks (harmless in normal play). */
window.__game = {
  get state() { return G.state; },
  get wanted() { return G.wanted; },
  get cash() { return G.cash; },
  get player() { return G.player; },
  get cars() { return G.cars; },
  get police() { return G.police; },
  get peds() { return G.peds; },
  get activeMission() { return G.activeMission; },
  get missions() { return MISSIONS; },
  startGame, startMission: startMissionIdx, addWanted, resetGame,
  saveGame, loadSave, hasSave, continueSave,
  teleport(x, y) {
    G.player.x = x; G.player.y = y;
    if (G.player.car) { G.player.car.x = x; G.player.car.y = y; }
    G.cam.x = x; G.cam.y = y;
  },
  teleportNearCar() {
    const c = G.cars[0];
    if (c) {
      G.player.x = c.x + 30; G.player.y = c.y; G.player.onFoot = true;
      if (G.player.car) { G.cars.push(G.player.car); G.player.car = null; }
      G.cam.x = G.player.x; G.cam.y = G.player.y;
    }
    return !!c;
  },
  pressE() { tryEnterExitCar(); },
};
