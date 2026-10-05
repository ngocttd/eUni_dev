'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel } from "../../../../shared/components/ui/page.jsx";
import { ConditionCheck, PageHead } from "../shared.jsx";
export function PsRegThesis() {
  const { psRegThesis } = useModuleData('portal-student');
  const d = psRegThesis;
  const eligible = d.conditions.every(c => c.ok);
  return <>
      <PageHead title="Đăng ký đồ án tốt nghiệp" sub={d.round} />
      <Panel title="Kiểm tra điều kiện" icon="shield"><ConditionCheck items={d.conditions} /></Panel>
      <Panel title="Đăng ký đề tài & giảng viên hướng dẫn" icon="graduation">
        {!eligible && <p className="ps-muted" style={{
        marginBottom: 12
      }}>Chức năng mở khi bạn đủ điều kiện. Bạn có thể liên hệ cố vấn học tập để được hỗ trợ.</p>}
        <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
          <label>Giảng viên hướng dẫn
            <select disabled={!eligible}>{d.advisors.map(a => <option key={a}>{a}</option>)}</select>
          </label>
          <label>Đề tài
            <select disabled={!eligible}>{d.topics.map(t => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="ps-formgrid__wide">Tên đề tài tự đề xuất (nếu có)<input type="text" disabled={!eligible} placeholder="Nhập tên đề tài" /></label>
          <label className="ps-formgrid__wide">Mô tả tóm tắt<textarea rows="3" disabled={!eligible} placeholder="Mục tiêu, phạm vi dự kiến…" /></label>
          <button type="submit" className="humg-btn humg-btn--primary" disabled={!eligible}>Gửi đăng ký</button>
        </form>
      </Panel>
    </>;
}
