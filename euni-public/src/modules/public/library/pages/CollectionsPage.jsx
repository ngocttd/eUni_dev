'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { LinkList, Panel } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function CollectionsPage() {
  const { libraryHub, collections } = useModuleData('library');
  return shell({
    title: 'Bộ sưu tập',
    lead: 'Các nhóm tài liệu được tổ chức theo chủ đề, loại hình và mục đích sử dụng để bạn khám phá nhanh hơn.',
    crumbs: [{
      label: 'Thư viện',
      to: '/thu-vien'
    }, {
      label: 'Bộ sưu tập'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={libraryHub.quickLinks} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Tất cả bộ sưu tập" icon="layers">
          <div className="lib-collections lib-collections--lg">
            {collections.map(c => <Link key={c.id} to="/thu-vien/tim-kiem" className="lib-collection lib-collection--lg">
                <span className="lib-collection__ic"><Icon name={c.icon} size={22} /></span>
                <strong>{c.name}</strong>
                <span className="lib-collection__count">{c.count}</span>
                <span className="lib-collection__desc">{c.desc}</span>
              </Link>)}
          </div>
        </Panel>
        <Panel title="Chủ đề nổi bật" icon="target">
          <div className="lib-topics">
            {['Địa chất', 'Khai thác mỏ', 'Dầu khí', 'Trắc địa – Bản đồ', 'Môi trường', 'Cơ điện mỏ', 'Xây dựng công trình ngầm', 'Công nghệ thông tin', 'Kinh tế – Quản trị', 'Vật liệu'].map(t => <Link key={t} to="/thu-vien/tim-kiem" className="lib-topic">{t}</Link>)}
          </div>
        </Panel>
      </>
  });
}
