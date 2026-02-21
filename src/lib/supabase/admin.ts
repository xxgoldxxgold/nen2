import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS. Server-side only.
// Lazy initialized to avoid build-time errors when the key isn't set.
let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const key = process.env.NEN2_DB_SERVICE_ROLE_KEY
    if (!key) throw new Error('NEN2_DB_SERVICE_ROLE_KEY is not set')
    _client = createClient(process.env.NEXT_PUBLIC_NEN2_DB_URL!, key)
  }
  return _client
}
