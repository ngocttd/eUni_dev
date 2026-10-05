'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, TileGrid } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function OrgChartPage() {
  const { orgChart } = useModuleData('about');
  return shell({
    title: 'Cơ cấu tổ chức',
    lead: 'Sơ đồ tổ chức của Trường Đại học Mỏ - Địa chất.',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Cơ cấu tổ chức'
    }],
    children: <>
        <Panel title="Sơ đồ tổ chức" icon="layers">
          <div className="orgchart">
            <div className="orgchart__row orgchart__row--1">
              <div className="orgchart__box is-top">{orgChart.board}</div>
            </div>
            <div className="orgchart__row orgchart__row--2">
              {orgChart.branches.map((b, i) => <Link key={b} to={['/gioi-thieu/khoa', '/gioi-thieu/phong-ban', '/gioi-thieu/trung-tam-vien', '/gioi-thieu/don-vi-truc-thuoc'][i]} className="orgchart__box is-leaf">
                  <span className="orgchart__leaf-ic">
                    <Icon name={['graduation', 'file', 'flask', 'building'][i]} size={18} />
                  </span>
                  {b}
                </Link>)}
            </div>
          </div>
          <p className="orgchart__note"><Icon name="users" size={13} /> {orgChart.support}</p>
          <p className="orgchart__motto"><Icon name="check" size={14} /> {orgChart.motto}</p>
        </Panel>
        <Panel title="Các khối đơn vị" icon="grid">
          <TileGrid cols={2} items={[{
          icon: 'award',
          title: 'Ban Giám hiệu',
          desc: 'Hiệu trưởng và các Phó Hiệu trưởng.',
          to: '/gioi-thieu/ban-giam-hieu'
        }, {
          icon: 'graduation',
          title: 'Khoa / Viện đào tạo',
          desc: '12 khoa và viện đào tạo theo lĩnh vực.',
          to: '/gioi-thieu/khoa'
        }, {
          icon: 'file',
          title: 'Phòng / Ban chức năng',
          desc: 'Tham mưu, giúp việc cho Ban Giám hiệu.',
          to: '/gioi-thieu/phong-ban'
        }, {
          icon: 'flask',
          title: 'Trung tâm / Viện nghiên cứu',
          desc: 'Nghiên cứu, dịch vụ khoa học công nghệ.',
          to: '/gioi-thieu/trung-tam-vien'
        }, {
          icon: 'building',
          title: 'Đơn vị trực thuộc',
          desc: 'Các đơn vị sự nghiệp, dịch vụ.',
          to: '/gioi-thieu/don-vi-truc-thuoc'
        }, {
          icon: 'users',
          title: 'Đội ngũ cán bộ, giảng viên',
          desc: 'Quy mô đội ngũ và cách tra cứu thông tin giảng viên.',
          to: '/gioi-thieu/giang-vien'
        }, {
          icon: 'award',
          title: 'Danh sách chuyên gia',
          desc: 'Hồ sơ nhà khoa học, hướng nghiên cứu, công bố.',
          to: '/nghien-cuu/chuyen-gia'
        }]} />
        </Panel>
      </>
  });
}
