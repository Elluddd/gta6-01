// input.js — keyboard and buttons. It owns the `keys` object the loop
// reads, and calls back into actions main.js supplies (start, pause,
// missions, restart) so this module never imports main.js.
import { tryEnterExitCar } from './entities.js';
import { G, STATE } from './state.js';
import { $, showMissionMenu, hideMissionMenu } from './ui.js';
import { renderMissionMenu } from './missions.js';

export const keys = {};

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'brake', KeyE: 'e', KeyM: 'm', KeyP: 'p', Enter: 'enter', Escape: 'esc',
};

export function bindInput(actions) {
  window.addEventListener('keydown', e => {
    const k = KEYMAP[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
    if (e.code === 'Enter' && G.state === STATE.TITLE) actions.startGame();
    if (e.code === 'KeyP') actions.togglePause();
    if (e.code === 'KeyM') actions.toggleMissionMenu();
    if (e.code === 'Escape' && G.state === STATE.MENU) actions.closeMissionMenu();
    if (G.state === STATE.MENU && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
      actions.startMission(parseInt(e.code.slice(-1), 10) - 1);
    }
    if (e.code === 'KeyE' && G.state === STATE.PLAYING) tryEnterExitCar();
  });
  window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });

  $('start-btn').addEventListener('click', actions.startGame);
  $('continue-btn').addEventListener('click', actions.continueSave);
  $('save-btn').addEventListener('click', actions.saveGame);
  $('resume-btn').addEventListener('click', actions.togglePause);
  $('restart-btn').addEventListener('click', () => { actions.resetGame(); actions.startGame(); });
  $('end-continue-btn').addEventListener('click', actions.continueFromEnd);
  $('end-restart-btn').addEventListener('click', () => { actions.resetGame(); actions.startGame(); });
}

export function openMissionMenu() {
  renderMissionMenu(idx => window.__game.startMission(idx));
  showMissionMenu();
}
export function closeMissionMenu() { hideMissionMenu(); }
