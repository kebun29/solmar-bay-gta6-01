// Coralina Bay: Sunset Syndicate — Articulated Characters & Reactive Pedestrian Crowd AI
import * as THREE from 'three';
import { createContactShadow, createGlowSprite } from './textures.js';

export function createCharacter(role = 'player', pedStyleIdx = 0) {
  const root = new THREE.Group();
  const isCop = role === 'cop';
  const isPlayer = role === 'player';
  const isPed = role === 'ped';

  const pedPalettes = [
    { jacket: 0xfb7185, shirt: 0xffffff, pants: 0x334155, skin: 0xdca782, hair: 0x1e1512 },
    { jacket: 0x14b8a6, shirt: 0xfef08a, pants: 0x1e293b, skin: 0xc68a63, hair: 0x2a1c14 },
    { jacket: 0xf59e0b, shirt: 0xf8fafc, pants: 0x475569, skin: 0xe2b796, hair: 0x4a2f1d },
    { jacket: 0x8b5cf6, shirt: 0xfda4af, pants: 0x1f2937, skin: 0xb97c56, hair: 0x111827 },
    { jacket: 0x38bdf8, shirt: 0xfef3c7, pants: 0x374151, skin: 0xd9a27c, hair: 0x3b2416 },
  ];
  const pp = pedPalettes[pedStyleIdx % pedPalettes.length];

  const jacketColor = isPlayer ? 0x1a1f2e : isCop ? 0x132043 : pp.jacket;
  const shirtColor = isPlayer ? 0xfb7185 : isCop ? 0x22d3ee : pp.shirt;
  const pantsColor = isPlayer ? 0x1f2430 : isCop ? 0x0f172a : pp.pants;
  const skinColor = isPlayer ? 0xd8a47f : isCop ? 0xe0b592 : pp.skin;

  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.68, metalness: 0.08 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.58 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.65, metalness: 0.15 });
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.52, metalness: 0.28 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.82, roughness: 0.25 });

  root.add(createContactShadow(1.15, 1.15, 0.58));

  const rig = new THREE.Group();
  root.add(rig);

  const hips = new THREE.Group();
  hips.position.set(0, 0.94, 0);
  rig.add(hips);

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.165, 0.16, 12), pantsMat);
  pelvis.scale.set(1.18, 1, 0.72);
  pelvis.position.y = 0.02;
  hips.add(pelvis);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.175, 0.5, 14), jacketMat);
  torso.scale.set(1.1, 1, 0.66);
  torso.position.y = 0.3;
  torso.castShadow = true;
  hips.add(torso);

  if (isCop) {
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.205, 0.39, 12), gearMat);
    vest.scale.set(1.1, 1, 0.74);
    vest.position.y = 0.32;
    vest.castShadow = true;
    hips.add(vest);

    [-0.09, 0, 0.09].forEach((px) => {
      const pouch = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.11, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 })
      );
      pouch.position.set(px, 0.23, 0.17);
      hips.add(pouch);
    });
    const badgePatch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.02), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    badgePatch.position.set(0, 0.42, 0.175);
    hips.add(badgePatch);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.065, 12), gearMat);
    belt.scale.set(1.15, 1, 0.76);
    belt.position.y = 0.09;
    hips.add(belt);
  } else {
    const innerShirt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.46, 10), shirtMat);
    innerShirt.scale.set(0.95, 1, 0.72);
    innerShirt.position.set(0, 0.3, 0.055);
    hips.add(innerShirt);

    if (isPlayer) {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.032, 8, 14, Math.PI * 1.4), jacketMat);
      collar.rotation.x = Math.PI / 2;
      collar.rotation.z = -Math.PI * 0.2;
      collar.position.set(0, 0.54, -0.01);
      hips.add(collar);
    }
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.068, 0.11, 10), skinMat);
  neck.position.y = 0.59;
  hips.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), skinMat);
  head.scale.set(0.94, 1.08, 0.98);
  head.position.y = 0.73;
  head.castShadow = true;
  hips.add(head);

  if (isCop) {
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.162, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      gearMat
    );
    helmet.position.set(0, 0.75, -0.005);
    helmet.castShadow = true;
    hips.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.156, 0.156, 0.075, 14, 1, true, -0.85, 1.7),
      new THREE.MeshStandardMaterial({
        color: 0x0b253d,
        metalness: 0.92,
        roughness: 0.08,
        envMapIntensity: 1.6,
        side: THREE.DoubleSide,
      })
    );
    visor.position.set(0, 0.735, 0.015);
    hips.add(visor);
  } else {
    const hairMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x141218 : pp.hair,
      roughness: 0.78,
    });
    const hairDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.154, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hairDome.scale.set(0.98, 1.05, 1.04);
    hairDome.position.set(0, 0.755, -0.015);
    hips.add(hairDome);

    if (isPlayer) {
      const shades = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.045, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.12 })
      );
      shades.position.set(0, 0.74, 0.125);
      hips.add(shades);
    }
  }

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.275, 0.5, 0);
    hips.add(shoulder);

    shoulder.add(new THREE.Mesh(new THREE.SphereGeometry(isCop ? 0.088 : 0.072, 10, 8), isCop ? gearMat : jacketMat));

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.19, 6, 10), jacketMat);
    upper.position.y = -0.14;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.28, 0);
    shoulder.add(elbow);

    elbow.add(new THREE.Mesh(new THREE.SphereGeometry(0.056, 8, 8), isCop ? gearMat : jacketMat));

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.18, 6, 10), isCop ? jacketMat : skinMat);
    forearm.position.y = -0.13;
    forearm.castShadow = true;
    elbow.add(forearm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), isCop ? gearMat : skinMat);
    hand.position.y = -0.26;
    elbow.add(hand);

    return { shoulder, elbow };
  }

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0, -0.27, 0.12);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.115, 0.5), gunMat);
  receiver.position.set(0, 0, 0.18);
  weaponGroup.add(receiver);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.08), gunMat);
  mag.position.set(0, -0.1, 0.22);
  mag.rotation.x = 0.2;
  weaponGroup.add(mag);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8), gunMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.52);
  weaponGroup.add(barrel);

  const muzzleFlash = createGlowSprite(0xffb84d, 1.55, 0.0);
  muzzleFlash.position.set(0, 0.02, 0.78);
  weaponGroup.add(muzzleFlash);
  if (!isPed) {
    rightArm.elbow.add(weaponGroup);
  }

  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.125, -0.02, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.28, 6, 10), pantsMat);
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    hip.add(thigh);

    if (isCop && side === 1) {
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.045, 10), gearMat);
      strap.position.y = -0.18;
      hip.add(strap);
      const holster = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.17, 0.095), gearMat);
      holster.position.set(0.085, -0.19, 0.02);
      hip.add(holster);
    }

    const knee = new THREE.Group();
    knee.position.set(0, -0.43, 0);
    hip.add(knee);

    knee.add(new THREE.Mesh(new THREE.SphereGeometry(isCop ? 0.072 : 0.064, 8, 8), isCop ? gearMat : pantsMat));

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.28, 6, 10), pantsMat);
    shin.position.y = -0.21;
    shin.castShadow = true;
    knee.add(shin);

    const boot = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.11, 6, 8), bootMat);
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, -0.42, 0.045);
    knee.add(boot);

    return { hip, knee };
  }

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const charObj = {
    mesh: root,
    rig,
    hips,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponGroup,
    muzzleFlash,
    flashTimer: 0,
    pose: 'idle',
    setPose(pose, time = 0) {
      this.pose = pose;
      rig.position.set(0, 0, 0);
      rig.rotation.set(0, 0, 0);
      hips.position.y = 0.94;
      hips.rotation.set(0, 0, 0);

      if (pose === 'aim') {
        hips.rotation.y = -0.22;
        rightArm.shoulder.rotation.set(-1.38, -0.15, -0.1);
        rightArm.elbow.rotation.set(-0.32, 0, 0);
        leftArm.shoulder.rotation.set(-1.26, 0.56, 0.18);
        leftArm.elbow.rotation.set(-0.62, 0.25, 0);
        weaponGroup.rotation.set(1.52, 0, 0);
        leftLeg.hip.rotation.set(-0.24, 0, 0.08);
        leftLeg.knee.rotation.set(0.32, 0, 0);
        rightLeg.hip.rotation.set(0.22, 0, -0.08);
        rightLeg.knee.rotation.set(0.24, 0, 0);
        hips.position.y = 0.88;
      } else if (pose === 'crouch') {
        hips.position.y = 0.62;
        hips.rotation.x = 0.18;
        rightArm.shoulder.rotation.set(-1.42, -0.15, -0.08);
        rightArm.elbow.rotation.set(-0.35, 0, 0);
        leftArm.shoulder.rotation.set(-1.28, 0.52, 0.16);
        leftArm.elbow.rotation.set(-0.68, 0.2, 0);
        weaponGroup.rotation.set(1.52, 0, 0);
        leftLeg.hip.rotation.set(-0.95, 0, 0.08);
        leftLeg.knee.rotation.set(1.45, 0, 0);
        rightLeg.hip.rotation.set(-0.45, 0, -0.08);
        rightLeg.knee.rotation.set(1.25, 0, 0);
      } else if (pose === 'run') {
        const s = Math.sin(time * 10);
        hips.position.y = 0.92 + Math.abs(s) * 0.05;
        hips.rotation.x = 0.12;
        leftLeg.hip.rotation.set(s * 0.68, 0, 0);
        leftLeg.knee.rotation.set(Math.max(0, -s * 0.85), 0, 0);
        rightLeg.hip.rotation.set(-s * 0.68, 0, 0);
        rightLeg.knee.rotation.set(Math.max(0, s * 0.85), 0, 0);
        leftArm.shoulder.rotation.set(-s * 0.55, 0, 0.1);
        leftArm.elbow.rotation.set(-0.65, 0, 0);
        rightArm.shoulder.rotation.set(s * 0.45 - 0.35, 0, -0.1);
        rightArm.elbow.rotation.set(-0.75, 0, 0);
        weaponGroup.rotation.set(1.1, 0, 0);
      } else if (pose === 'walk') {
        const s = Math.sin(time * 4.5);
        hips.position.y = 0.93 + Math.abs(s) * 0.02;
        leftLeg.hip.rotation.set(s * 0.36, 0, 0);
        leftLeg.knee.rotation.set(Math.max(0, -s * 0.4), 0, 0);
        rightLeg.hip.rotation.set(-s * 0.36, 0, 0);
        rightLeg.knee.rotation.set(Math.max(0, s * 0.4), 0, 0);
        leftArm.shoulder.rotation.set(-s * 0.3, 0, 0.1);
        leftArm.elbow.rotation.set(-0.25, 0, 0);
        rightArm.shoulder.rotation.set(s * 0.3, 0, -0.1);
        rightArm.elbow.rotation.set(-0.25, 0, 0);
      } else if (pose === 'downed') {
        rig.position.set(0, 0.2, 0);
        rig.rotation.set(-Math.PI / 2, 0, 0.35);
        leftArm.shoulder.rotation.set(-0.45, 0, 0.65);
        leftArm.elbow.rotation.set(-0.7, 0, 0);
        rightArm.shoulder.rotation.set(-0.85, 0, -0.45);
        rightArm.elbow.rotation.set(-0.55, 0, 0);
        leftLeg.hip.rotation.set(0.25, 0, 0.22);
        leftLeg.knee.rotation.set(0.65, 0, 0);
        rightLeg.hip.rotation.set(-0.18, 0, -0.15);
        rightLeg.knee.rotation.set(0.45, 0, 0);
      } else {
        leftArm.shoulder.rotation.set(0.08, 0, 0.12);
        leftArm.elbow.rotation.set(-0.28, 0, 0);
        rightArm.shoulder.rotation.set(0.12, 0, -0.12);
        rightArm.elbow.rotation.set(-0.35, 0, 0);
        weaponGroup.rotation.set(1.15, 0, 0);
        leftLeg.hip.rotation.set(0, 0, 0.04);
        leftLeg.knee.rotation.set(0.06, 0, 0);
        rightLeg.hip.rotation.set(0, 0, -0.04);
        rightLeg.knee.rotation.set(0.06, 0, 0);
      }
    },
    triggerMuzzleFlash(duration = 0.08) {
      this.flashTimer = duration;
      this.muzzleFlash.material.opacity = 0.98;
    },
    getMuzzleWorldPos(target = new THREE.Vector3()) {
      this.mesh.updateMatrixWorld(true);
      return this.muzzleFlash.getWorldPosition(target);
    },
  };

  charObj.setPose('idle', 0);
  return charObj;
}

