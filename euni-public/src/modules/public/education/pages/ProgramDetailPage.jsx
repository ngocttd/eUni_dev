'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { useState } from "react";
import { MetaBar, Panel, DocList, SupportCard, StatRow, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function ProgramDetailPage() {
  const { getProgram, programs } = useModuleData('education');
  const {
    id
  } = useParams();
  const p = getProgram(id) || programs[0];
  const [tab, setTab] = useState('tong-quan');
  const tabs = [{
    key: 'tong-quan',
    label: 'Tổng quan'
  }, {
    key: 'muc-tieu',
    label: 'Mục tiêu'
  }, {
    key: 'chuan-dau-ra',
    label: 'Chuẩn đầu ra'
  }, {
    key: 'khung-ct',
    label: 'Khung chương trình'
  }, {
    key: 'nghe-nghiep',
    label: 'Cơ hội nghề nghiệp'
  }, {
    key: 'hoc-phi',
    label: 'Học phí'
  }];
  const totalCredits = p.curriculum.reduce((s, b) => s + b.credits, 0);
  return shell({
    title: p.name,
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Chương trình đào tạo',
      to: '/hoc-tap/chuong-trinh-dao-tao'
    }, {
      label: p.name
    }],
    hero: <MetaBar items={[{
      icon: 'grid',
      text: `Mã ngành: ${p.code}`
    }, {
      icon: 'building',
      text: p.faculty
    }, {
      icon: 'graduation',
      text: p.type
    }]} />,
    sidebar: <>
        <Panel title="Tài liệu chương trình" icon="file"><DocList items={p.docs} /></Panel>
        <SupportCard title="Đăng ký tư vấn" lead={`Tư vấn về ngành ${p.name}`} phone="0888 123 456" email="tuyensinh@humg.edu.vn" cta={{
        label: 'Đăng ký tư vấn',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <Panel>
          <StatRow items={[{
          value: p.level,
          label: 'Trình độ đào tạo'
        }, {
          value: p.duration,
          label: 'Thời gian đào tạo'
        }, {
          value: String(totalCredits),
          label: 'Tổng số tín chỉ'
        }, {
          value: String(p.quota),
          label: 'Chỉ tiêu (2026)'
        }, {
          value: p.degree,
          label: 'Văn bằng'
        }]} />
        </Panel>

        <Panel flush>
          <div className="edu-tabs">
            {tabs.map(t => <button key={t.key} type="button" className={t.key === tab ? 'is-active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
          </div>
          <div className="edu-tabbody">
            {tab === 'tong-quan' && <>
                <p className="edu-lead">{p.desc}</p>
                <h3>Định hướng chuyên ngành</h3>
                <ul className="edu-check">{p.orientations.map(o => <li key={o}><Icon name="check" size={14} /> {o}</li>)}</ul>
                <h3>Tổ hợp môn xét tuyển</h3>
                <div className="edu-chiprow">{p.combos.map(c => <span key={c}>{c}</span>)}</div>
                <h3>Thông tin nhanh</h3>
                <DataTable columns={['Mục', 'Chi tiết']} rows={[['Khoa quản lý', p.faculty], ['Hình thức đào tạo', 'Chính quy'], ['Ngôn ngữ giảng dạy', 'Tiếng Việt'], ['Tổ hợp xét tuyển', p.combos.join(', ')]]} />
              </>}
            {tab === 'muc-tieu' && <ul className="edu-check">{p.objectives.map((o, i) => <li key={i}><Icon name="check" size={14} /> {o}</li>)}</ul>}
            {tab === 'chuan-dau-ra' && <>
                <h3>Về kiến thức</h3>
                <ul className="edu-num">{p.outcomes.knowledge.map((o, i) => <li key={i}>{o}</li>)}</ul>
                <h3>Về kỹ năng</h3>
                <ul className="edu-num">{p.outcomes.skills.map((o, i) => <li key={i}>{o}</li>)}</ul>
                <h3>Về mức tự chủ và trách nhiệm</h3>
                <ul className="edu-num">{p.outcomes.autonomy.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </>}
            {tab === 'khung-ct' && <>
                <DataTable columns={['Khối kiến thức', 'Số tín chỉ']} rows={[...p.curriculum.map(b => [b.block, String(b.credits)]), ['Tổng cộng', String(totalCredits)]]} />
                <p className="edu-note">Khung chương trình chi tiết (danh mục học phần theo học kỳ) xem trong tài liệu “Đề cương chi tiết chương trình đào tạo”.</p>
              </>}
            {tab === 'nghe-nghiep' && <ul className="edu-check">{p.careers.map((c, i) => <li key={i}><Icon name="briefcase" size={14} /> {c}</li>)}</ul>}
            {tab === 'hoc-phi' && <>
                <DataTable columns={['Mục', 'Mức']} rows={[['Đơn giá tín chỉ', p.tuition.perCredit], ['Học phí ước tính / năm', p.tuition.perYear]]} />
                <p className="edu-note">{p.tuition.note}</p>
                <Link to="/hoc-tap/hoc-phi-hoc-bong" className="humg-link-more">Xem chính sách học phí & học bổng <Icon name="arrow-right" size={14} /></Link>
              </>}
          </div>
        </Panel>
      </>
  });
}
