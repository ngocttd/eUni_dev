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
Tài khoản mock: `tvanminh` / `Humg@2025` (Super Admin), `nthoa` (Editor), `ltmai` (Author) — cùng mật khẩu. Viewer không vào được CMS.

## Cấu trúc

```text
src/
├─ app/
│  ├─ (auth)/dang-nhap      Đăng nhập CMS (modules/authentication/AdminLoginPage)
│  ├─ (cms)/cms/*           21 màn hình CMS, layout bọc CmsShell (bắt buộc đăng nhập + quyền cms.access)
│  └─ page.jsx              / → redirect /cms
├─ modules/
│  ├─ cms/                  ResourceManager.jsx (CRUD dùng chung) · pages/ (CmsDashboard, CmsPosts, CmsPostEditor, CmsCategories, CmsMedia, CmsPagesMenu,
│  │                        CmsBanners, CmsHome, CmsAlbums, CmsVideos, CmsPodcasts, CmsUsers, CmsRoles, CmsSettings, CmsActivity, CmsBackup…), shared.jsx, css
│  └─ authentication/       AdminLoginPage
├─ lib/
│  ├─ api/client.js         Client gọi gateway (Bearer token)
│  ├─ api/cmsApi.js         ★ Thao tác GHI sẵn sàng gắn vào màn hình: cmsApi.contents.update(id, {...})…
│  ├─ datasets/loaders.js   ★ loadCms(): gọi các endpoint quản trị và đổi về dạng dữ liệu màn hình đang dùng
│  ├─ datasets/useModuleData.jsx   useModuleData('cms') · useReloadDatasets() (làm mới sau khi ghi)
│  └─ router.jsx            Lớp tương thích react-router-dom → next/navigation
├─ shared/                  Layout (PortalLayout variant "cms"), ui, auth, guards, portal/CmsShell
├─ config/                  env.js · apps.js · cmsUi.js (tab, danh sách lựa chọn, mặc định form — không phải dữ liệu API)
└─ routes/cmsConfig.js      Menu & thông báo của CMS
```

## Trạng thái

- **Đọc dữ liệu**: tất cả màn hình lấy dữ liệu thật từ `cms-api` (không còn mock trong code).
- **Ghi dữ liệu qua giao diện**: **tất cả màn hình lưu/xóa được qua API** — Bài viết, Danh mục, Media (tải lên/xóa), Trang & Menu (kể cả tiêu đề EN), Banner, Album, Video, Podcast, Trang chủ, Người dùng, Vai trò & Ma trận phân quyền, Cấu hình hệ thống, Sao lưu. Website public đổi theo ngay.
  Màn hình CRUD đơn giản dùng chung `modules/cms/ResourceManager.jsx`; các màn hình khác dùng hook `useAction()` (`modules/cms/actions.jsx`) để chạy thao tác, báo lỗi/thành công và nạp lại dữ liệu CMS.
- **Soạn bài viết bằng trình soạn WYSIWYG** (`modules/cms/RichTextEditor.jsx`, **TipTap — giấy phép MIT, miễn phí kể cả thương mại**): đậm/nghiêng/gạch chân, H2–H3, danh sách, trích dẫn, căn lề, liên kết, bảng, chèn ảnh (tải thẳng lên Media thư viện hoặc theo URL), hoàn tác/làm lại.
  Nội dung lưu dạng **HTML** trong `contentBody`; bài cũ (dữ liệu khối JSON) vẫn mở và hiển thị được. Website **làm sạch HTML** (`sanitize-html`) trước khi hiển thị nên script/onerror/javascript: bị loại.
- **Ảnh đại diện bài viết và logo/favicon** chọn từ Media thư viện (`modules/cms/MediaPicker.jsx`, có thể tải ảnh mới ngay trong hộp thoại).
- **Sao lưu & Phục hồi**: tạo bản sao lưu (chụp dữ liệu CMS), **tải tệp JSON về**, **phục hồi** từ bản đã có hoặc từ tệp tải lên; **gửi email thử** ở mục Cấu hình → Email.
- **Bản dịch tiếng Anh**: bản "Đã dịch" được website hiển thị khi người dùng chọn EN; bản "Đang dịch/Chưa dịch" tự quay về tiếng Việt.

## Đăng nhập

- **SSO Microsoft 365** (mặc định: đăng nhập **trực tiếp Microsoft Entra ID** của HUMG bằng OIDC + PKCE): nút "Đăng nhập với Microsoft 365 (SSO)".
  Application (client) ID `5a7cce06-4b5c-4612-b1fa-0ef7f0702a27`, tenant `c852d62b-3032-4cdc-96ab-30e4368fabd7`. Trên Azure, app cần có nền tảng **Single-page application** với Redirect URI `{origin}/dang-nhap/sso/callback`
  (vd. `http://localhost:3001/dang-nhap/sso/callback`, và địa chỉ production của admin) và Post-logout redirect `{origin}/`.
  Vai trò CMS lấy từ app role/nhóm trong token (`cms-admin`, `cms-editor`) — xem `src/lib/sso/oidc.js` (`ROLE_RULES`); tài khoản không có vai trò CMS sẽ bị từ chối.
  Có thể chuyển sang Keycloak HUMG bằng `NEXT_PUBLIC_SSO_PROVIDER=keycloak`.
- **Tài khoản nội bộ/mock** qua `auth-api` (dev: `tvanminh` / `Humg@2025`).
- Cần quản trị SSO đăng ký client OIDC (public, PKCE S256) cho app này: Valid redirect URI `{origin}/dang-nhap/sso/callback`, Post logout redirect URI `{origin}/`.

## Phân quyền

Token mang `permissions`; cms-api kiểm tra từng endpoint (`post.create`, `post.publish`, `user.manage`, `settings.manage`…).
Giao diện chỉ ẩn/hiện, quyền thật do backend quyết định. Xem bảng quyền trong `euni-api-mock/contract/API_CONTRACT.md`.

## Biến môi trường

`NEXT_PUBLIC_API_GATEWAY_URL` (gateway), `NEXT_PUBLIC_API_TIMEOUT`, `NEXT_PUBLIC_API_LOG`,
`NEXT_PUBLIC_PUBLIC_URL` / `NEXT_PUBLIC_ADMIN_URL` (link chéo tới website công khai),
`NEXT_PUBLIC_SSO_ENABLED` / `_PROVIDER` / `_TENANT_ID` / `_CLIENT_ID` / `_API_SCOPE` (đăng nhập SSO; `_ISSUER`, `_IDP_HINT` chỉ cho chế độ Keycloak).
