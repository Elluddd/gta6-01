// entities.js — everything that moves: the player on foot and behind the
// wheel, NPC traffic, pedestrians, and the police who chase the player.
import { WORLD, ROAD_POS, ROAD_W, CAR_COLORS, PED_COLORS, hitsBuilding, onRoad, nearestRoadAxis, randomRoadPoint } from './city.js';
import { G } from './state.js';
import { addWanted, damagePlayer } from './rules.js';
import { toast } from './ui.js';
import { clamp, dist, angleTo, angDiff, rand, pick } from './util.js';

/* ---------------- Cars ---------------- */
export function makeCar(x, y, angle, color, isPolice = false) {
  return {
    x, y, angle, speed: 0, color, isPolice,
    axis: Math.abs(angle) < Math.PI / 4 || Math.abs(angle) > 3 * Math.PI / 4 ? 'h' : 'v',
    road: 0, dir: 1, cruise: 90 + rand() * 70,
    w: 44, h: 22, hitCooldown: 0, ramCooldown: 0,
  };
}

export function spawnTraffic(n) {
  for (let i = 0; i < n; i++) {
    const p = randomRoadPoint();
    const angle = p.axis === 'h' ? (rand() < 0.5 ? 0 : Math.PI) : (rand() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const c = makeCar(p.x, p.y, angle, pick(CAR_COLORS));
    c.axis = p.axis;
    c.road = p.road;
    c.dir = angle === 0 || angle === Math.PI / 2 ? 1 : -1;
    c.speed = c.cruise;
    G.cars.push(c);
  }
}

export function spawnPolice() {
  const p = randomRoadPoint();
  const c = makeCar(p.x, p.y, angleTo(p.x, p.y, G.player.x, G.player.y), '#1e3a8a', true);
  c.cruise = 260;
  c.speed = 200;
  G.police.push(c);
}
export function desiredPoliceCount() { return Math.min(G.wanted, 3); }

/* ---------------- Pedestrians ---------------- */
export function spawnPed() {
  const p = randomRoadPoint();
  const a = pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
  return {
    x: clamp(p.x, 40, WORLD - 40), y: clamp(p.y, 40, WORLD - 40),
    angle: a, speed: 22 + rand() * 18, color: pick(PED_COLORS), flee: 0, dead: false,
  };
}
export function spawnPeds(n) { for (let i = 0; i < n; i++) G.peds.push(spawnPed()); }

/* ---------------- Steal / exit a car ---------------- */
function nearestCar(maxD) {
  let best = null, bestD = maxD;
  for (const c of [...G.cars, ...G.police]) {
    const d = dist(G.player.x, G.player.y, c.x, c.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

export function tryEnterExitCar() {
  const p = G.player;
  if (p.onFoot) {
    const c = nearestCar(64);
    if (c) {
      p.onFoot = false;
      p.car = c;
      p.x = c.x; p.y = c.y; p.angle = c.angle; p.speed = 0;
      G.cars = G.cars.filter(x => x !== c);
      G.police = G.police.filter(x => x !== c);
      addWanted(1, c.isPolice ? 'You stole a cop car! +1 star' : 'Car stolen! +1 star');
      toast(c.isPolice ? 'You jacked a POLICE car!' : 'Car stolen!');
    } else {
      toast('No car nearby — walk up to one and press E.');
    }
  } else {
    const c = p.car;
    p.onFoot = true;
    p.x = c.x + Math.cos(c.angle + Math.PI / 2) * 34;
    p.y = c.y + Math.sin(c.angle + Math.PI / 2) * 34;
    p.speed = 0;
    p.angle = c.angle;
    c.speed = 0;
    G.cars.push(c); // it becomes a parked car again
    p.car = null;
  }
}

/* ---------------- Player update ---------------- */
export function updatePlayer(dt, keys) {
  const p = G.player;
  if (p.onFoot) {
    let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (mx || my) {
      const len = Math.hypot(mx, my); mx /= len; my /= len;
      const spd = 170;
      const nx = p.x + mx * spd * dt, ny = p.y + my * spd * dt;
      if (!hitsBuilding(nx, p.y, 12)) p.x = nx;
      if (!hitsBuilding(p.x, ny, 12)) p.y = ny;
      p.angle = Math.atan2(my, mx);
    }
    p.x = clamp(p.x, 20, WORLD - 20);
    p.y = clamp(p.y, 20, WORLD - 20);
  } else {
    const c = p.car;
    const accel = 340, maxSpeed = 460, maxReverse = 160;
    if (keys.up) c.speed += accel * dt;
    else if (keys.down) c.speed -= (c.speed > 0 ? accel * 0.8 : accel * 0.5) * dt;
    else c.speed -= Math.sign(c.speed) * 120 * dt; // drag
    if (keys.brake) c.speed -= Math.sign(c.speed) * 520 * dt;
    if (Math.abs(c.speed) < 4 && !keys.up && !keys.down) c.speed = 0;
    c.speed = clamp(c.speed, -maxReverse, maxSpeed);
    const steer = ((keys.left ? 1 : 0) - (keys.right ? 1 : 0)) * (c.speed >= 0 ? 1 : -1);
    const turnRate = 2.4 * clamp(Math.abs(c.speed) / 120, 0, 1);
    c.angle += steer * turnRate * dt;
    const nx = c.x + Math.cos(c.angle) * c.speed * dt;
    const ny = c.y + Math.sin(c.angle) * c.speed * dt;
    if (hitsBuilding(nx, ny, 20)) {
      if (Math.abs(c.speed) > 220) {
        damagePlayer(Math.floor((Math.abs(c.speed) - 220) / 14));
        toast('CRASH!');
      }
      c.speed *= -0.25;
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
    } else {
      c.x = nx; c.y = ny;
    }
    c.x = clamp(c.x, 20, WORLD - 20);
    c.y = clamp(c.y, 20, WORLD - 20);
    p.x = c.x; p.y = c.y; p.angle = c.angle; p.speed = c.speed;

    // Speeding past the cops is a crime.
    if (Math.abs(c.speed) > 380 && G.police.some(pc => dist(pc.x, pc.y, c.x, c.y) < 420)) {
      addWanted(1, 'Speeding past the cops! +1 star');
    }
    // Hitting pedestrians and cars while driving.
    for (const ped of G.peds) {
      if (!ped.dead && dist(c.x, c.y, ped.x, ped.y) < 30 && Math.abs(c.speed) > 60) {
        ped.dead = true; ped.flee = 0;
        addWanted(1, 'You hit a pedestrian! +1 star');
        damagePlayer(2);
      }
    }
    for (const oc of G.cars) {
      if (dist(c.x, c.y, oc.x, oc.y) < 46 && Math.abs(c.speed) > 180) {
        oc.speed = 0;
        oc.x += Math.cos(c.angle) * 30; oc.y += Math.sin(c.angle) * 30;
        addWanted(1, 'Hit and run! +1 star');
        c.speed *= 0.6;
        damagePlayer(4);
      }
    }
  }
}

/* ---------------- Traffic update ---------------- */
export function updateTraffic(dt) {
  for (const c of G.cars) {
    c.hitCooldown = Math.max(0, c.hitCooldown - dt);
    let dx = 0, dy = 0;
    if (c.axis === 'h') { dx = c.dir; c.angle = c.dir > 0 ? 0 : Math.PI; }
    else { dy = c.dir; c.angle = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    // Slow down if a car is ahead.
    let blocked = false;
    for (const o of G.cars) {
      if (o === c) continue;
      const ahead = (c.axis === 'h' ? (o.x - c.x) * c.dir : (o.y - c.y) * c.dir);
      const side = c.axis === 'h' ? Math.abs(o.y - c.y) : Math.abs(o.x - c.x);
      if (ahead > 0 && ahead < 70 && side < 30) { blocked = true; break; }
    }
    const v = blocked ? 0 : c.cruise;
    c.x += dx * v * dt; c.y += dy * v * dt;
    // At intersections, sometimes turn onto the crossing road.
    const pos = c.axis === 'h' ? c.x : c.y;
    for (const r of ROAD_POS) {
      if (Math.abs(pos - r) < 4 && rand() < 0.02) {
        if (rand() < 0.35) {
          c.axis = c.axis === 'h' ? 'v' : 'h';
          c.road = r;
          c.dir = rand() < 0.5 ? 1 : -1;
          if (c.axis === 'h') c.y = r; else c.x = r;
        }
        break;
      }
    }
    if (c.x < 40) c.x = WORLD - 40; if (c.x > WORLD - 40) c.x = 40;
    if (c.y < 40) c.y = WORLD - 40; if (c.y > WORLD - 40) c.y = 40;
    // Keep the car on its lane.
    if (c.axis === 'h') c.y += (c.road - c.y) * 0.1; else c.x += (c.road - c.x) * 0.1;
  }
}

/* ---------------- Pedestrian update ---------------- */
export function updatePeds(dt) {
  for (const ped of G.peds) {
    if (ped.dead) continue;
    if (ped.flee > 0) {
      ped.flee -= dt;
      ped.x += Math.cos(ped.angle) * 140 * dt;
      ped.y += Math.sin(ped.angle) * 140 * dt;
    } else {
      ped.x += Math.cos(ped.angle) * ped.speed * dt;
      ped.y += Math.sin(ped.angle) * ped.speed * dt;
      if (rand() < 0.005) ped.angle = pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
      // Drift back toward the roads instead of wandering deep into blocks.
      if (!onRoad(ped.x, ped.y) && rand() < 0.02) {
        const nr = nearestRoadAxis(ped.x, ped.y);
        ped.angle = angleTo(ped.x, ped.y, nr.axis === 'v' ? nr.road : ped.x, nr.axis === 'h' ? nr.road : ped.y);
      }
    }
    ped.x = clamp(ped.x, 30, WORLD - 30);
    ped.y = clamp(ped.y, 30, WORLD - 30);
    // Flee from the player's car.
    if (!G.player.onFoot && dist(ped.x, ped.y, G.player.x, G.player.y) < 90) {
      ped.flee = 1.2;
      ped.angle = angleTo(G.player.x, G.player.y, ped.x, ped.y);
    }
  }
  if (G.peds.filter(p => !p.dead).length < 14 && rand() < 0.02) G.peds.push(spawnPed());
  if (G.peds.length > 40) G.peds = G.peds.filter(p => !p.dead).slice(-30);
}

/* ---------------- Police update ---------------- */
export function updatePolice(dt) {
  while (G.police.length < desiredPoliceCount()) spawnPolice();
  if (G.police.length > desiredPoliceCount()) G.police.splice(desiredPoliceCount());
  for (const c of G.police) {
    c.ramCooldown = Math.max(0, c.ramCooldown - dt);
    const target = angleTo(c.x, c.y, G.player.x, G.player.y);
    c.angle += clamp(angDiff(c.angle, target), -2.6 * dt, 2.6 * dt);
    const wantSpeed = 300 + G.wanted * 18;
    c.speed += clamp(wantSpeed - c.speed, -500 * dt, 300 * dt);
    const nx = c.x + Math.cos(c.angle) * c.speed * dt;
    const ny = c.y + Math.sin(c.angle) * c.speed * dt;
    if (!hitsBuilding(nx, ny, 20)) { c.x = nx; c.y = ny; }
    else { c.angle += Math.PI / 2 * dt * 4; c.speed *= 0.7; }
    c.x = clamp(c.x, 20, WORLD - 20); c.y = clamp(c.y, 20, WORLD - 20);
    const d = dist(c.x, c.y, G.player.x, G.player.y);
    if (d < 46 && c.ramCooldown <= 0) {
      c.ramCooldown = 1.2;
      if (G.player.onFoot) {
        if (G.wanted >= 2) {
          G.bustedTimer += 1;
          if (G.bustedTimer >= 2) { G.pendingEnd = 'arrested'; return; }
        } else {
          damagePlayer(8);
          toast('The cops are roughing you up! Run!');
        }
      } else {
        G.player.car.speed *= 0.55;
        G.player.speed = G.player.car.speed;
        damagePlayer(6);
        toast('Police rammed you!');
      }
    }
  }
  if (G.police.length === 0 || !G.police.some(c => dist(c.x, c.y, G.player.x, G.player.y) < 60)) G.bustedTimer = 0;
}
