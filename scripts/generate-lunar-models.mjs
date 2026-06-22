import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      if (this.onloadend) this.onloadend();
    });
  }
};

const outputDir = path.resolve("public/assets/models/lunar");
fs.mkdirSync(outputDir, { recursive: true });

const materials = {
  hull: new THREE.MeshStandardMaterial({ color: 0xbfc4c8, roughness: 0.74, metalness: 0.12 }),
  darkHull: new THREE.MeshStandardMaterial({ color: 0x555d66, roughness: 0.84, metalness: 0.18 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x9fb7c9, roughness: 0.38, metalness: 0.04, transparent: true, opacity: 0.72 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.52, metalness: 0.22 }),
  solar: new THREE.MeshStandardMaterial({ color: 0x101826, roughness: 0.4, metalness: 0.28 }),
  regolith: new THREE.MeshStandardMaterial({ color: 0x756f66, roughness: 0.96, metalness: 0.01 })
};

function mesh(geometry, material, x, y, z, rotation = {}) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  item.castShadow = false;
  item.receiveShadow = true;
  return item;
}

function addHabitat(group, length, radius, x, z, rotation = 0, material = materials.hull) {
  group.add(mesh(new THREE.CylinderGeometry(radius, radius, length, 18), material, x, radius, z, { z: Math.PI / 2, y: rotation }));
}

function addDome(group, radius, x, z, material = materials.glass) {
  group.add(mesh(new THREE.SphereGeometry(radius, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), material, x, 0.02, z));
}

function addPad(group, radius, x, z) {
  group.add(mesh(new THREE.CylinderGeometry(radius, radius, 0.045, 36), materials.darkHull, x, 0.02, z));
  group.add(mesh(new THREE.TorusGeometry(radius * 0.76, 0.012, 8, 40), materials.gold, x, 0.06, z, { x: Math.PI / 2 }));
}

function addAntenna(group, x, z) {
  group.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 10), materials.hull, x, 0.36, z));
  group.add(mesh(new THREE.TorusGeometry(0.14, 0.008, 8, 24), materials.gold, x, 0.62, z, { x: Math.PI / 2 }));
}

function addSolar(group, x, z, rotation = 0) {
  const panel = mesh(new THREE.BoxGeometry(0.38, 0.018, 0.15), materials.solar, x, 0.18, z, { x: -0.28, y: rotation });
  group.add(panel);
  group.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), materials.hull, x, 0.08, z));
}

function addTank(group, x, z) {
  group.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 20), materials.hull, x, 0.16, z));
  group.add(mesh(new THREE.SphereGeometry(0.11, 16, 8), materials.hull, x, 0.31, z));
}

function addBerm(group, radius, x, z) {
  group.add(mesh(new THREE.TorusGeometry(radius, 0.03, 8, 42), materials.regolith, x, 0.055, z, { x: Math.PI / 2 }));
}

function addRover(group, x, z, rotation = 0) {
  group.add(mesh(new THREE.BoxGeometry(0.2, 0.055, 0.12), materials.darkHull, x, 0.08, z, { y: rotation }));
  [-0.08, 0.08].forEach((dx) => [-0.055, 0.055].forEach((dz) => {
    group.add(mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.02, 10), materials.hull, x + dx, 0.035, z + dz, { z: Math.PI / 2 }));
  }));
}

function baseGroup() {
  const group = new THREE.Group();
  group.name = "optimized lunar city glb";
  group.userData.kind = "glb-city-asset";
  return group;
}

function buildAmity() {
  const g = baseGroup();
  addPad(g, 0.7, 0, 0); addDome(g, 0.48, 0, 0); addBerm(g, 0.6, 0, 0);
  addDome(g, 0.22, -0.58, 0.34); addDome(g, 0.2, 0.54, -0.38);
  addHabitat(g, 0.62, 0.1, 0.05, 0.68); addHabitat(g, 0.44, 0.08, -0.78, -0.08, -0.5); addHabitat(g, 0.42, 0.08, 0.78, 0.08, 0.6);
  addPad(g, 0.38, 0.9, 0.58); addAntenna(g, -0.86, -0.56); addAntenna(g, 0.86, -0.18);
  [-0.98, -0.74, -0.5, -0.26].forEach((x) => addSolar(g, x, 0.86, 0.12));
  addRover(g, 0.42, 0.36, -0.3);
  return g;
}

function buildMycenae() {
  const g = baseGroup();
  addPad(g, 0.76, 0, 0); addDome(g, 0.43, 0, 0); addBerm(g, 0.64, 0, 0);
  addHabitat(g, 0.72, 0.1, -0.52, 0.4, 0.15); addHabitat(g, 0.56, 0.09, 0.54, 0.34, -0.12); addHabitat(g, 0.62, 0.08, 0.34, -0.5, Math.PI / 2);
  addPad(g, 0.32, -0.84, -0.38); addAntenna(g, 0.84, -0.68); addAntenna(g, -0.78, 0.7);
  [-0.18, 0.16, 0.5].forEach((x) => addSolar(g, x, 0.76, -0.05));
  addRover(g, -0.42, -0.2, 0.4);
  return g;
}

function buildHattusa() {
  const g = baseGroup();
  addPad(g, 0.8, 0, 0); addBerm(g, 0.68, 0, 0);
  addHabitat(g, 0.54, 0.12, -0.22, 0.02, 0.18); addHabitat(g, 0.52, 0.1, -0.72, -0.5, -0.22); addHabitat(g, 0.42, 0.09, 0.18, 0.52, 0.62);
  addTank(g, 0.44, -0.34); addTank(g, 0.68, -0.32); addTank(g, 0.88, -0.28);
  addPad(g, 0.36, 0.84, 0.44);
  [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].forEach((x, index) => addSolar(g, x, 0.86, index * 0.04));
  addAntenna(g, -0.9, -0.08); addRover(g, 0.5, 0.18, -0.2);
  return g;
}

function buildTycho() {
  const g = baseGroup();
  addPad(g, 0.66, 0, 0); addDome(g, 0.31, -0.28, 0.06); addBerm(g, 0.5, -0.28, 0.06);
  addHabitat(g, 0.56, 0.09, 0.42, 0.18, 0.12); addHabitat(g, 0.45, 0.08, 0.72, -0.54, -0.1); addHabitat(g, 0.38, 0.075, -0.06, -0.62, 0.54);
  groupInstrument(g, -0.82, 0.58); groupInstrument(g, -0.58, 0.74); groupInstrument(g, -0.36, 0.54); groupInstrument(g, -0.16, 0.8);
  addAntenna(g, 0.84, 0.58); addSolar(g, 0.62, 0.86, -0.2); addSolar(g, 0.88, 0.84, -0.24); addRover(g, 0.22, -0.26, 0.2);
  return g;
}

function groupInstrument(group, x, z) {
  group.add(mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.18, 10), materials.hull, x, 0.09, z));
  group.add(mesh(new THREE.CylinderGeometry(0.07, 0.045, 0.06, 14), materials.gold, x, 0.2, z, { z: Math.PI / 2 }));
}

const builders = { amity: buildAmity, mycenae: buildMycenae, hattusa: buildHattusa, tycho: buildTycho };
const exporter = new GLTFExporter();

for (const [name, build] of Object.entries(builders)) {
  const arrayBuffer = await new Promise((resolve, reject) => {
    exporter.parse(build(), resolve, reject, { binary: true, trs: false });
  });
  fs.writeFileSync(path.join(outputDir, `${name}.glb`), Buffer.from(arrayBuffer));
}
