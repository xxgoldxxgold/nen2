import { createBrowserClient } from '@supabase/ssr'

// Auth client (browser-side) — shared project (vylwpbbwkmuxrfzmgvkj)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
