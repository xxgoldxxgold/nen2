import { createClient } from '@supabase/supabase-js'

// Server-side data client pointing to nen2's own Supabase (API routes).
// RLS is disabled on nen2 tables; auth is handled by gc2.
export function createDataServer() {
  return createClient(
    process.env.NEXT_PUBLIC_NEN2_DB_URL!,
    process.env.NEXT_PUBLIC_NEN2_DB_ANON_KEY!
  )
}
