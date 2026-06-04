import { supabase } from '../utils/supabase'

/**
 * Single source of truth for "who is the caller" in service-layer writes.
 *
 * Every insert/update/delete that touches owned data should derive the user id
 * from the live Supabase session — never from a value passed down by the UI —
 * so the database identity and the RLS `auth.uid()` check can never drift apart.
 * This is what prevents orphaned rows (insert with a null/foreign owner) and
 * permission leaks (mutating a row you don't own).
 */

/** Current authenticated user's id, or null when logged out. */
export async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

/**
 * Like {@link getCurrentUserId} but throws a localized error when there is no
 * session. Use for owner-scoped writes (update/delete) so we never issue an
 * unscoped mutation that RLS would have to be the only thing stopping.
 */
export async function requireUserId() {
  const uid = await getCurrentUserId()
  if (!uid) throw new Error('יש להתחבר כדי לבצע פעולה זו')
  return uid
}
