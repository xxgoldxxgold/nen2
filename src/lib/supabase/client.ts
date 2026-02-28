import { createBrowserClient } from '@supabase/ssr'

/**
 * Auth client (browser-side).
 * !! WARNING: This connects to the SHARED auth project (gc2.jp + nen2.com).
 * !! Do NOT use this client to modify auth settings or provider config.
 * !! Read-only auth operations only (signIn, signUp, getSession, getUser).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
