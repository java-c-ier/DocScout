import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __funcDir = dirname(fileURLToPath(import.meta.url));

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "jimutksahoo99@gmail.com";
const FROM_AUTOREPLY = "DocScout <doc-scout@jimut.in>";
const FROM_NOREPLY = "No Reply <no-reply@jimut.in>";

const notificationTemplate = readFileSync(join(__funcDir, "templates/contact-form-template.html"), "utf8");
const autoReplyTemplate = readFileSync(join(__funcDir, "templates/autoreply-template.html"), "utf8");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fill(template, { firstName, lastName, email, phone, message }) {
  const safe = {
    firstName: escapeHtml(firstName),
    lastName: escapeHtml(lastName || ""),
    email: escapeHtml(email),
    phone: phone ? escapeHtml(phone) : "",
    message: escapeHtml(message),
  };
  return template
    .replace(/\{\{first-name\}\}/g, safe.firstName)
    .replace(/\{\{last-name\}\}/g, safe.lastName)
    .replace(/\+91 \{\{phone\}\}/g, safe.phone ? "+91 " + safe.phone : "Not provided")
    .replace(/\{\{phone\}\}/g, safe.phone || "Not provided")
    .replace(/\{\{email\}\}/g, safe.email)
    .replace(/\{\{message\}\}/g, safe.message);
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const { firstName, lastName, email, phone, message } = body;
  if (!firstName || !email || !message) return new Response("Missing required fields", { status: 400 });

  const data = { firstName, lastName, email, phone, message };

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_NOREPLY, to: TO_EMAIL,
        subject: `New Contact Form Submission from ${firstName} ${lastName}`,
        html: fill(notificationTemplate, data), reply_to: email,
      }),
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_AUTOREPLY, to: email, reply_to: email,
        subject: `Thank you for contacting DocScout, ${firstName}!`,
        html: fill(autoReplyTemplate, data),
      }),
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
