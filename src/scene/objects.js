import * as THREE from 'three';

/**
 * Visual Object Factory for Place Value sticks, bundles, and slabs.
 * Follows toy-world low-poly rounded aesthetic.
 */

// Shared Materials & Geometries for high performance & clean disposal
const stickMaterial = new THREE.MeshStandardMaterial({
  color: 0x38bdf8, // Sky Blue
  roughness: 0.35,
  metalness: 0.1,
});

const stickGlowMaterial = new THREE.MeshStandardMaterial({
  color: 0x67e8f9,
  emissive: 0x0284c7,
  emissiveIntensity: 0.6,
  roughness: 0.2,
});

const bundleStickMaterial = new THREE.MeshStandardMaterial({
  color: 0x22c55e, // Meadow Green
  roughness: 0.35,
  metalness: 0.1,
});

const ropeMaterial = new THREE.MeshStandardMaterial({
  color: 0xf59e0b, // Golden rope band
  roughness: 0.7,
  metalness: 0.05,
});

const slabMaterial = new THREE.MeshStandardMaterial({
  color: 0xf97316, // Orange
  roughness: 0.35,
  metalness: 0.1,
});

const slabBandMaterial = new THREE.MeshStandardMaterial({
  color: 0xd97706,
  roughness: 0.5,
});

export function createUnitStick() {
  const group = new THREE.Group();
  group.name = 'unit_stick';

  // Rounded toy stick cylinder or box
  const stickGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12);
  const mesh = new THREE.Mesh(stickGeo, stickMaterial.clone());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 0.35;
  group.add(mesh);

  // Tiny top cap highlight
  const capGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const topCap = new THREE.Mesh(capGeo, mesh.material);
  topCap.position.y = 0.7;
  topCap.scale.set(1, 0.4, 1);
  group.add(topCap);

  group.userData = {
    type: 'unit',
    setGlow: (glow) => {
      mesh.material = glow ? stickGlowMaterial : stickMaterial;
      topCap.material = mesh.material;
    }
  };

  return group;
}

export function createTenBundle() {
  const group = new THREE.Group();
  group.name = 'ten_bundle';

  // 10 small sticks grouped in a 2 x 5 cluster
  const stickGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 10);
  const cols = 5;
  const rows = 2;
  const spacingX = 0.18;
  const spacingZ = 0.18;

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= 10) break;
      const stick = new THREE.Mesh(stickGeo, bundleStickMaterial);
      stick.castShadow = true;
      stick.receiveShadow = true;
      stick.position.set(
        (c - (cols - 1) / 2) * spacingX,
        0.4,
        (r - (rows - 1) / 2) * spacingZ
      );
      group.add(stick);
      count++;
    }
  }

  // Visible rope bands around the middle
  const ropeTorus = new THREE.TorusGeometry(0.46, 0.06, 8, 20);
  const ropeMesh1 = new THREE.Mesh(ropeTorus, ropeMaterial);
  ropeMesh1.rotation.x = Math.PI / 2;
  ropeMesh1.position.y = 0.32;
  ropeMesh1.scale.set(1.1, 0.65, 1);
  ropeMesh1.castShadow = true;
  group.add(ropeMesh1);

  const ropeMesh2 = new THREE.Mesh(ropeTorus, ropeMaterial);
  ropeMesh2.rotation.x = Math.PI / 2;
  ropeMesh2.position.y = 0.48;
  ropeMesh2.scale.set(1.1, 0.65, 1);
  ropeMesh2.castShadow = true;
  group.add(ropeMesh2);

  // Small knot or bow on front
  const knotGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const knot = new THREE.Mesh(knotGeo, ropeMaterial);
  knot.position.set(0, 0.4, 0.32);
  group.add(knot);

  // Hook anchor at top for crane to latch onto
  const hookLoopGeo = new THREE.TorusGeometry(0.08, 0.025, 8, 16);
  const hookLoop = new THREE.Mesh(hookLoopGeo, ropeMaterial);
  hookLoop.position.set(0, 0.84, 0);
  group.add(hookLoop);

  group.userData = {
    type: 'ten',
    hookPoint: new THREE.Vector3(0, 0.88, 0)
  };

  return group;
}

export function createHundredSlab() {
  const group = new THREE.Group();
  group.name = 'hundred_slab';

  // Flat slab representing 10 ten-bundles joined together
  const slabWidth = 1.4;
  const slabHeight = 0.22;
  const slabDepth = 1.4;

  const boxGeo = new THREE.BoxGeometry(slabWidth, slabHeight, slabDepth);
  const mainMesh = new THREE.Mesh(boxGeo, slabMaterial);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  mainMesh.position.y = slabHeight / 2;
  group.add(mainMesh);

  // 10 grooved segments across the slab representing the 10 bundled rods
  for (let i = 0; i < 10; i++) {
    const grooveX = -slabWidth / 2 + (i + 0.5) * (slabWidth / 10);
    const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, slabDepth - 0.05, 8);
    const rodMesh = new THREE.Mesh(rodGeo, slabBandMaterial);
    rodMesh.rotation.x = Math.PI / 2;
    rodMesh.position.set(grooveX, slabHeight + 0.02, 0);
    group.add(rodMesh);
  }

  // Hook ring on top center
  const ringGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 16);
  const ring = new THREE.Mesh(ringGeo, ropeMaterial);
  ring.position.set(0, slabHeight + 0.12, 0);
  ring.castShadow = true;
  group.add(ring);

  group.userData = {
    type: 'hundred',
    hookPoint: new THREE.Vector3(0, slabHeight + 0.18, 0)
  };

  return group;
}

/**
 * Generates slot positions on a platform of size (3.2 x 3.2).
 */
export function getUnitSlotPosition(index) {
  // 2 rows of 5 slots
  const col = index % 5;
  const row = Math.floor(index / 5);
  const spacingX = 0.45;
  const spacingZ = 0.6;
  const x = (col - 2) * spacingX;
  const z = (row - 0.5) * spacingZ;
  return new THREE.Vector3(x, 0.05, z);
}

export function getTenSlotPosition(index) {
  // 2 rows of 5 slots
  const col = index % 5;
  const row = Math.floor(index / 5);
  const spacingX = 0.55;
  const spacingZ = 0.65;
  const x = (col - 2) * spacingX;
  const z = (row - 0.5) * spacingZ;
  return new THREE.Vector3(x, 0.05, z);
}

export function getHundredSlotPosition(index) {
  // Stack slabs with slight stagger
  const yOffset = index * 0.25;
  const staggerX = (index % 2 === 0 ? 0.03 : -0.03);
  const staggerZ = (index % 3 === 0 ? 0.03 : -0.02);
  return new THREE.Vector3(staggerX, yOffset + 0.05, staggerZ);
}
