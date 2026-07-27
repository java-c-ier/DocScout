import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOGIN_REQUEST_TTL_MS = 60 * 60 * 1000;

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const { token, email, rid } = body;
  if (!token || !email) return Response.json({ error: 'invalid' }, { status: 400 });

  const { data, error } = await supabase.auth.verifyOtp({ token_hash: token, type: 'email' });
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('expired') || msg.includes('invalid')) {
      return Response.json({ error: 'expired' });
    }
    return Response.json({ error: 'invalid' });
  }

  const session = data?.session;
  if (!session) return Response.json({ error: 'invalid' });

  // Best-effort: let the device that originally requested this link (if different
  // from this one) pick up its own session via check-login-request polling.
  if (rid) {
    const { data: requestRow } = await supabase
      .from('login_requests')
      .select('id, email, status, created_at')
      .eq('id', rid)
      .single();

    const isFresh = requestRow && Date.now() - new Date(requestRow.created_at).getTime() < LOGIN_REQUEST_TTL_MS;
    if (requestRow && requestRow.status === 'pending' && requestRow.email === email && isFresh) {
      const { data: linkData } = await supabase.auth.admin.generateLink({ type: 'magiclink', email });
      let redeemToken = null;
      const actionLink = linkData?.properties?.action_link;
      if (actionLink) {
        try { redeemToken = new URL(actionLink).searchParams.get('token'); } catch { /* ignore */ }
      }
      if (redeemToken) {
        await supabase
          .from('login_requests')
          .update({ status: 'completed', redeem_token_hash: redeemToken })
          .eq('id', rid);
      }
    }
  }

  return Response.json({
    success: true,
    session: { access_token: session.access_token, refresh_token: session.refresh_token },
  });
};
