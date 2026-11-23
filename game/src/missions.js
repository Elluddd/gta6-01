// missions.js — the three jobs that pay: Getaway, Taxi Rush, Lose the Heat.
// Each has a timer, a win condition and a cash reward. updateMission()
// returns null while a mission runs, or { type, text } when it ends;
// main.js turns that into the end screen.
import { randomRoadPoint } from './city.js';
import { G } from './state.js';
import { toast, $ } from './ui.js';
import { dist } from './util.js';

export const MISSIONS = [
  {
    id: 0, name: 'Getaway', reward: 500, timeLimit: 90,
    desc: 'Steal a car and reach the yellow marker across town before the timer runs out. The cops hate this one.',
    state: 'available', // available | active | done
  },
  {
    id: 1, name: 'Taxi Rush', reward: 800, timeLimit: 120,
    desc: 'Pick up the passenger at the green marker, then drop them at the destination. No crashing — they tip better alive.',
    state: 'available',
  },
  {
    id: 2, name: 'Lose the Heat', reward: 1000, timeLimit: 180,
    desc: 'Get to 3 wanted stars, then lose the cops completely (0 stars) before the timer ends. Lay low to cool off.',
    state: 'available',
  },
];

function missionMarkerPos() {
  let p;
  do { p = randomRoadPoint(); } while (dist(p.x, p.y, G.player.x, G.player.y) < 900);
  return p;
}

export function startMission(idx) {
  const def = MISSIONS[idx];
  if (!def || def.state === 'done') { toast('Mission already completed.'); return false; }
  if (G.activeMission) { toast('Finish the current mission first — or wait for its timer.'); return false; }
  def.state = 'active';
  G.activeMission = { def, timeLeft: def.timeLimit, stage: 0, marker: missionMarkerPos(), passenger: null, reached3: false };
  if (def.id === 1) {
    G.activeMission.passenger = {
      x: G.activeMission.marker.x + 30, y: G.activeMission.marker.y + 30,
      color: '#2ecc71', pickedUp: false,
    };
  }
  toast('Mission started: ' + def.name + ' — ' + def.timeLimit + 's on the clock!');
  return true;
}

function failMission(reason) {
  const def = G.activeMission.def;
  def.state = 'available';
  G.activeMission = null;
  return { type: 'failed', text: reason || ('Mission failed: ' + def.name) };
}

function completeMission() {
  const def = G.activeMission.def;
  def.state = 'done';
  G.cash += def.reward;
  G.activeMission = null;
  return { type: 'complete', text: 'Mission complete: ' + def.name + ' — +$' + def.reward };
}

export function updateMission(dt) {
  if (!G.activeMission) return null;
  const m = G.activeMission;
  m.timeLeft -= dt;
  if (m.timeLeft <= 0) return failMission('Time ran out on "' + m.def.name + '".');
  if (m.def.id === 0) {
    if (!G.player.onFoot && dist(G.player.x, G.player.y, m.marker.x, m.marker.y) < 60) return completeMission();
  } else if (m.def.id === 1) {
    if (m.stage === 0) {
      if (dist(G.player.x, G.player.y, m.passenger.x, m.passenger.y) < 50) {
        m.stage = 1;
        m.marker = missionMarkerPos();
        m.passenger.pickedUp = true;
        toast('Passenger aboard! Take them to the yellow marker.');
      }
    } else if (dist(G.player.x, G.player.y, m.marker.x, m.marker.y) < 60) {
      return completeMission();
    }
  } else if (m.def.id === 2) {
    if (G.wanted >= 3) m.reached3 = true;
    if (m.reached3 && G.wanted === 0) return completeMission();
  }
  return null;
}

export function renderMissionMenu(onStart) {
  const list = $('mission-list');
  list.innerHTML = '';
  MISSIONS.forEach((m, i) => {
    const row = document.createElement('div');
    row.className = 'mission-row' + (m.state === 'done' ? ' done' : '')
      + (G.activeMission && G.activeMission.def.id === m.id ? ' active' : '');
    const status = m.state === 'done' ? '✓ COMPLETED'
      : (G.activeMission && G.activeMission.def.id === m.id ? '● IN PROGRESS' : 'Press ' + (i + 1));
    row.innerHTML = '<div class="num">' + (i + 1) + '</div><div><div class="m-title">' + m.name +
      ' — $' + m.reward + ' &nbsp;·&nbsp; ' + m.timeLimit + 's</div><div class="m-desc">' + m.desc + '</div></div>' +
      '<div class="m-status">' + status + '</div>';
    row.addEventListener('click', () => onStart(i));
    list.appendChild(row);
  });
}
