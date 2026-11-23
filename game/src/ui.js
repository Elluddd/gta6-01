// ui.js — everything that touches the DOM: HUD, toasts, and the
// title / pause / mission / end screens. No game logic lives here.
import { G, STATE } from './state.js';

export const $ = id => document.getElementById(id);

const cashEl = $('cash-val'), starsEl = $('stars'), healthFill = $('health-fill'),
  speedEl = $('speed-val'), vehicleEl = $('vehicle-label'),
  objectiveEl = $('objective'), objectiveText = $('objective-text'),
  objectiveTimer = $('objective-timer'), toastEl = $('toast');

export function toast(msg, dur = 2600) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  G.toastTimer = dur / 1000;
}

export function updateHUD() {
  cashEl.textContent = G.cash;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += '<span class="' + (i < G.wanted ? 'star-on' : 'star-off') + '">★</span>';
  }
  starsEl.innerHTML = stars;
  healthFill.style.width = G.player.health + '%';
  healthFill.style.background = G.player.health > 50 ? 'linear-gradient(90deg,#37d67a,#9dff57)'
    : G.player.health > 25 ? 'linear-gradient(90deg,#f39c12,#f1c40f)' : 'linear-gradient(90deg,#e74c3c,#ff6b6b)';
  const mph = Math.round(Math.abs(G.player.speed || 0) * 0.32);
  speedEl.textContent = G.player.onFoot ? 0 : mph;
  vehicleEl.textContent = G.player.onFoot ? 'ON FOOT'
    : (G.player.car && G.player.car.isPolice ? 'POLICE CRUISER' : 'STOLEN CAR');

  if (G.activeMission) {
    objectiveEl.classList.remove('hidden');
    const m = G.activeMission;
    let txt = m.def.name + ': ';
    if (m.def.id === 0) txt += 'Reach the yellow marker in a car';
    else if (m.def.id === 1) txt += m.stage === 0 ? 'Pick up the passenger (green)' : 'Drop the passenger at the yellow marker';
    else txt += m.reached3 ? 'Lose the cops — reach 0 stars!' : 'Get to 3 stars, then lose the cops';
    objectiveText.textContent = txt;
    objectiveTimer.textContent = Math.ceil(m.timeLeft) + 's';
  } else {
    objectiveEl.classList.add('hidden');
  }

  if (G.toastTimer > 0) {
    G.toastTimer -= 1 / 60;
    if (G.toastTimer <= 0) toastEl.classList.add('hidden');
  }
}

export function showTitle() { $('title-screen').classList.remove('hidden'); }
export function hideTitle() { $('title-screen').classList.add('hidden'); }
export function showHUD() { $('hud').classList.remove('hidden'); }
export function showPause() { $('pause-screen').classList.remove('hidden'); }
export function hidePause() { $('pause-screen').classList.add('hidden'); }
export function showMissionMenu() { $('mission-menu').classList.remove('hidden'); }
export function hideMissionMenu() { $('mission-menu').classList.add('hidden'); }

export function showEnd(kind, text) {
  const title = $('end-title'), body = $('end-text');
  if (kind === 'complete') { title.textContent = '★ MISSION COMPLETE ★'; title.style.color = '#7dff8a'; }
  else if (kind === 'arrested') { title.textContent = 'ARRESTED!'; title.style.color = '#ff5b5b'; }
  else if (kind === 'takenout') { title.textContent = 'TAKEN OUT'; title.style.color = '#ff5b5b'; }
  else if (kind === 'failed') { title.textContent = 'MISSION FAILED'; title.style.color = '#ffb300'; }
  body.textContent = text || '';
  $('end-screen').classList.remove('hidden');
}
export function hideEnd() { $('end-screen').classList.add('hidden'); }
export { STATE };
