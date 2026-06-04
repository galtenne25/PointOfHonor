import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'

// Flip to false once you've verified auth is working. Logs are namespaced
// `[Auth]` so you can filter them in the browser devtools console.
const DEBUG_AUTH = true
const log = (...a) => DEBUG_AUTH && console.log('[Auth]', ...a)
const logErr = (...a) => DEBUG_AUTH && console.error('[Auth]', ...a)

/**
 * AuthContext — listens to Supabase auth state and hydrates the user's
 * profile row (used for `isAdmin`, display name, etc.). Wrap the app once
 * (outside AppProvider) so any consumer can call useAuth().
 */
const AuthCtx = createContext(null)

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? '').toLowerCase()

async function fetchProfile(userId) {
  if (!userId) return null
  log('fetchProfile → SELECT profiles WHERE id =', userId)
  // `select('*')` so we tolerate DBs that haven't run the latest migration
  // (is_admin / bio / avatar_url are only present post-migration).
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    logErr('fetchProfile failed:', error.code, error.message)
    return null
  }
  log('fetchProfile → row =', data ? { id: data.id, full_name: data.full_name, is_admin: data.is_admin } : null)
  return data
}

// Insert a minimal profiles row if missing (covers DBs without handle_new_user
// trigger). Idempotent: ON CONFLICT (id) DO NOTHING via upsert+ignore.
async function ensureProfile(user) {
  if (!user) return null
  const existing = await fetchProfile(user.id)
  if (existing) return existing
  log('ensureProfile → no row found, upserting...')
  const meta = user.user_metadata ?? {}
  const fname = (meta.full_name || '').trim() || (user.email?.split('@')[0] ?? 'אנונימי')
  const initial = (fname || '?').slice(0, 1).toUpperCase()
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, full_name: fname, initials: initial, avatar_color: '#7B9E4A' },
      { onConflict: 'id', ignoreDuplicates: true },
    )
  if (error) {
    logErr('ensureProfile upsert failed:', error.code, error.message)
    return null
  }
  return fetchProfile(user.id)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initial session + auth listener.
  //
  // IMPORTANT: do NOT use a module-/component-level "mounted" ref to guard
  // against state updates after unmount. In React 18 + StrictMode (dev only)
  // every useEffect is mount→cleanup→mount, and a ref set to `false` in the
  // first cleanup stays `false` on the re-mount — which would bail BOTH async
  // runs and leave `loading` stuck on `true` forever (the symptom of the
  // "spinner that never resolves" on Profile page).
  //
  // The correct pattern is a LOCAL `cancelled` variable per effect run.
  useEffect(() => {
    log('AuthProvider effect mounted')
    let cancelled = false
    let unsub = null

    // 6-second fail-safe: if supabase.auth.getSession() hangs (stale refresh
    // token, network blip), we treat it as "no session" instead of leaving
    // `loading` true forever. The AppAuthGate will then redirect to /auth.
    const sessionWithTimeout = Promise.race([
      supabase.auth.getSession(),
      new Promise(resolve => setTimeout(
        () => resolve({ data: { session: null }, error: { message: 'getSession timeout (6s)' } }),
        6000,
      )),
    ])

    ;(async () => {
      log('calling supabase.auth.getSession()...')
      const { data, error } = await sessionWithTimeout
      if (error) logErr('getSession error:', error.message)
      const s = data?.session ?? null
      log('getSession resolved →', { hasSession: !!s, userId: s?.user?.id, email: s?.user?.email })

      if (cancelled) { log('cancelled before applying initial session'); return }
      setSession(s)

      // CRITICAL FIX: unblock the UI as soon as the session is known. Do NOT
      // wait for the profile fetch — that lets a slow network / RLS hiccup
      // freeze the page on a spinner forever. The profile loads in the
      // background and the UI re-renders when it arrives.
      setLoading(false)
      log('initial auth resolved → loading=false (profile may still be loading)')

      if (s?.user) {
        const p = await ensureProfile(s.user)
        if (cancelled) { log('cancelled before applying initial profile'); return }
        setProfile(p)
      }

      // Register the auth listener AFTER initial state is settled.
      const sub = supabase.auth.onAuthStateChange((event, next) => {
        log('onAuthStateChange event:', event, { userId: next?.user?.id })
        if (cancelled) return
        setSession(next)
        // CRITICAL: never await Supabase calls directly inside this callback.
        // supabase-js holds an auth lock for its duration; awaiting a query/auth
        // call here deadlocks the client and every later query hangs forever
        // (stuck skeletons, "שומר..." spinner). Defer with setTimeout(0) so the
        // profile fetch runs OUTSIDE the lock.
        setTimeout(async () => {
          if (cancelled) return
          const p = next?.user ? await ensureProfile(next.user) : null
          if (cancelled) return
          setProfile(p)
        }, 0)
      })
      unsub = sub.data.subscription
    })().catch(err => logErr('unexpected error in auth bootstrap:', err))

    return () => {
      log('AuthProvider effect cleanup')
      cancelled = true
      unsub?.unsubscribe?.()
    }
  }, [])

  const signUp = useCallback(async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName?.trim() || undefined } },
    })
    if (error) throw error
    // If the project requires email confirmation, no session is returned.
    // Try a normal sign-in anyway — succeeds when confirmation is disabled.
    if (!data.session) {
      const { error: siErr } = await supabase.auth.signInWithPassword({ email, password })
      if (siErr) {
        const e = new Error('נשלח אליך אימייל לאימות החשבון. אשר/י את הקישור לפני התחברות.')
        e.code = 'email-confirmation-required'
        throw e
      }
    }
    return data
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    setProfile(await fetchProfile(session.user.id))
  }, [session?.user])

  const user    = session?.user ?? null
  const isAdmin = !!profile?.is_admin || (!!user?.email && user.email.toLowerCase() === ADMIN_EMAIL)

  // "Needs completion" is the strict-spec interpretation: redirect ONLY when
  // a user has authenticated but no profile row exists (trigger missed it, or
  // RLS blocks the SELECT). We DO NOT force-redirect users who have a row
  // with the auto-generated default name — that produced an infinite redirect
  // away from /profile every visit. They get a soft banner instead.
  const needsProfileCompletion = !loading && !!user && !profile

  // A softer signal that the UI can use to surface a "complete your profile"
  // banner without forcing navigation.
  const emailPrefix = user?.email?.split('@')[0]?.toLowerCase()
  const fname       = (profile?.full_name ?? '').trim().toLowerCase()
  const profileLooksDefault = !!user && !!profile && (
    !fname || (fname === emailPrefix && !profile?.avatar_url)
  )

  return (
    <AuthCtx.Provider value={{
      session, user, profile, loading, isAdmin,
      needsProfileCompletion, profileLooksDefault,
      signUp, signIn, signOut, refreshProfile,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
