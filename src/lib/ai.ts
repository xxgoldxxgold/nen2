import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 2048): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = message.content.find(block => block.type === 'text')
  return textBlock ? textBlock.text : ''
}

export function streamClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096,
  model: 'claude-opus-4-6' | 'claude-sonnet-4-6' = 'claude-sonnet-4-6',
  useWebSearch = false,
) {
  const params: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }
  if (useWebSearch) {
    params.tools = [{
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
    }]
  }
  return anthropic.messages.stream(params as Parameters<typeof anthropic.messages.stream>[0])
}

export async function checkRateLimit(supabase: any, userId: string, type: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('plan, ai_credits_remaining')
    .eq('id', userId)
    .single()

  if (!user) return false

  // Get usage count for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', startOfMonth.toISOString())

  const limits: Record<string, Record<string, number>> = {
    free: { generate: 10, rewrite: 20, suggest: 50, seo_analyze: 5, generate_image: 5, suggest_tags: 20, design: 3 },
    pro: { generate: 100, rewrite: 200, suggest: 500, seo_analyze: 9999, generate_image: 50, suggest_tags: 200, design: 9999 },
    business: { generate: 9999, rewrite: 9999, suggest: 9999, seo_analyze: 9999, generate_image: 200, suggest_tags: 9999, design: 9999 },
  }

  const limit = limits[user.plan]?.[type] ?? 10
  return (count || 0) < limit
}

export async function logAIUsage(supabase: any, userId: string, type: string, tokensUsed = 0) {
  await supabase.from('ai_usage_logs').insert({
    user_id: userId,
    type,
    tokens_used: tokensUsed,
  })
}
