import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_NOREPLY = "DocScout <doc-scout@jimut.in>";

const signupTemplate = readFileSync(join(__dirname, "templates/verification-signup-template.html"), "utf8");
const loginTemplate = readFileSync(join(__dirname, "templates/verification-login-template.html"), "utf8");

function fill(template, vars) {
  return template
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{verification-link\}\}/g, vars.verificationLink);
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const { uid, email, displayName, source, origin } = body;
  if (!uid || !email) return new Response("Missing uid or email", { status: 400 });

  const oldTokens = await db.collection("emailVerifications").where("uid", "==", uid).where("used", "==", false).get();
  const batch = db.batch();
  oldTokens.forEach((d) => batch.delete(d.ref));
  if (!oldTokens.empty) await batch.commit();

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  await db.collection("emailVerifications").doc(token).set({
    uid, email, source: source || "signup", expiresAt, used: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const baseUrl = origin || "https://doc-scout.jimut.in";
  const verificationLink = `${baseUrl}/verify-email?token=${token}`;
  const name = displayName || email.split("@")[0];

  const template = source === "login" ? loginTemplate : signupTemplate;
  const html = fill(template, { name, verificationLink });

  const subject = source === "login"
    ? "Verify your DocScout email address"
    : "Welcome to DocScout — Verify your email";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_NOREPLY, to: email, subject, html }),
    });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
