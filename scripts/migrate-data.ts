/**
 * Data migration script: gc2 → nen2
 *
 * Copies nen2-active users and their data from gc2 Supabase to nen2 Supabase.
 * Run with: npx tsx scripts/migrate-data.ts
 *
 * Requires environment variables (already in .env.local):
 * - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (gc2 — source)
 * - NEXT_PUBLIC_NEN2_DB_URL / NEN2_DB_SERVICE_ROLE_KEY (nen2 — destination)
 *
 * Also needs gc2 service role key as GC2_SERVICE_ROLE_KEY env var.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const GC2_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const GC2_KEY = process.env.GC2_SERVICE_ROLE_KEY
if (!GC2_KEY) {
  console.error('GC2_SERVICE_ROLE_KEY is required. Set it before running this script.')
  console.error('Example: GC2_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/migrate-data.ts')
  process.exit(1)
}

const NEN2_URL = process.env.NEXT_PUBLIC_NEN2_DB_URL!
const NEN2_KEY = process.env.NEN2_DB_SERVICE_ROLE_KEY!

const gc2 = createClient(GC2_URL, GC2_KEY)
const nen2 = createClient(NEN2_URL, NEN2_KEY)

async function migrate() {
  console.log('=== gc2 → nen2 data migration ===\n')

  // 1. Fetch nen2-active users from gc2
  console.log('1. Fetching nen2-active users from gc2...')
  const { data: gc2Users, error: userErr } = await gc2
    .from('users')
    .select('*')
    .contains('blog_settings', { nen2_active: true })

  if (userErr) { console.error('Failed to fetch users:', userErr); return }
  console.log(`   Found ${gc2Users?.length || 0} nen2 users`)

  if (!gc2Users || gc2Users.length === 0) {
    console.log('   No users to migrate.')
    return
  }

  const userIds = gc2Users.map(u => u.id)

  // 2. Upsert users into nen2
  console.log('\n2. Upserting users into nen2...')
  for (const user of gc2Users) {
    const { error } = await nen2.from('users').upsert(user, { onConflict: 'id' })
    if (error) console.error(`   Error upserting user ${user.id}:`, error.message)
    else console.log(`   ✓ ${user.email || user.id}`)
  }

  // 3. Migrate blog_posts
  console.log('\n3. Migrating blog_posts...')
  const { data: posts, error: postErr } = await gc2
    .from('blog_posts')
    .select('*')
    .in('user_id', userIds)

  if (postErr) { console.error('Failed to fetch posts:', postErr); return }
  console.log(`   Found ${posts?.length || 0} posts`)

  if (posts && posts.length > 0) {
    for (const post of posts) {
      const { error } = await nen2.from('blog_posts').upsert(post, { onConflict: 'id' })
      if (error) console.error(`   Error upserting post ${post.id}:`, error.message)
    }
    console.log(`   ✓ ${posts.length} posts migrated`)
  }

  // 4. Migrate blog_tags
  console.log('\n4. Migrating blog_tags...')
  const { data: tags, error: tagErr } = await gc2.from('blog_tags').select('*')
  if (tagErr) { console.error('Failed to fetch tags:', tagErr); return }
  console.log(`   Found ${tags?.length || 0} tags`)

  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const { error } = await nen2.from('blog_tags').upsert(tag, { onConflict: 'id' })
      if (error) console.error(`   Error upserting tag ${tag.id}:`, error.message)
    }
    console.log(`   ✓ ${tags.length} tags migrated`)
  }

  // 5. Migrate blog_post_tags (for posts belonging to nen2 users)
  console.log('\n5. Migrating blog_post_tags...')
  if (posts && posts.length > 0) {
    const postIds = posts.map(p => p.id)
    const { data: postTags, error: ptErr } = await gc2
      .from('blog_post_tags')
      .select('*')
      .in('post_id', postIds)

    if (ptErr) { console.error('Failed to fetch post_tags:', ptErr); return }
    console.log(`   Found ${postTags?.length || 0} post-tag relations`)

    if (postTags && postTags.length > 0) {
      for (const pt of postTags) {
        const { error } = await nen2.from('blog_post_tags').upsert(pt, { onConflict: 'post_id,tag_id' })
        if (error) console.error(`   Error upserting post_tag:`, error.message)
      }
      console.log(`   ✓ ${postTags.length} post-tag relations migrated`)
    }
  }

  // 6. Migrate ai_usage_logs
  console.log('\n6. Migrating ai_usage_logs...')
  const { data: logs, error: logErr } = await gc2
    .from('ai_usage_logs')
    .select('*')
    .in('user_id', userIds)

  if (logErr) { console.error('Failed to fetch ai_usage_logs:', logErr); return }
  console.log(`   Found ${logs?.length || 0} AI usage logs`)

  if (logs && logs.length > 0) {
    for (const log of logs) {
      const { error } = await nen2.from('ai_usage_logs').upsert(log, { onConflict: 'id' })
      if (error) console.error(`   Error upserting log:`, error.message)
    }
    console.log(`   ✓ ${logs.length} AI usage logs migrated`)
  }

  console.log('\n=== Migration complete ===')
}

migrate().catch(console.error)
