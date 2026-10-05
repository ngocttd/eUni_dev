'use client'
import { useState } from "react";
import { PageShell, Panel, NewsMini, SupportCard, TileGrid } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { ALUMNI_NAV, alumniConnect, alumniContribute } from "../shared.jsx";
export function AlumniPage() {
  const [q, setQ] = useState('');
  return <PageShell eyebrow="Cựu sinh viên" title="Cộng đồng Cựu sinh viên HUMG" lead="Mạng lưới kết nối cựu sinh viên Trường Đại học Mỏ - Địa chất trên toàn quốc và quốc tế: cập nhật thông tin, tham gia sự kiện, hỗ trợ nghề nghiệp và đồng hành cùng sự phát triển của Nhà trường." crumbs={[{
    label: 'Cựu sinh viên'
  }]} sectionNav={ALUMNI_NAV} variant="student" sidebar={<>
          <Panel title="Sự kiện" icon="calendar" action={<Link to="/su-kien" className="humg-link-more">Tất cả <Icon name="arrow-right" size={13} /></Link>}>
            <NewsMini items={[{
        date: '10/11/2026',
        title: 'Gặp mặt cựu sinh viên kỷ niệm 60 năm thành lập Trường',
        to: '/su-kien'
      }, {
        date: 'Hằng quý',
        title: 'Talkshow nghề nghiệp do cựu sinh viên chia sẻ',
        to: '/su-kien'
      }]} />
          </Panel>
          <SupportCard title="Ban Liên lạc Cựu sinh viên" lead="Thường trực tại Phòng Công tác chính trị – Sinh viên." phone="024.3838.3830" email="cuusinhvien@humg.edu.vn" cta={{
      label: 'Liên hệ',
      to: '/lien-he'
    }} />
        </>}>
      <Panel title="Kết nối & tham gia" icon="users"><TileGrid items={alumniConnect} cols={2} /></Panel>

      <Panel title="Đóng góp cho Trường" icon="heart">
        <div className="aud-contrib">
          {alumniContribute.map(c => <div key={c.title} className="aud-contrib__item">
              <span className="aud-contrib__ic"><Icon name={c.icon} size={18} /></span>
              <strong>{c.title}</strong>
              <span>{c.desc}</span>
            </div>)}
        </div>
      </Panel>

      <Panel title="Cập nhật thông tin cựu sinh viên" icon="user">
        <form className="aud-form" onSubmit={e => e.preventDefault()}>
          <label>Họ và tên<input type="text" placeholder="Nguyễn Văn A" /></label>
          <label>Khoa / Khóa<input type="text" placeholder="Khoa CNTT · K58 (2013)" /></label>
          <label>Email<input type="email" value={q} onChange={e => setQ(e.target.value)} placeholder="email@company.com" /></label>
          <label>Đơn vị công tác<input type="text" placeholder="Công ty / Tổ chức" /></label>
          <button type="submit" className="humg-btn humg-btn--primary">Gửi thông tin</button>
        </form>
      </Panel>
    </PageShell>;
}
