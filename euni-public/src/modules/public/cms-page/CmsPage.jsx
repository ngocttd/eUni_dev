'use client'
import { useEffect, useState } from 'react'
import { PageShell, ArticleBody, MetaBar } from '../../../shared/components/ui/page.jsx'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'
import { loadCmsPage } from '../../../lib/datasets/loaders.js'
import { fmtDate } from '../../../lib/datasets/format.js'
import '../../../shared/site/site.css'

/** Hiển thị trang tĩnh do CMS soạn. Chuyển sang EN thì nạp bản dịch (nếu đã dịch xong, không thì giữ tiếng Việt). */
export default function CmsPage({ initial }) {
  const { lang } = useLanguage()
  const [page, setPage] = useState(initial)
  useEffect(() => {
    let alive = true
    if (lang === (page.language || 'vi')) return undefined
    loadCmsPage(initial.slug, { lang }).then((p) => { if (alive && p) setPage(p) }).catch(() => {})
    return () => { alive = false }
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <PageShell
      title={page.title}
      crumbs={[...(page.parents || []).map((p) => ({ label: p.title, to: p.url })), { label: page.title }]}
      hero={page.updatedAt ? <MetaBar items={[{ icon: 'calendar', text: `Cập nhật ${fmtDate(page.updatedAt)}` }]} /> : null}
    >
      {page.bodyHtml
        ? <ArticleBody blocks={[{ type: 'html', html: page.bodyHtml }]} />
        : <p className="cms-page__updated">Trang này chưa có nội dung.</p>}
    </PageShell>
  )
}
