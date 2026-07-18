const HF_API_URL =
  'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function analyzeSentiment(text, token, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (res.status === 503) {
      const json = await res.json().catch(() => ({}));
      const wait = (json.estimated_time || 20) * 1000;
      if (attempt < retries - 1) { await sleep(Math.min(wait, 30000)); continue; }
      throw new Error('model_loading');
    }

    if (!res.ok) throw new Error(`hf_error_${res.status}`);

    const data = await res.json();
    // HF returns [[{label,score},...]] for this model
    const predictions = Array.isArray(data[0]) ? data[0] : data;
    const top = predictions.reduce((a, b) => (a.score > b.score ? a : b));
    const rating = parseInt(top.label[0], 10); // "5 stars" -> 5
    return { rating: Math.max(1, Math.min(5, rating)), score: top.score };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'HUGGINGFACE_API_KEY not set' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const categories = body.reviews || {};
  const output = {};

  for (const [aspect, reviewsList] of Object.entries(categories)) {
    if (!Array.isArray(reviewsList) || reviewsList.length === 0) {
      output[aspect] = { reviews: [], average_rating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
      continue;
    }

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const results = await Promise.all(
      reviewsList.map(async (text) => {
        try {
          const { rating, score } = await analyzeSentiment(text, token);
          dist[rating]++;
          return { review: text, analysis: { label: `${rating} stars`, score } };
        } catch {
          return { review: text, analysis: { label: 'unknown', score: 0 } };
        }
      })
    );

    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    const avg = total
      ? Object.entries(dist).reduce((sum, [r, c]) => sum + Number(r) * c, 0) / total
      : 0;

    output[aspect] = {
      reviews: results,
      average_rating: Math.round(avg * 100) / 100,
      distribution: dist,
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(output),
  };
};
