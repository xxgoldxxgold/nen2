'use client'

import { useState, useEffect } from 'react'
import { Download, Check, X as XIcon, RotateCcw } from 'lucide-react'

type Spec = {
  id: string
  title: string
  summary: string
  category: string
  priority: string
  status: string
  vote_count: number
  created_at: string
  raw_input: string
  app_name: string
  spec_json: any
  users: { username: string; display_name: string }
}

export default function DesignSpecAdminPage() {
  const [specs, setSpecs] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(true)

  useEffect(() => {
    fetch('/api/d/specs?sort=votes')
      .then(r => r.json())
      .then(data => {
        setSpecs(data.specs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const changeStatus = async (specId: string, status: string) => {
    setUpdating(specId)
    try {
      const res = await fetch(`/api/d/specs/${specId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.status === 403) { setIsAdmin(false); return }
      if (res.ok) {
        setSpecs(prev => prev.map(s => s.id === specId ? { ...s, status } : s))
      }
    } catch {}
    setUpdating(null)
  }

  const exportJSON = () => {
    const json = JSON.stringify(specs, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `design_specs_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
        <h2 style={{ color: '#333' }}>管理者権限が必要です</h2>
        <p>この画面にアクセスするには管理者アカウントでログインしてください。</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>管理者ダッシュボード</h1>
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>
            仕様書のステータス管理・エクスポート
          </p>
        </div>
        <button
          onClick={exportJSON}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
            background: '#fff', cursor: 'pointer', fontSize: '13px',
          }}
        >
          <Download size={14} />
          JSONエクスポート
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>読み込み中...</div>
      ) : specs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>仕様書がありません</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '14px',
            background: '#fff', borderRadius: '12px', overflow: 'hidden',
            border: '1px solid #e5e7eb',
          }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>票</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>タイトル</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>カテゴリ</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>優先度</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>投稿者</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>日付</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>ステータス</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {specs.map(spec => (
                <tr key={spec.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb' }}>
                    {spec.vote_count}
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: '250px' }}>
                    <div style={{ fontWeight: 600 }}>{spec.title}</div>
                    <div style={{ fontSize: '12px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {spec.summary}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{spec.category}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      color: spec.priority === '高' ? '#dc2626' : spec.priority === '中' ? '#d97706' : '#16a34a',
                      fontWeight: 600,
                    }}>
                      {spec.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                    {spec.users?.display_name || '匿名'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                    {new Date(spec.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      background: spec.status === 'adopted' ? '#dcfce7' : spec.status === 'rejected' ? '#fee2e2' : '#dbeafe',
                      color: spec.status === 'adopted' ? '#16a34a' : spec.status === 'rejected' ? '#dc2626' : '#1d4ed8',
                    }}>
                      {spec.status === 'adopted' ? '採用済' : spec.status === 'rejected' ? '却下' : '新規'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={() => changeStatus(spec.id, 'adopted')}
                        disabled={updating === spec.id || spec.status === 'adopted'}
                        title="採用"
                        style={{
                          padding: '4px 8px', borderRadius: '6px', border: '1px solid #a7f3d0',
                          background: spec.status === 'adopted' ? '#dcfce7' : '#fff',
                          cursor: spec.status === 'adopted' ? 'default' : 'pointer',
                          color: '#16a34a',
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => changeStatus(spec.id, 'rejected')}
                        disabled={updating === spec.id || spec.status === 'rejected'}
                        title="却下"
                        style={{
                          padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca',
                          background: spec.status === 'rejected' ? '#fee2e2' : '#fff',
                          cursor: spec.status === 'rejected' ? 'default' : 'pointer',
                          color: '#dc2626',
                        }}
                      >
                        <XIcon size={14} />
                      </button>
                      <button
                        onClick={() => changeStatus(spec.id, 'new')}
                        disabled={updating === spec.id || spec.status === 'new'}
                        title="新規に戻す"
                        style={{
                          padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db',
                          background: '#fff', cursor: spec.status === 'new' ? 'default' : 'pointer',
                          color: '#666',
                        }}
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
