import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";

const viewer = document.querySelector("[data-lunar-viewer]");
const canvas = document.querySelector("#lunar-city-canvas");

export const MOON_RADIUS = 10;
export const REFERENCE_RADIUS_KM = 1737.4;

export const cities = {
  amity: {
    name: "Amity City",
    phase: "Phase I diplomatic node",
    role: "Diplomatic Hub",
    site: "Mare Tranquillitatis",
    displayCoordinate: "0.67° N, 23.47° E",
    lat: 0.67,
    lonEast: 23.47,
    asset: "/assets/models/lunar/amity.glb",
    modelType: "Forum dome, delegation habitats, archive module, landing pad, antennas, solar panels, corridors, and protected mobility route.",
    summary: "Diplomatic and administrative coordination district for early multilateral activity.",
    governance: "Secretariat functions, registry support, dispute intake, and public transparency reporting.",
    infrastructure: "Habitat clusters, public forum dome, landing safety area, antenna array, registry/archive module.",
    question: "What minimum public authority is needed before a settlement becomes an operating community?",
    color: 0xd8b94d
  },
  mycenae: {
    name: "Mycenae",
    phase: "Phase II governance node",
    role: "Governance Capital",
    site: "Malapert Massif",
    displayCoordinate: "86.00° S, 0.00° E",
    lat: -86.0,
    lonEast: 0.0,
    asset: "/assets/models/lunar/mycenae.glb",
    modelType: "Assembly dome, civic habitat campus, dual communications masts, landing pad, protected corridors, radiator field, and perimeter markers.",
    summary: "Governance capital modeled around an ISA-style treaty administration concept.",
    governance: "Jurisdiction, membership, recordkeeping, standards-setting, and dispute-resolution structure.",
    infrastructure: "Central assembly habitat, communications mast, civic modules, landing pad, protected surface corridors.",
    question: "How should a lunar administration remain distinct from a UN organ while still serving public authority?",
    color: 0x8fc9ff
  },
  hattusa: {
    name: "Hattusa",
    phase: "Phase III industrial node",
    role: "Industrial Capital",
    site: "PSR peaks of eternal light + water-ice",
    displayCoordinate: "89.45° S, 137.31° W",
    lat: -89.45,
    lonEast: 222.69,
    asset: "/assets/models/lunar/hattusa.glb",
    modelType: "Bermed processing modules, volatile tanks, cargo pad, cranes, ridge solar farms, logistics corridors, and industrial rover route.",
    summary: "Industrial resource-support node for power, volatile logistics, and shared infrastructure governance.",
    governance: "Resource activity licensing, environmental monitoring, power access rules, and industrial safety buffers.",
    infrastructure: "Solar ridge arrays, storage tanks, cargo pads, bermed industrial modules, rover/logistics routes.",
    question: "Who governs scarce infrastructure when public missions and private operators depend on the same systems?",
    color: 0x9ce0c0
  },
  tycho: {
    name: "Tycho",
    phase: "Phase IV science node",
    role: "Science Capital",
    site: "Tycho Crater Rim",
    displayCoordinate: "43.37° S, 348.68° E",
    lat: -43.37,
    lonEast: 348.68,
    asset: "/assets/models/lunar/tycho.glb",
    modelType: "Shielded labs, observatory mast, instrument field, sample-handling modules, solar array, radiator bank, and crater-rim rover route.",
    summary: "Science node for crater-rim research, observatory operations, sample handling, and field mobility.",
    governance: "Research access protocols, protected scientific zones, sample handling rules, and open data review.",
    infrastructure: "Observatory/instrument fields, shielded labs, sample handling modules, rover routes, crater-rim markers.",
    question: "How should high-value science sites be protected without freezing legitimate exploration?",
    color: 0xff9f7a
  }
};

export function latLonToVector3(latDeg, lonEastDeg, radius = MOON_RADIUS) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonEastDeg);
  const cosLat = Math.cos(lat);
  return new THREE.Vector3(
    radius * cosLat * Math.sin(lon),
    radius * Math.sin(lat),
    radius * cosLat * Math.cos(lon)
  );
}

