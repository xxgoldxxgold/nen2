'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronUp, Filter, SortAsc, X } from 'lucide-react'

const CATEGORIES = ['UI', 'UX', 'パフォーマンス', 'アクセシビリティ', 'その他'] as const
const STATUSES = [
  { value: '', label: 'すべて' },
  { value: 'new', label: '新規' },
  { value: 'adopted', label: '採用済' },
  { value: 'rejected', label: '却下' },
]

type Spec = {
  id: string
  title: string
  summary: string
  category: string
  priority: string
  status: string
  vote_count: number
  created_at: string
  users: { username: string; display_name: string }
}

type SpecDetail = Spec & {
  raw_input: string
  app_name: string
  spec_json: any
}

export default function DesignSpecBoardPage() {
  const [specs, setSpecs] = useState<Spec[]>([])
  const [votedIds, setVotedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedSpec, setSelectedSpec] = useState<SpecDetail | null>(null)
  const [selectedHasVoted, setSelectedHasVoted] = useState(false)
  const [voting, setVoting] = useState<string | null>(null)

  const fetchSpecs = useCallback(async () => {
    const params = new URLSearchParams({ sort })
    if (categoryFilter) params.set('category', categoryFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/d/specs?${params}`)
    const data = await res.json()
    setSpecs(data.specs || [])
    setVotedIds(data.votedSpecIds || [])
    setLoading(false)
  }, [sort, categoryFilter, statusFilter])

  useEffect(() => { fetchSpecs() }, [fetchSpecs])

  const handleVote = async (specId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setVoting(specId)
    try {
      const res = await fetch(`/api/d/specs/${specId}/vote`, { method: 'POST' })
      if (res.status === 401) { window.location.href = '/login'; return }
      const data = await res.json()
      setSpecs(prev => prev.map(s => s.id === specId ? { ...s, vote_count: data.voteCount } : s))
      if (data.voted) {
        setVotedIds(prev => [...prev, specId])
      } else {
        setVotedIds(prev => prev.filter(id => id !== specId))
      }
      if (selectedSpec?.id === specId) {
        setSelectedHasVoted(data.voted)
        setSelectedSpec(prev => prev ? { ...prev, vote_count: data.voteCount } : null)
      }
    } catch {}
    setVoting(null)
  }

  const openDetail = async (specId: string) => {
    const res = await fetch(`/api/d/specs?id=${specId}`)
    const data = await res.json()
    if (data.spec) {
      setSelectedSpec(data.spec)
      setSelectedHasVoted(data.hasVoted)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      new: { bg: '#dbeafe', text: '#1d4ed8' },
      adopted: { bg: '#dcfce7', text: '#16a34a' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
    }
    const labels: Record<string, string> = { new: '新規', adopted: '採用済', rejected: '却下' }
    const c = colors[status] || colors.new
    return (
      <span style={{
        background: c.bg, color: c.text, padding: '2px 8px',
        borderRadius: '10px', fontSize: '11px', fontWeight: 600,
      }}>
        {labels[status] || status}
      </span>
    )
  }

  const priorityBadge = (priority: string) => {
    const c = priority === '高' ? '#dc2626' : priority === '中' ? '#d97706' : '#16a34a'
    return (
      <span style={{
        color: c, fontSize: '11px', fontWeight: 600,
        border: `1px solid ${c}33`, borderRadius: '10px', padding: '1px 8px',
      }}>
        {priority}
      </span>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>仕様ボード</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        コミュニティから寄せられたデザイン改善仕様に投票しよう
      </p>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <SortAsc size={14} style={{ color: '#888' }} />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
              fontSize: '13px', background: '#fff',
            }}
          >
            <option value="newest">新着順</option>
            <option value="votes">投票数順</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={14} style={{ color: '#888' }} />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
              fontSize: '13px', background: '#fff',
            }}
          >
            <option value="">全カテゴリ</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              style={{
                padding: '4px 12px', borderRadius: '14px', fontSize: '12px',
                border: statusFilter === s.value ? '1px solid #2563eb' : '1px solid #d1d5db',
                background: statusFilter === s.value ? '#eff6ff' : '#fff',
                color: statusFilter === s.value ? '#2563eb' : '#666',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spec cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>読み込み中...</div>
      ) : specs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          <p>まだ仕様書がありません</p>
          <a href="/d" style={{ color: '#2563eb', fontSize: '14px' }}>最初の要望を送信する</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {specs.map(spec => {
            const hasVoted = votedIds.includes(spec.id)
            return (
              <div
                key={spec.id}
                onClick={() => openDetail(spec.id)}
                style={{
                  display: 'flex', gap: '16px', background: '#fff',
                  borderRadius: '12px', border: '1px solid #e5e7eb',
                  padding: '16px 20px', cursor: 'pointer', transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Vote column */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: '48px', gap: '2px',
                }}>
                  <button
                    onClick={e => handleVote(spec.id, e)}
                    disabled={voting === spec.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: hasVoted ? '#2563eb' : '#aaa', padding: '4px',
                      transition: 'transform 0.15s',
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <ChevronUp size={24} strokeWidth={hasVoted ? 3 : 2} />
                  </button>
                  <span style={{
                    fontWeight: 700, fontSize: '16px',
                    color: hasVoted ? '#2563eb' : '#333',
                  }}>
                    {spec.vote_count}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {statusBadge(spec.status)}
                    {priorityBadge(spec.priority)}
                    <span style={{
                      background: '#f3f4f6', color: '#555', padding: '1px 8px',
                      borderRadius: '10px', fontSize: '11px',
                    }}>
                      {spec.category}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>{spec.title}</h3>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {spec.summary}
                  </p>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    {spec.users?.display_name || '匿名'} &middot; {new Date(spec.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSpec && (
        <div
          onClick={() => setSelectedSpec(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', maxWidth: '720px', width: '100%',
              maxHeight: '80vh', overflow: 'auto', padding: '32px', position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedSpec(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer', color: '#999',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {statusBadge(selectedSpec.status)}
              {priorityBadge(selectedSpec.priority)}
              <span style={{ background: '#f3f4f6', color: '#555', padding: '1px 8px', borderRadius: '10px', fontSize: '11px' }}>
                {selectedSpec.category}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{selectedSpec.title}</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>{selectedSpec.summary}</p>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb',
              marginBottom: '20px',
            }}>
              <button
                onClick={() => handleVote(selectedSpec.id)}
                disabled={voting === selectedSpec.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 20px', borderRadius: '8px',
                  border: selectedHasVoted ? '2px solid #2563eb' : '1px solid #d1d5db',
                  background: selectedHasVoted ? '#eff6ff' : '#fff',
                  color: selectedHasVoted ? '#2563eb' : '#333',
                  fontWeight: 600, cursor: 'pointer', fontSize: '14px',
                }}
              >
                <ChevronUp size={18} />
                {selectedSpec.vote_count} 票
              </button>
              <span style={{ fontSize: '13px', color: '#999' }}>
                {selectedSpec.users?.display_name || '匿名'} &middot; {new Date(selectedSpec.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>

            {/* Spec details */}
            {selectedSpec.spec_json && (
              <div style={{ fontSize: '14px', lineHeight: 1.8 }}>
                {selectedSpec.spec_json.background && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>背景</h3>
                    <p style={{ color: '#444', margin: 0 }}>{selectedSpec.spec_json.background}</p>
                  </div>
                )}
                {selectedSpec.spec_json.goal && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>ゴール</h3>
                    <p style={{ color: '#444', margin: 0 }}>{selectedSpec.spec_json.goal}</p>
                  </div>
                )}
                {selectedSpec.spec_json.requirements?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>要件</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedSpec.spec_json.requirements.map((r: string, i: number) => (
                        <li key={i} style={{ color: '#444' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedSpec.spec_json.ui_changes?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>UI変更</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedSpec.spec_json.ui_changes.map((r: string, i: number) => (
                        <li key={i} style={{ color: '#444' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedSpec.spec_json.acceptance_criteria?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>受け入れ基準</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedSpec.spec_json.acceptance_criteria.map((r: string, i: number) => (
                        <li key={i} style={{ color: '#444' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedSpec.spec_json.notes && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>補足</h3>
                    <p style={{ color: '#444', margin: 0 }}>{selectedSpec.spec_json.notes}</p>
                  </div>
                )}
              </div>
            )}

            {selectedSpec.raw_input && (
              <div style={{
                marginTop: '20px', padding: '12px 16px', background: '#f9fafb',
                borderRadius: '8px', fontSize: '13px', color: '#666',
              }}>
                <span style={{ fontWeight: 600, color: '#444' }}>元の要望:</span> {selectedSpec.raw_input}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
