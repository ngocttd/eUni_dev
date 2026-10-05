# euni-admin — CMS quản trị nội dung HUMG

Next.js 15 (App Router, React 19). Quản trị toàn bộ nội dung hiển thị trên website `euni-public`
(bài viết, danh mục, media, trang/menu, banner, sự kiện, khối trang chủ, người dùng, phân quyền, cấu hình, nhật ký, sao lưu).
Dữ liệu đi qua **cms-api** của API gateway; khi admin ghi dữ liệu, website public đọc cùng API nên **đổi theo ngay**.

## Chạy dự án

```bash
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3001  → /cms
```

Cần API gateway: chạy **euni-api-mock** (`http://127.0.0.1:3000`) hoặc gateway thật.
Tài khoản mock (mật khẩu `Humg@2025`): `tvanminh` quản trị (2 trang: Trường + Khoa CNTT) · `nthoa` biên tập trang Trường · `pvloc` biên tập Khoa CNTT ·
`vthuong` người duyệt thông báo P.Đào tạo · `ltmai` tác giả P.Truyền thông · `dvtung` cộng tác viên chuyên mục Nghiên cứu.

Thiết kế: [`docs/design/CMS_DESIGN.md`](../docs/design/CMS_DESIGN.md) — multi-tenant, workflow Draft → PendingReview → Published → Archived (+ hẹn giờ),
phân quyền mức bản ghi, revision / soft delete / audit, thông báo theo đối tượng.

## Cấu trúc

```text
src/
├─ app/
│  ├─ (auth)/dang-nhap      Đăng nhập CMS (modules/authentication/AdminLoginPage)
│  ├─ (cms)/cms/*           Màn hình CMS, layout bọc CmsShell (đăng nhập + quyền cms.access + chọn trang/tenant quản trị)
│  │                        bai-viet (+ thùng rác, workflow, lịch sử) · thong-bao (soạn, đối tượng nhận, thống kê đọc) · phan-quyen (grants) · …
│  └─ page.jsx              / → redirect /cms
├─ modules/
│  ├─ cms/                  ResourceManager.jsx (CRUD dùng chung) · workflow.jsx (WorkflowBar, HistoryPanel, TrashPanel) · pickers.jsx (danh bạ, đơn vị)
│  │                        pages/ (CmsDashboard, CmsPosts, CmsPostEditor, CmsAnnouncements, CmsAnnouncementEditor, CmsGrants, CmsCategories, CmsMedia,
│  │                        CmsPagesMenu, CmsBanners, CmsHome, CmsAlbums, CmsVideos, CmsPodcasts, CmsSettings, CmsActivity, CmsBackup…), shared.jsx, css
│  └─ authentication/       AdminLoginPage
├─ lib/
│  ├─ api/client.js         Client gọi gateway (Bearer token)
│  ├─ api/cmsApi.js         ★ Thao tác GHI: cmsApi.contents.update(id, {..., version}) · .workflow(id, 'submit') · .revisions(id) · announcements · grants…
│  ├─ datasets/loaders.js   ★ loadCms(): gọi các endpoint quản trị và đổi về dạng dữ liệu màn hình đang dùng
│  ├─ datasets/useModuleData.jsx   useModuleData('cms') · useReloadDatasets() (làm mới sau khi ghi)
│  └─ router.jsx            Lớp tương thích react-router-dom → next/navigation
├─ shared/                  Layout (PortalLayout variant "cms"), ui, auth, guards, portal/CmsShell
├─ config/                  env.js · apps.js · cmsUi.js (tab, danh sách lựa chọn, mặc định form — không phải dữ liệu API)
└─ routes/cmsConfig.js      Menu & thông báo của CMS
```

## Trạng thái

