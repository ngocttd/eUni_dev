'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Link } from '../../../../lib/router.jsx';
import { LinkList, SupportCard, Panel, StatRow, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function FacultyStaffPage() {
  const { units, facultyDepartments } = useModuleData('about');
  const khoaRows = units.khoa.list.filter(k => facultyDepartments[k.id]).map(k => {
    const ds = facultyDepartments[k.id];
    return [<Link key="t" to={`/gioi-thieu/khoa/${k.id}`}>{k.name}</Link>, String(ds.length), String(ds.reduce((n, d) => n + d.size, 0)), <Link key="a" to={`/gioi-thieu/khoa/${k.id}`} className="humg-link-more">Xem khoa</Link>];
  });
  return shell({
    title: 'Đội ngũ cán bộ, giảng viên',
    lead: 'Thông tin chung về quy mô, cơ cấu và chính sách phát triển đội ngũ cán bộ, giảng viên của Trường Đại học Mỏ - Địa chất.',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Đội ngũ cán bộ, giảng viên'
    }],
    sidebar: <>
        <LinkList title="Xem thêm" items={[{
        label: 'Ban Giám hiệu',
        to: '/gioi-thieu/ban-giam-hieu'
      }, {
        label: 'Cơ cấu tổ chức',
        to: '/gioi-thieu/co-cau-to-chuc'
      }, {
        label: 'Khoa / Viện đào tạo',
        to: '/gioi-thieu/khoa'
      }, {
        label: 'Danh sách chuyên gia NCKH',
        to: '/nghien-cuu/chuyen-gia'
      }]} />
        <SupportCard title="Phòng Tổ chức – Cán bộ" lead="Thông tin tuyển dụng và chính sách cán bộ." phone="024.3838.3832" email="tccb@humg.edu.vn" cta={{
        label: 'Trang liên hệ',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <Panel title="Đội ngũ trong những con số" icon="award">
          <StatRow items={[{
          value: '600+',
          label: 'Cán bộ, giảng viên'
        }, {
          value: '65%',
          label: 'Trình độ Tiến sĩ trở lên'
        }, {
          value: '90+',
          label: 'GS, PGS'
        }, {
          value: '12',
          label: 'Khoa đào tạo'
        }]} />
        </Panel>

        <Panel title="Tra cứu thông tin giảng viên / chuyên gia" icon="search">
          <p className="about-muted" style={{
          marginTop: 0,
          marginBottom: 12
        }}>
            Bạn có thể tra cứu đội ngũ theo các hướng sau:
          </p>
          <div className="about-fields">
            <Link to="/gioi-thieu/khoa" className="about-fields__item">
              <span className="about-fields__ic"><Icon name="graduation" size={20} /></span>
              Khoa → Bộ môn → Danh sách giảng viên
            </Link>
            <Link to="/nghien-cuu/chuyen-gia" className="about-fields__item">
              <span className="about-fields__ic"><Icon name="award" size={20} /></span>
              Danh sách chuyên gia &amp; hồ sơ khoa học
            </Link>
            <Link to="/giang-vien/danh-ba" className="about-fields__item">
              <span className="about-fields__ic"><Icon name="phone" size={20} /></span>
              Danh bạ đơn vị &amp; số máy nội bộ
            </Link>
          </div>
          <ul className="about-funcs" style={{
          marginTop: 14
        }}>
            <li><Icon name="check" size={14} /> <strong>Theo Khoa – Bộ môn:</strong> mở trang Khoa → tab Bộ môn → mở bộ môn để xem danh sách giảng viên và bấm vào từng người để xem hồ sơ.</li>
            <li><Icon name="check" size={14} /> <strong>Danh sách chuyên gia:</strong> lọc theo khoa, lĩnh vực; xem hướng nghiên cứu, công bố, h-index, email liên hệ.</li>
            <li><Icon name="check" size={14} /> <strong>Danh bạ:</strong> số điện thoại và hộp thư của Văn phòng Khoa, Phòng/Ban để liên hệ trực tiếp.</li>
          </ul>
        </Panel>

        <Panel title="Quy mô đội ngũ theo khoa" icon="building">
          <DataTable columns={['Khoa', 'Số bộ môn', 'Số GV (ước tính)', '']} rows={khoaRows} />
        </Panel>
        <Panel title="Chính sách phát triển đội ngũ" icon="check">
          <ul className="about-funcs">
            {['Hỗ trợ đào tạo tiến sĩ trong nước và nước ngoài, sau tiến sĩ.', 'Thu hút nhà khoa học trình độ cao, chuyên gia đầu ngành.', 'Khen thưởng công bố quốc tế, đề tài và sản phẩm khoa học tiêu biểu.'].map(t => <li key={t}><Icon name="check" size={14} /> {t}</li>)}
          </ul>
        </Panel>
      </>
  });
}
