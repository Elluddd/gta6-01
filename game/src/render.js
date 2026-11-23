// render.js — draws the city, the cars, the people and the minimap.
// Depends only on city.js and state.js; the main loop owns the camera.
import { WORLD, ROAD_W, ROAD_POS, VIEW_W, VIEW_H, buildings, parks } from './city.js';
import { G } from './state.js';
import { clamp, dist } from './util.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const minimap = document.getElementById('minimap');
const mctx = minimap.getContext('2d');

function drawCar(c, isPlayerCar) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(-22, -11 + 3, 44, 22);
  ctx.fillStyle = c.color;
  ctx.fillRect(-22, -11, 44, 22);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillRect(-6, -10, 12, 20); // windshield band
  ctx.fillStyle = c.isPolice ? '#0f172a' : 'rgba(0,0,0,.55)';
  ctx.fillRect(6, -9, 8, 18);
  ctx.fillStyle = '#ffe27a'; // headlights
  ctx.fillRect(20, -9, 3, 5); ctx.fillRect(20, 4, 3, 5);
  if (c.isPolice) {
    const flash = Math.floor(G.timeSec * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2e2e' : '#2e7bff';
    ctx.fillRect(-4, -11, 8, 5);
    ctx.fillStyle = flash ? '#2e7bff' : '#ff2e2e';
    ctx.fillRect(-4, 6, 8, 5);
  }
  if (isPlayerCar) {
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.strokeRect(-24, -13, 48, 26);
  }
  ctx.restore();
}

