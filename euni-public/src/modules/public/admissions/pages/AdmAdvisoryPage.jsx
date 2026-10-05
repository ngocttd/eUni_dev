'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { crumbs, shell } from "../shared.jsx";
export function AdmAdvisoryPage() {
  const { admissionAdvisory } = useModuleData('admissions');
  return shell({
    title: 'Tư vấn tuyển sinh',
    lead: admissionAdvisory.note,
    crumbs: crumbs('Tư vấn tuyển sinh'),
    children: <>
        <Panel title="Kênh tư vấn" icon="headphones">
          <ul className="adm-channels">
            {admissionAdvisory.channels.map(c => <li key={c.label}>
                <span className="adm-channels__ic"><Icon name={c.icon} size={16} /></span>
                <span><strong>{c.label}</strong><em>{c.value}</em></span>
              </li>)}
          </ul>
        </Panel>
        <Panel title="Đăng ký được tư vấn" icon="user">
          <form className="adm-form" onSubmit={e => e.preventDefault()}>
            <label>Họ và tên<input type="text" placeholder="Nguyễn Văn A" /></label>
            <label>Số điện thoại<input type="tel" placeholder="09xx xxx xxx" /></label>
            <label>Email<input type="email" placeholder="email@example.com" /></label>
            <label>Ngành quan tâm<input type="text" placeholder="VD: Công nghệ thông tin" /></label>
            <label className="adm-form__wide">Nội dung cần tư vấn<textarea rows="3" placeholder="Câu hỏi của bạn…" /></label>
            <button type="submit" className="humg-btn humg-btn--primary">Gửi yêu cầu tư vấn</button>
          </form>
        </Panel>
      </>
  });
}
