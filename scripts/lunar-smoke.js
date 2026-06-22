const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const app = require("../src/app");

const screenshotDir = path.join(__dirname, "..", ".tmp");
fs.mkdirSync(screenshotDir, { recursive: true });

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch (error) {
    return chromium.launch();
  }
}

function readCanvasPixels() {
  const canvas = document.querySelector("#lunar-city-canvas");
  if (!canvas) return { ok: false, reason: "missing canvas" };

  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) return { ok: false, reason: "missing webgl context" };

  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  let litPixels = 0;
  let totalBrightness = 0;
  const stride = Math.max(4, Math.floor(pixels.length / 12000 / 4) * 4);
  for (let index = 0; index < pixels.length; index += stride) {
    const brightness = pixels[index] + pixels[index + 1] + pixels[index + 2];
    if (brightness > 24) litPixels += 1;
    totalBrightness += brightness;
  }

  return {
    ok: litPixels > 300 && totalBrightness > 45000,
    width,
    height,
    litPixels,
    totalBrightness
  };
}

function inspectLunarScene() {
  const scene = window.__lunarScene;
  if (!scene) return { ok: false, reason: "missing scene inspection API" };

  const origin = scene.latLonToVector3(0, 0, scene.MOON_RADIUS);
  const amity = scene.cities.amity;
  const hattusa = scene.cities.hattusa;
  const mycenae = scene.cities.mycenae;
  const tycho = scene.cities.tycho;
  const kinds = scene.sceneKinds();
  const detailCounts = scene.cityDetailCounts ? scene.cityDetailCounts() : {};

  return {
    ok: true,
    origin,
    referenceRadiusKm: scene.REFERENCE_RADIUS_KM,
    cityCount: Object.keys(scene.cities).length,
    hasSphere: kinds.includes("moon-sphere"),
    cityModelCount: kinds.filter((kind) => kind === "city-model").length,
    cityDetailCount: kinds.filter((kind) => kind && kind.startsWith("city-")).length,
    detailCounts,
    assetSources: scene.cityAssetSources ? scene.cityAssetSources() : {},
    assetStatuses: scene.cityAssetStatuses ? scene.cityAssetStatuses() : {},
    isAnimationVisible: scene.isAnimationVisible ? scene.isAnimationVisible() : true,
    isFrameScheduled: scene.isFrameScheduled ? scene.isFrameScheduled() : false,
    coordinates: {
      amity: { lat: amity.lat, lonEast: amity.lonEast },
      hattusa: { lat: hattusa.lat, lonEast: hattusa.lonEast },
      mycenae: { lat: mycenae.lat, lonEast: mycenae.lonEast },
      tycho: { lat: tycho.lat, lonEast: tycho.lonEast }
    }
  };
}

function inspectLunarHero() {
  const title = document.querySelector(".lunar-project-page .lunar-hero-copy h1");
  const hero = document.querySelector(".lunar-project-page .lunar-hero");
  if (!title || !hero) return { ok: false, reason: "missing lunar hero" };
  const titleRect = title.getBoundingClientRect();
  const heroRect = hero.getBoundingClientRect();
  return {
    ok: titleRect.height < window.innerHeight * 0.42 && titleRect.right <= window.innerWidth + 1 && heroRect.height <= window.innerHeight * 0.86,
    titleHeight: titleRect.height,
    heroHeight: heroRect.height,
    viewportHeight: window.innerHeight,
    titleRight: titleRect.right,
    viewportWidth: window.innerWidth
  };
}

function inspectHomeHero() {
  const hero = document.querySelector(".aaa-hero");
  const title = document.querySelector(".aaa-hero h1");
  const actions = document.querySelector(".aaa-hero .hero-actions");
  if (!hero || !title || !actions) return { ok: false, reason: "missing AAA homepage hero elements" };

  const heroRect = hero.getBoundingClientRect();
  const titleRect = title.getBoundingClientRect();
  const actionsRect = actions.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  return {
    ok:
      heroRect.height >= window.innerHeight * 0.82 &&
      titleRect.width > 260 &&
      titleRect.right <= viewportWidth + 1 &&
      actionsRect.bottom <= heroRect.bottom + 1,
    heroHeight: heroRect.height,
    titleRight: titleRect.right,
    viewportWidth,
    actionsBottom: actionsRect.bottom,
    heroBottom: heroRect.bottom
  };
}

function inspectLunarAdministration() {
  const section = document.querySelector("#lunar-administration");
  const seal = section ? section.querySelector('img[src="/assets/lunar-administration-seal.svg"]') : null;
  const functions = section ? section.querySelectorAll(".admin-dashboard article") : [];

  return {
    ok: Boolean(section && seal && seal.complete && seal.naturalWidth > 0 && seal.alt && functions.length >= 9),
    hasSection: Boolean(section),
    hasSeal: Boolean(seal),
    sealLoaded: Boolean(seal && seal.complete && seal.naturalWidth > 0),
    hasAlt: Boolean(seal && seal.alt),
    functionCount: functions.length
  };
}

function inspectLunarNewSections() {
  const sustainability = document.querySelector("#sustainable-operations");
  const sustainabilityItems = sustainability ? sustainability.querySelectorAll(".sustainability-grid article") : [];

  return {
    ok: Boolean(sustainability && sustainabilityItems.length >= 8),
    hasSustainability: Boolean(sustainability),
    sustainabilityItemCount: sustainabilityItems.length
  };
}

