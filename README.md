# Stone Cold Solutions — Website

A fast, modern, fully static website for Stone Cold Solutions LLC. No build step, no
database, no server to maintain — just HTML, CSS, and a little JavaScript. That makes
it cheap to host, secure, and easy for you to control.

## Project structure

```
stonecold-site/
├── index.html          # The entire site (single page)
├── css/styles.css      # All styling (brand colors, layout, responsive rules)
├── js/main.js          # Menu, scroll animations, contact form handling
├── images/             # Logo + illustrations (copied from your original site)
├── .do/app.yaml        # DigitalOcean deployment config
├── robots.txt
└── README.md
```

## Editing content

Everything visible on the site lives in `index.html`. To change wording, open it in any
text editor and edit the text between the tags. Brand colors and fonts are defined at the
top of `css/styles.css` under `:root` — change `--gold`, `--navy-900`, etc. in one place
and they update everywhere.

## Contact form

The form works on a static host with **no backend** in one of two ways:

1. **Email fallback (works immediately):** as shipped, submitting the form opens the
   visitor's email app with the message pre-filled to `Info@stonecoldsolutions.io`.
2. **Formspree (recommended — submissions arrive in your inbox automatically):**
   - Create a free account at <https://formspree.io> and add a new form.
   - Copy your form ID (looks like `xayzabcd`).
   - In `index.html`, find `action="https://formspree.io/f/YOUR_FORM_ID"` and replace
     `YOUR_FORM_ID` with yours.
   - Done — submissions now arrive by email and the page shows a success message.

## Insights blog + daily auto-published articles

The site has an **Insights** blog at `/insights/`. Article content lives in
`insights/articles.json`; the HTML pages are generated from it.

- `scripts/lib.mjs` — page templates and the render logic.
- `scripts/render-all.mjs` — rebuild every Insights page from `articles.json`
  (run locally with `npm run render`).
- `scripts/generate.mjs` — generate ONE new article via the Anthropic API, add it
  to `articles.json`, and rebuild (`npm run generate`).

### Daily automation (GitHub Actions)

`.github/workflows/daily-article.yml` runs `generate.mjs` once a day (13:00 UTC),
commits the new article, and pushes it — which makes DigitalOcean redeploy
automatically. To enable it:

1. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository
   secret**. Name it `ANTHROPIC_API_KEY` and paste your Anthropic API key
   (get one at <https://console.anthropic.com>).
2. (Optional) Add a repository **variable** named `ANTHROPIC_MODEL` to choose the
   model. Defaults to `claude-3-5-sonnet-20241022`.
3. Test it: **Actions → Daily Insights Article → Run workflow**. A new post should
   appear under `/insights/` within a couple of minutes.

To change how often it runs, edit the `cron` line in the workflow file.

## Deploying to DigitalOcean

See **DEPLOY.md** for the full step-by-step guide.
