// Shared templates and helpers for the Insights blog.
// Used by render-all.mjs (build all pages) and generate.mjs (daily new article).
import { readFile, writeFile, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");
export const INSIGHTS_DIR = path.join(ROOT, "insights");
export const DATA_FILE = path.join(INSIGHTS_DIR, "articles.json");

const BRAND = "Stone Cold Solutions";

export function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function slugify(title) {
  return String(title).toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-")
    .slice(0, 70);
}

export function displayDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export async function loadArticles() {
  if (!existsSync(DATA_FILE)) return [];
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export async function saveArticles(articles) {
  await writeFile(DATA_FILE, JSON.stringify(articles, null, 2) + "\n", "utf8");
}

// Shared <head>; `up` is the relative path back to site root ("../" for /insights/ pages).
function head(title, description, up) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="theme-color" content="#0f1f30" />
  <link rel="icon" type="image/png" href="${up}images/fulllogo_transparent.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${up}css/styles.css" />
</head>`;
}

function header(up) {
  return `  <header class="site-header" id="top">
    <div class="container header-inner">
      <a href="${up}index.html" class="brand" aria-label="${BRAND} home">
        <img src="${up}images/fulllogo_transparent.png" alt="${BRAND} logo" class="brand-logo" />
        <span class="brand-name">${BRAND}</span>
      </a>
      <nav class="main-nav" id="main-nav" aria-label="Primary">
        <a href="${up}index.html#services">Services</a>
        <a href="${up}index.html#why">Why Choose Us</a>
        <a href="${up}index.html#process">Process</a>
        <a href="${up}insights/">Insights</a>
        <a href="${up}index.html#contact" class="btn btn-gold nav-cta">Contact Us</a>
      </nav>
      <button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="main-nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`;
}

function footer(up) {
  return `  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img src="${up}images/fulllogo_transparent.png" alt="${BRAND} logo" class="footer-logo" />
        <p>Your Global Partner for Comprehensive Business Solutions.</p>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        <a href="${up}index.html#services">Services</a>
        <a href="${up}index.html#why">Why Choose Us</a>
        <a href="${up}index.html#process">Process</a>
        <a href="${up}insights/">Insights</a>
        <a href="${up}index.html#contact">Contact</a>
      </nav>
      <div class="footer-contact">
        <a href="mailto:Info@stonecoldsolutions.io">Info@stonecoldsolutions.io</a>
        <a href="tel:+18884499552">+1 (888) 449-9552</a>
        <span>30 N Gould, Sheridan, WY 82801</span>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>&copy; <span id="year">${new Date().getUTCFullYear()}</span> ${BRAND} LLC. All rights reserved.</span>
    </div>
  </footer>
  <script src="${up}js/main.js"></script>`;
}

export function renderArticlePage(a) {
  const up = "../";
  return `${head(`${a.title} — ${BRAND}`, a.summary, up)}
<body>
${header(up)}
  <main class="article-wrap">
    <a href="${up}insights/" class="article-back">&larr; Back to Insights</a>
    <div class="article-head">
      <div class="post-meta">
        <span class="post-tag">${escapeHtml(a.tag || "Business")}</span>
        <span class="post-date">${escapeHtml(a.dateDisplay || displayDate(a.date))}</span>
      </div>
      <h1>${escapeHtml(a.title)}</h1>
    </div>
    <article class="article-body">
${a.bodyHtml}
    </article>
    <div class="article-cta">
      <h3>Ready to put these ideas to work?</h3>
      <p>Stone Cold Solutions helps businesses worldwide turn strategy into results.</p>
      <a href="${up}index.html#contact" class="btn btn-gold">Contact us</a>
    </div>
  </main>
${footer(up)}
</body>
</html>
`;
}

export function renderIndexPage(articles) {
  const up = "../";
  const cards = articles.length
    ? `<div class="posts-grid">
${articles.map(a => `      <article class="post-card">
        <div class="post-meta">
          <span class="post-tag">${escapeHtml(a.tag || "Business")}</span>
          <span class="post-date">${escapeHtml(a.dateDisplay || displayDate(a.date))}</span>
        </div>
        <h2><a href="${escapeHtml(a.slug)}.html">${escapeHtml(a.title)}</a></h2>
        <p>${escapeHtml(a.summary)}</p>
        <a href="${escapeHtml(a.slug)}.html" class="read-more">Read article &rarr;</a>
      </article>`).join("\n")}
    </div>`
    : `<p class="posts-empty">New articles are on the way — check back soon.</p>`;

  return `${head(`Insights — ${BRAND}`, "Practical business insights on strategy, operations, finance, technology, and growth from Stone Cold Solutions.", up)}
<body>
${header(up)}
  <section class="page-hero">
    <div class="container">
      <p class="eyebrow" style="color:var(--gold-light)">Insights</p>
      <h1>Business Insights &amp; Ideas</h1>
      <p>Practical perspectives on strategy, operations, finance, technology, and growth — published regularly to help your business move forward.</p>
    </div>
  </section>
  <section class="section">
    <div class="container">
${cards}
    </div>
  </section>
${footer(up)}
</body>
</html>
`;
}

// Write index.html + one HTML file per article. Removes orphaned article files.
export async function renderAll() {
  const articles = await loadArticles();
  articles.sort((x, y) => new Date(y.date) - new Date(x.date));
  await writeFile(path.join(INSIGHTS_DIR, "index.html"), renderIndexPage(articles), "utf8");
  const wanted = new Set(articles.map(a => `${a.slug}.html`));
  for (const a of articles) {
    await writeFile(path.join(INSIGHTS_DIR, `${a.slug}.html`), renderArticlePage(a), "utf8");
  }
  // clean orphaned generated article pages (keep index.html and non-article files)
  for (const f of await readdir(INSIGHTS_DIR)) {
    if (f === "index.html" || !f.endsWith(".html")) continue;
    if (!wanted.has(f)) await unlink(path.join(INSIGHTS_DIR, f));
  }
  return articles.length;
}
