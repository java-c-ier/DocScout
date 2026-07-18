import admin from 'firebase-admin';

let db = null;
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
if (admin.apps.length) db = admin.firestore();

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Fallback chain: tried in order, skipped on 429 or model-not-found
// Order: best quality first → highest-availability (3.1-flash-lite: 500 RPD, 15 RPM) → remaining
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash-lite',
];

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
- Works anywhere in the world — not limited to Odisha.
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
- NEVER list, suggest, or make up any hospital names, websites, or ratings from your own knowledge. You do NOT have hospital data — only DocScout's database and OpenStreetMap do.
- Hospital names and links will ONLY appear in this prompt under a "Live hospital data" or "Live nearby hospitals" section. If those sections are absent, no hospital data is available.
- When listing hospitals from the data sections below, list ALL of them — do not skip or truncate. Show name and website/link only (no type, no rating).
- For detailed hospital info (doctors, departments, contact, reviews, ratings), always say: "For full details, search for this hospital in the DocScout search bar — select the district and you will see complete information including doctors, reviews, and contact details."
- If a user asks about hospitals in an Odisha district and no data section is present, tell them to use the DocScout search bar for that district.
- If a user asks about their location or nearby hospitals and NO "Live nearby hospitals" section exists in this prompt AND no GPS data was provided, tell them to click the 📍 location button in the chat input bar.
- If a "Live nearby hospitals" section says no hospitals were found, say so honestly and suggest expanding the search radius using the Live Map on the homepage.
- If a user is outside Odisha or asks about hospitals outside Odisha, explain that DocScout's database covers only Odisha, but the Live Map on the homepage works worldwide using OpenStreetMap — scroll down and click Show hospitals near me.
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

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchNearbyOverpass(lat, lon, radiusMeters = 10000) {
  const query = `[out:json][timeout:25];(node["amenity"~"hospital|clinic"](around:${radiusMeters},${lat},${lon});way["amenity"~"hospital|clinic"](around:${radiusMeters},${lat},${lon}););out center;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  const data = await res.json();
  return (data.elements || [])
    .filter((e) => e.tags?.name)
    .map((e) => {
      const elat = e.lat ?? e.center?.lat;
      const elon = e.lon ?? e.center?.lon;
      if (!elat || !elon) return null;
      const distKm = haversineKm(lat, lon, elat, elon);
      return {
        name: e.tags.name,
        distKm: Math.round(distKm * 10) / 10,
        mapsLink: `https://www.google.com/maps?q=${elat},${elon}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 5);
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const messages = body.messages || [];
  const coords = body.coords || null;
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  let systemPrompt = SYSTEM_PROMPT;

  const district = detectDistrict(lastUserMsg);

  const [overpassResults, firestoreResults] = await Promise.all([
    coords?.lat && coords?.lon
      ? fetchNearbyOverpass(coords.lat, coords.lon).catch((e) => { console.error('Overpass error:', e.message); return []; })
      : Promise.resolve(null),
    district && db
      ? fetchHospitals(district).catch((e) => { console.error('Firestore error:', e.message); return []; })
      : Promise.resolve(null),
  ]);

  if (coords?.locationName) {
    systemPrompt += `\n\n## User's current location\nThe user is currently at: ${coords.locationName}. Mention this when relevant.`;
  }

  if (overpassResults?.length > 0) {
    const overpassNames = new Set(overpassResults.map((h) => h.name.toLowerCase()));
    const list = overpassResults.map((h) => `- ${h.name} (${h.distKm} km away): ${h.mapsLink}`).join('\n');
    systemPrompt += `\n\n## Top 5 nearby hospitals (OpenStreetMap, sorted by distance)\nList these with distance and Google Maps links. After listing, tell the user they can see more on the Live Map section of the homepage (5 km, 10 km, or 20 km radius options):\n${list}`;

    if (firestoreResults?.length > 0) {
      const deduped = firestoreResults.filter((h) => !overpassNames.has(h.name.toLowerCase()));
      if (deduped.length > 0) {
        const dbList = deduped
          .map((h) => `- ${h.name}${h.type ? ` (${h.type})` : ''}${h.website ? `: ${h.website}` : ''}`)
          .join('\n');
        systemPrompt += `\n\n## Additional DocScout database hospitals for ${district} district (not in nearby list above)\nMention these as well:\n${dbList}`;
      }
    }
  }

  if (firestoreResults?.length > 0 && !(overpassResults?.length > 0)) {
    const list = firestoreResults
      .map((h) => `- ${h.name}${h.type ? ` (${h.type})` : ''}${h.website ? `: ${h.website}` : ''}`)
      .join('\n');
    systemPrompt += `\n\n## DocScout database hospitals for ${district} district\nList these with website links if available:\n${list}`;
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
  });

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: payload,
      });

      if (res.status === 429 || res.status === 404) {
        console.warn(`${model} skipped (${res.status})`);
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`${model} error ${res.status}:`, JSON.stringify(err));
        continue;
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) { console.warn(`${model} returned empty reply`); continue; }

      console.log(`Served by ${model}`);
      return Response.json({ reply });
    } catch (err) {
      console.error(`${model} network error:`, err.message);
      continue;
    }
  }

  return Response.json({ reply: 'All AI models are currently busy. Please try again in a moment.' });
};
