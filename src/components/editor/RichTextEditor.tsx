'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Undo, Redo,
  Image as ImageIcon, Link as LinkIcon, Sparkles, Wand2,
} from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string, html: string) => void
  onAIGenerate?: () => void
  onAIRewrite?: (text: string) => Promise<string | undefined>
  onAISuggest?: (context: string) => void
}

export default function RichTextEditor({
  content,
  onChange,
  onAIGenerate,
  onAIRewrite,
  onAISuggest,
}: RichTextEditorProps) {
  const [showAIMenu, setShowAIMenu] = useState(false)
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '記事を書き始めましょう... AIに下書きを生成させることもできます',
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800' },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      onChange(editor.getJSON() as unknown as string, editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-8 py-6',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Tab' && onAISuggest) {
          event.preventDefault()
          const text = editor?.getText() || ''
          const lastParagraph = text.split('\n').filter(Boolean).pop() || ''
          onAISuggest(lastParagraph)
          return true
        }
        return false
      },
    },
  })

  // Sync external content changes (e.g. AI streaming) to the editor with debounce
  const pendingContent = useRef<string | null>(null)
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!editor || isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    if (content && content !== editor.getHTML()) {
      pendingContent.current = content
      if (flushTimer.current) clearTimeout(flushTimer.current)
      flushTimer.current = setTimeout(() => {
        if (pendingContent.current && editor) {
          editor.commands.setContent(pendingContent.current)
          pendingContent.current = null
        }
      }, 80)
    }
    return () => { if (flushTimer.current) clearTimeout(flushTimer.current) }
  }, [content, editor])

  const addImage = useCallback(() => {
    const url = prompt('画像URLを入力してください')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = prompt('URLを入力してください')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const handleAIRewrite = useCallback(async () => {
    if (!editor || !onAIRewrite) return
    const { from, to } = editor.state.selection
    if (from === to) {
      alert('リライトしたいテキストをドラッグで選択してからボタンを押してください')
      return
    }
    const selectedText = editor.state.doc.textBetween(from, to)
    if (selectedText) {
      const rewritten = await onAIRewrite(selectedText)
      if (rewritten) {
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, rewritten).run()
      }
    }
    setShowAIMenu(false)
  }, [editor, onAIRewrite])

  if (!editor) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="見出し1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="見出し2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="見出し3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="太字"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="斜体"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="打ち消し線"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="コード"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="箇条書き"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="番号付きリスト"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="引用"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <ToolbarButton onClick={addImage} title="画像挿入">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addLink} title="リンク挿入">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="元に戻す">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="やり直す">
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* AI Buttons */}
        {onAIGenerate && (
          <button
            onClick={onAIGenerate}
            className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI生成
          </button>
        )}
        {onAIRewrite && (
          <button
            onClick={handleAIRewrite}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
          >
            <Wand2 className="h-3.5 w-3.5" />
            AIリライト
          </button>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer hint */}
      <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-400 dark:border-gray-700">
        Tabキーで続きをAIが提案 | テキスト選択でリライトメニュー表示
      </div>
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  )
}
