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
