'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { SupportCard, Panel, DataTable, StepList, Faq } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function ResultLookupPage() {
  const { resultLookup } = useModuleData('education');
  const [term, setTerm] = useState(resultLookup.terms[0]);
  const [prog, setProg] = useState(resultLookup.programs[0]);
  const [shown, setShown] = useState(false);
  const s = resultLookup.sample.summary;
  return shell({
    title: 'Tra cứu kết quả học tập',
    lead: 'Xem điểm học phần, GPA và tiến độ tích lũy tín chỉ.',
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Tra cứu kết quả học tập'
    }],
    sidebar: <>
        <SupportCard title="Cổng sinh viên My eUni" lead="Đăng nhập để xem đầy đủ kết quả học tập, bảng điểm và tiến độ." cta={{
        label: 'Đăng nhập My eUni',
        to: '/dang-nhap'
      }} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Tra cứu kết quả" icon="search">
          <form className="edu-form" onSubmit={e => {
          e.preventDefault();
          setShown(true);
        }}>
            <label>Mã số sinh viên <input type="text" placeholder="VD: 2151000123" required /></label>
            <label>Học kỳ
              <select value={term} onChange={e => setTerm(e.target.value)}>
                {resultLookup.terms.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Chương trình
              <select value={prog} onChange={e => setProg(e.target.value)}>
                {resultLookup.programs.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label>Mã xác nhận <input type="text" placeholder="Nhập mã hiển thị" required /></label>
            <button type="submit" className="humg-btn humg-btn--primary">Tra cứu</button>
          </form>
          <p className="edu-note">Kết quả tra cứu nhanh mang tính minh họa. Để xem đầy đủ và tải bảng điểm, vui lòng đăng nhập Cổng sinh viên.</p>
        </Panel>

        {shown && <Panel title={`Kết quả học tập · ${term}`} icon="award" action={<a href="#" className="humg-link-more"><Icon name="download" size={14} /> Xem bảng điểm PDF</a>}>
            <DataTable columns={['STT', 'Mã HP', 'Tên học phần', 'TC', 'Điểm', 'Điểm chữ']} rows={resultLookup.sample.rows} />
            <div className="edu-resultsum">
              <div><strong>{s.credits}</strong><span>Tín chỉ trong kỳ</span></div>
              <div><strong>{s.gpa10}</strong><span>Điểm TB (hệ 10)</span></div>
              <div><strong>{s.gpa4}</strong><span>GPA (hệ 4)</span></div>
              <div><strong>{s.rank}</strong><span>Xếp loại</span></div>
            </div>
          </Panel>}

        <Panel title="Các bước tra cứu trên My eUni" icon="check"><StepList items={resultLookup.steps} /></Panel>
        <Panel title="Thang điểm quy đổi" icon="award" flush>
          <DataTable columns={resultLookup.grading.columns} rows={resultLookup.grading.rows} />
        </Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={resultLookup.faqs} /></Panel>
      </>
  });
}
