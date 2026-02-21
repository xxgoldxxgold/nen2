import { createClient } from '@supabase/supabase-js'

// Browser-side data client pointing to nen2's own Supabase.
// RLS is disabled on nen2 tables; auth is handled by gc2.
export function createDataClient() {
  return createClient(
    process.env.NEXT_PUBLIC_NEN2_DB_URL!,
    process.env.NEXT_PUBLIC_NEN2_DB_ANON_KEY!
  )
}