// Reactive sidewalk & beachfront pedestrian AI with panic fleeing & proximity recycling
export function updatePedestrians(game, dt, pPos, pDirZ) {
  const recentGunshot = game.lastGunshotPos && (game.time - game.lastGunshotTime) < 6.0;
  const chaseSpeed = game.inVehicle && game.currentVehicle ? Math.abs(game.currentVehicle.speed) : 0;

  for (const ped of game.world.sidewalkPeds) {
    let px = ped.char.mesh.position.x;
    let pz = ped.char.mesh.position.z;

    if (Math.hypot(px - pPos.x, pz - pPos.z) > 115) {
      const recycledZ = Math.max(-200, Math.min(200, pPos.z + pDirZ * (45 + Math.random() * 55)));
      ped.char.mesh.position.z = recycledZ;
      ped.homeZ = recycledZ;
      ped.panicTimer = 0;
      ped.panicked = false;
      pz = recycledZ;
    }

    let threatX = null;
    let threatZ = null;
    if (recentGunshot && Math.hypot(px - game.lastGunshotPos.x, pz - game.lastGunshotPos.z) < 28) {
      threatX = game.lastGunshotPos.x;
      threatZ = game.lastGunshotPos.z;
    } else if (game.wantedStars >= 1 && chaseSpeed > 14 && Math.hypot(px - pPos.x, pz - pPos.z) < 18) {
      threatX = pPos.x;
      threatZ = pPos.z;
    }
    if (threatX !== null) {
      ped.panicked = true;
      ped.panicTimer = 5.0;
      ped.fleeAngle = Math.atan2(px - threatX, pz - threatZ);
    }

    if (ped.panicTimer > 0) {
      ped.panicTimer -= dt;
      const fleeSpd = 5.4 * dt;
      const minX = ped.side === 'east' ? 12.4 : -16.2;
      const maxX = ped.side === 'east' ? 15.8 : -12.6;
      ped.char.mesh.position.x = Math.max(minX, Math.min(maxX, px + Math.sin(ped.fleeAngle) * fleeSpd));
      ped.char.mesh.position.z += Math.cos(ped.fleeAngle) * fleeSpd;
      ped.char.mesh.rotation.y = ped.fleeAngle;
      ped.char.setPose('run', game.time + ped.phase);
    } else {
      ped.panicked = false;
      ped.char.mesh.position.z += Math.cos(ped.baseRy) * 1.1 * dt;
      if (Math.abs(ped.char.mesh.position.z - ped.homeZ) > 12) {
        ped.baseRy += Math.PI;
      }
      ped.char.mesh.rotation.y = ped.baseRy;
      ped.char.setPose('walk', game.time + ped.phase);
    }
  }
}
