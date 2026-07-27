import { createClient } from '@supabase/supabase-js';

const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(
  process.env.SUPABASE_URL,
  rawKey
);

// Separate client for login_requests table access. supabase.auth.verifyOtp() below
// sets a user session on `supabase`, which makes supabase-js send that user's access
// token (role: authenticated) instead of the service-role key on subsequent .from()
// calls — this second client stays untouched so those requests keep using service_role.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  rawKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
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
    const { data: requestRow, error: rowErr } = await supabaseAdmin
      .from('login_requests')
      .select('id, email, status, created_at')
      .eq('id', rid)
      .single();

    if (rowErr) {
      console.error('verify-login: login_requests lookup failed', rid, rowErr.message);
    } else if (!requestRow) {
      console.error('verify-login: no login_requests row for rid', rid);
    } else {
      const isFresh = Date.now() - new Date(requestRow.created_at).getTime() < LOGIN_REQUEST_TTL_MS;
      if (requestRow.status !== 'pending') {
        console.error('verify-login: row not pending', rid, requestRow.status);
      } else if (requestRow.email !== email) {
        console.error('verify-login: email mismatch', rid, requestRow.email, email);
      } else if (!isFresh) {
        console.error('verify-login: row stale', rid, requestRow.created_at);
      } else {
        const { data: linkData, error: genErr } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
        if (genErr) console.error('verify-login: generateLink failed', rid, genErr.message);

        let redeemToken = null;
        const actionLink = linkData?.properties?.action_link;
        if (actionLink) {
          try { redeemToken = new URL(actionLink).searchParams.get('token'); } catch { /* ignore */ }
        }
        if (!redeemToken) {
          console.error('verify-login: no token in generated action_link', rid, actionLink);
        } else {
          const { error: updateErr } = await supabaseAdmin
            .from('login_requests')
            .update({ status: 'completed', redeem_token_hash: redeemToken })
            .eq('id', rid);
          if (updateErr) console.error('verify-login: row update failed', rid, updateErr.message);
        }
      }
    }
  }

  return Response.json({
    success: true,
    session: { access_token: session.access_token, refresh_token: session.refresh_token },
  });
};
