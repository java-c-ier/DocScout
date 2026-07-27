import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOGIN_REQUEST_TTL_MS = 60 * 60 * 1000;

export default async (req) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  const rid = new URL(req.url).searchParams.get('rid');
  if (!rid) return Response.json({ status: 'not_found' }, { status: 400 });

  const { data: row } = await supabase
    .from('login_requests')
    .select('id, status, redeem_token_hash, created_at')
    .eq('id', rid)
    .single();

  if (!row) return Response.json({ status: 'not_found' });

  if (Date.now() - new Date(row.created_at).getTime() > LOGIN_REQUEST_TTL_MS) {
    return Response.json({ status: 'expired' });
  }

  if (row.status !== 'completed' || !row.redeem_token_hash) {
    return Response.json({ status: 'pending' });
  }

  // Single delivery: the pairing token is only handed out once, so a second
  // poll (or a replay) can't redeem it again.
  await supabase.from('login_requests').delete().eq('id', rid);

  return Response.json({ status: 'completed', tokenHash: row.redeem_token_hash });
};
