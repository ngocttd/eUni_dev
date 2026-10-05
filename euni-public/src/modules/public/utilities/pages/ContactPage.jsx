'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { PageShell, Panel, Faq, DataTable } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
export function ContactPage() {
  const { contact } = useModuleData('utilities');
  return <PageShell eyebrow="Liên hệ" title="Liên hệ với HUMG" lead="Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Vui lòng chọn hình thức liên hệ phù hợp hoặc gửi thông tin cho chúng tôi." crumbs={[{
    label: 'Liên hệ'
  }]}>
      <div className="util-contactcards">
        {contact.cards.map(c => <div key={c.label} className="util-contactcard">
            <span className="util-contactcard__ic"><Icon name={c.icon} size={18} /></span>
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </div>)}
      </div>

      <div className="util-contactgrid">
        <Panel title="Gửi liên hệ" icon="mail">
          <form className="util-form" onSubmit={e => e.preventDefault()}>
            <div className="util-form__row">
              <label>Họ và tên <span>*</span><input type="text" placeholder="Nhập họ và tên" /></label>
              <label>Email <span>*</span><input type="email" placeholder="Nhập email của bạn" /></label>
            </div>
            <div className="util-form__row">
              <label>Số điện thoại<input type="tel" placeholder="Nhập số điện thoại" /></label>
              <label>Chủ đề
                <select>
                  <option value="">-- Chọn chủ đề --</option>
                  {contact.subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label>Nội dung <span>*</span><textarea rows="5" placeholder="Nhập nội dung liên hệ…" /></label>
            <button type="submit" className="humg-btn humg-btn--primary humg-btn--block">
              <Icon name="mail" size={16} /> Gửi liên hệ
            </button>
          </form>
        </Panel>

        <Panel title="Bản đồ vị trí" icon="map-pin" flush>
          <div className="util-map humg-ph" data-ratio="4-3"><span>Bản đồ · 18 Phố Viên, Bắc Từ Liêm, Hà Nội</span></div>
          <div className="util-transport">
            {contact.transport.map(t => <div key={t.title}>
                <span className="util-transport__ic"><Icon name={t.icon} size={16} /></span>
                <strong>{t.title}</strong>
                <em>{t.text}</em>
              </div>)}
          </div>
        </Panel>
      </div>

      <div className="util-contactgrid">
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={contact.faqs} /></Panel>
        <Panel title="Thời gian làm việc" icon="clock" flush>
          <DataTable columns={['Ngày', 'Giờ làm việc']} rows={contact.hours} />
        </Panel>
      </div>
    </PageShell>;
}
