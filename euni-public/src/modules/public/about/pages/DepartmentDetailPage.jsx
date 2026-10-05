'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { Panel, LinkList, SupportCard, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function DepartmentDetailPage() {
  const { getUnit, units, getDepartment, facultyDepartments } = useModuleData('about');
  const {
    khoaId,
    bmId
  } = useParams();
  const khoa = getUnit('khoa', khoaId) || units.khoa.list[0];
  const dept = getDepartment(khoaId, bmId) || (facultyDepartments[khoaId] || [])[0];
  if (!dept) return shell({
    title: 'Không tìm thấy bộ môn',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }],
    children: <Panel><p>Bộ môn không tồn tại.</p></Panel>
  });
  const lecturers = dept.lecturers || [];
  return shell({
    title: dept.name,
    lead: dept.desc,
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Khoa / Viện đào tạo',
      to: '/gioi-thieu/khoa'
    }, {
      label: khoa.name,
      to: `/gioi-thieu/khoa/${khoaId}`
    }, {
      label: dept.name
    }],
    sidebar: <>
        <LinkList title="Bộ môn khác" items={(facultyDepartments[khoaId] || []).filter(d => d.id !== dept.id).map(d => ({
        label: d.name,
        to: `/gioi-thieu/khoa/${khoaId}/bo-mon/${d.id}`
      }))} />
        <SupportCard title={khoa.name} lead="Liên hệ Văn phòng Khoa để biết thêm thông tin đội ngũ và học phần." cta={{
        label: 'Trang Khoa',
        to: `/gioi-thieu/khoa/${khoaId}`
      }} />
      </>,
    children: <>
        <Panel title="Thông tin bộ môn" icon="grid" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Trưởng bộ môn', dept.head], ['Trực thuộc', khoa.name], ['Quy mô đội ngũ', `${dept.size} giảng viên`]]} />
        </Panel>
        <Panel title="Giới thiệu" icon="building">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{dept.desc}</p>
        </Panel>
        <Panel title="Hướng nghiên cứu trọng tâm" icon="target">
          <div className="about-chiprow">{dept.research.map(r => <span key={r}>{r}</span>)}</div>
        </Panel>

        {lecturers.length > 0 && <Panel title="Đội ngũ giảng viên" icon="users">
            <div className="about-lecs">
              {lecturers.map(lec => <Link key={lec.id} to={`/gioi-thieu/khoa/${khoaId}/bo-mon/${dept.id}/giang-vien/${lec.id}`} className="about-lec">
                  <span className="about-lec__photo humg-ph" data-ratio="1-1"><span>Ảnh</span></span>
                  <span className="about-lec__body">
                    <strong>{lec.name}</strong>
                    <em>{lec.position} · {lec.pubs} công bố</em>
                    <span className="about-lec__tags">{lec.fields.map(f => <span key={f}>{f}</span>)}</span>
                  </span>
                  <Icon name="arrow-right" size={15} />
                </Link>)}
            </div>
            <p className="about-muted" style={{
          marginTop: 12
        }}>
              Danh sách một số giảng viên tiêu biểu của bộ môn. Xem thêm hồ sơ nhà khoa học tại{' '}
              <Link to="/nghien-cuu/chuyen-gia">Danh sách chuyên gia</Link>.
            </p>
          </Panel>}

        <Panel title="Đào tạo & học phần phụ trách" icon="graduation">
          <p className="about-muted" style={{
          marginTop: 0
        }}>
            Bộ môn tham gia giảng dạy các học phần cơ sở ngành và chuyên ngành thuộc {khoa.name}.
            Xem chi tiết chương trình và đề cương học phần tại <Link to="/hoc-tap/chuong-trinh-dao-tao">Chương trình đào tạo</Link>.
          </p>
        </Panel>
      </>
  });
}
