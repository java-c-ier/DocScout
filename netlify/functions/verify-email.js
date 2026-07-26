import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const { token } = body;
  if (!token) return Response.json({ error: 'missing_token' }, { status: 400 });

  // All DB ops run as postgres via SECURITY DEFINER — bypasses role permission issues
  const { data: result, error: rpcErr } = await supabase.rpc('verify_email_token', { p_token: token });
  if (rpcErr) return Response.json({ error: rpcErr.message }, { status: 500 });

  // Propagate DB-level errors (invalid, expired, already_used)
  if (result?.error) return Response.json({ error: result.error }, { status: 400 });

  const { uid, email } = result;

  // Confirm email in Supabase Auth
  await supabase.auth.admin.updateUserById(uid, { email_confirm: true });

  // Generate magic link — extract OTP token for client-side verifyOtp (cross-tab session sync)
  const origin = req.headers.get('origin') || 'https://doc-scout.jimut.in';
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: origin },
  });

  let otpToken = null;
  const actionLink = linkData?.properties?.action_link;
  if (actionLink) {
    try { otpToken = new URL(actionLink).searchParams.get('token'); } catch { /* ignore */ }
  }

  return Response.json({ success: true, email, otpToken });
};
