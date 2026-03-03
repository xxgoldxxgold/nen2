'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const CATEGORIES = ['UI', 'UX', 'パフォーマンス', 'アクセシビリティ', 'その他'] as const

type ValidationResult = { result: 'PASS' | 'CLARIFY' | 'REJECT'; reason: string; suggestion?: string }
type GeneratedSpec = {
  id: string
  title: string
  summary: string
  priority: string
  category: string
  spec_json: any
  created_at: string
}

export default function DesignSpecSubmitPage() {
  const [appName, setAppName] = useState('NEN2')
  const [input, setInput] = useState('')
  const [category, setCategory] = useState<string>('UI')
  const [step, setStep] = useState<'input' | 'validating' | 'validated' | 'generating' | 'done' | 'error'>('input')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [spec, setSpec] = useState<GeneratedSpec | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleValidate = async () => {
    if (!input.trim()) return
    setStep('validating')
    setValidation(null)
    try {
      const res = await fetch('/api/d/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      const data: ValidationResult = await res.json()
      setValidation(data)
      if (data.result === 'PASS') {
        setStep('validated')
      } else {
        setStep('input')
      }
    } catch {
      setErrorMsg('審査中にエラーが発生しました')
      setStep('error')
    }
  }

  const handleGenerate = async () => {
    setStep('generating')
    try {
      const res = await fetch('/api/d/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim(), appName, category }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '生成に失敗しました')
      }
      const data = await res.json()
      setSpec(data.spec)
      setStep('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '生成エラー')
      setStep('error')
    }
  }

  const reset = () => {
    setStep('input')
    setInput('')
    setValidation(null)
    setSpec(null)
    setErrorMsg('')
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>改善要望を送信</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
        NEN2をもっと良くするアイデアを教えてください。AIが構造化されたデザイン仕様書に変換します。
      </p>

      {step === 'done' && spec ? (
        <div>
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
          }}>
            <CheckCircle size={20} style={{ color: '#059669' }} />
            <span style={{ color: '#065f46', fontWeight: 600 }}>仕様書が生成されました！</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                background: spec.priority === '高' ? '#fef2f2' : spec.priority === '中' ? '#fffbeb' : '#f0fdf4',
                color: spec.priority === '高' ? '#dc2626' : spec.priority === '中' ? '#d97706' : '#16a34a',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {spec.priority}
              </span>
              <span style={{
                background: '#f0f4ff',
                color: '#3b5998',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
              }}>
                {spec.category}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{spec.title}</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{spec.summary}</p>

            {spec.spec_json && (
              <div style={{ fontSize: '14px', lineHeight: 1.8 }}>
                {spec.spec_json.background && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>背景</h3>
                    <p style={{ color: '#444' }}>{spec.spec_json.background}</p>
                  </div>
                )}
                {spec.spec_json.goal && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>ゴール</h3>
                    <p style={{ color: '#444' }}>{spec.spec_json.goal}</p>
                  </div>
                )}
                {spec.spec_json.requirements?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>要件</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {spec.spec_json.requirements.map((r: string, i: number) => (
                        <li key={i} style={{ color: '#444' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.spec_json.ui_changes?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>UI変更</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {spec.spec_json.ui_changes.map((r: string, i: number) => (
                        <li key={i} style={{ color: '#444' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.spec_json.acceptance_criteria?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>受け入れ基準</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {spec.spec_json.acceptance_criteria.map((r: string, i: number) => (
                        <li key={i} style={{ color: '#444' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.spec_json.notes && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>補足</h3>
                    <p style={{ color: '#444' }}>{spec.spec_json.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button onClick={reset} style={{
              padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db',
              background: '#fff', cursor: 'pointer', fontSize: '14px',
            }}>
              別の要望を送信
            </button>
            <a href="/d/board" style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: '#2563eb', color: '#fff', textDecoration: 'none', fontSize: '14px',
            }}>
              ボードを見る
            </a>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
          {/* App Name */}
          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              アプリ名（任意）
            </span>
            <input
              type="text"
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="NEN2"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box',
              }}
            />
          </label>

          {/* Category */}
          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              カテゴリ
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', fontSize: '13px',
                    border: category === c ? '2px solid #2563eb' : '1px solid #d1d5db',
                    background: category === c ? '#eff6ff' : '#fff',
                    color: category === c ? '#2563eb' : '#555',
                    fontWeight: category === c ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </label>

          {/* Input */}
          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              改善要望 <span style={{ color: '#dc2626' }}>*</span>
            </span>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="例: ダッシュボードのサイドバーにダークモード切り替えボタンがほしい。現在は設定画面に行かないと変更できないため、頻繁に使う機能として常に見える場所にあると便利。"
              rows={5}
              maxLength={1000}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '12px', color: '#999' }}>{input.length}/1000</span>
          </label>

          {/* Validation feedback */}
          {validation && validation.result === 'REJECT' && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <XCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
              <span style={{ color: '#991b1b', fontSize: '14px' }}>{validation.reason}</span>
            </div>
          )}
          {validation && validation.result === 'CLARIFY' && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: '#92400e', fontSize: '14px' }}>{validation.reason}</span>
                {validation.suggestion && (
                  <p style={{ color: '#92400e', fontSize: '13px', margin: '4px 0 0' }}>{validation.suggestion}</p>
                )}
              </div>
            </div>
          )}

          {step === 'error' && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '16px',
            }}>
              <span style={{ color: '#991b1b', fontSize: '14px' }}>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          {step === 'validated' ? (
            <button
              onClick={handleGenerate}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: '#059669', color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CheckCircle size={16} />
              審査OK — 仕様書を生成
            </button>
          ) : (
            <button
              onClick={handleValidate}
              disabled={step === 'validating' || step === 'generating' || input.trim().length < 10}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: input.trim().length < 10 ? '#d1d5db' : '#2563eb',
                color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: input.trim().length < 10 ? 'not-allowed' : 'pointer',
                opacity: step === 'validating' || step === 'generating' ? 0.7 : 1,
              }}
            >
              {step === 'validating' ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> AI審査中...</>
              ) : step === 'generating' ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 仕様書を生成中...</>
              ) : (
                <><Send size={16} /> 仕様書を生成</>
              )}
            </button>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
