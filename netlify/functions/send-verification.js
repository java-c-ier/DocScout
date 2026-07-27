import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __funcDir = dirname(fileURLToPath(import.meta.url));

const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(
  process.env.SUPABASE_URL,
  rawKey
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_NOREPLY = 'DocScout <doc-scout@jimut.in>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jimutksahoo99@gmail.com';

const signupTemplate = readFileSync(join(__funcDir, 'templates/email-signup-verify.html'), 'utf8');
const loginTemplate = readFileSync(join(__funcDir, 'templates/email-login-link.html'), 'utf8');

function fill(template, vars) {
  return template
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{verification-link\}\}/g, vars.verificationLink);
}

async function sendEmail(to, subject, html) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_NOREPLY, to, subject, html }),
  });
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const { source, email, name, origin } = body;
  if (!email) return Response.json({ error: 'missing_email' }, { status: 400 });

  const baseUrl = origin || 'https://doc-scout.jimut.in';

  // ── SIGNUP ────────────────────────────────────────────────────────────────
  if (source === 'signup') {
    const { data: existing } = await supabase.rpc('get_user_for_login', { p_email: email });
    if (existing) {
      if (existing.email_verified) return Response.json({ error: 'already_registered' });

      // Account exists but never verified — resend a fresh verification link instead of dead-ending.
      const uid = existing.id;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error: tokenErr } = await supabase.rpc('create_email_verification', {
        p_token: token,
        p_uid: uid,
        p_email: email,
        p_source: 'signup',
        p_expires_at: expiresAt,
      });
      if (tokenErr) return Response.json({ error: tokenErr.message }, { status: 500 });

      const verificationLink = `${baseUrl}/verify-email?token=${token}`;
      const displayName = existing.display_name || name || email.split('@')[0];
      const html = fill(signupTemplate, { name: displayName, verificationLink });
      await sendEmail(email, 'Welcome to DocScout — Verify your email', html);
      return Response.json({ success: true });
    }

    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { display_name: name || '' },
    });
    if (createErr) {
      const msg = (createErr.message || '').toLowerCase();
      if (msg.includes('already') || createErr.code === 'email_exists') {
        return Response.json({ error: 'already_registered' });
      }
      return Response.json({ error: createErr.message }, { status: 500 });
    }

    const uid = authData.user.id;

    const { error: insertErr } = await supabase.rpc('create_user_profile', {
      p_id: uid,
      p_email: email,
      p_display_name: name || '',
      p_role: email === ADMIN_EMAIL ? 'admin' : 'user',
    });
    if (insertErr) {
      await supabase.auth.admin.deleteUser(uid);
      return Response.json({ error: insertErr.message }, { status: 500 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: tokenErr } = await supabase.rpc('create_email_verification', {
      p_token: token,
      p_uid: uid,
      p_email: email,
      p_source: 'signup',
      p_expires_at: expiresAt,
    });
    if (tokenErr) {
      await supabase.auth.admin.deleteUser(uid);
      return Response.json({ error: tokenErr.message }, { status: 500 });
    }

    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    const displayName = name || email.split('@')[0];
    const html = fill(signupTemplate, { name: displayName, verificationLink });
    await sendEmail(email, 'Welcome to DocScout — Verify your email', html);
    return Response.json({ success: true });
  }

  // ── LOGIN (one-click login link) ──────────────────────────────────────────
  if (source === 'login') {
    const { data: userData, error: lookupErr } = await supabase.rpc('get_user_for_login', { p_email: email });
    if (lookupErr) return Response.json({ error: lookupErr.message }, { status: 500 });

    if (!userData) return Response.json({ error: 'not_found' });
    if (userData.blocked) return Response.json({ error: 'blocked' });
    if (!userData.email_verified) return Response.json({ error: 'not_verified' });

    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: baseUrl },
    });
    if (linkErr) return Response.json({ error: linkErr.message }, { status: 500 });

    let otpToken = null;
    const actionLink = linkData?.properties?.action_link;
    if (actionLink) {
      try { otpToken = new URL(actionLink).searchParams.get('token'); } catch { /* ignore */ }
    }
    if (!otpToken) return Response.json({ error: 'failed_to_generate_link' }, { status: 500 });

    // Track this login attempt so the device that requested the link (which may not be
    // the device the link is opened on) can pick up its own session once it's confirmed.
    await supabase.from('login_requests').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    const { data: requestRow, error: requestErr } = await supabase
      .from('login_requests')
      .insert({ email })
      .select('id')
      .single();
    if (requestErr) return Response.json({ error: requestErr.message }, { status: 500 });

    const verificationLink = `${baseUrl}/verify-login?token=${otpToken}&email=${encodeURIComponent(email)}&rid=${requestRow.id}`;
    const displayName = userData.display_name || email.split('@')[0];
    const html = fill(loginTemplate, { name: displayName, verificationLink });
    await sendEmail(email, 'Your DocScout sign-in link', html);
    return Response.json({ success: true, requestId: requestRow.id });
  }

  return Response.json({ error: 'invalid_source' }, { status: 400 });
};
