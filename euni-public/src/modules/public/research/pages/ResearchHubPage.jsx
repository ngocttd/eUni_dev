'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";
import { HeroSearch, LinkList, Panel, StatRow, NewsMini } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, StatusTag, shell } from "../shared.jsx";
export function ResearchHubPage() {
  const { resHub, researchFields, projects, publications, conferences } = useModuleData('research');
  const {
    t
  } = useLanguage();
  return shell({
    title: 'Khoa học & Công nghệ',
    lead: 'Cập nhật hoạt động nghiên cứu khoa học, công bố, đề tài – dự án, chuyển giao công nghệ và đổi mới sáng tạo của HUMG.',
    crumbs: [{
      label: 'Nghiên cứu'
    }],
    hero: <HeroSearch placeholder="Tìm đề tài, công bố, chuyên gia…" />,
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={resHub.quickLinks} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Số liệu KH&CN" icon="award"><StatRow items={resHub.stats} /></Panel>

        <Panel title="Lĩnh vực nghiên cứu" icon="target">
          <div className="res-chiprow">{researchFields.map(f => <span key={f}>{f}</span>)}</div>
        </Panel>

        <Panel title="Đề tài / dự án tiêu biểu" icon="flask" action={<Link to="/nghien-cuu/de-tai" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <div className="res-list">
            {projects.slice(0, 3).map(p => <Link key={p.id} to={`/nghien-cuu/de-tai/${p.id}`} className="res-item">
                <span className="res-item__code">{p.code}</span>
                <span className="res-item__body">
                  <strong>{p.title}</strong>
                  <em>{p.leader} · {p.field} · {p.startYear}–{p.endYear}</em>
                </span>
                <StatusTag status={p.status} />
              </Link>)}
          </div>
        </Panel>

        <Panel title="Công bố khoa học nổi bật" icon="newspaper" action={<Link to="/nghien-cuu/cong-bo" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <div className="res-list">
            {publications.slice(0, 3).map(p => <Link key={p.id} to={`/nghien-cuu/cong-bo/${p.id}`} className="res-item">
                <span className="res-item__body">
                  <strong>{p.title}</strong>
                  <em>{p.authors} · {p.journal} · {p.year}</em>
                </span>
                {p.quartile !== '—' && <span className="res-q">{p.quartile}</span>}
              </Link>)}
          </div>
        </Panel>

        <Panel title="Sự kiện KH&CN sắp diễn ra" icon="calendar" action={<Link to="/nghien-cuu/hoi-nghi-hoi-thao" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <div className="res-list">
            {conferences.filter(c => c.status === 'Sắp diễn ra').slice(0, 3).map(c => <Link key={c.slug} to={`/nghien-cuu/hoi-nghi-hoi-thao/${c.slug}`} className="res-item">
                <span className="res-item__body">
                  <strong>{c.name}</strong>
                  <em>{c.date} · {c.place} · {c.scope}</em>
                </span>
                <Icon name="arrow-right" size={15} />
              </Link>)}
          </div>
        </Panel>

        <Panel title="Tin tức & thông báo KH&CN" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <NewsMini items={resHub.notices.map(n => ({
          ...n,
          to: '/tin-tuc'
        }))} />
        </Panel>
      </>
  });
}
