import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Crane } from './crane.js';
import {
  createUnitStick,
  createTenBundle,
  createHundredSlab,
  getUnitSlotPosition,
  getTenSlotPosition,
  getHundredSlotPosition
} from './objects.js';
import { t } from '../strings.js';

/**
 * ThreeScene manages the WebGL rendering canvas, lighting, platforms,
 * object tracking on each platform, and the Crane.
 */
export class ThreeScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth || window.innerWidth;
    this.height = canvasContainer.clientHeight || window.innerHeight;

    this.unitMeshes = [];
    this.tenMeshes = [];
    this.hundredMeshes = [];

    this.platformPositions = {
      hundreds: -4.2,
      tens: 0,
      units: 4.2
    };

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLighting();
    this.initFloorAndPlatforms();
    this.initCrane();
    this.initEventListeners();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.isIdleOrbiting = true;
    this.lastInteractionTime = Date.now();

    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // DPR capped at 2
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Soft pastel sky gradient background
    this.scene.background = new THREE.Color(0xdbeafe); // Soft baby blue pastel
  }

  initCamera() {
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(0, 4.0, 11.2);
    this.camera.lookAt(0, 1.8, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.8, 0);

    // Strict angle clamping so kids never get disoriented
    this.controls.minPolarAngle = Math.PI / 4.5; // ~40 deg
    this.controls.maxPolarAngle = Math.PI / 2.3; // ~78 deg
    this.controls.minAzimuthAngle = -Math.PI / 9; // ~-20 deg
    this.controls.maxAzimuthAngle = Math.PI / 9;  // ~+20 deg
    this.controls.minDistance = 8.5;
    this.controls.maxDistance = 14.5;
    this.controls.enablePan = false;

    this.controls.addEventListener('start', () => {
      this.isIdleOrbiting = false;
      this.lastInteractionTime = Date.now();
    });
  }

  initLighting() {
    // Warm hemisphere light (warm sky, wood-reflected bounce)
    this.hemiLight = new THREE.HemisphereLight(0xfffaed, 0xdcfce7, 0.9);
    this.hemiLight.position.set(0, 20, 0);
    this.scene.add(this.hemiLight);

    // Warm directional sun light with soft shadows
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    this.dirLight.position.set(6, 12, 8);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 25;
    this.dirLight.shadow.camera.left = -8;
    this.dirLight.shadow.camera.right = 8;
    this.dirLight.shadow.camera.top = 8;
    this.dirLight.shadow.camera.bottom = -4;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Gentle front-fill light
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.4);
    fillLight.position.set(-6, 4, 8);
    this.scene.add(fillLight);
  }

  initFloorAndPlatforms() {
    // 1. Play table floor (warm natural honey wood)
    const tableGeo = new THREE.BoxGeometry(16, 0.5, 9);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a, // Honey wood
      roughness: 0.6,
      metalness: 0.05
    });
    this.tableMesh = new THREE.Mesh(tableGeo, tableMat);
    this.tableMesh.position.y = -0.25;
    this.tableMesh.receiveShadow = true;
    this.scene.add(this.tableMesh);

    // Decorative table border rim
    const rimGeo = new THREE.BoxGeometry(16.4, 0.2, 9.4);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = -0.15;
    rim.receiveShadow = true;
    this.scene.add(rim);

    // 2. Three Platforms (Hundreds = Orange, Tens = Green, Units = Blue)
    this.platforms = {};
    this.platformMeshes = {};
    this.labels = {};
    this.counterSprites = {};

    const configs = [
      { key: 'hundreds', name: 'HUNDREDS', x: this.platformPositions.hundreds, color: 0xf97316, darkColor: 0xc2410c },
      { key: 'tens', name: 'TENS', x: this.platformPositions.tens, color: 0x22c55e, darkColor: 0x15803d },
      { key: 'units', name: 'UNITS', x: this.platformPositions.units, color: 0x0284c7, darkColor: 0x0369a1 }
    ];

    configs.forEach((cfg) => {
      const platGroup = new THREE.Group();
      platGroup.position.set(cfg.x, 0, 0);

      // Base beveled platform block
      const platGeo = new THREE.BoxGeometry(3.4, 0.35, 3.4);
      const platMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.35,
        metalness: 0.15
      });
      const platMesh = new THREE.Mesh(platGeo, platMat);
      platMesh.position.y = 0.175;
      platMesh.castShadow = true;
      platMesh.receiveShadow = true;
      platMesh.userData = { platformKey: cfg.key };
      platGroup.add(platMesh);

      // Inner tray recess
      const trayGeo = new THREE.BoxGeometry(3.0, 0.08, 3.0);
      const trayMat = new THREE.MeshStandardMaterial({
        color: cfg.darkColor,
        roughness: 0.5
      });
      const trayMesh = new THREE.Mesh(trayGeo, trayMat);
      trayMesh.position.y = 0.35;
      trayMesh.receiveShadow = true;
      platGroup.add(trayMesh);

      // Containers for spawned 3D pieces
      const itemsContainer = new THREE.Group();
      itemsContainer.position.set(0, 0.38, 0);
      platGroup.add(itemsContainer);

      // 3D Floating Digit Counter & Label Billboard
      const { billboard, counterCanvas, counterContext, counterTexture } = this.createPlatformBillboard(cfg.name, cfg.color);
      billboard.position.set(0, 2.8, -1.5);
      platGroup.add(billboard);

      this.scene.add(platGroup);
      this.platforms[cfg.key] = platGroup;
      this.platformMeshes[cfg.key] = platMesh;
      this.counterSprites[cfg.key] = {
        canvas: counterCanvas,
        ctx: counterContext,
        texture: counterTexture,
        count: 0,
        title: cfg.name,
        color: cfg.color
      };
      platGroup.userData.itemsContainer = itemsContainer;
    });
  }

  createPlatformBillboard(title, themeHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    // Draw initial billboard
    this.drawBillboard(ctx, title, 0, themeHex);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 1.5, 1);

    return {
      billboard: sprite,
      counterCanvas: canvas,
      counterContext: ctx,
      counterTexture: texture
    };
  }

  drawBillboard(ctx, title, count, themeHex) {
    ctx.clearRect(0, 0, 512, 320);

    const hexStr = `#${themeHex.toString(16).padStart(6, '0')}`;

    // Outer pill card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = hexStr;
    ctx.lineWidth = 14;
    this.roundRect(ctx, 20, 20, 472, 280, 40);
    ctx.fill();
    ctx.stroke();

    // Title badge top
    ctx.fillStyle = hexStr;
    this.roundRect(ctx, 60, 36, 392, 70, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px "Nunito", "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 72);

    // Large Live Digit
    ctx.fillStyle = '#1e293b';
    ctx.font = '900 130px "Nunito", "Baloo 2", sans-serif';
    ctx.fillText(String(count), 256, 200);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  updatePlatformCounters(counts) {
    ['hundreds', 'tens', 'units'].forEach((k) => {
      const data = this.counterSprites[k];
      if (data && counts[k] !== undefined) {
        data.count = counts[k];
        const localizedTitle = t(k);
        this.drawBillboard(data.ctx, localizedTitle, data.count, data.color);
        data.texture.needsUpdate = true;
      }
    });
  }

  initCrane() {
    this.crane = new Crane(this.scene);
  }

  initEventListeners() {
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);
  }

  onWindowResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Dynamic camera framing based on aspect ratio
    if (this.camera.aspect < 1.0) {
      // Mobile portrait view: pull camera back slightly so all 3 platforms fit nicely
      this.camera.position.set(0, 5.2, 14.8);
    } else {
      // Desktop / tablet landscape view
      this.camera.position.set(0, 4.0, 11.2);
    }
  }

  /**
   * Syncs 3D meshes on platforms to match target counts.
   * Cleans up excess and instantiates new ones at neat slot coordinates.
   */
  syncObjects(state) {
    const { units, tens, hundreds } = state;

    // 1. Units
    const unitContainer = this.platforms.units.userData.itemsContainer;
    while (this.unitMeshes.length > units) {
      const mesh = this.unitMeshes.pop();
      unitContainer.remove(mesh);
    }
    while (this.unitMeshes.length < units) {
      const mesh = createUnitStick();
      const pos = getUnitSlotPosition(this.unitMeshes.length);
      mesh.position.copy(pos);
      unitContainer.add(mesh);
      this.unitMeshes.push(mesh);
    }

    // 2. Tens
    const tenContainer = this.platforms.tens.userData.itemsContainer;
    while (this.tenMeshes.length > tens) {
      const mesh = this.tenMeshes.pop();
      tenContainer.remove(mesh);
    }
    while (this.tenMeshes.length < tens) {
      const mesh = createTenBundle();
      const pos = getTenSlotPosition(this.tenMeshes.length);
      mesh.position.copy(pos);
      tenContainer.add(mesh);
      this.tenMeshes.push(mesh);
    }

    // 3. Hundreds
    const hundredContainer = this.platforms.hundreds.userData.itemsContainer;
    while (this.hundredMeshes.length > hundreds) {
      const mesh = this.hundredMeshes.pop();
      hundredContainer.remove(mesh);
    }
    while (this.hundredMeshes.length < hundreds) {
      const mesh = createHundredSlab();
      const pos = getHundredSlotPosition(this.hundredMeshes.length);
      mesh.position.copy(pos);
      hundredContainer.add(mesh);
      this.hundredMeshes.push(mesh);
    }

    this.updatePlatformCounters(state);
  }

  highlightPlatform(platformKey, durationMs = 1500) {
    const mesh = this.platformMeshes[platformKey];
    if (!mesh) return;

    const originalColor = mesh.material.color.getHex();
    mesh.material.emissive.setHex(0xffff00);
    mesh.material.emissiveIntensity = 0.6;

    setTimeout(() => {
      mesh.material.emissive.setHex(0x000000);
      mesh.material.emissiveIntensity = 0;
    }, durationMs);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Gentle idle orbit when child hasn't touched the scene for 4s
    if (this.isIdleOrbiting && Date.now() - this.lastInteractionTime > 4000) {
      const sway = Math.sin(elapsedTime * 0.4) * 0.001;
      this.camera.position.x += sway;
    }

    this.controls.update();
    this.crane.update(elapsedTime);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
