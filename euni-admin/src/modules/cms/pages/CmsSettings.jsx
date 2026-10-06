'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { Panel, DataTable } from "../../../shared/components/ui/page.jsx";
import { Link } from '../../../lib/router.jsx';
import Icon from "../../../shared/lib/Icon.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, formToObject } from "../actions.jsx";
import { mediaUrl } from "../../../lib/api/media.js";
import MediaPicker from "../MediaPicker.jsx";
import { Head, Tag, Toggle } from "../shared.jsx";

/** Mỗi mục cấu hình ↔ một nhóm trong cms-api /api/v1/admin/settings/{group} (mục không có nhóm = chỉ để xem) */
const GROUP = {
  'Thông tin chung': 'general', 'Ngôn ngữ': 'language', 'SEO & Mạng xã hội': 'seo', 'Email hệ thống': 'email',
  'Bảo mật': 'security', 'Sao lưu dữ liệu': 'backup', 'Tích hợp dịch vụ': 'integration'
};

export function CmsSettings() {
  const { cmsSettingsSections, cmsSettings, cmsSettingsAll, cmsLanguageSettings, cmsLanguages, cmsI18nCoverage, cmsMedia } = useModuleData('cms');
  const act = useAction();
  const [sec, setSec] = useState(cmsSettingsSections[0]);
  const g = cmsSettings.general;
  const s = cmsSettings.seo;
  const e = cmsSettings.email;
  const sc = cmsSettingsAll?.security || {};
  const bk = cmsSettingsAll?.backup || {};
  const ig = cmsSettingsAll?.integration || {};
  const ls = cmsLanguageSettings;
  const [enOn, setEnOn] = useState(ls.enabledCodes.includes('en'));
  const [defaultLang, setDefaultLang] = useState(ls.defaultCode);
  const [fallback, setFallback] = useState(ls.fallback);
  const [logoId, setLogoId] = useState(g.logoMediaId ?? null);
  const [faviconId, setFaviconId] = useState(g.faviconMediaId ?? null);
  const [pickFor, setPickFor] = useState(null); // 'logo' | 'favicon'
  const mediaOf = id => cmsMedia.find(m => m.id === id);
  const testEmail = () => {
    const to = window.prompt('Gửi email thử tới địa chỉ:', e.fromEmail || '');
    if (to) act.run(async () => { await cmsApi.settings.testEmail(to.trim()); }, `Đã gửi email thử tới ${to.trim()}`);
  };

  const submit = ev => {
    ev.preventDefault();
    const group = GROUP[sec];
    if (!group) return;
    const values = group === 'language'
      ? { defaultCode: defaultLang, enabledCodes: ['vi', ...(enOn ? ['en'] : [])], fallback }
      : { ...formToObject(ev.currentTarget), ...(group === 'general' ? { logoMediaId: logoId, faviconMediaId: faviconId } : {}) };
    act.run(() => cmsApi.settings.save(group, values), `Đã lưu cấu hình "${sec}"`);
  };
  const saveable = !!GROUP[sec];
  const SECTION_ICON = { 'Thông tin chung': 'building', 'Ngôn ngữ': 'globe', 'SEO & Mạng xã hội': 'search', 'Email hệ thống': 'mail', 'Bảo mật': 'shield', 'Sao lưu dữ liệu': 'download', 'Tích hợp dịch vụ': 'layers', 'Lịch trình (Cron)': 'clock', 'Nhật ký hệ thống': 'file' };

  return <>
      <Head title="Cấu hình hệ thống" sub="Thiết lập chung, SEO, email, bảo mật và tích hợp" />
      <Notice error={act.error} notice={act.notice} />
      <div className="cms-settings">
        <nav className="cms-settings__nav">
          {cmsSettingsSections.map(x => <button key={x} type="button" aria-current={sec === x ? 'page' : undefined} className={sec === x ? 'is-active' : ''} onClick={() => { setSec(x); act.clear(); }}>{x}</button>)}
        </nav>
        <Panel title={sec} icon={SECTION_ICON[sec] || 'settings'}>
          <form className="cms-form" onSubmit={submit}>
            {sec === 'Thông tin chung' && <>
                <label>Tên website<input type="text" name="siteName" defaultValue={g.siteName} /><span className="cms-hint">Dùng ở dòng bản quyền chân trang và tiêu đề trình duyệt.</span></label>
                <div className="cms-form__two">
                  <label>Tên cạnh logo<input type="text" name="brandName" defaultValue={g.brandName || ''} placeholder="Để trống = TRƯỜNG ĐẠI HỌC MỎ - ĐỊA CHẤT" /><span className="cms-hint">Vd. KHOA CÔNG NGHỆ THÔNG TIN cho website Khoa.</span></label>
                  <label>Tên cạnh logo (EN)<input type="text" name="brandNameEn" defaultValue={g.brandNameEn || ''} placeholder="Để trống = tên tiếng Anh của Trường" /></label>
                </div>
                <div className="cms-form__two">
                  <label>Dòng phụ dưới tên<input type="text" name="tagline" defaultValue={g.tagline || ''} placeholder="Để trống = Tri thức - Bản lĩnh - Sáng tạo - Hội nhập" /></label>
                  <label>Dòng phụ (EN)<input type="text" name="taglineEn" defaultValue={g.taglineEn || ''} placeholder="Để trống = khẩu hiệu tiếng Anh" /></label>
                </div>
                <div className="cms-form__two">
                  <label>Email liên hệ<input type="email" name="email" defaultValue={g.email} /></label>
                  <label>Số điện thoại<input type="text" name="phone" defaultValue={g.phone} /></label>
                </div>
                <label>Địa chỉ<input type="text" name="address" defaultValue={g.address} /></label>
                <div className="cms-form__two">
                  {[['Logo', logoId, setLogoId, 'logo'], ['Favicon', faviconId, setFaviconId, 'favicon']].map(([label, id, setId, key]) => <div key={key}>
                      <label>{label}</label>
                      <div className="cms-uploadbox is-sm">
                        {id && mediaOf(id) ? <img src={mediaUrl(mediaOf(id).url)} alt={label} style={{ width: 76, height: 76, objectFit: 'contain', borderRadius: 8, background: '#f1f5f9' }} onError={ev => { ev.currentTarget.style.visibility = 'hidden' }} /> : <span className="humg-ph" data-ratio="1-1"><span>{label}</span></span>}
                        <span className="cms-uploadbox__act">
                          <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => setPickFor(key)}>Chọn ảnh</button>
                          {id && <button type="button" className="cms-rowbtn is-danger" onClick={() => setId(null)}>Xóa</button>}
                        </span>
                      </div>
                    </div>)}
                </div>
              </>}
            {sec === 'Ngôn ngữ' && <>
                <p className="ps-muted">
                  Cấu hình ngôn ngữ áp dụng cho <strong>cả website công khai và My eUni Portal</strong>.
                  Tiếng Việt luôn là bản gốc (không thể tắt); các ngôn ngữ khác là bản dịch — nếu một
                  nội dung chưa có bản dịch, hệ thống áp dụng quy tắc hiển thị bên dưới.
                </p>
                <label>Ngôn ngữ đang bật</label>
                <div className="cms-langlist">
                  {cmsLanguages.map(l => <div key={l.code} className="cms-langlist__row">
                      <span><span aria-hidden="true">{l.flag}</span> {l.label} <em>({l.code.toUpperCase()})</em></span>
                      {l.isSource ? <span className="cms-tag is-done">Bắt buộc · Bản gốc</span> : <Toggle checked={enOn} onChange={setEnOn} label="" />}
                    </div>)}
                </div>
                <div className="cms-form__two">
                  <label>Ngôn ngữ mặc định khi truy cập lần đầu
                    <select value={defaultLang} onChange={ev => setDefaultLang(ev.target.value)}>
                      {cmsLanguages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </label>
                  <label>Khi nội dung chưa có bản dịch
                    <select value={fallback} onChange={ev => setFallback(ev.target.value)}>
                      {ls.fallbackOptions.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                </div>
                <p className="ps-muted">{ls.urlNote}</p>

                <h4 className="ps-subhead" style={{ margin: '18px 0 10px' }}>Tỷ lệ hoàn thành bản dịch (Tiếng Anh)</h4>
                <DataTable columns={['Loại nội dung', 'Đã dịch / Tổng', 'Tỷ lệ']} rows={cmsI18nCoverage.map(c => {
              const pct = Math.round(c.translated / c.total * 100);
              return [c.type, `${c.translated} / ${c.total}`, <span key="p" className="cms-i18n-progress">
                        <span className="cms-i18n-progress__track"><span style={{ width: `${pct}%` }} /></span>
                        <em>{pct}%</em>
                      </span>];
            })} />
                <Link to="/cms/bai-viet" className="humg-btn humg-btn--ghost humg-btn--sm" style={{ marginTop: 4 }}>
                  <Icon name="external" size={13} /> Xem danh sách bài viết theo trạng thái dịch
                </Link>
              </>}
            {sec === 'SEO & Mạng xã hội' && <>
                <label>Meta title mặc định<input type="text" name="metaTitle" defaultValue={s.metaTitle} /></label>
                <label>Meta description mặc định<textarea rows="3" name="metaDesc" defaultValue={s.metaDesc} /></label>
                <div className="cms-form__two">
                  <label>Facebook Page<input type="text" name="facebook" defaultValue={s.facebook} /></label>
                  <label>Kênh YouTube<input type="text" name="youtube" defaultValue={s.youtube} /></label>
                </div>
                <label>Google Analytics ID<input type="text" name="analytics" defaultValue={s.analytics} /></label>
              </>}
            {sec === 'Email hệ thống' && <>
                <div className="cms-form__two">
                  <label>SMTP Host<input type="text" name="smtpHost" defaultValue={e.smtpHost} /></label>
                  <label>SMTP Port<input type="text" name="smtpPort" defaultValue={e.smtpPort} /></label>
                </div>
                <div className="cms-form__two">
                  <label>Tên người gửi<input type="text" name="fromName" defaultValue={e.fromName} /></label>
                  <label>Email người gửi<input type="email" name="fromEmail" defaultValue={e.fromEmail} /></label>
                </div>
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" disabled={act.busy} onClick={testEmail}>Gửi email kiểm tra</button>
              </>}
            {sec === 'Bảo mật' && <>
                <label className="cms-inline"><input type="checkbox" name="twoFactor" defaultChecked={sc.twoFactor ?? true} /> Bắt buộc xác thực 2 lớp (2FA) với Admin</label>
                <label className="cms-inline"><input type="checkbox" name="lockAfterFailures" defaultChecked={sc.lockAfterFailures ?? true} /> Khóa tài khoản sau 5 lần đăng nhập sai</label>
                <label className="cms-inline"><input type="checkbox" name="ipRestrict" defaultChecked={sc.ipRestrict ?? false} /> Chặn truy cập CMS ngoài dải IP nội bộ</label>
                <label>Thời gian hết phiên (phút)<input type="number" name="sessionMinutes" defaultValue={sc.sessionMinutes ?? 30} /></label>
              </>}
            {sec === 'Sao lưu dữ liệu' && <>
                <label>Tần suất sao lưu tự động
                  <select name="frequency" defaultValue={bk.frequency ?? 'Hằng ngày'}>{['Hằng ngày', 'Hằng tuần', 'Thủ công'].map(x => <option key={x}>{x}</option>)}</select>
                </label>
                <label>Giờ chạy<input type="time" name="runAt" defaultValue={bk.runAt ?? '03:00'} /></label>
                <label>Số bản lưu giữ lại<input type="number" name="retentionCount" defaultValue={bk.retentionCount ?? 7} /></label>
                <Link to="/cms/sao-luu" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="external" size={13} /> Mở trang Sao lưu & Phục hồi</Link>
              </>}
            {sec === 'Tích hợp dịch vụ' && <>
                <label className="cms-inline"><input type="checkbox" name="sso365" defaultChecked={ig.sso365 ?? true} /> SSO Microsoft 365 (Azure AD)</label>
                <label className="cms-inline"><input type="checkbox" name="opac" defaultChecked={ig.opac ?? true} /> Thư viện số HUMG (OPAC)</label>
                <label className="cms-inline"><input type="checkbox" name="payment" defaultChecked={ig.payment ?? false} /> Cổng thanh toán học phí</label>
                <label>API Key nội bộ<input type="text" name="apiKey" defaultValue={ig.apiKey ?? 'humg_live_xxxxxxxxxxxx'} /></label>
              </>}
            {sec === 'Lịch trình (Cron)' && <DataTable columns={['Tác vụ', 'Lịch chạy', 'Lần chạy gần nhất', 'Trạng thái']} rows={[['Sao lưu CSDL', 'Hằng ngày 03:00', '16/05/2025 03:00', <Tag key="1" v="Thành công" />], ['Dọn file tạm', 'Hằng ngày 04:00', '16/05/2025 04:00', <Tag key="2" v="Thành công" />], ['Gửi bản tin email', 'Thứ 2 hằng tuần 07:00', '12/05/2025 07:00', <Tag key="3" v="Thành công" />], ['Đồng bộ danh bạ đơn vị', 'Hằng ngày 01:00', '16/05/2025 01:00', <Tag key="4" v="Thành công" />]]} />}
            {sec === 'Nhật ký hệ thống' && <>
                <p className="ps-muted">Xem nhật ký thao tác chi tiết của người dùng tại trang Nhật ký hoạt động.</p>
                <Link to="/cms/nhat-ky" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="external" size={13} /> Mở Nhật ký hoạt động</Link>
              </>}
            {saveable && <div className="cms-form__actions">
              <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary">{act.busy ? 'Đang lưu…' : 'Lưu cấu hình'}</button>
            </div>}
          </form>
        </Panel>
      </div>
      {pickFor && <MediaPicker title={pickFor === 'logo' ? 'Chọn logo' : 'Chọn favicon'} folder="Cơ sở vật chất" onClose={() => setPickFor(null)} onPick={m => { (pickFor === 'logo' ? setLogoId : setFaviconId)(m.id); setPickFor(null); }} />}
    </>;
}
