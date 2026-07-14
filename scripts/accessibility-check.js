const { chromium } = require("playwright");
const app = require("../src/app");

const pages = [
  "/",
  "/research",
  "/projects/ostgap",
  "/projects/lunar",
  "/publications/ostgap-report",
  "/topics",
  "/topics/outer-space-governance",
  "/topics/outer-space-treaty-gaps",
  "/topics/lunar-governance",
  "/topics/copuos-policy",
  "/topics/space-resources-governance",
  "/topics/space-settlement-governance",
  "/topics/article-ii",
  "/topics/article-vi",
  "/topics/article-ix",
  "/insights",
  "/insights/what-is-outer-space-governance",
  "/insights/outer-space-treaty-gaps",
  "/insights/why-lunar-governance-matters",
  "/about",
  "/team",
  "/join",
  "/glossary",
  "/faq"
];

async function launchBrowser() {
  try { return await chromium.launch({ channel: "chrome" }); }
  catch (error) { return chromium.launch(); }
}

function collectAccessibilityIssues() {
  const issues = [];
  const isVisible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };
  const text = (element) => (element.textContent || "").replace(/\s+/g, " ").trim();
  const accessibleName = (element) => {
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const value = labelledBy.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map(text).join(" ").trim();
      if (value) return value;
    }
    if (element.id) {
      const label = document.querySelector("label[for=\"" + CSS.escape(element.id) + "\"]");
      if (label && text(label)) return text(label);
    }
    const wrappedLabel = element.closest("label");
    if (wrappedLabel && text(wrappedLabel)) return text(wrappedLabel);
    const img = element.querySelector ? element.querySelector("img[alt]") : null;
    if (img && img.getAttribute("alt")) return img.getAttribute("alt").trim();
    const title = element.getAttribute("title");
    if (title && title.trim()) return title.trim();
    return text(element);
  };

  const h1s = Array.from(document.querySelectorAll("h1")).filter(isVisible);
  if (h1s.length !== 1) issues.push("expected one visible h1, found " + h1s.length);

  for (const img of Array.from(document.images).filter(isVisible)) {
    if (!img.hasAttribute("alt")) issues.push("visible image is missing alt: " + (img.currentSrc || img.src || "unknown"));
  }

  for (const control of Array.from(document.querySelectorAll("input, select, textarea")).filter(isVisible)) {
    if (control.type === "hidden") continue;
    if (!accessibleName(control)) issues.push("form control lacks accessible name: " + control.tagName.toLowerCase() + (control.name ? "[name=" + control.name + "]" : ""));
  }

  for (const element of Array.from(document.querySelectorAll("a[href], button")).filter(isVisible)) {
    if (!accessibleName(element)) issues.push(element.tagName.toLowerCase() + " lacks accessible name");
  }

  const focusables = Array.from(document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")).filter((element) => {
    if (!isVisible(element)) return false;
    if (element.disabled) return false;
    const tabindex = element.getAttribute("tabindex");
    return tabindex !== "-1";
  });
  for (const element of focusables.slice(0, 40)) {
    element.focus({ preventScroll: true });
    if (document.activeElement !== element) issues.push("focusable element could not receive focus: " + element.tagName.toLowerCase());
  }

  const parseColor = (value) => {
    const match = value && value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
  };
  const luminance = (color) => {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  };
  const ratio = (foreground, background) => {
    const l1 = luminance(foreground);
    const l2 = luminance(background);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const effectiveBackground = (element) => {
    let current = element;
    while (current && current !== document.documentElement) {
      const style = getComputedStyle(current);
      const color = parseColor(style.backgroundColor);
      if (color && color.a > 0.05) return color;
      current = current.parentElement;
    }
    const body = parseColor(getComputedStyle(document.body).backgroundColor);
    return body && body.a > 0.05 ? body : { r: 255, g: 255, b: 255, a: 1 };
  };
  const contrastElements = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,li,a,button,label,span,summary,dt,dd,strong,small")).filter((element) => isVisible(element) && text(element).length > 0);
  for (const element of contrastElements) {
    const style = getComputedStyle(element);
    const color = parseColor(style.color);
    if (!color || color.a < 0.5) continue;
    const fontSize = Number.parseFloat(style.fontSize);
    const fontWeight = Number.parseFloat(style.fontWeight) || 400;
    const threshold = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
    const contrast = ratio(color, effectiveBackground(element));
    if (contrast + 0.01 < threshold) {
      issues.push("low contrast " + contrast.toFixed(2) + " on " + element.tagName.toLowerCase() + ": " + text(element).slice(0, 70));
      if (issues.length > 25) break;
    }
  }

  return issues;
}

async function main() {
  const server = app.listen(0);
  const port = await new Promise((resolve) => server.once("listening", () => resolve(server.address().port)));
  const browser = await launchBrowser();
  const failures = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    for (const route of pages) {
      await page.goto("http://127.0.0.1:" + port + route, { waitUntil: "networkidle" });
      const issues = await page.evaluate(collectAccessibilityIssues);
      for (const issue of issues) failures.push(route + ": " + issue);
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (failures.length > 0) {
    console.error("Accessibility check failed:");
    for (const failure of failures) console.error("- " + failure);
    process.exit(1);
  }
  console.log("Accessibility check passed for " + pages.length + " public pages.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
