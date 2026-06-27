# Deploying to DigitalOcean App Platform (static site)

This guide deploys the site to DigitalOcean's **App Platform** as a static site:
GitHub-connected, auto-deploys on every push, free SSL certificate, global CDN.
Cost for a single static site on App Platform is **free** for the first 3 static
sites on most plans (confirm current pricing in your DO dashboard).

You'll do this once. After that, any change you push to GitHub goes live automatically.

---

## Part 1 — Put the code on GitHub

You have two options.

### Option A — GitHub website (no command line)

1. Go to <https://github.com/new> and create a repository named, e.g.,
   `stonecoldsolutions`. Leave it empty (no README).
2. On the new repo page, click **uploading an existing file**.
3. Drag in the **contents** of the `stonecold-site` folder (the `index.html`,
   `css/`, `js/`, `images/`, `.do/` — not the outer folder itself).
4. Click **Commit changes**.

### Option B — Command line (git)

From inside the `stonecold-site` folder:

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/stonecoldsolutions.git
git push -u origin main
```

---

## Part 2 — Create the app on DigitalOcean

1. Sign in at <https://cloud.digitalocean.com>.
2. In the left menu, click **App Platform → Create App**.
3. Choose **GitHub** as the source. Authorize DigitalOcean to access your GitHub if
   prompted, then select the `stonecoldsolutions` repo and the `main` branch.
   Leave **Autodeploy** on.
4. DigitalOcean will scan the repo. Because there's no build step, it should detect a
   **Static Site**. If it offers a "Web Service", change the **Resource Type** to
   **Static Site**.
   - **Build Command:** leave **blank**.
   - **Output Directory:** `/` (the repository root).
   - **Index document:** `index.html`.
5. Pick a plan (the **Starter / static** tier is free), choose a region close to your
   customers, and click **Create Resources**.
6. Wait ~1–2 minutes. You'll get a live URL like
   `https://stonecoldsolutions-xxxxx.ondigitalocean.app`. Open it to confirm.

> Tip: instead of steps 3–4 you can point App Platform at the included
> `.do/app.yaml` (edit the `repo:` line first), or run
> `doctl apps create --spec .do/app.yaml` if you have the `doctl` CLI.

---

## Part 3 — Connect your domain (stonecoldsolutions.io)

Your domain is registered at **GoDaddy**. You can keep it there and just point it at
DigitalOcean.

1. In your DigitalOcean app, go to **Settings → Domains → Add Domain**.
2. Enter `stonecoldsolutions.io`. DigitalOcean will show you the DNS records to create.
3. **Recommended (lets DO manage DNS + auto-SSL):**
   - In DigitalOcean, the app will give you the option **"We'll manage your DNS"** and
     show three nameservers: `ns1.digitalocean.com`, `ns2.digitalocean.com`,
     `ns3.digitalocean.com`.
   - In **GoDaddy → My Products → your domain → DNS → Nameservers → Change**, switch to
     **Custom** and enter those three nameservers. Save.
   - DNS changes can take from a few minutes up to 24–48 hours to propagate.
4. **Alternative (keep DNS at GoDaddy):** instead of changing nameservers, add the
   records DigitalOcean shows you in **GoDaddy → DNS → Records** — typically a
   `CNAME` for `www` pointing to your `.ondigitalocean.app` hostname, and an
   `A`/`ALIAS`/forwarding record for the root domain. Use this only if you want GoDaddy
   to stay in charge of DNS.
5. Once the domain is verified, DigitalOcean automatically issues a free SSL
   certificate, so `https://stonecoldsolutions.io` will be secure.

Add `www.stonecoldsolutions.io` the same way and set one as primary so the other
redirects to it.

---

## Making changes later

1. Edit the files (text in `index.html`, colors in `css/styles.css`).
2. Push to GitHub (upload via the website, or `git add . && git commit -m "update" && git push`).
3. DigitalOcean redeploys automatically within a minute or two. That's it.

---

## A note on the old site

You don't need access to the old website's hosting for any of this. The only thing tied
to the old setup is the **domain's DNS**, which lives at GoDaddy and which you control.
Pointing it at DigitalOcean (Part 3) is what moves `stonecoldsolutions.io` over to the
new site. Until you change DNS, the new site stays reachable at its free
`.ondigitalocean.app` URL, so you can review it safely before switching the domain.
