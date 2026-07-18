import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const { token } = body;
  if (!token) return Response.json({ error: "missing_token" }, { status: 400 });

  const tokenDoc = await db.collection("emailVerifications").doc(token).get();
  if (!tokenDoc.exists) return Response.json({ error: "invalid_token" }, { status: 400 });

  const { uid, email, expiresAt, used } = tokenDoc.data();

  if (used) return Response.json({ error: "already_used" }, { status: 400 });
  if (Date.now() > expiresAt) return Response.json({ error: "expired" }, { status: 400 });

  await tokenDoc.ref.update({ used: true });
  await db.collection("users").doc(uid).update({ emailVerified: true });

  return Response.json({ success: true, email });
};
