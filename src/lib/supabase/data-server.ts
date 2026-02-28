import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side data client pointing to nen2's own Supabase (API routes).
// Uses service_role key because RLS is disabled and anon has no GRANTs.
// Auth is handled by shared gc2 project; this is the nen2 data-only project.
// !! WARNING: This DB also contains gc2.jp SNS tables (users, follows, likes,
// !! conversations, messages, etc.) — NEVER modify or drop those tables.
// !! nen2 tables only: profiles, posts, tags, post_tags, images, ai_usage_logs
let _client: SupabaseClient | null = null

export function createDataServer(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_NEN2_DB_URL!,
      process.env.NEN2_DB_SERVICE_ROLE_KEY!,
    )
  }
  return _client
}
