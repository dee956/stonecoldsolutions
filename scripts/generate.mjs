// Generate one new business article with the Anthropic API, add it to
// articles.json, and rebuild the Insights pages. Run daily by GitHub Actions.
//
// Requires environment variable: ANTHROPIC_API_KEY
// Optional environment variable: ANTHROPIC_MODEL  (defaults below)
import Anthropic from "@anthropic-ai/sdk";
import { loadArticles, saveArticles, renderAll, slugify, displayDate } from "./lib.mjs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

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

// Structured tool so the model returns a guaranteed-valid object.
// This avoids fragile JSON parsing of free-form text (unescaped quotes, etc.).
const ARTICLE_TOOL = {
  name: "publish_article",
  description: "Publish one business-insights article to the Stone Cold Solutions blog.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Compelling title, under 80 characters, not in the recent list.",
      },
      tag: {
        type: "string",
        description: "ONE or TWO word category, e.g. Finance, Operations, Strategy, Marketing, HR, Technology, Expansion, Leadership.",
      },
      summary: {
        type: "string",
        description: "1-2 sentence plain-text teaser, under 240 characters, no HTML.",
      },
      bodyHtml: {
        type: "string",
        description: "Article body as clean HTML using p, h2, optional blockquote, ul/ol, li. No html, head, body, h1, or inline styles.",
      },
    },
    required: ["title", "tag", "summary", "bodyHtml"],
  },
};

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

Call the publish_article tool with the finished article. Put the article body in bodyHtml as clean HTML (no <html>, <head>, <body>, <h1>, or inline styles).`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    tools: [ARTICLE_TOOL],
    tool_choice: { type: "tool", name: "publish_article" },
    messages: [{ role: "user", content: prompt }],
  });

  const block = resp.content.find(b => b.type === "tool_use");
  if (!block || !block.input) {
    console.error("Model did not return a publish_article tool call:\n", JSON.stringify(resp.content, null, 2));
    process.exit(1);
  }
  const data = block.input;

  if (!data.title || !data.bodyHtml) {
    console.error("Model output missing required fields:\n", JSON.stringify(data, null, 2));
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
