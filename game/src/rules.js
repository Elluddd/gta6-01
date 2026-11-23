// rules.js — the wanted system and damage: what counts as a crime,
// how the heat cools off, and what happens when the player gets hurt.
import { G } from './state.js';
import { clamp } from './util.js';
import { toast } from './ui.js';

// Raise the wanted level (0-5 stars). Crimes inside the 2s cooldown
// window don't stack, so one crash isn't five stars at once.
export function addWanted(n, msg) {
  if (G.timeSec - G.lastCrimeAt < 0.4 && G.crimeCooldown > 0) return;
  const before = G.wanted;
  G.wanted = clamp(G.wanted + n, 0, 5);
  G.lastCrimeAt = G.timeSec;
  G.crimeCooldown = 2;
  if (msg && G.wanted > before) toast(msg);
}

// Lay low and the heat fades: after 20 crime-free seconds, lose one
// star every 12 seconds.
export function decayWanted(dt) {
  G.crimeCooldown = Math.max(0, G.crimeCooldown - dt);
  if (G.wanted > 0 && G.timeSec - G.lastCrimeAt > 20) {
    decayWanted._acc = (decayWanted._acc || 0) + dt;
    if (decayWanted._acc > 12) {
      decayWanted._acc = 0;
      G.wanted--;
      toast(G.wanted === 0 ? 'You lost the cops. Heat is off.' : 'Heat cooling down… ' + G.wanted + ' stars left.');
    }
  } else {
    decayWanted._acc = 0;
  }
}

// Hurt the player; at zero health the main loop ends the run.
export function damagePlayer(n) {
  G.player.health = clamp(G.player.health - n, 0, 100);
  if (G.player.health <= 0 && !G.pendingEnd) G.pendingEnd = 'takenout';
}
