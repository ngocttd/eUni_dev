'use client'
import { Link, useLocation, useParams } from '../lib/router.jsx'
import Breadcrumb from '../shared/components/common/Breadcrumb.jsx'
import Icon from '../shared/lib/Icon.jsx'
import { mainNav } from '../routes/sitemap.js'
import './PlaceholderPage.css'

/**
 * Trang khung dùng chung cho mọi màn hình chưa dựng chi tiết.
 * Hiển thị: breadcrumb, tiêu đề, mã wireframe tương ứng và các trang
 * cùng nhóm trong sitemap để việc điều hướng vẫn liền mạch.
 */
export default function PlaceholderPage({ title, wireframe }) {
  const { pathname } = useLocation()
  const params = useParams()

  // Tìm section cha để render danh sách "trang liên quan"
  const section = mainNav.find(
    (s) => s.children && (pathname === s.path || pathname.startsWith(s.path + '/')),
  )

  return (
    <>
      <Breadcrumb
        items={[
          section && section.path !== '/' ? { label: section.label, to: section.path } : null,
          { label: title },
        ].filter(Boolean)}
      />

      <section className="humg-section">
        <div className="humg-container-wide ph-page">
          <div className="ph-page__main">
            <span className="humg-eyebrow"><Icon name="layers" size={14} /> {section ? section.label : 'HUMG Portal'}</span>
            <h1>{title}</h1>
            {Object.keys(params).length > 0 && (
              <p className="ph-page__params">
                Tham số: {Object.entries(params).map(([k, v]) => `${k} = ${v}`).join(' · ')}
              </p>
            )}
            <p className="ph-page__lead">
              Màn hình này đã được khai báo trong cấu trúc website theo sitemap và sẽ được dựng
              chi tiết ở bước tiếp theo.
              {wireframe && <> Wireframe tham chiếu: <code>{wireframe}</code>.</>}
            </p>

            <div className="ph-page__skeleton" aria-hidden="true">
              <div className="ph-page__sk-row">
                <span /><span /><span />
              </div>
              <div className="ph-page__sk-block" />
              <div className="ph-page__sk-lines">
                <span /><span /><span /><span />
              </div>
            </div>

            <Link to="/" className="humg-btn humg-btn--ghost">
              <Icon name="arrow-left" size={16} /> Về trang chủ
            </Link>
          </div>

          {section && (
            <aside className="ph-page__aside humg-card">
              <h2>{section.label}</h2>
              <ul>
                {section.children.map((c) => (
                  <li key={c.path + c.label} className={pathname === c.path ? 'is-current' : ''}>
                    <Link to={c.path}>
                      <Icon name="chevron-right" size={13} />
                      <span>{c.label}</span>
                      {c.wireframe && <em>{c.wireframe}</em>}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>
    </>
  )
}
