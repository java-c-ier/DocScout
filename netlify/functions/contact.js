const fs = require("fs");
const path = require("path");

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = "jimutksahoo99@gmail.com";
const FROM_EMAIL = "DocScout <doc-scout@jimut.in>";

const notificationTemplate = fs.readFileSync(path.join(__dirname, "templates/contact-form-template.html"), "utf8");
const autoReplyTemplate = fs.readFileSync(path.join(__dirname, "templates/autoreply-template.html"), "utf8");

function fill(template, { firstName, lastName, email, phone, message }) {
  return template
    .replace(/\{\{first-name\}\}/g, firstName)
    .replace(/\{\{last-name\}\}/g, lastName || "")
    .replace(/\+91 \{\{phone\}\}/g, phone ? "+91 " + phone : "Not provided")
    .replace(/\{\{phone\}\}/g, phone || "Not provided")
    .replace(/\{\{email\}\}/g, email)
    .replace(/\{\{message\}\}/g, message);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { firstName, lastName, email, phone, message } = body;

  if (!firstName || !email || !message) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  const data = { firstName, lastName, email, phone, message };

  try {
    // Send notification to admin
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `New Contact Form Submission from ${firstName} ${lastName}`,
        html: fill(notificationTemplate, data),
        reply_to: email,
      }),
    });

    // Send auto-reply to submitter
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        reply_to: email,
        subject: `Thank you for contacting DocScout, ${firstName}!`,
        html: fill(autoReplyTemplate, data),
      }),
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
