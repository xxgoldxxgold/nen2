import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const GC2_KEY = process.env.GC2_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!GC2_KEY) {
  console.error('GC2_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required.')
  process.exit(1)
}

const gc2 = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, GC2_KEY)
const nen2 = createClient(process.env.NEXT_PUBLIC_NEN2_DB_URL, process.env.NEN2_DB_SERVICE_ROLE_KEY)

// Only columns that exist in nen2's users table
const USER_COLS = ['id', 'username', 'display_name', 'email', 'avatar_url', 'bio', 'plan', 'ai_credits_remaining', 'blog_settings', 'created_at', 'updated_at']

function pickCols(obj, cols) {
  const result = {}
  for (const c of cols) {
    if (obj[c] !== undefined) result[c] = obj[c]
  }
  return result
}

async function migrate() {
  console.log('=== Direct migration (column-safe) ===')

  // 1. Get all blog_posts to find user_ids
  const { data: posts } = await gc2.from('blog_posts').select('*')
  console.log('Posts found:', posts?.length || 0)
  if (!posts || posts.length === 0) {
    console.log('No posts to migrate.')
    return
  }

  const userIds = [...new Set(posts.map(p => p.user_id))]
  console.log('Unique user_ids:', userIds)

  // 2. Get those users from gc2 (only needed columns)
  const { data: users } = await gc2.from('users').select(USER_COLS.join(', ')).in('id', userIds)
  console.log('Users found:', users?.length || 0)

  // 3. Upsert users to nen2
  if (users) {
    for (const u of users) {
      const safe = pickCols(u, USER_COLS)
      const { error } = await nen2.from('users').upsert(safe, { onConflict: 'id' })
      console.log('User:', u.username, error ? 'ERROR: ' + error.message : 'OK')
    }
  }

  // 4. Upsert posts
  for (const p of posts) {
    const { error } = await nen2.from('blog_posts').upsert(p, { onConflict: 'id' })
    console.log('Post:', p.title, error ? 'ERROR: ' + error.message : 'OK')
  }

  // 5. Tags
  const { data: tags } = await gc2.from('blog_tags').select('*')
  console.log('Tags found:', tags?.length || 0)
  if (tags) {
    for (const t of tags) {
      const { error } = await nen2.from('blog_tags').upsert(t, { onConflict: 'id' })
      if (error) console.log('Tag error:', error.message)
    }
    console.log('Tags migrated')
  }

  // 6. Post-tag relations
  const postIds = posts.map(p => p.id)
  const { data: postTags } = await gc2.from('blog_post_tags').select('*').in('post_id', postIds)
  console.log('Post-tags found:', postTags?.length || 0)
  if (postTags) {
    for (const pt of postTags) {
      const { error } = await nen2.from('blog_post_tags').upsert(pt, { onConflict: 'post_id,tag_id' })
      if (error) console.log('Post-tag error:', error.message)
    }
    console.log('Post-tags migrated')
  }

  // 7. AI usage logs
  const { data: logs } = await gc2.from('ai_usage_logs').select('*').in('user_id', userIds)
  console.log('AI logs found:', logs?.length || 0)
  if (logs) {
    for (const l of logs) {
      const { error } = await nen2.from('ai_usage_logs').upsert(l, { onConflict: 'id' })
      if (error) console.log('Log error:', error.message)
    }
    console.log('AI logs migrated')
  }

  // Verify
  console.log('\n=== Verify nen2 DB ===')
  const [u, p, t, pt, al] = await Promise.all([
    nen2.from('users').select('*', { count: 'exact', head: true }),
    nen2.from('blog_posts').select('*', { count: 'exact', head: true }),
    nen2.from('blog_tags').select('*', { count: 'exact', head: true }),
    nen2.from('blog_post_tags').select('*', { count: 'exact', head: true }),
    nen2.from('ai_usage_logs').select('*', { count: 'exact', head: true }),
  ])
  console.log('users:', u.count)
  console.log('blog_posts:', p.count)
  console.log('blog_tags:', t.count)
  console.log('blog_post_tags:', pt.count)
  console.log('ai_usage_logs:', al.count)
}

migrate().catch(console.error)
