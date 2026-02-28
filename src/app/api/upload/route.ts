import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルは必須です' }, { status: 400 })

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: '画像ファイル（JPEG, PNG, GIF, WebP）のみ対応しています' }, { status: 400 })
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const storagePath = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await db.storage
    .from('images')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }

  const { data: urlData } = db.storage.from('images').getPublicUrl(storagePath)
  const url = urlData.publicUrl

  // Track in images table
  await db.from('images').insert({
    user_id: user.id,
    storage_path: storagePath,
    url,
    file_name: file.name,
    file_size: file.size,
    content_type: file.type,
  })

  return NextResponse.json({ url })
}
