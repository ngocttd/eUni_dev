'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { useState } from "react";
import { LinkList, Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function UnitDetailPage({
  kind
}) {
  const { units, getUnit, facultyDepartments } = useModuleData('about');
  const {
    id
  } = useParams();
  const cfg = units[kind];
  const u = getUnit(kind, id) || cfg.list[0];
  const isKhoa = kind === 'khoa';
  const depts = isKhoa ? facultyDepartments[u.id] : null;
  const staffList = Array.isArray(u.staff) ? u.staff : null;
  const facts = [u.head && ['Trưởng đơn vị', u.head], u.founded && ['Năm thành lập', String(u.founded)], u.phone && ['Điện thoại', u.phone], u.email && ['Email', u.email]].filter(Boolean);
  const statItems = [typeof u.staff === 'number' && {
    value: String(u.staff),
    label: 'Cán bộ, giảng viên'
  }, staffList && {
    value: String(staffList.length),
    label: 'Nhân sự chủ chốt'
  }, u.students && {
    value: u.students.toLocaleString('vi-VN'),
    label: 'Sinh viên'
  }, depts ? {
    value: String(depts.length),
    label: 'Bộ môn'
  } : null, u.majors && {
    value: String(u.majors.length),
    label: 'Ngành đào tạo'
  }, !isKhoa && u.functions && {
    value: String(u.functions.length),
    label: 'Nhóm chức năng'
  }].filter(Boolean);
  const khoaTabs = [...(u.board ? [['nhan-su', 'Ban chủ nhiệm khoa']] : []), ...(depts ? [['bo-mon', 'Bộ môn']] : []), ...(u.majors ? [['dao-tao', 'Đào tạo']] : [])];
  const [tab, setTab] = useState(khoaTabs[0]?.[0] || 'nhan-su');
  return shell({
    title: u.name,
    lead: u.desc,
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: cfg.label,
      to: `/gioi-thieu/${kind}`
    }, {
      label: u.name
    }],
    sidebar: <>
        <LinkList title={`${cfg.singular} khác`} items={cfg.list.filter(x => x.id !== u.id).map(x => ({
        label: x.name,
        to: `/gioi-thieu/${kind}/${x.id}`
      }))} />
        <LinkList title="Tra cứu nhân sự" items={[{
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }, {
        label: 'Danh bạ đơn vị & số máy',
        to: '/giang-vien/danh-ba'
      }, {
        label: 'Đội ngũ cán bộ, giảng viên',
        to: '/gioi-thieu/giang-vien'
      }]} />
      </>,
    children: <>
        <div className="about-unitprofile">
          <span className="about-unitprofile__img humg-ph" data-ratio="4-3"><span>{u.name}</span></span>
          <div className="about-unitprofile__facts">
            {facts.map(([k, v]) => <div key={k} className="about-unitprofile__fact"><span>{k}</span><strong>{v}</strong></div>)}
            {statItems.length > 0 && <div className="about-unitprofile__stats">
                {statItems.map(s => <span key={s.label}><strong>{s.value}</strong> {s.label}</span>)}
              </div>}
          </div>
        </div>

        {isKhoa ? <Panel flush>
            <div className="about-tabs">
              {khoaTabs.map(([k, label]) => <button key={k} type="button" className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>{label}</button>)}
            </div>
            <div style={{
          padding: 18
        }}>
              {tab === 'nhan-su' && u.board && <>
                  <DataTable columns={['Họ và tên', 'Chức vụ', 'Email']} rows={u.board.map(p => [p.name, p.role, p.email])} />
                  <p className="about-muted" style={{
              marginTop: 14
            }}>
                    Danh sách giảng viên từng bộ môn xem tại tab <strong>Bộ môn</strong>; hồ sơ nhà khoa học tại <Link to="/nghien-cuu/chuyen-gia">Danh sách chuyên gia</Link>.
                  </p>
                </>}
              {tab === 'bo-mon' && depts && <>
                  <div className="about-depts">
                    {depts.map(d => <Link key={d.id} to={`/gioi-thieu/khoa/${u.id}/bo-mon/${d.id}`} className="about-dept">
                        <span className="about-dept__ic"><Icon name="layers" size={16} /></span>
                        <span className="about-dept__body">
                          <strong>{d.name}</strong>
                          <em>{d.size} giảng viên · {d.head}</em>
                        </span>
                        <Icon name="arrow-right" size={15} />
                      </Link>)}
                  </div>
                  <p className="about-muted" style={{
              marginTop: 14
            }}>
                    Tìm hồ sơ nhà khoa học của Khoa tại <Link to="/nghien-cuu/chuyen-gia">Danh sách chuyên gia</Link>;
                    số máy, hộp thư liên hệ tại <Link to="/giang-vien/danh-ba">Danh bạ đơn vị</Link>.
                  </p>
                </>}
              {tab === 'dao-tao' && u.majors && <ul className="about-majors">
                  {u.majors.map(m => <li key={m}><Link to="/hoc-tap/chuong-trinh-dao-tao">{m} <Icon name="arrow-right" size={13} /></Link></li>)}
                </ul>}
            </div>
          </Panel> : <>
            {u.functions && <Panel title="Chức năng, nhiệm vụ" icon="check">
                <ul className="about-funcs">
                  {u.functions.map(f => <li key={f}><Icon name="check" size={14} /> {f}</li>)}
                </ul>
              </Panel>}
            {staffList && <Panel title="Nhân sự" icon="users">
                <DataTable columns={['Họ và tên', 'Chức vụ', 'Email']} rows={staffList.map(p => [p.name, p.role, p.email])} />
                <p className="about-muted" style={{
            marginTop: 14
          }}>
                  Số máy nội bộ và hộp thư đầy đủ của đơn vị xem tại <Link to="/giang-vien/danh-ba">Danh bạ đơn vị &amp; số máy</Link>.
                </p>
              </Panel>}
          </>}
      </>
  });
}
