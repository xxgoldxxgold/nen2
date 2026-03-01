const categoryLabels: Record<string, string> = {
  context: 'ブログ方針',
  style: '文体・トーン',
  audience: '読者ターゲット',
  fact: '事実・データ',
  reference: '参考情報',
}

export async function buildContextPrompt(db: any, userId: string): Promise<string> {
  const { data: notes } = await db
    .from('nen2_context_notes')
    .select('category, title, content')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (!notes || notes.length === 0) return ''

  // Group by category
  const grouped: Record<string, { title: string; content: string }[]> = {}
  for (const note of notes) {
    if (!grouped[note.category]) grouped[note.category] = []
    grouped[note.category].push({ title: note.title, content: note.content })
  }

  const sections: string[] = []
  let totalLength = 0
  const maxLength = 4000

  for (const [category, items] of Object.entries(grouped)) {
    const label = categoryLabels[category] || category
    let section = `【${label}】\n`
    for (const item of items) {
      const line = `- ${item.title}: ${item.content}\n`
      if (totalLength + line.length > maxLength) break
      section += line
      totalLength += line.length
    }
    sections.push(section)
    if (totalLength >= maxLength) break
  }

  return `\n## ユーザーのコンテキスト情報\n${sections.join('\n')}`
}
