'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";
import { HeroSearch, LinkList, Panel, StatRow, NewsMini } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, StatusTag, mono, shell } from "../shared.jsx";
export function CoopHubPage() {
  const { coopHub, coopFields, partners, coopPrograms } = useModuleData('cooperation');
  const {
    t
  } = useLanguage();
  return shell({
    title: 'Hợp tác & Hội nhập',
    lead: 'Thông tin về đối tác, chương trình liên kết, trao đổi và các cơ hội hợp tác trong nước và quốc tế của HUMG.',
    crumbs: [{
      label: 'Hợp tác'
    }],
    hero: <HeroSearch placeholder="Tìm đối tác, chương trình hợp tác…" />,
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={coopHub.quickLinks} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Hợp tác trong những con số" icon="award"><StatRow items={coopHub.stats} /></Panel>

        <Panel title="Lĩnh vực hợp tác chủ yếu" icon="target">
          <div className="coop-chiprow">{coopFields.map(f => <span key={f}>{f}</span>)}</div>
        </Panel>

        <Panel title="Đối tác nổi bật" icon="handshake" action={<Link to="/hop-tac/doi-tac" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <div className="coop-logogrid">
            {partners.slice(0, 8).map(p => <Link key={p.id} to={`/hop-tac/doi-tac/${p.id}`} className="coop-logo">
                <span className="coop-logo__mono">{mono(p.name)}</span>
                <span className="coop-logo__name">{p.name}</span>
                <span className="coop-logo__country"><Icon name={p.type === 'Quốc tế' ? 'globe' : 'map-pin'} size={11} /> {p.country}</span>
                <span className="coop-logo__go">{t('Xem chi tiết')} <Icon name="arrow-right" size={12} /></span>
              </Link>)}
          </div>
        </Panel>

        <Panel title="Chương trình / dự án tiêu biểu" icon="layers" action={<Link to="/hop-tac/chuong-trinh-du-an" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <div className="coop-list">
            {coopPrograms.slice(0, 4).map(cp => <Link key={cp.id} to={`/hop-tac/chuong-trinh-du-an/${cp.id}`} className="coop-item">
                <span className="coop-item__body">
                  <strong>{cp.title}</strong>
                  <em>Đối tác: {cp.partner} · {cp.startYear}–{cp.endYear}</em>
                </span>
                <StatusTag status={cp.status} />
                <Icon name="arrow-right" size={15} />
              </Link>)}
          </div>
        </Panel>

        <Panel title={`${t('Hoạt động hợp tác nổi bật năm')} ${coopHub.yearActivity.year}`} icon="globe">
          <div className="coop-yearstat">
            {coopHub.yearActivity.items.map(it => <div key={it.label} className="coop-ys">
                <strong>{it.value}</strong>
                <span>{t(it.label)}</span>
              </div>)}
          </div>
        </Panel>

        <Panel title="Tin tức & thông báo hợp tác" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <NewsMini items={coopHub.notices.map(n => ({
          ...n,
          to: '/tin-tuc'
        }))} />
        </Panel>
      </>
  });
}
