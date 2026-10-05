'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";
import { Panel, StatRow, LinkList, SupportCard } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function OverviewPage() {
  const { overview } = useModuleData('about');
  const {
    t
  } = useLanguage();
  return shell({
    title: 'Tổng quan về HUMG',
    lead: 'Trường Đại học Mỏ - Địa chất – 60 năm tri thức, bản lĩnh, sáng tạo và hội nhập.',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Tổng quan'
    }],
    children: <>
        <Panel title="Giới thiệu chung" icon="building">
          {overview.intro.map((t, i) => <p key={i} style={{
          margin: i ? '12px 0 0' : 0,
          fontSize: 14.5,
          lineHeight: 1.75
        }}>{t}</p>)}
        </Panel>
        <Panel title="HUMG trong những con số" icon="award" action={<Link to="/gioi-thieu/con-so" className="humg-link-more">{t('Xem đầy đủ')} <Icon name="arrow-right" size={14} /></Link>}>
          <StatRow items={overview.stats} />
        </Panel>
        <Panel><StatRow items={overview.more} /></Panel>
        <Panel title="Giá trị theo đuổi" icon="target">
          <div className="about-chips">
            {overview.values.map(v => <span key={v}>{v}</span>)}
          </div>
        </Panel>
      </>,
    sidebar: <>
        <LinkList title="Có thể bạn quan tâm" items={[{
        label: 'Thông điệp Hiệu trưởng',
        to: '/gioi-thieu/thong-diep-hieu-truong'
      }, {
        label: 'Lịch sử phát triển',
        to: '/gioi-thieu/lich-su'
      }, {
        label: 'HUMG qua các con số',
        to: '/gioi-thieu/con-so'
      }, {
        label: 'Cơ cấu tổ chức',
        to: '/gioi-thieu/co-cau-to-chuc'
      }]} />
        <SupportCard title="Liên hệ Nhà trường" lead="Phòng Hành chính – Tổng hợp" phone="024.3838.3806" email="humg@humg.edu.vn" cta={{
        label: 'Trang liên hệ',
        to: '/lien-he'
      }} />
      </>
  });
}
