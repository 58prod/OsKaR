import type { NextApiRequest } from 'next';
import { createClient, type User } from '@supabase/supabase-js';

/*
 * Relit, dans une route d'API, le compte qui fait la demande à partir du jeton
 * de session envoyé par le navigateur (« Authorization: Bearer … »). C'est
 * Supabase qui vérifie le jeton : rien de ce qui vient du navigateur n'est cru
 * sur parole. Renvoie null sans jeton, ou si le jeton est invalide ou expiré.
 */
export async function utilisateurDuJeton(req: NextApiRequest): Promise<User | null> {
  const jeton = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!jeton || !url || !cle) return null;

  const { data, error } = await createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.getUser(jeton);
  return error ? null : data?.user ?? null;
}
