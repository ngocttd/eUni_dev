'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { Panel, MetaBar, DataTable, NewsMini, LinkList, StatRow } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { GV_EDU, shell } from "../shared.jsx";
export function LecturerDetailPage() {
  const { getUnit, units, getDepartment, facultyDepartments, getLecturer } = useModuleData('about');
  const {
    khoaId,
    bmId,
    gvId
  } = useParams();
  const khoa = getUnit('khoa', khoaId) || units.khoa.list[0];
  const dept = getDepartment(khoaId, bmId) || (facultyDepartments[khoaId] || [])[0];
  const lec = getLecturer(khoaId, bmId, gvId) || (dept?.lecturers || [])[0];
  if (!lec) return shell({
    title: 'Không tìm thấy giảng viên',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }],
    children: <Panel><p>Giảng viên không tồn tại.</p></Panel>
  });
  const others = (dept.lecturers || []).filter(x => x.id !== lec.id);
  return shell({
    title: lec.name,
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
      label: dept.name,
      to: `/gioi-thieu/khoa/${khoaId}/bo-mon/${dept.id}`
    }, {
      label: lec.name
    }],
    hero: <MetaBar items={[{
      icon: 'award',
      text: lec.position
    }, {
      icon: 'building',
      text: dept.name
    }, {
      icon: 'mail',
      text: lec.email
    }]} />,
    sidebar: <>
        <Panel title="Liên hệ" icon="phone" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Đơn vị', dept.name], ['Chức vụ', lec.position], ['Email', lec.email], ['Điện thoại', lec.phone]]} />
        </Panel>
        {others.length > 0 && <Panel title="Giảng viên cùng bộ môn" icon="users">
            <NewsMini items={others.map(x => ({
          date: x.position,
          title: x.name,
          to: `/gioi-thieu/khoa/${khoaId}/bo-mon/${dept.id}/giang-vien/${x.id}`
        }))} />
          </Panel>}
        <LinkList title="Tra cứu nhân sự" items={[{
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }, {
        label: 'Danh bạ đơn vị & số máy',
        to: '/giang-vien/danh-ba'
      }]} />
      </>,
    children: <>
        <Panel>
          <StatRow items={[{
          value: String(lec.pubs),
          label: 'Công bố khoa học'
        }, {
          value: String(lec.fields.length),
          label: 'Hướng chuyên môn'
        }, {
          value: dept.name.replace('Bộ môn ', ''),
          label: 'Bộ môn'
        }]} />
        </Panel>
        <Panel title="Giới thiệu" icon="user">
          <div className="about-person is-big">
            <span className="about-person__photo humg-ph" data-ratio="1-1"><span>Chân dung</span></span>
            <div className="about-person__body">
              <strong>{lec.name}</strong>
              <span className="about-person__role">{lec.position} · {dept.name}</span>
              <p>
                {lec.name} là {lec.position.toLowerCase()} tại {dept.name}, {khoa.name}. Hướng chuyên môn chính gồm {lec.fields.join(', ')}.
                Giảng viên tham gia giảng dạy các học phần cơ sở ngành và chuyên ngành, hướng dẫn đồ án, luận văn và chủ trì / tham gia các đề tài nghiên cứu khoa học các cấp.
              </p>
              <div className="about-person__contact">
                <span><Icon name="mail" size={13} /> {lec.email}</span>
                <span><Icon name="phone" size={13} /> {lec.phone}</span>
              </div>
            </div>
          </div>
        </Panel>
        <Panel title="Hướng chuyên môn" icon="target">
          <div className="about-chiprow">{lec.fields.map(f => <span key={f}>{f}</span>)}</div>
        </Panel>
        <Panel title="Quá trình đào tạo" icon="graduation">
          <ul className="about-funcs">{GV_EDU.map(t => <li key={t}><Icon name="check" size={14} /> {t}</li>)}</ul>
        </Panel>
        <Panel title="Hoạt động chuyên môn" icon="newspaper">
          <ul className="about-funcs">
            <li><Icon name="check" size={14} /> Giảng dạy đại học và sau đại học tại {khoa.name}.</li>
            <li><Icon name="check" size={14} /> Chủ trì / tham gia đề tài NCKH cấp Trường, cấp Bộ; công bố trên tạp chí trong nước và quốc tế.</li>
            <li><Icon name="check" size={14} /> Hướng dẫn đồ án tốt nghiệp, luận văn thạc sĩ; tham gia hội đồng khoa học của bộ môn.</li>
          </ul>
          <p className="about-muted" style={{
          marginTop: 12
        }}>
            Danh mục công bố và đề tài chi tiết được cập nhật trong CSDL khoa học của Nhà trường.
          </p>
        </Panel>
      </>
  });
}
