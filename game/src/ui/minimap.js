// Coralina Bay: Sunset Syndicate — Circular Radar Minimap & Interactive World Map
import { DISTRICTS, INTERACTIVE_LOCATIONS } from '../core/config.js';
import { getCurrentStage } from '../gameplay/missions.js';

const dot = (c, x, y, r, fill, stroke = null, lw = 1.5) => {
  c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
};

export function drawMinimap(canvas, g) {
  if (!canvas) return;
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, p = g.getPlayerPos(), sc = 0.85;
  const tx = (x) => cx + (x - p.x) * sc, ty = (z) => cy + (z - p.z) * sc;
  c.clearRect(0, 0, w, h); c.save(); c.beginPath(); c.arc(cx, cy, w / 2 - 2, 0, Math.PI * 2); c.clip();
  c.fillStyle = '#071a2e'; c.fillRect(0, 0, w, h);
  const coast = tx(54), beach = tx(14);
  c.fillStyle = '#182438'; c.fillRect(0, 0, Math.max(0, coast), h);
  c.fillStyle = '#8b7355'; c.fillRect(beach, 0, Math.max(0, coast - beach), h);
  c.fillStyle = '#334155'; c.fillRect(tx(-11), 0, 22 * sc, h); c.fillRect(0, ty(52), tx(11), 16 * sc); c.fillRect(0, ty(-68), tx(11), 16 * sc);
  c.strokeStyle = '#ef4444'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx(-60), ty(-138)); c.lineTo(tx(140), ty(-138)); c.stroke();
  c.strokeStyle = 'rgba(251,191,36,.72)'; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(tx(0), 0); c.lineTo(tx(0), h); c.stroke(); c.setLineDash([]);
  for (const loc of INTERACTIVE_LOCATIONS) dot(c, tx(loc.x), ty(loc.z), 4, loc.id === 'garage' ? '#22d3ee' : '#fb7185', '#fff', 1.2);
  const st = getCurrentStage(g);
  if (st?.target) {
    const mx = tx(st.target.x), my = ty(st.target.z);
    c.strokeStyle = 'rgba(251,191,36,.85)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(mx, my); c.stroke();
    dot(c, mx, my, 4.2, '#fbbf24');
  }
  for (const v of g.vehicles) if (v.type === 'police') dot(c, tx(v.mesh.position.x), ty(v.mesh.position.z), 3, '#f43f5e');
  for (const cp of g.cops) if (!cp.downed) dot(c, tx(cp.char.mesh.position.x), ty(cp.char.mesh.position.z), 2.6, '#fb7185');
  c.save(); c.translate(cx, cy); c.rotate(-g.getPlayerHeading() + Math.PI);
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -6.5); c.lineTo(4.8, 5.2); c.lineTo(0, 2.6); c.lineTo(-4.8, 5.2); c.closePath(); c.fill();
  c.restore(); c.restore();
  dot(c, cx, 11, 8, '#0f172a', '#fb7185', 1.5);
  c.fillStyle = '#fff'; c.font = '900 9px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', cx, 11.5);
}

export function drawWorldMap(canvas, g) {
  if (!canvas) return;
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, toX = (x) => ((x + 165) / 365) * w, toY = (z) => ((z + 225) / 425) * h;
  c.fillStyle = '#07182b'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#142033'; c.fillRect(0, 0, toX(54), h);
  c.fillStyle = '#9c835c'; c.fillRect(toX(16), 0, toX(54) - toX(16), h);
  dot(c, toX(148), toY(-172), 46, '#24344c');
  c.strokeStyle = '#475569'; c.lineWidth = 8; c.beginPath(); c.moveTo(toX(0), 0); c.lineTo(toX(0), h); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(0, toY(60)); c.lineTo(toX(10), toY(60)); c.moveTo(0, toY(-60)); c.lineTo(toX(10), toY(-60)); c.stroke();
  c.strokeStyle = '#ef4444'; c.lineWidth = 6; c.beginPath(); c.moveTo(toX(-45), toY(-138)); c.lineTo(toX(148), toY(-138)); c.stroke();
  for (const d of DISTRICTS) {
    const dx = toX(d.x), dy = toY(d.z);
    c.strokeStyle = 'rgba(34,211,238,.32)'; c.lineWidth = 1.5; c.beginPath(); c.arc(dx, dy, 26, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#e2e8f0'; c.font = '800 10px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.fillText(d.name, dx, dy + 4);
  }
  for (const loc of INTERACTIVE_LOCATIONS) dot(c, toX(loc.x), toY(loc.z), 6, loc.id === 'garage' ? '#22d3ee' : '#fb7185');
  if (g.waypoint) dot(c, toX(g.waypoint.x), toY(g.waypoint.z), 7, '#fbbf24');
  const p = g.getPlayerPos(); dot(c, toX(p.x), toY(p.z), 6, '#fff', '#22d3ee', 2);
}
