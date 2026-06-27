// Rebuild every Insights page (index + one page per article) from articles.json.
// Run locally with: node scripts/render-all.mjs
import { renderAll } from "./lib.mjs";
const n = await renderAll();
console.log(`Rendered Insights index + ${n} article page(s).`);
