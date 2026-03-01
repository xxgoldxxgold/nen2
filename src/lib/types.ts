export type Plan = 'free' | 'pro' | 'business'
export type PostStatus = 'draft' | 'published'
export type AIUsageType = 'generate' | 'rewrite' | 'suggest' | 'seo_analyze' | 'generate_image' | 'suggest_tags'

export interface Profile {
  id: string
  username: string
  display_name: string
  email: string | null
  avatar_url: string | null
  bio: string | null
  plan: Plan
  ai_credits_remaining: number
  accent_color: string
  heading_font: string
  body_font: string
  header_image_url: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  slug: string
  content: string | null
  content_html: string | null
  excerpt: string | null
  cover_image_url: string | null
  status: PostStatus
  seo_score: number
  meta_description: string | null
  seo_title: string | null
  og_title: string | null
  og_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
}

export interface Image {
  id: string
  user_id: string
  storage_path: string
  url: string
  file_name: string | null
  file_size: number | null
  content_type: string | null
  created_at: string
}

export interface AIUsageLog {
  id: string
  user_id: string
  type: AIUsageType
  tokens_used: number
  created_at: string
}

// Social features
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  article_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  article_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface PageView {
  id: string
  post_id: string
  user_id: string
  session_id: string | null
  path: string | null
  referrer: string | null
  device_type: string | null
  browser: string | null
  country: string | null
  created_at: string
}

export interface CommentWithAuthor extends Comment {
  author_name: string
  author_avatar_url: string | null
}

// F4: Translations
export interface PostTranslation {
  id: string
  post_id: string
  language_code: string
  title: string
  content: string
  meta_description: string | null
  status: 'draft' | 'published' | 'needs_update'
  translation_quality: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

// F5: Blog suggestions
export type SuggestionCategory = 'seo' | 'content_freshness' | 'internal_links' | 'content_gap' | 'readability' | 'performance'
export type SuggestionSeverity = 'info' | 'warning' | 'critical'
export type SuggestionStatus = 'open' | 'accepted' | 'dismissed' | 'completed'

export interface BlogSuggestion {
  id: string
  user_id: string
  post_id: string | null
  category: SuggestionCategory
  severity: SuggestionSeverity
  title: string
  description: string
  action_label: string | null
  action_data: any
  status: SuggestionStatus
  created_at: string
  resolved_at: string | null
}

export interface AnalysisRun {
  id: string
  user_id: string
  posts_analyzed: number
  suggestions_created: number
  started_at: string
  completed_at: string | null
  status: 'running' | 'completed' | 'failed'
  error_message: string | null
}

// F6: Analytics events
export interface AnalyticsEvent {
  postId: string
  authorId: string
  sessionId: string
  event_type: 'pageview' | 'scroll' | 'exit' | 'read_complete'
  duration_seconds?: number
  scroll_depth?: number
  utm_source?: string
  utm_medium?: string
}

// F1: Context notes
export type ContextNoteCategory = 'context' | 'style' | 'audience' | 'fact' | 'reference'

export interface ContextNote {
  id: string
  user_id: string
  category: ContextNoteCategory
  title: string
  content: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// F3: Version history
export type VersionChangeType = 'manual_save' | 'auto_save' | 'publish' | 'unpublish' | 'ai_generate' | 'ai_rewrite' | 'rollback'

export interface PostVersion {
  id: string
  post_id: string
  version_number: number
  title: string
  content: string
  meta_description: string | null
  change_type: VersionChangeType
  change_summary: string | null
  content_hash: string | null
  word_count: number | null
  created_at: string
}