- **Đọc dữ liệu**: tất cả màn hình lấy dữ liệu thật từ `cms-api` (không còn mock trong code).
- **Ghi dữ liệu qua giao diện**: **tất cả màn hình lưu/xóa được qua API** — Bài viết, Thông báo, Danh mục, Media (tải lên/xóa), Trang & Menu (kể cả tiêu đề EN), Banner, Album, Video, Podcast, Trang chủ, Phân quyền nội dung, Cấu hình hệ thống, Sao lưu.
- **Workflow** (bài viết, thông báo): Bản nháp → Chờ duyệt → Đã xuất bản (hoặc **Hẹn giờ**) → Lưu trữ. Nút trên thanh workflow theo `allowedActions` do server tính từ quyền;
  trả lại cần lý do; sửa bài đang xuất bản khi không có quyền xuất bản → **bản sửa đổi chờ duyệt** (website giữ nội dung cũ đến khi được duyệt).
  Lưu kèm `version` → báo xung đột nếu người khác vừa sửa. Tab **Lịch sử**: các phiên bản (xem khác biệt, khôi phục), lịch sử xử lý, audit. **Thùng rác**: xóa mềm + khôi phục.
- **Thông báo theo đối tượng**: chọn sinh viên / cán bộ / phụ huynh × đơn vị hoặc lớp (gồm đơn vị con) × cá nhân (tra danh bạ theo tên, email, mã CB/SV), có dòng loại trừ;
  ưu tiên, ghim, hết hạn, yêu cầu xác nhận đã đọc, thống kê đã đọc. Người nhận xem trong My eUni (euni-public).
  Màn hình CRUD đơn giản dùng chung `modules/cms/ResourceManager.jsx`; các màn hình khác dùng hook `useAction()` (`modules/cms/actions.jsx`) để chạy thao tác, báo lỗi/thành công và nạp lại dữ liệu CMS.
- **Soạn bài viết bằng trình soạn WYSIWYG** (`modules/cms/RichTextEditor.jsx`, **TipTap — giấy phép MIT, miễn phí kể cả thương mại**): đậm/nghiêng/gạch chân, H2–H3, danh sách, trích dẫn, căn lề, liên kết, bảng, chèn ảnh (tải thẳng lên Media thư viện hoặc theo URL), hoàn tác/làm lại.
  Nội dung lưu dạng **HTML** trong `contentBody`; bài cũ (dữ liệu khối JSON) vẫn mở và hiển thị được. Website **làm sạch HTML** (`sanitize-html`) trước khi hiển thị nên script/onerror/javascript: bị loại.
- **Ảnh đại diện bài viết và logo/favicon** chọn từ Media thư viện (`modules/cms/MediaPicker.jsx`, có thể tải ảnh mới ngay trong hộp thoại).
- **Sao lưu & Phục hồi**: tạo bản sao lưu (chụp dữ liệu CMS), **tải tệp JSON về**, **phục hồi** từ bản đã có hoặc từ tệp tải lên; **gửi email thử** ở mục Cấu hình → Email.
- **Bản dịch tiếng Anh**: bản "Đã dịch" được website hiển thị khi người dùng chọn EN; bản "Đang dịch/Chưa dịch" tự quay về tiếng Việt.

## Đăng nhập

Mọi đăng nhập đi qua **Identity Server** (OIDC + PKCE) — `NEXT_PUBLIC_AUTH_MODE=oidc`, `NEXT_PUBLIC_SSO_PROVIDER=ids`, `NEXT_PUBLIC_SSO_ISSUER`:
hai nút **Tài khoản trường** và **Microsoft 365** (cùng một người dùng trên IdS). Quyền CMS lấy từ role trong token
(`cms.admin`, `cms.editor`, `cms.reviewer`, `cms.author`) + phân quyền mức bản ghi ở màn hình **Phân quyền nội dung**.
**CMS không quản lý người dùng / vai trò** (màn hình Người dùng, Vai trò cũ đã bỏ). Trang (tenant) được quản trị lấy từ claim `tenant`.

Chế độ `entra` (đăng nhập thẳng Entra ID, client `5a7cce06-…`) vẫn dùng được; chế độ `mock` dùng form gọi `auth-api` của euni-api-mock.
Cấu hình đầy đủ: `.env.example`.
