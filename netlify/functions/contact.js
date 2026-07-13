const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = "jimutksahoo99@trisysit.com";
const FROM_EMAIL = "onboarding@resend.dev";

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

  const notificationHtml = `
    <h2>New Contact Form Submission — DocScout</h2>
    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone ? "+91 " + phone : "Not provided"}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  const autoReplyHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a8efd,#0056c7);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">DocScout</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Your Healthcare Companion</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#374151;">Hi <strong>${firstName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;text-align:center;">
              Thank you for reaching out to us! We have received your message and our team will get back to you as soon as possible, typically within <strong>1–2 business days</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td style="border-top:1px solid #e5e7eb;"></td></tr></table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #dbeafe;border-radius:8px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#1a8efd;text-transform:uppercase;letter-spacing:0.5px;">Your Message Summary</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#6b7280;width:110px;">Name</td>
                    <td style="padding:5px 0;font-size:13px;color:#111827;font-weight:500;">${firstName} ${lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#6b7280;">Email</td>
                    <td style="padding:5px 0;font-size:13px;color:#111827;font-weight:500;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#6b7280;vertical-align:top;">Message</td>
                    <td style="padding:5px 0;font-size:13px;color:#111827;">${message}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td style="border-top:1px solid #e5e7eb;"></td></tr></table>
            <p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.7;">
              In the meantime, feel free to explore DocScout to find hospitals, check reviews, and access healthcare information near you.
            </p>
            <p style="margin:24px 0 0;font-size:15px;color:#374151;">
              Warm regards,<br/>
              <strong style="color:#1a8efd;">The DocScout Team</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated response. Please do not reply to this email.</p>
            <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">&copy; 2026 DocScout. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  try {
    // Send notification to you
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `New Contact Form Submission from ${firstName} ${lastName}`,
        html: notificationHtml,
        reply_to: email,
      }),
    });

    // Send auto-reply to user
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Thank you for contacting DocScout, ${firstName}!`,
        html: autoReplyHtml,
      }),
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
