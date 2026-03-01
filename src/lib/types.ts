export type Plan = 'free' | 'pro' | 'business'
export type PostStatus = 'draft' | 'published' | 'scheduled'
export type AIUsageType = 'generate' | 'rewrite' | 'suggest' | 'seo_analyze' | 'generate_image' | 'generate_header_image' | 'suggest_tags' | 'design' | 'field_assist' | 'analyze'

export interface User {
  id: string
  username: string
  display_name: string
  email: string | null
  avatar_url: string | null
  bio: string | null
  plan: Plan
  ai_credits_remaining: number
  blog_settings: BlogSettings
  created_at: string
  updated_at: string
}

export interface BlogSettings {
  template: string
  primaryColor: string
  fontFamily: string
  headerStyle: string
  showSidebar: boolean
  [key: string]: unknown
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
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  slug: string
}

export interface Tag {
  id: string
  name: string
}

export type VersionChangeType = 'manual_save' | 'auto_save' | 'publish' | 'unpublish' | 'ai_generate' | 'ai_rewrite' | 'rollback'

export interface PostVersion {
  id: string
  post_id: string
  user_id: string
  version_number: number
  title: string
  content: string | null
  content_html: string | null
  excerpt: string | null
  meta_description: string | null
  tags: string[] | null
  change_type: VersionChangeType
  change_summary: string | null
  content_hash: string | null
  word_count: number
  created_at: string
}

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

export interface AIUsageLog {
  id: string
  user_id: string
  type: AIUsageType
  tokens_used: number
  created_at: string
}

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
  action_data: Record<string, unknown> | null
  status: SuggestionStatus
  created_at: string
  resolved_at: string | null
  post_title?: string
}

export interface AnalysisRun {
  id: string
  user_id: string
  categories: string[]
  posts_analyzed: number
  suggestions_created: number
  started_at: string
  completed_at: string | null
  status: 'running' | 'completed' | 'failed'
  error_message: string | null
}
