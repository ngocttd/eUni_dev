'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { HeroSearch, LinkList, Panel, StatRow, DataTable, NewsMini } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function EducationHubPage() {
  const { eduHub, academicCalendar, programs } = useModuleData('education');
  return shell({
    title: 'Học tập tại HUMG',
    lead: 'Nền tảng cung cấp thông tin toàn diện về đào tạo, học phí, học bổng, quy chế và các dịch vụ hỗ trợ người học.',
    crumbs: [{
      label: 'Học tập'
    }],
    hero: <HeroSearch placeholder="Tìm thông tin học tập, quy chế, biểu mẫu…" />,
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={eduHub.quickLinks.map(q => ({
        label: q.title,
        to: q.to
      }))} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Đào tạo trong những con số" icon="award"><StatRow items={eduHub.stats} /></Panel>

        <Panel title="Mốc thời gian học kỳ" icon="calendar" action={<Link to="/hoc-tap/lich-hoc" className="humg-link-more">Kế hoạch đầy đủ <Icon name="arrow-right" size={14} /></Link>}>
          <p className="edu-muted" style={{
          marginTop: 0
        }}>{academicCalendar.year}</p>
          <DataTable columns={academicCalendar.plan.columns} rows={academicCalendar.plan.rows.slice(0, 5)} />
        </Panel>

        <Panel title="Chương trình đào tạo nổi bật" icon="book" action={<Link to="/hoc-tap/chuong-trinh-dao-tao" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={14} /></Link>}>
          <div className="edu-featgrid">
            {programs.slice(0, 6).map(p => <Link key={p.id} to={`/hoc-tap/chuong-trinh-dao-tao/${p.id}`} className="edu-feat">
                <span className="edu-feat__ic"><Icon name="graduation" size={16} /></span>
                <strong>{p.name}</strong>
                <span>{p.faculty} · {p.degree}</span>
              </Link>)}
          </div>
        </Panel>

        <Panel title="Thông báo học vụ" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={14} /></Link>}>
          <NewsMini items={eduHub.notices.map(n => ({
          ...n,
          to: '/tin-tuc'
        }))} />
        </Panel>
      </>
  });
}
