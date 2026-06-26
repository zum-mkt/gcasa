import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Image as ImageIcon, Youtube as YoutubeIcon, Minus, Quote,
  Heading2, Heading3, Undo, Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value?: Record<string, unknown>
  onChange: (json: Record<string, unknown>, html: string) => void
  placeholder?: string
  label?: string
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
      title={title}
      onClick={onClick}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded transition-colors',
        active ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      )}
    >
      {children}
    </button>
  )
}

const YoutubeIcon2 = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
  </svg>
)

export function RichTextEditor({ value, onChange, placeholder = 'Escreva o conteúdo aqui...', label }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full' } }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Youtube.configure({ width: 640, height: 360 }),
      CharacterCount,
    ],
    content: value ?? {},
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>, editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[280px] px-4 py-4 outline-none focus:outline-none',
      },
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = prompt('URL da imagem:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const addLink = () => {
    const url = prompt('URL do link:')
    if (url) editor.chain().focus().toggleLink({ href: url }).run()
  }

  const addYoutube = () => {
    const url = prompt('URL do vídeo do YouTube:')
    if (url) editor.commands.setYoutubeVideo({ src: url })
  }

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium text-gray-700 mb-1.5">{label}</p>}
      <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
            <Undo size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer">
            <Redo size={13} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título H2">
            <Heading2 size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título H3">
            <Heading3 size={13} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito">
            <Bold size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico">
            <Italic size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
            <Strikethrough size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Código">
            <Code size={13} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
            <List size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
            <ListOrdered size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação">
            <Quote size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divisor">
            <Minus size={13} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinhar esquerda">
            <AlignLeft size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centralizar">
            <AlignCenter size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinhar direita">
            <AlignRight size={13} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Link">
            <LinkIcon size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Imagem">
            <ImageIcon size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={addYoutube} title="Vídeo YouTube">
            <YoutubeIcon2 />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            {editor.storage.characterCount.words()} palavras · {editor.storage.characterCount.characters()} caracteres
          </p>
        </div>
      </div>
    </div>
  )
}
