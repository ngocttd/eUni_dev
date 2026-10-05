'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";
import { useState } from "react";

import { HeroSearch, LinkList, Panel, Chips, StatRow, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Link } from '../../../../lib/router.jsx';
import { SUPPORT, shell } from "../shared.jsx";
export function LibraryHubPage() {
  const { libraryHub, collections } = useModuleData('library');
  const {
    t
  } = useLanguage();
  const [tab, setTab] = useState('Tất cả');
  return shell({
    title: 'Thư viện HUMG',
    lead: libraryHub.intro,
    crumbs: [{
      label: 'Thư viện'
    }],
    hero: <HeroSearch placeholder="Tìm tài liệu, sách, tạp chí, luận văn…" />,
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={libraryHub.quickLinks} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Tra cứu nhanh" icon="search">
          <Chips options={libraryHub.tabs.map(t => ({
          key: t,
          label: t
        }))} value={tab} onChange={setTab} />
          <form className="lib-quicksearch" onSubmit={e => e.preventDefault()}>
            <Icon name="search" size={16} />
            <input type="search" placeholder={`Nhập từ khóa, tên tài liệu, tác giả, chủ đề… (${tab})`} />
            <Link to="/thu-vien/tim-kiem" className="humg-btn humg-btn--primary">{t('Tìm nâng cao')}</Link>
          </form>
        </Panel>

        <Panel title="Thư viện trong những con số" icon="award"><StatRow items={libraryHub.stats} /></Panel>

        <Panel title="Bộ sưu tập nổi bật" icon="layers" action={<Link to="/thu-vien/bo-suu-tap" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <div className="lib-collections">
            {collections.slice(0, 6).map(c => <Link key={c.id} to="/thu-vien/bo-suu-tap" className="lib-collection">
                <span className="lib-collection__ic"><Icon name={c.icon} size={20} /></span>
                <strong>{c.name}</strong>
                <span className="lib-collection__count">{c.count}</span>
              </Link>)}
          </div>
        </Panel>

        <Panel title="Thông báo Thư viện" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <NewsMini items={libraryHub.notices.map(n => ({
          ...n,
          to: '/tin-tuc'
        }))} />
        </Panel>
      </>
  });
}
