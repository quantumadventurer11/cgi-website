const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const siteUrl = "https://celestialgovernance.org";

const pages = [
  ["/", "index.html"],
  ["/research", "research.html"],
  ["/projects/ostgap", "projects/ostgap.html"],
  ["/projects/lunar", "projects/lunar.html"],
  ["/publications/ostgap-report", "publications/ostgap-report.html"],
  ["/topics", "topics.html"],
  ["/topics/outer-space-governance", "topics/outer-space-governance.html"],
  ["/topics/outer-space-treaty-gaps", "topics/outer-space-treaty-gaps.html"],
  ["/topics/lunar-governance", "topics/lunar-governance.html"],
  ["/topics/copuos-policy", "topics/copuos-policy.html"],
  ["/topics/space-resources-governance", "topics/space-resources-governance.html"],
  ["/topics/space-settlement-governance", "topics/space-settlement-governance.html"],
  ["/topics/article-ii", "topics/article-ii.html"],
  ["/topics/article-vi", "topics/article-vi.html"],
  ["/topics/article-ix", "topics/article-ix.html"],
  ["/insights", "insights.html"],
  ["/insights/what-is-outer-space-governance", "insights/what-is-outer-space-governance.html"],
  ["/insights/outer-space-treaty-gaps", "insights/outer-space-treaty-gaps.html"],
  ["/insights/why-lunar-governance-matters", "insights/why-lunar-governance-matters.html"],
  ["/about", "about.html"],
  ["/team", "team.html"],
  ["/join", "join.html"],
  ["/glossary", "glossary.html"],
  ["/faq", "faq.html"]
];

const forbiddenTerms = [
  ["D", "FH"].join(""),
  ["S", "GAC"].join(""),
  ["Democracy", "and", "Federalism", "Hub"].join(" "),
  ["Space", "Generation", "Advisory", "Council"].join(" "),
  ["dfh", "org", "il"].join("."),
  ["cgi", ["dfh", "org", "il"].join(".")].join("@")
];

const breadcrumbRoutes = new Set(
  pages
    .map(([route]) => route)
    .filter((route) => route.split("/").filter(Boolean).length > 1)
);

const articleRoutes = new Set([
  "/publications/ostgap-report",
  "/insights/what-is-outer-space-governance",
  "/insights/outer-space-treaty-gaps",
  "/insights/why-lunar-governance-matters"
]);

const failures = [];

function readPublic(filePath) {
  return fs.readFileSync(path.join(publicDir, filePath), "utf8");
}

function expectedCanonical(route) {
  return route === "/" ? `${siteUrl}/` : `${siteUrl}${route}`;
}

for (const [route, filePath] of pages) {
  const fullPath = path.join(publicDir, filePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${route}: missing ${filePath}`);
    continue;
  }

  const html = readPublic(filePath);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) failures.push(`${route}: expected one h1, found ${h1Count}`);
  if (!/<title>[^<]{12,}<\/title>/i.test(html)) failures.push(`${route}: missing useful title`);
  if (!/<meta\s+name="description"\s+content="[^"]{50,}"/i.test(html)) failures.push(`${route}: missing useful meta description`);

  const canonical = expectedCanonical(route);
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    failures.push(`${route}: missing canonical ${canonical}`);
  }

  if (!/<meta\s+property="og:title"\s+content="/i.test(html)) failures.push(`${route}: missing og:title`);
  if (!/<meta\s+property="og:description"\s+content="/i.test(html)) failures.push(`${route}: missing og:description`);
  if (!/<meta\s+name="twitter:card"\s+content="/i.test(html)) failures.push(`${route}: missing twitter card`);
  if (!/<a\s+[^>]*href="\/[^"]*"/i.test(html)) failures.push(`${route}: missing crawlable internal link`);
  if (breadcrumbRoutes.has(route) && !html.includes("\"@type\":\"BreadcrumbList\"") && !html.includes("\"@type\": \"BreadcrumbList\"")) {
    failures.push(`${route}: missing BreadcrumbList JSON-LD`);
  }
  if (articleRoutes.has(route) && !html.includes("\"@type\":\"Article\"") && !html.includes("\"@type\": \"Article\"")) {
    failures.push(`${route}: missing Article JSON-LD`);
  }

  for (const term of forbiddenTerms) {
    if (html.includes(term)) failures.push(`${route}: forbidden legacy term ${term}`);
  }
}

const sitemap = readPublic("sitemap.xml");
for (const [route] of pages) {
  const loc = `<loc>${expectedCanonical(route)}</loc>`;
  if (!sitemap.includes(loc)) failures.push(`sitemap: missing ${loc}`);
}

const robots = readPublic("robots.txt");
if (!robots.includes("Sitemap: https://celestialgovernance.org/sitemap.xml")) {
  failures.push("robots.txt: missing sitemap reference");
}

if (failures.length > 0) {
  console.error("SEO check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO check passed for ${pages.length} public pages.`);
