'use client'
/**
 * Trình soạn thảo WYSIWYG cho bài viết (TipTap, giấy phép MIT — miễn phí, dùng thương mại được).
 * value / onChange làm việc với HTML. Ảnh chèn qua onUploadImage(file) → URL (tải lên Media thư viện).
 */
import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button type="button" className={`rte__btn${active ? ' is-active' : ''}`} onMouseDown={e => e.preventDefault()} onClick={onClick} disabled={disabled} title={title} aria-label={title} aria-pressed={active ? 'true' : undefined}>
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, placeholder, onUploadImage }) {
  const fileRef = useRef(null)
  const lastEmitted = useRef(value || '') // HTML mới nhất do chính trình soạn phát ra (tránh ghi đè khi gõ nhanh)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const editor = useEditor({
    immediatelyRender: false, // tránh lệch hydrate khi render phía server
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: placeholder || 'Nhập nội dung bài viết…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
    ],
    content: value || '',
    editorProps: { attributes: { class: 'rte__content ui-article', 'aria-label': 'Nội dung bài viết' } },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : ed.getHTML()
      lastEmitted.current = html
      onChange?.(html)
    },
  })

  // chỉ nạp lại khi giá trị đổi TỪ BÊN NGOÀI (đổi ngôn ngữ, nạp bài khác), không phải do chính người dùng đang gõ
  useEffect(() => {
    if (!editor || value === undefined) return
    if ((value || '') === lastEmitted.current) return
    lastEmitted.current = value || ''
    editor.commands.setContent(value || '', false)
  }, [value, editor])

  if (!editor) return <div className="rte rte--loading">Đang tải trình soạn thảo…</div>
  const c = () => editor.chain().focus()

  const setLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('Địa chỉ liên kết (để trống để gỡ liên kết):', prev)
    if (url === null) return
    if (url.trim() === '') c().extendMarkRange('link').unsetLink().run()
    else c().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }
  const addImageUrl = () => {
    const url = window.prompt('Địa chỉ (URL) ảnh:')
    if (url && url.trim()) c().setImage({ src: url.trim() }).run()
  }
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setErr('')
    try {
      const url = await onUploadImage(file)
      if (url) c().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, '') }).run()
    } catch (x) { setErr(x.message || 'Không tải được ảnh.') } finally { setBusy(false) }
  }

  return (
    <div className="rte">
      <div className="rte__toolbar" role="toolbar" aria-label="Định dạng văn bản">
        <Btn title="Hoàn tác" onClick={() => c().undo().run()} disabled={!editor.can().undo()}>↶</Btn>
        <Btn title="Làm lại" onClick={() => c().redo().run()} disabled={!editor.can().redo()}>↷</Btn>
        <span className="rte__sep" />
        <Btn title="Đoạn văn" active={editor.isActive('paragraph')} onClick={() => c().setParagraph().run()}>¶</Btn>
        <Btn title="Tiêu đề 2" active={editor.isActive('heading', { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>H2</Btn>
        <Btn title="Tiêu đề 3" active={editor.isActive('heading', { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}>H3</Btn>
        <span className="rte__sep" />
        <Btn title="In đậm" active={editor.isActive('bold')} onClick={() => c().toggleBold().run()}><b>B</b></Btn>
        <Btn title="In nghiêng" active={editor.isActive('italic')} onClick={() => c().toggleItalic().run()}><i>I</i></Btn>
        <Btn title="Gạch chân" active={editor.isActive('underline')} onClick={() => c().toggleUnderline().run()}><u>U</u></Btn>
        <Btn title="Gạch ngang" active={editor.isActive('strike')} onClick={() => c().toggleStrike().run()}><s>S</s></Btn>
        <span className="rte__sep" />
        <Btn title="Danh sách chấm" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}>• ≡</Btn>
        <Btn title="Danh sách số" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}>1. ≡</Btn>
        <Btn title="Trích dẫn" active={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()}>“ ”</Btn>
        <span className="rte__sep" />
        <Btn title="Căn trái" active={editor.isActive({ textAlign: 'left' })} onClick={() => c().setTextAlign('left').run()}>⇤</Btn>
        <Btn title="Căn giữa" active={editor.isActive({ textAlign: 'center' })} onClick={() => c().setTextAlign('center').run()}>↔</Btn>
        <span className="rte__sep" />
        <Btn title="Chèn / sửa liên kết" active={editor.isActive('link')} onClick={setLink}>🔗</Btn>
        <Btn title="Tải ảnh lên và chèn" disabled={busy || !onUploadImage} onClick={() => fileRef.current?.click()}>{busy ? '…' : '🖼'}</Btn>
        <Btn title="Chèn ảnh theo URL" onClick={addImageUrl}>URL</Btn>
        <Btn title="Chèn bảng 3×3" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⌗</Btn>
        {editor.isActive('table') && <>
          <Btn title="Thêm hàng" onClick={() => c().addRowAfter().run()}>+Hàng</Btn>
          <Btn title="Thêm cột" onClick={() => c().addColumnAfter().run()}>+Cột</Btn>
          <Btn title="Xóa hàng" onClick={() => c().deleteRow().run()}>−Hàng</Btn>
          <Btn title="Xóa cột" onClick={() => c().deleteColumn().run()}>−Cột</Btn>
          <Btn title="Xóa bảng" onClick={() => c().deleteTable().run()}>✕ Bảng</Btn>
        </>}
        <span className="rte__sep" />
        <Btn title="Xóa định dạng" onClick={() => c().unsetAllMarks().clearNodes().run()}>Tx</Btn>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>
      {err && <p className="rte__err" role="alert">{err}</p>}
      <EditorContent editor={editor} />
    </div>
  )
}
