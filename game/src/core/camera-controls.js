// Coralina Bay: Sunset Syndicate — GTA 360° Mouse-Look, Pointer Lock & Camera Rig
import * as THREE from 'three';
import { CAMERA_DEFAULTS as CD } from './config.js';

export class CameraController {
  constructor(camera, canvas, sound) {
    Object.assign(this, { camera, canvas, sound, yaw: Math.PI, pitch: 0.24, dist: CD.vehicleDist, idleTimer: 0, aiming: false, pointerLocked: false, _drag: false, _moved: 0, _lx: 0, _ly: 0, _onFire: null, _onUnlock: null, _can: () => false });
  }

  bind({ canControl, onFire, onPointerUnlockPause }) {
    this._can = canControl; this._onFire = onFire; this._onUnlock = onPointerUnlockPause;
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      const was = this.pointerLocked; this.pointerLocked = document.pointerLockElement === this.canvas;
      if (was && !this.pointerLocked && this._can() && this._onUnlock) this._onUnlock();
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this._can()) return;
      this.sound?.unlock(); this._drag = true; this._moved = 0; this._lx = e.clientX; this._ly = e.clientY;
      if (e.button === 2) this.aiming = true;
      if (e.button === 0) { if (!this.pointerLocked) this.requestLock(); this._onFire?.(true); }
    });
    window.addEventListener('mousemove', (e) => {
      if (!this._can()) return;
      if (document.pointerLockElement === this.canvas) {
        this.yaw -= e.movementX * 0.0042;
        this.pitch = Math.max(CD.minPitch, Math.min(CD.maxPitch, this.pitch + e.movementY * 0.0036));
        this.idleTimer = 0; return;
      }
      if (this._drag) {
        const dx = e.clientX - this._lx, dy = e.clientY - this._ly; this._lx = e.clientX; this._ly = e.clientY;
        if ((this._moved += Math.hypot(dx, dy)) > 2) {
          this.yaw -= dx * 0.0052;
          this.pitch = Math.max(CD.minPitch, Math.min(CD.maxPitch, this.pitch + dy * 0.0042));
          this.idleTimer = 0;
        }
      }
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 2) this.aiming = false; if (e.button === 0) this._onFire?.(false); this._drag = false; });
    this.canvas.addEventListener('wheel', (e) => {
      if (!this._can()) return; e.preventDefault();
      this.dist = Math.max(CD.minDist, Math.min(CD.maxDist, this.dist + Math.sign(e.deltaY) * 0.75));
      this.idleTimer = 0;
    }, { passive: false });
  }

  requestLock() { try { if (document.pointerLockElement !== this.canvas) this.canvas.requestPointerLock?.()?.catch?.(() => {}); } catch {} }
  exitLock() { this.aiming = this._drag = false; try { if (document.pointerLockElement) document.exitPointerLock?.(); } catch {} }
  onEnterVehicle(h) { this.yaw = h; this.dist = CD.vehicleDist; this.pitch = 0.24; this.idleTimer = 0; }
  onExitVehicle(h) { this.yaw = h; this.dist = CD.onFootDist; this.pitch = 0.22; this.idleTimer = 0; }

  updateVehicleCamera(dt, v, boosting) {
    this.idleTimer += dt;
    const tf = boosting ? CD.boostFov : CD.fov + 2;
    if (Math.abs(this.camera.fov - tf) > 0.02) { this.camera.fov += (tf - this.camera.fov) * (1 - Math.exp(-6 * dt)); this.camera.updateProjectionMatrix(); }
    if (this.idleTimer > CD.autoRecenterDelay && Math.abs(v.speed) > 2) {
      let d = v.heading - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += d * (1 - Math.exp(-2.8 * dt));
    }
    const h = Math.cos(this.pitch) * this.dist, vt = Math.sin(this.pitch) * this.dist, p = v.mesh.position;
    this.camera.position.lerp(new THREE.Vector3(p.x - Math.sin(this.yaw) * h, Math.max(1.15, 1.65 + vt), p.z - Math.cos(this.yaw) * h), 1 - Math.exp(-10 * dt));
    this.camera.lookAt(p.x, 1.4, p.z);
  }

  updateOnFootCamera(dt, mesh, isFiring) {
    this.idleTimer += dt; const ots = this.aiming || isFiring, tf = ots ? CD.fov - 8 : CD.fov;
    if (Math.abs(this.camera.fov - tf) > 0.02) { this.camera.fov += (tf - this.camera.fov) * (1 - Math.exp(-8 * dt)); this.camera.updateProjectionMatrix(); }
    const ud = ots ? Math.min(4.2, this.dist * 0.65) : Math.min(8.5, Math.max(4.5, this.dist));
    const h = Math.cos(this.pitch) * ud, vt = Math.sin(this.pitch) * ud, rx = -Math.cos(this.yaw), rz = Math.sin(this.yaw), sh = ots ? 0.85 : 0.42, p = mesh.position;
    this.camera.position.lerp(new THREE.Vector3(p.x - Math.sin(this.yaw) * h + rx * sh, Math.max(1.05, 1.62 + vt), p.z - Math.cos(this.yaw) * h + rz * sh), 1 - Math.exp(-12 * dt));
    this.camera.lookAt(p.x + Math.sin(this.yaw) * 14 + rx * (ots ? 0.5 : 0.15), Math.max(0.8, 1.45 - Math.sin(this.pitch) * 3.8), p.z + Math.cos(this.yaw) * 14 + rz * (ots ? 0.5 : 0.15));
  }
}
