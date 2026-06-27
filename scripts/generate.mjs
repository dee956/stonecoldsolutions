// Generate one new business article with the Anthropic API, add it to
// articles.json, and rebuild the Insights pages. Run daily by GitHub Actions.
//
// Requires environment variable: ANTHROPIC_API_KEY
// Optional environment variable: ANTHROPIC_MODEL  (defaults below)
import Anthropic from "@anthropic-ai/sdk";
import { loadArticles, saveArticles, renderAll, slugify, displayDate } from "./lib.mjs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

// Rotating themes so the blog covers a mix of business topics over time.
const THEMES = [
  "business setup, company formation, and market entry",
  "operational efficiency and process improvement",
  "finance, cash flow, and financial planning",
  "human resources, hiring, and workplace culture",
  "technology adoption and digital transformation",
  "marketing, branding, and sales strategy",
  "international expansion and cross-border trade",
  "leadership, decision-making, and management",
  "customer experience and retention",
  "productivity and time management for owners and teams",
  "risk management, resilience, and crisis planning",
  "strategy, competitive positioning, and growth",
];

function pickTheme() {
  // Deterministic-ish rotation by day-of-year so consecutive days differ.
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start) / 86400000);
  return THEMES[day % THEMES.length];
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY. Set it as a repository secret.");
    process.exit(1);
  }

  const articles = await loadArticles();
  const recentTitles = articles.slice(0, 25).map(a => a.title);
  const theme = pickTheme();

  const client = new Anthropic();

  const prompt = `You are writing an article for the "Insights" blog of Stone Cold Solutions LLC, a global business-consulting firm. The audience is owners and managers of startups, SMEs, and larger companies.

Write ONE original, practical article on this theme: ${theme}.

Requirements:
- 550 to 800 words.
- Helpful, professional, and concrete. Avoid hype, filler, and generic platitudes.
- Do NOT fabricate statistics, studies, named clients, or quotes from real people.
- Use British or American English consistently (American is fine).
- Structure: a short intro paragraph, then 3-5 sections each with an <h2> heading, and a brief closing paragraph. You may use one <blockquote> and at most one <ul>/<ol> list if it genuinely helps.
- Do NOT repeat any of these recent titles: ${recentTitles.length ? recentTitles.map(t => `"${t}"`).join(", ") : "(none yet)"}.

Return ONLY a JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "title": "string, compelling, under 80 characters, not in the recent list",
  "tag": "ONE or TWO word category, e.g. Finance, Operations, Strategy, Marketing, HR, Technology, Expansion, Leadership",
  "summary": "1-2 sentence plain-text teaser, under 240 characters, no HTML",
  "bodyHtml": "the article body as clean HTML using <p>, <h2>, optional <blockquote>, <ul>/<ol>, <li>. No <html>, <head>, <body>, <h1>, or inline styles."
}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = resp.content.map(b => (b.type === "text" ? b.text : "")).join("").trim();

  let data;
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    data = JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    console.error("Could not parse model output as JSON:\n", text);
    process.exit(1);
  }

  if (!data.title || !data.bodyHtml) {
    console.error("Model output missing required fields.");
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  let slug = slugify(data.title) || `article-${today}`;
  // Ensure unique slug.
  const existing = new Set(articles.map(a => a.slug));
  if (existing.has(slug)) slug = `${slug}-${today}`;

  const article = {
    slug,
    title: String(data.title).trim(),
    date: today,
    dateDisplay: displayDate(today),
    tag: String(data.tag || "Business").trim(),
    summary: String(data.summary || "").trim(),
    bodyHtml: String(data.bodyHtml).trim(),
  };

  articles.unshift(article);
  await saveArticles(articles);
  const n = await renderAll();
  console.log(`Added "${article.title}" [${article.tag}] -> insights/${slug}.html (total ${n}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
