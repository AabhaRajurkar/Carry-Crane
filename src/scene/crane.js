import * as THREE from 'three';
import { tween, easeInOutQuad } from './animations.js';

/**
 * Cartoon Crane with Overhead Rail, Friendly Face, Winch Cable, and Hook.
 */
export class Crane {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'crane_system';

    this.railY = 4.8;
    this.currentX = 0; // Center (Tens platform)
    this.cableRestLength = 1.6;
    this.currentHookY = this.railY - this.cableRestLength;
    this.cableSwayAngle = 0;
    this.attachedObject = null;

    this.buildRail();
    this.buildTrolleyAndCab();
    this.buildCableAndHook();

    this.scene.add(this.root);
  }

  buildRail() {
    // Overhead steel rail spanning across all 3 platforms (x from -6 to +6)
    const railLength = 12.0;
    const railGeo = new THREE.BoxGeometry(railLength, 0.22, 0.4);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Slate grey
      roughness: 0.4,
      metalness: 0.6
    });

    const railMesh = new THREE.Mesh(railGeo, railMat);
    railMesh.position.set(0, this.railY + 0.35, 0);
    railMesh.castShadow = true;
    this.root.add(railMesh);

    // Support pillars on far left and right
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, this.railY + 0.35, 12);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.5,
      metalness: 0.5
    });

    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-railLength / 2 + 0.2, (this.railY + 0.35) / 2, 0);
    leftPillar.castShadow = true;
    this.root.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(railLength / 2 - 0.2, (this.railY + 0.35) / 2, 0);
    rightPillar.castShadow = true;
    this.root.add(rightPillar);
  }

  buildTrolleyAndCab() {
    this.trolleyGroup = new THREE.Group();
    this.trolleyGroup.position.set(this.currentX, this.railY, 0);
    this.root.add(this.trolleyGroup);

    // Trolley base carriage
    const carriageGeo = new THREE.BoxGeometry(1.2, 0.25, 0.7);
    const carriageMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber/yellow
      roughness: 0.3,
      metalness: 0.2
    });
    const carriage = new THREE.Mesh(carriageGeo, carriageMat);
    carriage.castShadow = true;
    this.trolleyGroup.add(carriage);

    // Wheels on rail
    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    [-0.45, 0.45].forEach((wx) => {
      [-0.32, 0.32].forEach((wz) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.15, wz);
        this.trolleyGroup.add(wheel);
      });
    });

    // Friendly Crane Cab (Head with cute face)
    this.cabHead = new THREE.Group();
    this.cabHead.position.set(0, -0.4, 0.35); // Hangs slightly down and forward
    this.trolleyGroup.add(this.cabHead);

    // Cab main body: bright sunny yellow rounded box
    const cabGeo = new THREE.BoxGeometry(0.85, 0.7, 0.65);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright cheerful yellow
      roughness: 0.25,
      metalness: 0.1
    });
    const cabMesh = new THREE.Mesh(cabGeo, cabMat);
    cabMesh.castShadow = true;
    this.cabHead.add(cabMesh);

    // Cute Hard-Hat / Roof
    const hatGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.18, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }); // Red cap
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.set(0, 0.42, 0);
    hat.castShadow = true;
    this.cabHead.add(hat);

    // Flashing safety beacon on hat
    const beaconGeo = new THREE.SphereGeometry(0.09, 10, 8);
    this.beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf97316,
      emissiveIntensity: 0.8
    });
    const beacon = new THREE.Mesh(beaconGeo, this.beaconMat);
    beacon.position.set(0, 0.55, 0);
    this.cabHead.add(beacon);

    // Big expressive Cartoon Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const pupilGeo = new THREE.SphereGeometry(0.065, 10, 10);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    [-0.2, 0.2].forEach((eyeX) => {
      const eye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      eye.position.set(eyeX, 0.08, 0.32);
      eye.scale.set(1, 1.15, 0.6);
      this.cabHead.add(eye);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(eyeX, 0.08, 0.38);
      pupil.scale.set(1, 1, 0.3);
      this.cabHead.add(pupil);

      // Rosy cheeks
      const cheekGeo = new THREE.SphereGeometry(0.07, 8, 8);
      const cheekMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.7 });
      const cheek = new THREE.Mesh(cheekGeo, cheekMat);
      cheek.position.set(eyeX * 1.35, -0.09, 0.32);
      cheek.scale.set(1.2, 0.7, 0.3);
      this.cabHead.add(cheek);
    });

    // Friendly smile curve
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.16, -0.16, 0.34),
      new THREE.Vector3(0, -0.26, 0.34),
      new THREE.Vector3(0.16, -0.16, 0.34)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 12, 0.025, 6, false);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x7c2d12 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    this.cabHead.add(smile);
  }

  buildCableAndHook() {
    this.winchGroup = new THREE.Group();
    this.winchGroup.position.set(0, 0, -0.05); // Under center of carriage
    this.trolleyGroup.add(this.winchGroup);

    // Spool cylinder
    const spoolGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12);
    const spoolMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.3 });
    const spool = new THREE.Mesh(spoolGeo, spoolMat);
    spool.rotation.z = Math.PI / 2;
    spool.position.y = -0.15;
    this.winchGroup.add(spool);

    // Cable pivot group to allow pendulum sway
    this.cablePivot = new THREE.Group();
    this.cablePivot.position.set(0, -0.22, 0);
    this.winchGroup.add(this.cablePivot);

    // Cable line geometry (updated dynamically)
    this.cableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    this.cableGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 6);
    this.cableMesh = new THREE.Mesh(this.cableGeo, this.cableMat);
    this.cableMesh.position.y = -0.5;
    this.cablePivot.add(this.cableMesh);

    // Hook assembly
    this.hookGroup = new THREE.Group();
    this.hookGroup.position.y = -this.cableRestLength;
    this.cablePivot.add(this.hookGroup);

    // Hook pulley block
    const blockGeo = new THREE.BoxGeometry(0.25, 0.25, 0.2);
    const blockMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.castShadow = true;
    this.hookGroup.add(block);

    // Curved hook geometry (Torus arc + hook tip)
    const hookTorusGeo = new THREE.TorusGeometry(0.14, 0.04, 8, 16, Math.PI * 1.3);
    const hookMetalMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Golden metal
      metalness: 0.8,
      roughness: 0.2
    });
    const hookArm = new THREE.Mesh(hookTorusGeo, hookMetalMat);
    hookArm.rotation.z = Math.PI * 0.85;
    hookArm.position.set(0.04, -0.25, 0);
    hookArm.castShadow = true;
    this.hookGroup.add(hookArm);

    // Hook attachment anchor point
    this.attachmentPoint = new THREE.Group();
    this.attachmentPoint.position.set(0, -0.42, 0);
    this.hookGroup.add(this.attachmentPoint);
  }

  updateCableVisual(length) {
    this.cableMesh.scale.set(1, length, 1);
    this.cableMesh.position.y = -length / 2;
    this.hookGroup.position.y = -length;
  }

  /**
   * Smoothly slides the crane trolley to a target X coordinate.
   * Features procedural pendulum cable sway during acceleration & deceleration.
   */
  async slideTo(targetX, duration = 800) {
    const startX = this.trolleyGroup.position.x;
    const distance = targetX - startX;
    const direction = Math.sign(distance);

    await tween({
      duration,
      easing: easeInOutQuad,
      onUpdate: (eased, raw) => {
        const curX = startX + distance * eased;
        this.trolleyGroup.position.x = curX;
        this.currentX = curX;

        // Dynamic cable sway: sways opposite to movement direction, then recovers
        const swayAmp = Math.sin(raw * Math.PI) * 0.25 * direction;
        this.cablePivot.rotation.z = -swayAmp;
        this.cabHead.rotation.z = -swayAmp * 0.4;
      }
    });

    this.cablePivot.rotation.z = 0;
    this.cabHead.rotation.z = 0;
  }

  /**
   * Lowers hook to a target world Y position.
   */
  async lowerHook(targetWorldY, duration = 600) {
    const startCableLen = -this.hookGroup.position.y;
    // World Y of winch pivot = railY + winch offset (-0.22)
    const pivotWorldY = this.railY - 0.22;
    // Attachment point is at -0.42 from hookGroup, so hookGroup should be at targetWorldY + 0.42
    const targetCableLen = Math.max(0.5, pivotWorldY - (targetWorldY + 0.42));

    await tween({
      duration,
      easing: easeInOutQuad,
      onUpdate: (t) => {
        const len = startCableLen + (targetCableLen - startCableLen) * t;
        this.updateCableVisual(len);
      }
    });
  }

  /**
   * Raises hook back up to default clearance length.
   */
  async raiseHook(duration = 600) {
    const startCableLen = -this.hookGroup.position.y;
    const targetCableLen = this.cableRestLength;

    await tween({
      duration,
      easing: easeInOutQuad,
      onUpdate: (t) => {
        const len = startCableLen + (targetCableLen - startCableLen) * t;
        this.updateCableVisual(len);
      }
    });
  }

  /**
   * Attaches a 3D object to the hook's attachment point.
   */
  attach(object3D) {
    this.attachedObject = object3D;
    // Parent object to attachment point while maintaining correct visual position
    this.attachmentPoint.attach(object3D);
  }

  /**
   * Detaches the held object and reparents to target container.
   */
  detach(targetParent) {
    if (!this.attachedObject) return null;
    const obj = this.attachedObject;
    targetParent.attach(obj);
    this.attachedObject = null;
    return obj;
  }

  /**
   * Friendly "no-no" head shake when subtraction would go below zero.
   */
  async shakeHead(duration = 500) {
    await tween({
      duration,
      onUpdate: (t) => {
        const angle = Math.sin(t * Math.PI * 4) * 0.35;
        this.cabHead.rotation.y = angle;
      }
    });
    this.cabHead.rotation.y = 0;
  }

  /**
   * Cheerful nod when a step or problem is complete.
   */
  async nodHead(duration = 450) {
    await tween({
      duration,
      onUpdate: (t) => {
        const pitch = Math.sin(t * Math.PI * 3) * 0.25;
        this.cabHead.rotation.x = pitch;
      }
    });
    this.cabHead.rotation.x = 0;
  }

  /**
   * Subtle idle animation (blinking beacon & gentle breath).
   */
  update(timeSeconds) {
    if (this.beaconMat) {
      const pulse = 0.5 + 0.5 * Math.sin(timeSeconds * 6);
      this.beaconMat.emissiveIntensity = 0.4 + pulse * 0.7;
    }
  }
}
