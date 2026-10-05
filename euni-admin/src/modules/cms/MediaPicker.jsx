'use client'
/** Hộp chọn ảnh từ Media thư viện (có thể tải ảnh mới lên ngay trong hộp thoại). */
import { useRef, useState } from 'react'
import { useModuleData, useReloadDatasets } from '../../lib/datasets/useModuleData.jsx'
import { cmsApi } from '../../lib/api/cmsApi.js'
import { mediaUrl } from '../../lib/api/media.js'
import Icon from '../../shared/lib/Icon.jsx'

export default function MediaPicker({ title = 'Chọn ảnh từ Media thư viện', folder = 'Tin tức', onPick, onClose }) {
  const { cmsMedia } = useModuleData('cms')
  const reload = useReloadDatasets()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const images = cmsMedia.filter((m) => m.kind === 'Hình ảnh')

  const upload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setErr('')
    try {
      const m = await cmsApi.media.upload(file, { folder })
      await reload()
      onPick({ id: m.id, name: m.fileName, url: m.url })
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <div className="cms-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cms-modal__box">
        <div className="cms-modal__head">
          <strong>{title}</strong>
          <span>
            <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" disabled={busy} onClick={() => fileRef.current?.click()}><Icon name="image" size={13} /> {busy ? 'Đang tải…' : 'Tải ảnh mới'}</button>
            <button type="button" className="cms-rowbtn" onClick={onClose} aria-label="Đóng"><Icon name="x" size={13} /> Đóng</button>
          </span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
        </div>
        {err && <p className="cms-empty" role="alert">{err}</p>}
        {!images.length && <p className="cms-empty">Chưa có ảnh nào trong thư viện — bấm "Tải ảnh mới".</p>}
        <div className="cms-modal__grid">
          {images.map((m) => (
            <button key={m.id} type="button" className="cms-modal__item" onClick={() => onPick({ id: m.id, name: m.name, url: m.url })} title={m.name}>
              <span className="cms-modal__thumb">
                <img src={mediaUrl(m.url)} alt={m.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <Icon name="image" size={22} />
              </span>
              <em>{m.name}</em>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
