// Coralina Bay: Sunset Syndicate — Dynamic Circular Radar Minimap & Interactive District World Map
import { DISTRICTS, INTERACTIVE_LOCATIONS } from './config.js';
import { getCurrentStage } from './missions.js';

export function drawMinimap(canvas, game) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2 - 2;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Ocean & city base
  ctx.fillStyle = '#071a2e';
  ctx.fillRect(0, 0, w, h);

  const pPos = game.getPlayerPos();
  const scale = 0.85;
  const toMapX = (wx) => cx + (wx - pPos.x) * scale;
  const toMapY = (wz) => cy + (wz - pPos.z) * scale;

  // Landmass west of coast
  const coastX = toMapX(54);
  ctx.fillStyle = '#182438';
  ctx.fillRect(0, 0, Math.max(0, coastX), h);

  // Sandy beach strip
  const beachStart = toMapX(14);
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(beachStart, 0, Math.max(0, coastX - beachStart), h);

  // Main Marina Boulevard & cross avenues
  ctx.fillStyle = '#334155';
  ctx.fillRect(toMapX(-11), 0, 22 * scale, h);
  ctx.fillRect(0, toMapY(52), toMapX(11), 16 * scale);
  ctx.fillRect(0, toMapY(-68), toMapX(11), 16 * scale);

  // Bay Bridge line
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(toMapX(-60), toMapY(-138));
  ctx.lineTo(toMapX(140), toMapY(-138));
  ctx.stroke();

  // Center dashed yellow line
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(toMapX(0), 0);
  ctx.lineTo(toMapX(0), h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Interactive Garage & Arms Dealer markers
  for (const loc of INTERACTIVE_LOCATIONS) {
    const lx = toMapX(loc.x);
    const ly = toMapY(loc.z);
    ctx.fillStyle = loc.id === 'garage' ? '#22d3ee' : '#fb7185';
    ctx.beginPath();
    ctx.arc(lx, ly, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Mission stage target
  const stage = getCurrentStage(game);
  if (stage && stage.target) {
    const tx = toMapX(stage.target.x);
    const ty = toMapY(stage.target.z);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Police cruisers & SWAT blips
  for (const v of game.vehicles) {
    if (v.type !== 'police') continue;
    const vx = toMapX(v.mesh.position.x);
    const vy = toMapY(v.mesh.position.z);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(vx, vy, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const c of game.cops) {
    if (c.downed) continue;
    const vx = toMapX(c.char.mesh.position.x);
    const vy = toMapY(c.char.mesh.position.z);
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(vx, vy, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player directional arrow at center
  const heading = game.getPlayerHeading();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-heading + Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -6.5);
  ctx.lineTo(4.8, 5.2);
  ctx.lineTo(0, 2.6);
  ctx.lineTo(-4.8, 5.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();

  // North indicator pill
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, 11, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 9px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, 11.5);
}

export function drawWorldMap(canvas, game) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#07182b';
  ctx.fillRect(0, 0, w, h);

  const toX = (wx) => ((wx + 165) / 365) * w;
  const toY = (wz) => ((wz + 225) / 425) * h;

  // Mainland & Beach
  ctx.fillStyle = '#142033';
  ctx.fillRect(0, 0, toX(54), h);
  ctx.fillStyle = '#9c835c';
  ctx.fillRect(toX(16), 0, toX(54) - toX(16), h);

  // Isla Dorada
  ctx.fillStyle = '#24344c';
  ctx.beginPath();
  ctx.arc(toX(148), toY(-172), 46, 0, Math.PI * 2);
  ctx.fill();

  // Roads & Bridge
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(toX(0), 0);
  ctx.lineTo(toX(0), h);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, toY(60));
  ctx.lineTo(toX(10), toY(60));
  ctx.moveTo(0, toY(-60));
  ctx.lineTo(toX(10), toY(-60));
  ctx.stroke();

  // Suspension bridge
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(toX(-45), toY(-138));
  ctx.lineTo(toX(148), toY(-138));
  ctx.stroke();

  // District circles & labels
  for (const d of DISTRICTS) {
    const dx = toX(d.x);
    const dy = toY(d.z);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(dx, dy, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '800 10px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.name, dx, dy + 4);
  }

  // Interactive Shops
  for (const loc of INTERACTIVE_LOCATIONS) {
    const lx = toX(loc.x);
    const ly = toY(loc.z);
    ctx.fillStyle = loc.id === 'garage' ? '#22d3ee' : '#fb7185';
    ctx.beginPath();
    ctx.arc(lx, ly, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Waypoint
  if (game.waypoint) {
    const wx = toX(game.waypoint.x);
    const wy = toY(game.waypoint.z);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(wx, wy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player dot
  const pPos = game.getPlayerPos();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(toX(pPos.x), toY(pPos.z), 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.stroke();
}