function drawPed(ped) {
  ctx.save();
  ctx.translate(ped.x, ped.y);
  if (ped.dead) {
    ctx.rotate(0.6);
    ctx.fillStyle = ped.color;
    ctx.fillRect(-7, -4, 14, 8);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.arc(0, 2, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ped.color;
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(Math.cos(ped.angle) * 3, Math.sin(ped.angle) * 3, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlayerOnFoot() {
  const p = G.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.arc(0, 2, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(Math.cos(p.angle) * 4, Math.sin(p.angle) * 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawWorld() {
  G.cam.x += (G.player.x - G.cam.x) * 0.12;
  G.cam.y += (G.player.y - G.cam.y) * 0.12;
  const vx = clamp(G.cam.x - VIEW_W / 2, 0, WORLD - VIEW_W);
  const vy = clamp(G.cam.y - VIEW_H / 2, 0, WORLD - VIEW_H);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(-vx, -vy);

  // Grass base + parks.
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(vx, vy, VIEW_W, VIEW_H);
  ctx.fillStyle = '#3f7a33';
  for (const p of parks) ctx.fillRect(p.x, p.y, p.w, p.h);

  // Roads, sidewalks, lane dashes.
  ctx.fillStyle = '#33363b';
  for (const r of ROAD_POS) {
    ctx.fillRect(0, r - ROAD_W / 2, WORLD, ROAD_W);
    ctx.fillRect(r - ROAD_W / 2, 0, ROAD_W, WORLD);
  }
  ctx.fillStyle = '#6b7280';
  for (const r of ROAD_POS) {
    ctx.fillRect(0, r - ROAD_W / 2 - 10, WORLD, 10);
    ctx.fillRect(0, r + ROAD_W / 2, WORLD, 10);
    ctx.fillRect(r - ROAD_W / 2 - 10, 0, 10, WORLD);
    ctx.fillRect(r + ROAD_W / 2, 0, 10, WORLD);
  }
  ctx.fillStyle = '#33363b';
  for (const r of ROAD_POS) {
    ctx.fillRect(0, r - ROAD_W / 2, WORLD, ROAD_W);
    ctx.fillRect(r - ROAD_W / 2, 0, ROAD_W, WORLD);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 22]);
  ctx.beginPath();
  for (const r of ROAD_POS) {
    ctx.moveTo(0, r); ctx.lineTo(WORLD, r);
    ctx.moveTo(r, 0); ctx.lineTo(r, WORLD);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Buildings (skip off-screen ones) with lit windows.
  for (const b of buildings) {
    if (b.x + b.w < vx - 20 || b.x > vx + VIEW_W + 20 || b.y + b.h < vy - 20 || b.y > vy + VIEW_H + 20) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fillRect(b.x, b.y, b.w, 8);
    ctx.strokeStyle = 'rgba(0,0,0,.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,235,120,.5)';
    for (let wx = b.x + 14; wx < b.x + b.w - 14; wx += 34) {
      for (let wy = b.y + 16; wy < b.y + b.h - 14; wy += 34) {
        ctx.fillRect(wx, wy, 12, 14);
      }
    }
  }

  // Mission marker (pulsing gold) + passenger marker (green).
  if (G.activeMission) {
    const m = G.activeMission.marker;
    const pulse = 26 + Math.sin(G.timeSec * 5) * 8;
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(m.x, m.y, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,215,0,.25)';
    ctx.beginPath(); ctx.arc(m.x, m.y, pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
    ctx.fillText('★', m.x, m.y + 7);
    if (G.activeMission.def.id === 1 && G.activeMission.stage === 0 && G.activeMission.passenger) {
      const pg = G.activeMission.passenger;
      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(pg.x, pg.y, 20 + Math.sin(G.timeSec * 5) * 4, 0, Math.PI * 2); ctx.stroke();
    }
  }

  for (const ped of G.peds) drawPed(ped);
  for (const c of G.cars) drawCar(c, false);
  for (const c of G.police) drawCar(c, false);
  if (!G.player.onFoot && G.player.car) drawCar(G.player.car, true);
  if (G.player.onFoot) drawPlayerOnFoot();

  ctx.restore();

  // Red flash at the edges when the cops are right on top of you.
  if (G.wanted > 0) {
    const near = G.police.some(c => dist(c.x, c.y, G.player.x, G.player.y) < 260);
    if (near && Math.floor(G.timeSec * 4) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,0,0,.06)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}

export function drawMinimap() {
  const s = 180 / WORLD;
  mctx.clearRect(0, 0, 180, 180);
  mctx.fillStyle = '#122612'; mctx.fillRect(0, 0, 180, 180);
  mctx.fillStyle = '#3a3a3a';
  for (const r of ROAD_POS) {
    mctx.fillRect(0, r * s - ROAD_W * s / 2, 180, ROAD_W * s);
    mctx.fillRect(r * s - ROAD_W * s / 2, 0, ROAD_W * s, 180);
  }
  mctx.fillStyle = '#5d6d7e';
  for (const b of buildings) mctx.fillRect(b.x * s, b.y * s, Math.max(1, b.w * s), Math.max(1, b.h * s));
  if (G.activeMission) {
    mctx.fillStyle = '#ffd700';
    mctx.beginPath(); mctx.arc(G.activeMission.marker.x * s, G.activeMission.marker.y * s, 5, 0, Math.PI * 2); mctx.fill();
    if (G.activeMission.def.id === 1 && G.activeMission.stage === 0 && G.activeMission.passenger) {
      mctx.fillStyle = '#2ecc71';
      mctx.beginPath(); mctx.arc(G.activeMission.passenger.x * s, G.activeMission.passenger.y * s, 4, 0, Math.PI * 2); mctx.fill();
    }
  }
  mctx.fillStyle = '#3b82f6';
  for (const c of G.police) { mctx.beginPath(); mctx.arc(c.x * s, c.y * s, 3, 0, Math.PI * 2); mctx.fill(); }
  mctx.fillStyle = '#7dff8a';
  mctx.beginPath(); mctx.arc(G.player.x * s, G.player.y * s, 4, 0, Math.PI * 2); mctx.fill();
  mctx.strokeStyle = '#fff'; mctx.lineWidth = 1;
  mctx.beginPath(); mctx.arc(G.player.x * s, G.player.y * s, 4, 0, Math.PI * 2); mctx.stroke();
}