async function main() {
  const server = app.listen(0);
  const port = await new Promise((resolve) => server.once("listening", () => resolve(server.address().port)));
  const browser = await launchBrowser();
  const errors = [];

  try {
    const home = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    home.on("pageerror", (error) => errors.push(error.message));
    home.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await home.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await home.screenshot({ path: path.join(screenshotDir, "home-desktop.png"), fullPage: true });
    const homeHero = await home.evaluate(inspectHomeHero);
    if (!homeHero.ok) throw new Error(`Homepage AAA hero inspection failed: ${JSON.stringify(homeHero)}`);
    await home.setViewportSize({ width: 390, height: 900 });
    await home.reload({ waitUntil: "networkidle" });
    await home.screenshot({ path: path.join(screenshotDir, "home-mobile.png"), fullPage: true });
    const mobileHomeHero = await home.evaluate(inspectHomeHero);
    if (!mobileHomeHero.ok) throw new Error(`Mobile homepage AAA hero inspection failed: ${JSON.stringify(mobileHomeHero)}`);
    await home.close();

    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(`http://127.0.0.1:${port}/projects/lunar`, { waitUntil: "networkidle" });
    await page.locator("#lunar-model").scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(screenshotDir, "lunar-desktop.png"), fullPage: true });

    const heroInspection = await page.evaluate(inspectLunarHero);
    if (!heroInspection.ok) throw new Error(`Lunar hero is too large or overflowing: ${JSON.stringify(heroInspection)}`);

    const lunarAdministration = await page.evaluate(inspectLunarAdministration);
    if (!lunarAdministration.ok) throw new Error(`Lunar Administration section inspection failed: ${JSON.stringify(lunarAdministration)}`);
    const newSections = await page.evaluate(inspectLunarNewSections);
    if (!newSections.ok) throw new Error(`Lunar sustainability inspection failed: ${JSON.stringify(newSections)}`);

    const desktopPixels = await page.evaluate(readCanvasPixels);
    if (!desktopPixels.ok) throw new Error(`Desktop lunar canvas did not render enough pixels: ${JSON.stringify(desktopPixels)}`);

    const sceneInspection = await page.evaluate(inspectLunarScene);
    if (!sceneInspection.ok) throw new Error(`Lunar scene inspection failed: ${JSON.stringify(sceneInspection)}`);
    if (!sceneInspection.hasSphere) throw new Error("Lunar scene is missing the textured Moon sphere.");
    if (sceneInspection.cityModelCount !== 4) throw new Error(`Expected 4 city models, found ${sceneInspection.cityModelCount}.`);
    if (sceneInspection.cityCount !== 4) throw new Error(`Expected 4 city data records, found ${sceneInspection.cityCount}.`);
    if (!["glb", "procedural-fallback"].includes(sceneInspection.assetSources.amity)) {
      throw new Error(`Expected active city to load GLB or fallback model, got ${JSON.stringify(sceneInspection.assetSources)}.`);
    }
    if (Math.abs(sceneInspection.origin[0]) > 0.001 || Math.abs(sceneInspection.origin[1]) > 0.001 || sceneInspection.origin[2] < 9.99) {
      throw new Error(`lat 0, lon 0 did not map to the expected equator/prime-meridian vector: ${JSON.stringify(sceneInspection.origin)}`);
    }
    if (sceneInspection.coordinates.hattusa.lat > -89 || sceneInspection.coordinates.mycenae.lat > -85) {
      throw new Error(`Hattusa/Mycenae are not near the south pole: ${JSON.stringify(sceneInspection.coordinates)}`);
    }
    if (Math.abs(sceneInspection.coordinates.amity.lat) > 2 || sceneInspection.coordinates.tycho.lat > -40) {
      throw new Error(`Amity/Tycho coordinate sanity check failed: ${JSON.stringify(sceneInspection.coordinates)}`);
    }

    for (const city of ["mycenae", "hattusa", "tycho", "amity"]) {
      await page.click(`[data-city="${city}"]`);
      await page.waitForTimeout(450);
      const activeName = await page.locator("[data-city-name]").innerText();
      if (!activeName.toLowerCase().includes(city === "amity" ? "amity" : city)) {
        throw new Error(`Selecting ${city} did not update panel name; got ${activeName}.`);
      }
      const source = await page.evaluate((cityKey) => window.__lunarScene.cityAssetSources()[cityKey], city);
      if (!["glb", "procedural-fallback"].includes(source)) {
        throw new Error(`Selecting ${city} did not load a GLB or fallback model; got ${source}.`);
      }
    }

    await page.evaluate(() => document.querySelector("#sustainable-operations").scrollIntoView());
    await page.waitForTimeout(250);
    const offscreenState = await page.evaluate(() => window.__lunarScene.isAnimationVisible());
    if (offscreenState) throw new Error("Expected lunar animation visibility to pause when model is offscreen.");

    await page.setViewportSize({ width: 390, height: 900 });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(screenshotDir, "lunar-mobile.png"), fullPage: true });

    const mobileHeroInspection = await page.evaluate(inspectLunarHero);
    if (!mobileHeroInspection.ok) throw new Error(`Mobile lunar hero is too large or overflowing: ${JSON.stringify(mobileHeroInspection)}`);

    const mobilePixels = await page.evaluate(readCanvasPixels);
    if (!mobilePixels.ok) throw new Error(`Mobile lunar canvas did not render enough pixels: ${JSON.stringify(mobilePixels)}`);
    if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);

    console.log("Lunar 3D smoke test passed.");
    console.log(`Desktop canvas: ${desktopPixels.width}x${desktopPixels.height}, lit pixels ${desktopPixels.litPixels}.`);
    console.log(`Mobile canvas: ${mobilePixels.width}x${mobilePixels.height}, lit pixels ${mobilePixels.litPixels}.`);
    console.log(`Screenshots: ${path.join(screenshotDir, "home-desktop.png")}, ${path.join(screenshotDir, "home-mobile.png")}, ${path.join(screenshotDir, "lunar-desktop.png")}, and ${path.join(screenshotDir, "lunar-mobile.png")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
