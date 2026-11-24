// Coralina Bay: Sunset Syndicate — GTA-Style Free 360° Mouse-Look, Pointer Lock & Camera Rig
import * as THREE from 'three';
import { CAMERA_DEFAULTS } from './config.js';

export class CameraController {
  constructor(camera, canvas, sound) {
    this.camera = camera;
    this.canvas = canvas;
    this.sound = sound;

    this.yaw = Math.PI;
    this.pitch = 0.24;
    this.dist = CAMERA_DEFAULTS.vehicleDist;
    this.idleTimer = 0;
    this.aiming = false;
    this.pointerLocked = false;

    this._isDragging = false;
    this._dragMoved = 0;
    this._lastX = 0;
    this._lastY = 0;
    this._downButton = -1;
    this._onFire = null;
    this._onPointerUnlockPause = null;
    this._canControl = () => false;
  }

  bind({ canControl, onFire, onPointerUnlockPause }) {
    this._canControl = canControl;
    this._onFire = onFire;
    this._onPointerUnlockPause = onPointerUnlockPause;

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      const wasLocked = this.pointerLocked;
      this.pointerLocked = document.pointerLockElement === this.canvas;
      if (wasLocked && !this.pointerLocked && this._canControl()) {
        // ESC released Pointer Lock during active gameplay -> open Pause/Map cleanly
        if (this._onPointerUnlockPause) this._onPointerUnlockPause();
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this._canControl()) return;
      if (this.sound) this.sound.unlock();

      this._isDragging = true;
      this._dragMoved = 0;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this._downButton = e.button;

      if (e.button === 2) {
        this.aiming = true;
      }

      // Auto-request Pointer Lock on left-click in active gameplay
      if (e.button === 0) {
        if (!this.pointerLocked) {
          this.requestLock();
        }
        if (this._onFire) this._onFire(true);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this._canControl()) return;

      if (document.pointerLockElement === this.canvas) {
        this.yaw -= e.movementX * 0.0042;
        this.pitch = Math.max(
          CAMERA_DEFAULTS.minPitch,
          Math.min(CAMERA_DEFAULTS.maxPitch, this.pitch + e.movementY * 0.0036)
        );
        this.idleTimer = 0;
        return;
      }

      // Fallback drag orbit (right-click drag or left-click drag) when Pointer Lock is not active
      if (this._isDragging) {
        const dx = e.clientX - this._lastX;
        const dy = e.clientY - this._lastY;
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        this._dragMoved += Math.hypot(dx, dy);
        if (this._dragMoved > 2) {
          this.yaw -= dx * 0.0052;
          this.pitch = Math.max(
            CAMERA_DEFAULTS.minPitch,
            Math.min(CAMERA_DEFAULTS.maxPitch, this.pitch + dy * 0.0042)
          );
          this.idleTimer = 0;
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.aiming = false;
      if (e.button === 0 && this._onFire) this._onFire(false);
      this._isDragging = false;
      this._downButton = -1;
    });

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        if (!this._canControl()) return;
        e.preventDefault();
        this.dist = Math.max(
          CAMERA_DEFAULTS.minDist,
          Math.min(CAMERA_DEFAULTS.maxDist, this.dist + Math.sign(e.deltaY) * 0.75)
        );
        this.idleTimer = 0;
      },
      { passive: false }
    );
  }

  requestLock() {
    try {
      if (document.pointerLockElement !== this.canvas && typeof this.canvas.requestPointerLock === 'function') {
        const p = this.canvas.requestPointerLock();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    } catch {
      // Safe fallback: drag orbit remains available
    }
  }

  exitLock() {
    this.aiming = false;
    this._isDragging = false;
    try {
      if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
        document.exitPointerLock();
      }
    } catch {
      // Ignore exit errors
    }
  }

  onEnterVehicle(heading) {
    this.yaw = heading;
    this.dist = CAMERA_DEFAULTS.vehicleDist;
    this.pitch = 0.24;
    this.idleTimer = 0;
  }

  onExitVehicle(heading) {
    this.yaw = heading;
    this.dist = CAMERA_DEFAULTS.onFootDist;
    this.pitch = 0.22;
    this.idleTimer = 0;
  }

  updateVehicleCamera(dt, vehicle, boosting) {
    this.idleTimer += dt;

    // Dynamic FOV widening during nitro boost
    const targetFov = boosting ? CAMERA_DEFAULTS.boostFov : CAMERA_DEFAULTS.fov + 2;
    if (Math.abs(this.camera.fov - targetFov) > 0.02) {
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-6.0 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Gentle auto-recenter behind car after 2.5s of no mouse input while driving
    if (this.idleTimer > CAMERA_DEFAULTS.autoRecenterDelay && Math.abs(vehicle.speed) > 2.0) {
      let yawDiff = vehicle.heading - this.yaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      this.yaw += yawDiff * (1 - Math.exp(-2.8 * dt));
    }

    const horiz = Math.cos(this.pitch) * this.dist;
    const vert = Math.sin(this.pitch) * this.dist;
    const targetCam = new THREE.Vector3(
      vehicle.mesh.position.x - Math.sin(this.yaw) * horiz,
      Math.max(1.15, 1.65 + vert),
      vehicle.mesh.position.z - Math.cos(this.yaw) * horiz
    );
    this.camera.position.lerp(targetCam, 1 - Math.exp(-10.0 * dt));
    this.camera.lookAt(vehicle.mesh.position.x, 1.4, vehicle.mesh.position.z);
  }

  updateOnFootCamera(dt, playerMesh, isFiring) {
    this.idleTimer += dt;
    const ots = this.aiming || isFiring;
    const targetFov = ots ? CAMERA_DEFAULTS.fov - 8 : CAMERA_DEFAULTS.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.02) {
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-8.0 * dt));
      this.camera.updateProjectionMatrix();
    }

    const useDist = ots ? Math.min(4.2, this.dist * 0.65) : Math.min(8.5, Math.max(4.5, this.dist));
    const horiz = Math.cos(this.pitch) * useDist;
    const vert = Math.sin(this.pitch) * useDist;

    // Over-the-shoulder right offset
    const rightX = -Math.cos(this.yaw);
    const rightZ = Math.sin(this.yaw);
    const shoulderOffset = ots ? 0.85 : 0.42;

    const targetCam = new THREE.Vector3(
      playerMesh.position.x - Math.sin(this.yaw) * horiz + rightX * shoulderOffset,
      Math.max(1.05, 1.62 + vert),
      playerMesh.position.z - Math.cos(this.yaw) * horiz + rightZ * shoulderOffset
    );
    this.camera.position.lerp(targetCam, 1 - Math.exp(-12.0 * dt));

    const lookDist = 14;
    this.camera.lookAt(
      playerMesh.position.x + Math.sin(this.yaw) * lookDist + rightX * (ots ? 0.5 : 0.15),
      Math.max(0.8, 1.45 - Math.sin(this.pitch) * 3.8),
      playerMesh.position.z + Math.cos(this.yaw) * lookDist + rightZ * (ots ? 0.5 : 0.15)
    );
  }
}
