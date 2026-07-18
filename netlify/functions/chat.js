import admin from 'firebase-admin';

let db = null;
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
if (admin.apps.length) db = admin.firestore();

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

const DISTRICTS = [
  'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh',
  'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur',
  'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapada', 'Keonjhar',
  'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh',
  'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh',
];

const SYSTEM_PROMPT = `You are Scouty, a helpful AI assistant for DocScout — a healthcare finder platform for Odisha, India. You are embedded inside the DocScout web app.

## About DocScout
DocScout helps people in Odisha find hospitals, clinics, and doctors quickly. It covers all 30 districts of Odisha.

## Districts covered
Angul, Balangir, Balasore, Bargarh, Bhadrak, Boudh, Cuttack, Deogarh, Dhenkanal, Gajapati, Ganjam, Jagatsinghpur, Jajpur, Jharsuguda, Kalahandi, Kandhamal, Kendrapada, Keonjhar, Khordha, Koraput, Malkangiri, Mayurbhanj, Nabarangpur, Nayagarh, Nuapada, Puri, Rayagada, Sambalpur, Subarnapur, Sundargarh.

## Features you must know in detail

### 1. Hospital Search (Hero section)
- Users type a district name in the "Enter Location" box and click the search icon to fetch all hospitals in that district from the database.
- Users can also type a disease or specialty in the "Enter Disease" box — both district and disease must be valid to search.
- Autocomplete suggestions appear as users type.
- Search results show hospital name, type, contact, rating, website, Google Map link, and a review button.

### 2. Show Nearby Hospitals (GPS)
- The blue "Show Nearby Hospitals" button uses the browser's GPS to detect the user's current location.
- It reverse-geocodes the coordinates to identify the Odisha district automatically.
- It then fetches hospitals for that district and sorts them by distance (closest first) using Nominatim geocoding.
- Only works if user allows location access in browser. Only works within Odisha.

### 3. Live Map (NearbyMap section)
- A separate "Hospitals near you" section with an interactive MapLibre map.
- Uses OpenStreetMap Overpass API to show real-time hospitals and clinics around the user's location.
- Radius options: 5 km, 10 km, 20 km — user can switch between them.
- Each hospital has a numbered marker on the map; clicking shows a popup with name, type, distance, phone.
- A sidebar list shows all results sorted by distance.
- User location is never stored.

### 4. Hospital Details & Reviews
- Each hospital row has an eye icon to view details and a chat icon to view/submit reviews.
- Reviews are categorised into 4 aspects: Cleanliness and Hygiene, Doctor and Staff Behaviour, Quality of Care, Wait Times and Efficiency.
- Sentiment analysis runs on submitted reviews using BERT AI to give star ratings (1–5) per aspect.
- Charts (pie and bar) show rating distribution per aspect.

### 5. Doctors
- Hospitals can have doctors listed under departments.
- Doctor info includes: name, qualification, experience, specialization, timing, department.

### 6. User Accounts
- Users can sign in with Google (one-click) or email/password.
- Email sign-up requires email verification before accessing the account.
- Profile page shows user details.
- Blocked accounts (non-Google) cannot log in and see a message to contact admin.

### 7. Admin Panel (/admin)
- Only accessible to admin users.
- Shows stats: total users, active users, blocked users.
- Admin can change user roles (user/admin) and block/unblock non-Google accounts.

### 8. Contact Form
- Users can submit a contact form (name, email, phone, message).
- Admin receives a notification email; user receives an auto-reply.

### 9. Navigation
- Home: main landing page with search, map, about, testimonials, contact, footer.
- About: info about DocScout.
- Testimonials: user testimonials.
- Contact: contact form.
- Sign In / Sign Up: authentication pages (no nav bar shown on these pages).

## Your behaviour
- Be concise, warm, and accurate.
- For emergencies always say: call 108 (Odisha ambulance) immediately.
- NEVER list, suggest, or make up any hospital names, websites, or ratings from your own knowledge. You do NOT have hospital data — only DocScout's database does.
- Hospital names and links will ONLY appear in this prompt under a "Live hospital data" section if they were fetched from the database. If that section is absent, no hospital data is available.
- If a user asks about hospitals in an Odisha district and no "Live hospital data" section is present, tell them to use the DocScout search bar for that district.
- If a user is outside Odisha or asks about hospitals outside Odisha, say: "DocScout currently only covers hospitals in Odisha. However, if you visit Odisha, you can use the Live Map section on the homepage — it shows real-time hospitals and clinics around your location within a 5 km, 10 km, or 20 km radius using OpenStreetMap data. For hospitals outside Odisha, please use Google Maps or a local hospital directory."
- If asked about a feature, explain it clearly with steps if needed.
- Answer general medical questions (symptoms, diseases, specialists) helpfully but remind users to consult a doctor for diagnosis.
- If asked something unrelated to healthcare or DocScout, politely redirect.

## Formatting rules (IMPORTANT)
- You may use **bold** for hospital names and important terms.
- Do NOT use # headers, --- dividers, or [text](url) markdown links.
- For hospital lists use plain bullet format: "- **Hospital Name**: https://website.com" (or just "- **Hospital Name**" if no website).
- For links, write the full URL plainly after a colon.
- Keep responses clean and readable.`;

function detectDistrict(text) {
  const lower = text.toLowerCase();
  return DISTRICTS.find((d) => lower.includes(d.toLowerCase())) || null;
}

async function fetchHospitals(district) {
  const snap = await db.collection('Odisha').doc(district).collection('Hospitals').get();
  return snap.docs
    .map((d) => d.data())
    .filter((h) => h.Name && h.Name !== 'NA')
    .map((h) => ({ name: h.Name, website: h.Website || '', type: h.Type || '' }));
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const messages = body.messages || [];
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  let systemPrompt = SYSTEM_PROMPT;

  const district = detectDistrict(lastUserMsg);
  if (district && db) {
    try {
      const hospitals = await fetchHospitals(district);
      if (hospitals.length > 0) {
        const hospitalList = hospitals
          .map((h) => `- ${h.name}${h.type ? ` (${h.type})` : ''}${h.website ? `: ${h.website}` : ''}`)
          .join('\n');
        systemPrompt += `\n\n## Live hospital data for ${district} district (from DocScout database)\nList these hospitals for the user. Show name and website link if present:\n${hospitalList}`;
      }
    } catch (e) {
      console.error('Firestore fetch error:', e.message);
    }
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = res.status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : err.error?.message || `Gemini API error (${res.status})`;
      console.error('Gemini error:', res.status, JSON.stringify(err));
      return Response.json({ reply: msg });
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    return Response.json({ reply });
  } catch (err) {
    return Response.json({ reply: 'Network error. Please try again.' });
  }
};
