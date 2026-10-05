'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";

import { Panel, LinkList, StatRow, TileGrid } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function LifeHubPage() {
  const { lifeHub } = useModuleData('life');
  const {
    t
  } = useLanguage();
  return shell({
    title: 'Đời sống HUMG',
    lead: lifeHub.intro,
    crumbs: [{
      label: 'Đời sống'
    }],
    sidebar: <>
        <Panel title="Sự kiện sắp diễn ra" icon="calendar" action={<Link to="/su-kien" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <ul className="life-events">
            {lifeHub.feed.slice(0, 4).map(f => {
            const [d, m] = f.date.split('/');
            return <li key={f.title}>
                  <span className="life-events__day"><strong>{d}</strong><em>Th{Number(m)}</em></span>
                  <span className="life-events__body"><strong>{f.title}</strong><em>{f.place}</em></span>
                </li>;
          })}
          </ul>
        </Panel>
        <LinkList title="Tiện ích nhanh" items={[{
        label: 'Đăng ký tham gia hoạt động',
        to: '/doi-song/hoat-dong-sinh-vien'
      }, {
        label: 'Góp ý – Phản hồi',
        to: '/lien-he'
      }, {
        label: 'Hỏi đáp',
        to: '/doi-song/ho-tro-sinh-vien'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <div className="life-banner">
          <span className="life-banner__img humg-ph" data-ratio="16-9"><span>{t('Đời sống sinh viên HUMG')}</span></span>
          <div className="life-banner__overlay">
            <strong>{t('HUMG – Nơi kiến tạo trải nghiệm và gắn kết')}</strong>
            <p>{t('Hơn 200 câu lạc bộ, đội nhóm cùng chuỗi hoạt động thể thao – văn hóa – tình nguyện quanh năm.')}</p>
            <Link to="/su-kien" className="humg-btn humg-btn--light">{t('Xem sự kiện')}</Link>
          </div>
        </div>

        <Panel title="Đời sống trong những con số" icon="award"><StatRow items={lifeHub.stats} /></Panel>

        <Panel title="Điểm nhấn đời sống sinh viên" icon="target"><TileGrid items={lifeHub.features} cols={3} /></Panel>

        <Panel title="Tin nổi bật" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <div className="life-newscards">
            {lifeHub.feed.slice(0, 3).map(f => <Link key={f.title} to="/tin-tuc" className="life-newscard">
                <span className="life-newscard__img humg-ph" data-ratio="16-9"><span>Ảnh</span></span>
                <span className="life-newscard__tag">{f.tag}</span>
                <strong>{f.title}</strong>
                <em>{f.date} · {f.place}</em>
              </Link>)}
          </div>
        </Panel>
      </>
  });
}
