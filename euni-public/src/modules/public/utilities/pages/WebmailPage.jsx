'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { PageShell, LinkList, SupportCard, Panel, DocList, Faq } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
export function WebmailPage() {
  const { webmail } = useModuleData('utilities');
  return <PageShell eyebrow="Tiện ích" title="Webmail HUMG" lead="Hộp thư điện tử @humg.edu.vn dành cho cán bộ, giảng viên và sinh viên của Trường." crumbs={[{
    label: 'Tiện ích',
    to: '/tien-ich'
  }, {
    label: 'Webmail'
  }]} sidebar={<>
          <LinkList title="Liên kết" items={webmail.links} />
          <SupportCard title="Trung tâm CNTT" lead="Hỗ trợ tài khoản, mật khẩu, cấu hình email." phone="024.3838.2010" email="cntt@humg.edu.vn" />
        </>}>
      <Panel title="Truy cập hộp thư" icon="mail">
        <div className="util-webmail">
          <span className="util-webmail__ic"><Icon name="mail" size={26} /></span>
          <div>
            <strong>Đăng nhập Webmail HUMG</strong>
            <p>Sử dụng tài khoản dạng <code>hoten@humg.edu.vn</code> và mật khẩu được cấp.</p>
          </div>
          <a href="#" className="humg-btn humg-btn--primary">Mở Webmail <Icon name="external" size={15} /></a>
        </div>
      </Panel>
      <Panel title="Hướng dẫn cấu hình" icon="file"><DocList items={webmail.docs} /></Panel>
      <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={webmail.faqs} /></Panel>
    </PageShell>;
}
