const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Invalid JSON" }; }

  const { token } = body;
  if (!token) return { statusCode: 400, body: JSON.stringify({ error: "missing_token" }) };

  const tokenDoc = await db.collection("emailVerifications").doc(token).get();
  if (!tokenDoc.exists) return { statusCode: 400, body: JSON.stringify({ error: "invalid_token" }) };

  const { uid, email, expiresAt, used } = tokenDoc.data();

  if (used) return { statusCode: 400, body: JSON.stringify({ error: "already_used" }) };
  if (Date.now() > expiresAt) return { statusCode: 400, body: JSON.stringify({ error: "expired" }) };

  await tokenDoc.ref.update({ used: true });
  await db.collection("users").doc(uid).update({ emailVerified: true });

  return { statusCode: 200, body: JSON.stringify({ success: true, email }) };
};
