export type Plan = 'free' | 'pro' | 'business'
export type PostStatus = 'draft' | 'published' | 'scheduled'
export type AIUsageType = 'generate' | 'rewrite' | 'suggest' | 'seo_analyze' | 'generate_image' | 'generate_header_image' | 'suggest_tags' | 'design'

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

export interface AIUsageLog {
  id: string
  user_id: string
  type: AIUsageType
  tokens_used: number
  created_at: string
}
