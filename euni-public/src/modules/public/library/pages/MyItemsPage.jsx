'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable, Chips } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, TYPE_ICON, shell } from "../shared.jsx";
export function MyItemsPage() {
  const { myItems } = useModuleData('library');
  const [tab, setTab] = useState('Đang mượn');
  const counts = {
    'Đang mượn': myItems.borrowing.length,
    'Đặt mượn': myItems.reserved.length,
    'Ưa thích': myItems.favorites.length,
    'Lịch sử tìm kiếm': myItems.history.length
  };
  return shell({
    title: 'Tài liệu của tôi',
    lead: 'Quản lý tài liệu đang mượn, đặt mượn, danh sách ưa thích và lịch sử tra cứu của bạn.',
    crumbs: [{
      label: 'Thư viện',
      to: '/thu-vien'
    }, {
      label: 'Tài liệu của tôi'
    }],
    sidebar: <>
        <Panel title="Tài khoản thư viện" icon="user" flush>
          <DataTable columns={['Mục', 'Thông tin']} rows={[['Chủ thẻ', 'Nguyễn Văn An'], ['Mã thẻ', 'TV-325.3/NG-A'], ['Loại bạn đọc', 'Sinh viên'], ['Quyền mượn', '05 tài liệu / lần'], ['Trạng thái', 'Đang hoạt động']]} />
        </Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Danh mục của tôi" icon="user">
          <Chips options={myItems.tabs.map(t => ({
          key: t,
          label: t,
          count: counts[t]
        }))} value={tab} onChange={setTab} />

          {tab === 'Đang mượn' && <DataTable columns={['Tên tài liệu', 'Loại', 'Ngày mượn', 'Hạn trả', 'Trạng thái', 'Thao tác']} rows={myItems.borrowing.map(b => [<Link key="t" to={`/thu-vien/tai-lieu/${b.id}`}>{b.name}</Link>, b.type, b.borrowed, b.due, <span key="s" className={`lib-tag ${b.state === 'warn' ? 'is-warn' : 'is-ok'}`}>{b.status}</span>, <button key="a" type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Gia hạn</button>])} />}

          {tab === 'Đặt mượn' && <DataTable columns={['Tên tài liệu', 'Loại', 'Ngày đặt', 'Trạng thái', 'Thao tác']} rows={myItems.reserved.map(r => [<Link key="t" to={`/thu-vien/tai-lieu/${r.id}`}>{r.name}</Link>, r.type, r.reservedOn, <span key="s" className="lib-tag is-wait">{r.status}</span>, <button key="a" type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Hủy đặt</button>])} />}

          {tab === 'Ưa thích' && <ul className="lib-favlist">
              {myItems.favorites.map(f => <li key={f.id}>
                  <span className="lib-fav__ic"><Icon name={TYPE_ICON[f.type] || 'file'} size={15} /></span>
                  <Link to={`/thu-vien/tai-lieu/${f.id}`}>{f.name}</Link>
                  <em>{f.type} · {f.year}</em>
                  <button type="button" className="lib-fav__x" aria-label="Bỏ ưa thích"><Icon name="x" size={14} /></button>
                </li>)}
            </ul>}

          {tab === 'Lịch sử tìm kiếm' && <DataTable columns={['Từ khóa', 'Thời điểm', 'Số kết quả', 'Thao tác']} rows={myItems.history.map(h => [h.q, h.when, h.results.toLocaleString('vi-VN'), <Link key="a" to="/thu-vien/tim-kiem" className="humg-link-more">Tìm lại</Link>])} />}
        </Panel>

        <Panel title="Lưu ý" icon="shield">
          <ul className="lib-check">
            {myItems.note.map((n, i) => <li key={i}><Icon name="check" size={14} /> {n}</li>)}
          </ul>
        </Panel>
      </>
  });
}