if (viewer && canvas) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactViewport = window.matchMedia("(max-width: 760px)").matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (error) {
    viewer.dataset.renderStatus = "unavailable";
    const hint = viewer.querySelector(".model-hint");
    if (hint) hint.textContent = "The 3D lunar model requires WebGL. Please use a browser with hardware acceleration enabled.";
  }

  if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compactViewport ? 1.35 : 1.65));
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
  camera.position.set(0, 5, 28);

  const moonGroup = new THREE.Group();
  scene.add(moonGroup);

  const ambient = new THREE.HemisphereLight(0x9fbfff, 0x100e18, 1.15);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff1bd, 3.4);
  sun.position.set(-20, 14, 18);
  sun.castShadow = false;
  scene.add(sun);

  const textureLoader = new THREE.TextureLoader();
  const colorMap = textureLoader.load("/assets/moon/nasa-lroc-color-2k.jpg", requestRender);
  const heightMap = textureLoader.load("/assets/moon/nasa-ldem-8bit-1k.jpg", requestRender);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 8;
  heightMap.anisotropy = 8;

  const moonMaterial = new THREE.MeshStandardMaterial({
    map: colorMap,
    bumpMap: heightMap,
    bumpScale: 0.28,
    roughness: 0.92,
    metalness: 0.01
  });

  const moonSegments = compactViewport ? { width: 64, height: 32 } : { width: 96, height: 48 };
  const moon = new THREE.Mesh(new THREE.SphereGeometry(MOON_RADIUS, moonSegments.width, moonSegments.height), moonMaterial);
  moon.name = "textured-moon-sphere";
  moon.userData.kind = "moon-sphere";
  moon.castShadow = true;
  moon.receiveShadow = true;
  moonGroup.add(moon);

  const routeMaterial = new THREE.LineBasicMaterial({ color: 0xc9a227, transparent: true, opacity: 0.62 });
  const routePoints = Object.values(cities).map((city) => latLonToVector3(city.lat, city.lonEast, MOON_RADIUS + 0.08));
  routePoints.push(routePoints[0].clone());
  const route = new THREE.Line(new THREE.BufferGeometry().setFromPoints(routePoints), routeMaterial);
  route.name = "city-coordinate-route";
  moonGroup.add(route);

  const cityGroups = {};
  const gltfLoader = new GLTFLoader();
  const cityAssetPromises = {};
  let isVisible = true;
  let needsRender = true;
  let frameHandle = 0;

  function requestRender() {
    needsRender = true;
    scheduleFrame();
  }

  function scheduleFrame() {
    if (!isVisible || frameHandle) return;
    frameHandle = requestAnimationFrame(animate);
  }

  function material(color, roughness = 0.62, metalness = 0.08) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  function localPosition(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  function addMesh(group, mesh, x, y, z, kind = "city-detail") {
    mesh.position.copy(localPosition(x, y, z));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (kind) {
      mesh.userData.kind = kind;
      group.userData.detailCount = (group.userData.detailCount || 0) + 1;
    }
    group.add(mesh);
    return mesh;
  }

  function addCylinder(group, radius, height, x, z, color, y = 0.03, segments = 24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.96, height, segments), material(color));
    addMesh(group, mesh, x, y + height / 2, z);
    return mesh;
  }

  function addBox(group, width, height, depth, x, z, color, y = 0.03, kind = "city-detail") {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, 0.68, 0.12));
    addMesh(group, mesh, x, y + height / 2, z, kind);
    return mesh;
  }

  function addDome(group, radius, x, z, color) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.34, metalness: 0.04, transmission: 0.12, transparent: true, opacity: 0.78 })
    );
    addMesh(group, mesh, x, 0.04, z);
    return mesh;
  }

  function addPad(group, radius, x, z, color = 0x2a3146) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.06, 40), material(color, 0.78, 0.18));
    addMesh(group, pad, x, 0.03, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.82, 0.012, 8, 48), material(0xc9a227, 0.54, 0.18));
    ring.rotation.x = Math.PI / 2;
    addMesh(group, ring, x, 0.082, z);
    return pad;
  }

  function addAntenna(group, x, z, color) {
    addCylinder(group, 0.025, 0.95, x, z, 0xd8d6ce);
    [[0.16, 0.38], [0.24, 0.66]].forEach(([radius, height]) => {
      const dish = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008, 8, 28), material(0xd8d6ce, 0.42, 0.24));
      dish.rotation.x = Math.PI / 2;
      dish.rotation.z = height;
      addMesh(group, dish, x, height, z);
    });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85 }));
    addMesh(group, beacon, x, 1.02, z);
  }

  function addRoverRoute(group, points, color = 0xc9a227) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, 0.075, z))),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.68 })
    );
    group.add(line);
  }

  function addSolarArray(group, x, z, rotation = 0) {
    const panel = addBox(group, 0.42, 0.025, 0.18, x, z, 0x203a66, 0.16, "city-panel");
    panel.rotation.y = rotation;
    panel.rotation.x = -0.32;
    addCylinder(group, 0.015, 0.18, x, z, 0xd8d6ce, 0.03);
  }

  function addHabitat(group, length, radius, x, z, color, rotation = 0) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 28), material(color, 0.58, 0.12));
    body.rotation.z = Math.PI / 2;
    body.rotation.y = rotation;
    addMesh(group, body, x, radius + 0.03, z);
    const endOffset = new THREE.Vector3(Math.cos(rotation) * length * 0.5, 0, -Math.sin(rotation) * length * 0.5);
    [-1, 1].forEach((side) => {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 12), material(color, 0.54, 0.1));
      cap.scale.set(0.72, 1, 1);
      addMesh(group, cap, x + endOffset.x * side, radius + 0.03, z + endOffset.z * side);
    });
    return body;
  }

  function addCorridor(group, x1, z1, x2, z2, color = 0xcfd8e6) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(-dz, dx);
    addHabitat(group, length, 0.045, (x1 + x2) / 2, (z1 + z2) / 2, color, angle);
  }

  function addTank(group, x, z, color = 0xf4f1e8) {
    addCylinder(group, 0.12, 0.32, x, z, color, 0.03, 28);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 10), material(color, 0.48, 0.1));
    top.scale.y = 0.46;
    addMesh(group, top, x, 0.36, z);
  }

  function addBerm(group, radius, x, z, color = 0x8b8277) {
    const berm = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 8, 54), material(color, 0.92, 0.02));
    berm.rotation.x = Math.PI / 2;
    addMesh(group, berm, x, 0.075, z);
  }

  function addCrane(group, x, z, rotation = 0) {
    addCylinder(group, 0.025, 0.58, x, z, 0xd8d6ce);
    const arm = addBox(group, 0.58, 0.025, 0.035, x + Math.cos(rotation) * 0.18, z - Math.sin(rotation) * 0.18, 0xc9a227, 0.58, "city-truss");
    arm.rotation.y = rotation;
    const hook = addCylinder(group, 0.012, 0.18, x + Math.cos(rotation) * 0.43, z - Math.sin(rotation) * 0.43, 0xd8d6ce, 0.37);
    hook.rotation.z = 0.1;
  }

  function addInstrument(group, x, z, color) {
    addCylinder(group, 0.028, 0.16, x, z, 0xd8d6ce, 0.03, 12);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.07, 18), material(color, 0.38, 0.16));
    head.rotation.z = Math.PI / 2;
    addMesh(group, head, x, 0.22, z);
  }

  function addRadiator(group, x, z, rotation = 0) {
    [-0.08, 0, 0.08].forEach((offset) => {
      const fin = addBox(group, 0.38, 0.018, 0.038, x + Math.sin(rotation) * offset, z + Math.cos(rotation) * offset, 0xb9c4d5, 0.22, "city-radiator");
      fin.rotation.y = rotation;
      fin.rotation.x = -0.48;
    });
  }

  function addSolarFarm(group, centerX, centerZ, columns, rows, spacing, rotation = 0) {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const x = centerX + (col - (columns - 1) / 2) * spacing;
        const z = centerZ + (row - (rows - 1) / 2) * spacing * 0.62;
        addSolarArray(group, x, z, rotation + (row % 2 ? 0.08 : -0.08));
      }
    }
  }

  function buildAmity(group, city) {
    addPad(group, 0.72, 0, 0);
    addDome(group, 0.52, 0, 0, city.color);
    addBerm(group, 0.64, 0, 0);
    addDome(group, 0.28, -0.66, 0.34, 0xf1e5b2);
    addDome(group, 0.24, 0.55, -0.44, 0xf4f1e8);
    addHabitat(group, 0.64, 0.12, 0.02, 0.72, 0xd8d6ce, 0.06);
    addHabitat(group, 0.44, 0.09, -0.82, -0.04, 0xe9dfc9, -0.5);
    addHabitat(group, 0.42, 0.09, 0.78, 0.1, 0xe9dfc9, 0.6);
    addCorridor(group, 0, 0, -0.66, 0.34);
    addCorridor(group, 0, 0, 0.55, -0.44);
    addCorridor(group, 0, 0, 0.02, 0.72);
    addPad(group, 0.46, 0.92, 0.62, 0x27334d);
    addAntenna(group, -0.92, -0.58, city.color);
    addAntenna(group, 0.92, -0.2, city.color);
    addRadiator(group, -0.42, -0.64, 0.2);
    addRadiator(group, 0.42, 0.86, -0.18);
    addSolarFarm(group, -0.88, 0.86, 3, 2, 0.22, 0.12);
    addRoverRoute(group, [[-0.92, -0.58], [0, 0], [0.92, 0.62], [0.55, -0.44]]);
  }

  function buildMycenae(group, city) {
    addPad(group, 0.78, 0, 0);
    addDome(group, 0.48, 0, 0, city.color);
    addBerm(group, 0.66, 0, 0);
    addHabitat(group, 0.78, 0.11, -0.54, 0.42, 0xd8d6ce, 0.18);
    addHabitat(group, 0.58, 0.1, 0.56, 0.38, 0xf4f1e8, -0.12);
    addHabitat(group, 0.62, 0.09, 0.34, -0.5, 0xcfd8e6, Math.PI / 2);
    addHabitat(group, 0.42, 0.08, -0.54, -0.42, 0xe9dfc9, -0.52);
    addCorridor(group, 0, 0, -0.54, 0.42);
    addCorridor(group, 0, 0, 0.56, 0.38);
    addCorridor(group, 0, 0, 0.34, -0.5);
    addPad(group, 0.36, -0.88, -0.42, 0x26304a);
    addAntenna(group, 0.9, -0.72, city.color);
    addAntenna(group, -0.86, 0.74, city.color);
    addRadiator(group, 0.72, 0.74, 0.35);
    [[-0.2, 0.72], [0.18, 0.72], [-0.2, -0.76], [0.18, -0.76]].forEach(([x, z]) => addCylinder(group, 0.025, 0.2, x, z, city.color, 0.03, 12));
    addRoverRoute(group, [[-0.88, -0.42], [0, 0], [-0.54, 0.42], [0.56, 0.38], [0.9, -0.72]]);
  }

  function buildHattusa(group, city) {
    addPad(group, 0.82, 0, 0);
    addBerm(group, 0.68, 0, 0);
    addHabitat(group, 0.55, 0.13, -0.25, 0.02, 0xd8d6ce, 0.18);
    addHabitat(group, 0.52, 0.11, -0.72, -0.52, 0x9ba7b6, -0.22);
    addHabitat(group, 0.42, 0.1, 0.16, 0.52, 0xe9dfc9, 0.62);
    addCylinder(group, 0.16, 0.42, 0.42, -0.32, city.color);
    addCylinder(group, 0.13, 0.34, 0.72, -0.28, 0xf4f1e8);
    addTank(group, 0.56, -0.58);
    addTank(group, 0.82, -0.58, 0xcfd8e6);
    addCorridor(group, -0.25, 0.02, 0.42, -0.32);
    addCorridor(group, -0.25, 0.02, -0.72, -0.52);
    addCorridor(group, -0.25, 0.02, 0.16, 0.52);
    addPad(group, 0.38, 0.86, 0.45, 0x26304a);
    addCrane(group, 0.92, 0.02, -0.3);
    addCrane(group, -0.9, -0.1, 0.42);
    addSolarFarm(group, -0.48, 0.88, 5, 2, 0.27, 0.08);
    addSolarFarm(group, 0.68, 0.88, 4, 2, 0.25, -0.04);
    addRoverRoute(group, [[-0.9, 0.82], [0, 0], [0.86, 0.45], [0.72, -0.28], [-0.74, -0.52]]);
  }

  function buildTycho(group, city) {
    addPad(group, 0.68, 0, 0);
    addDome(group, 0.34, -0.28, 0.06, city.color);
    addBerm(group, 0.52, -0.28, 0.06);
    addHabitat(group, 0.58, 0.1, 0.42, 0.18, 0xd8d6ce, 0.12);
    addHabitat(group, 0.46, 0.09, 0.72, -0.56, 0xcfd8e6, -0.1);
    addHabitat(group, 0.38, 0.08, -0.06, -0.62, 0xe9dfc9, 0.54);
    addCorridor(group, -0.28, 0.06, 0.42, 0.18);
    addCorridor(group, -0.28, 0.06, 0.72, -0.56);
    const telescope = addCylinder(group, 0.09, 0.52, -0.72, -0.46, 0xf4f1e8);
    telescope.rotation.z = 0.55;
    addCylinder(group, 0.12, 0.2, 0.72, -0.56, 0xcfd8e6);
    addAntenna(group, 0.88, 0.58, city.color);
    [[-0.95, 0.58], [-0.72, 0.74], [-0.48, 0.55], [-0.3, 0.78], [-0.98, 0.28], [-0.46, 0.92]].forEach(([x, z]) => addInstrument(group, x, z, city.color));
    addRadiator(group, 0.26, -0.82, -0.24);
    addSolarFarm(group, 0.78, 0.88, 3, 2, 0.24, -0.28);
    addRoverRoute(group, [[-0.95, 0.58], [-0.28, 0.06], [0.42, 0.18], [0.88, 0.58], [0.72, -0.56]]);
  }

  const modelBuilders = {
    amity: buildAmity,
    mycenae: buildMycenae,
    hattusa: buildHattusa,
    tycho: buildTycho
  };

  function createCityModel(city) {
    const group = new THREE.Group();
    group.name = `${city.name} scenario model`;
    group.userData.kind = "city-model";
    group.userData.city = city.name;
    group.userData.lat = city.lat;
    group.userData.lonEast = city.lonEast;
    group.userData.detailCount = 0;

    const surfaceNormal = latLonToVector3(city.lat, city.lonEast, 1).normalize();
    group.position.copy(surfaceNormal.clone().multiplyScalar(MOON_RADIUS + 0.18));
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfaceNormal);
    group.scale.setScalar(0.54);

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 12),
      new THREE.MeshStandardMaterial({ color: city.color, emissive: city.color, emissiveIntensity: 0.55 })
    );
    marker.name = `${city.name} coordinate marker`;
    addMesh(group, marker, 0, 0.62, 0, "city-marker");
    group.userData.assetStatus = "marker";
    group.userData.modelSource = "marker";
    return group;
  }

  function countMeshes(root) {
    let count = 0;
    root.traverse((object) => {
      if (object.isMesh) count += 1;
    });
    return count;
  }

  function normalizeLoadedAsset(root) {
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = true;
      object.userData.kind = "city-glb-detail";
      if (object.material) {
        object.material.roughness = Math.max(object.material.roughness || 0.5, 0.62);
      }
    });
  }

  function loadCityAsset(key) {
    const group = cityGroups[key];
    const city = cities[key];
    if (!group || !city) return Promise.resolve(false);
    if (group.userData.assetStatus === "loaded" || group.userData.assetStatus === "fallback") return Promise.resolve(true);
    if (cityAssetPromises[key]) return cityAssetPromises[key];

    group.userData.assetStatus = "loading";
    const hint = viewer.querySelector(".model-hint");
    if (hint) hint.textContent = `Loading ${city.name} model...`;

    cityAssetPromises[key] = new Promise((resolve) => {
      gltfLoader.load(city.asset, (gltf) => {
        const asset = gltf.scene;
        asset.name = `${city.name} optimized GLB city kit`;
        normalizeLoadedAsset(asset);
        group.add(asset);
        group.userData.assetStatus = "loaded";
        group.userData.modelSource = "glb";
        group.userData.detailCount = Math.max(group.userData.detailCount || 0, countMeshes(asset));
        if (hint) hint.textContent = "Drag to rotate. Select a city to focus.";
        requestRender();
        resolve(true);
      }, undefined, () => {
        modelBuilders[key](group, city);
        group.userData.assetStatus = "fallback";
        group.userData.modelSource = "procedural-fallback";
        if (hint) hint.textContent = "GLB model unavailable; showing optimized procedural fallback.";
        requestRender();
        resolve(false);
      });
    });

    return cityAssetPromises[key];
  }

  Object.entries(cities).forEach(([key, city]) => {
    city.key = key;
    const cityModel = createCityModel(city);
    moonGroup.add(cityModel);
    cityGroups[key] = cityModel;
  });

  const fields = {
    phase: viewer.querySelector("[data-city-phase]"),
    name: viewer.querySelector("[data-city-name]"),
    summary: viewer.querySelector("[data-city-summary]"),
    role: viewer.querySelector("[data-city-role]"),
    site: viewer.querySelector("[data-city-site]"),
    coordinates: viewer.querySelector("[data-city-coordinates]"),
    governance: viewer.querySelector("[data-city-governance]"),
    infrastructure: viewer.querySelector("[data-city-infrastructure]"),
    model: viewer.querySelector("[data-city-model]"),
    question: viewer.querySelector("[data-city-question]")
  };

  let activeCity = "amity";
  let targetRotation = 0;
  let isDragging = false;
  let lastX = 0;
  const focusTarget = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3(0, 4.5, 26);

  function focusCity(key) {
    const data = cities[key];
    if (!data) return;
    activeCity = key;
    Object.entries(fields).forEach(([field, element]) => {
      if (!element) return;
      if (field === "coordinates") element.textContent = data.displayCoordinate;
      else if (field === "model") element.textContent = data.modelType;
      else element.textContent = data[field];
    });

    viewer.querySelectorAll("[data-city]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.city === key);
    });

    const surface = latLonToVector3(data.lat, data.lonEast, MOON_RADIUS + 0.18).normalize();
    const poleLift = data.lat < -80 ? new THREE.Vector3(0, 7.2, 0) : new THREE.Vector3(0, 4.2, 0);
    focusTarget.copy(surface.clone().multiplyScalar(data.lat < -80 ? MOON_RADIUS * 0.18 : MOON_RADIUS * 0.38));
    cameraTarget.copy(surface.clone().multiplyScalar(data.lat < -80 ? MOON_RADIUS * 2.9 : MOON_RADIUS * 2.55).add(poleLift));
    targetRotation = -THREE.MathUtils.degToRad(data.lonEast);
    loadCityAsset(key);
    requestRender();
  }

  viewer.querySelectorAll("[data-city]").forEach((button) => {
    button.addEventListener("click", () => focusCity(button.dataset.city));
  });

  canvas.addEventListener("pointerdown", (event) => {
    isDragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const delta = event.clientX - lastX;
    lastX = event.clientX;
    targetRotation += delta * 0.008;
    requestRender();
  });

  canvas.addEventListener("pointerup", () => {
    isDragging = false;
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(360, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }

  function animate() {
    frameHandle = 0;
    if (!isVisible) return;
    moonGroup.rotation.y += (targetRotation - moonGroup.rotation.y) * 0.025;
    camera.position.lerp(cameraTarget, 0.035);
    camera.lookAt(focusTarget);

    let settling = Math.abs(targetRotation - moonGroup.rotation.y) > 0.001 || camera.position.distanceTo(cameraTarget) > 0.02;
    Object.entries(cityGroups).forEach(([key, group]) => {
      const scale = key === activeCity ? 0.7 : 0.48;
      if (Math.abs(group.scale.x - scale) > 0.002) settling = true;
      group.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.08);
    });

    if (needsRender || settling || isDragging) {
      renderer.render(scene, camera);
      needsRender = false;
    }
    if (settling || isDragging) scheduleFrame();
  }

  resize();
  focusCity(activeCity);
  scheduleFrame();
  window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      isVisible = Boolean(entry && entry.isIntersecting);
      if (isVisible) requestRender();
    }, { threshold: 0.08 });
    visibilityObserver.observe(viewer);
  }

  window.__lunarScene = {
    MOON_RADIUS,
    REFERENCE_RADIUS_KM,
    cities,
    latLonToVector3: (lat, lon, radius = MOON_RADIUS) => latLonToVector3(lat, lon, radius).toArray(),
    sceneKinds: () => {
      const kinds = [];
      scene.traverse((object) => {
        if (object.userData.kind) kinds.push(object.userData.kind);
      });
      return kinds;
    },
    cityDetailCounts: () => Object.fromEntries(Object.entries(cityGroups).map(([key, group]) => [key, group.userData.detailCount || 0])),
    cityAssetSources: () => Object.fromEntries(Object.entries(cityGroups).map(([key, group]) => [key, group.userData.modelSource || "marker"])),
    cityAssetStatuses: () => Object.fromEntries(Object.entries(cityGroups).map(([key, group]) => [key, group.userData.assetStatus || "marker"])),
    isAnimationVisible: () => isVisible,
    isFrameScheduled: () => Boolean(frameHandle),
    activeCity: () => activeCity
  };
  }
}
