// Stone Cold Solutions — invoice submission API.
// Runs as a small always-on service on the same DigitalOcean app, served at /api.
// Flow: receive multipart form (fields + invoice file[s]) -> verify Cloudflare
// Turnstile captcha -> email the submission (with attachments) via Resend.
//
// Required environment variables (set in the DigitalOcean app, encrypted):
//   TURNSTILE_SECRET   - Cloudflare Turnstile secret key
//   RESEND_API_KEY     - Resend API key
// Optional:
//   TO_EMAIL           - where invoices are delivered (default below)
//   FROM_EMAIL         - verified Resend sender (default Resend onboarding sender)
import express from "express";
import multer from "multer";
import { Resend } from "resend";

const TO_EMAIL = process.env.TO_EMAIL || "Info@stonecoldsolutions.io";
const FROM_EMAIL = process.env.FROM_EMAIL || "Stone Cold Solutions <onboarding@resend.dev>";
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB total budget
const app = express();
app.disable("x-powered-by");
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 5, fields: 20 },
});

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET) return { ok: false, reason: "Server captcha not configured." };
  if (!token) return { ok: false, reason: "Captcha missing." };
  try {
    const body = new URLSearchParams();
    body.append("secret", TURNSTILE_SECRET);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await r.json();
    return { ok: !!data.success, reason: data.success ? "" : "Captcha failed. Please try again." };
  } catch (e) {
    return { ok: false, reason: "Could not verify captcha." };
  }
}

async function handleInvoice(req, res) {
  try {
    const b = req.body || {};
    // Honeypot: bots fill this hidden field; humans never do.
    if (b._honey) return res.status(200).json({ ok: true });

    const company = (b.company || b["Company Name"] || "").toString().trim();
    const email = (b.email || "").toString().trim();
    const notes = (b.notes || b.Notes || "").toString().trim();
    const token = (b["cf-turnstile-response"] || "").toString();

    if (!company || !email) {
      return res.status(400).json({ ok: false, error: "Company name and email are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    }

    const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim();
    const verdict = await verifyTurnstile(token, ip);
    if (!verdict.ok) return res.status(400).json({ ok: false, error: verdict.reason });

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({ ok: false, error: "Please attach your invoice file." });
    }

    if (!RESEND_API_KEY) {
      return res.status(500).json({ ok: false, error: "Email service not configured." });
    }
    const resend = new Resend(RESEND_API_KEY);

    const fileList = files.map(f => `${f.originalname} (${Math.round(f.size / 1024)} KB)`).join(", ");
    const html =
      `<h2>New invoice submission</h2>` +
      `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` +
      `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` +
      `<p><strong>Notes:</strong><br>${escapeHtml(notes || "—").replace(/\n/g, "<br>")}</p>` +
      `<p><strong>Attached:</strong> ${escapeHtml(fileList)}</p>`;

    const attachments = files.map(f => ({ filename: f.originalname, content: f.buffer }));

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: email,
      subject: `New invoice submission — ${company}`,
      html,
      attachments,
    });
    if (error) {
      console.error("Resend error:", error);
      return res.status(502).json({ ok: false, error: "Could not send the email. Please try again." });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Invoice handler error:", e);
    if (e && e.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ ok: false, error: "Files are too large (10 MB total maximum)." });
    }
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  }
}

// Register on both paths in case the platform strips the /api route prefix.
app.post("/api/invoice", upload.array("invoice", 5), handleInvoice);
app.post("/invoice", upload.array("invoice", 5), handleInvoice);

app.get(["/api/health", "/health"], (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Invoice API listening on ${PORT}`));
