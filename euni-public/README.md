# euni-public — Website công khai + My eUni Portal

Next.js 15 (App Router, React 19). Toàn bộ dữ liệu lấy từ **API gateway**; repo này **không còn data mock trong code**.

| Khu vực | Đường dẫn | Ghi chú |
|---|---|---|
| Website công khai | `/`, `/gioi-thieu`, `/hoc-tap`, `/nghien-cuu`, `/tin-tuc`… (128 trang) | Render phía server (SSR), dữ liệu CMS luôn mới |
| Đăng nhập | `/dang-nhap`, `/dang-nhap-phu-huynh`, `/doi-mat-khau`, `/quen-mat-khau` | Qua Identity Server: tài khoản trường hoặc Microsoft 365 (mock: `auth-api`) |
| My eUni Portal | `/euni/sinh-vien`, `/euni/giang-vien`, `/euni/phu-huynh`, `/euni/lanh-dao` (88 trang) | Cần đăng nhập + đúng vai trò |

CMS quản trị nằm ở repo riêng **euni-admin**; link `/cms` trong repo này tự chuyển sang app admin (`NEXT_PUBLIC_ADMIN_URL`).

## Chạy dự án

```bash
npm install
cp .env.example .env.local      # chỉnh URL gateway nếu cần
npm run dev                     # http://localhost:3002
```

Cần một API gateway: chạy **euni-api-mock** (`http://127.0.0.1:3000`) hoặc trỏ `NEXT_PUBLIC_API_GATEWAY_URL` tới gateway thật
(`https://api-gateway-demo.humg.edu.vn`). Hợp đồng API: `euni-api-mock/contract/API_CONTRACT.md`.

Kiểm tra trước khi tạo PR: `npm run build`.

Đăng nhập (thiết kế: `docs/design/CMS_DESIGN.md` §3):
- **Identity Server** (`NEXT_PUBLIC_AUTH_MODE=oidc`, `NEXT_PUBLIC_SSO_PROVIDER=ids`, `NEXT_PUBLIC_SSO_ISSUER=…`): trang `/dang-nhap` có 2 lựa chọn —
  **Tài khoản trường (HUMG ID)** và **Microsoft 365** (gửi gợi ý IdP `acr_values=idp:Microsoft`, chỉnh bằng `NEXT_PUBLIC_SSO_M365_PARAM/VALUE`).
  Hai cách cho cùng một người dùng (`sub`) trên IdS; app **không nhận mật khẩu**. Endpoint lấy từ `{issuer}/.well-known/openid-configuration`.
  Vai trò, tenant, đơn vị, mã CB/SV lấy từ claim `role`, `tenant`, `unit`, `staff_code`, `student_code` (`src/lib/sso/oidc.js` → `mapSsoUser`).
  Phụ huynh đăng nhập tài khoản cục bộ trên IdS ở `/dang-nhap-phu-huynh`.
- **Keycloak** (`NEXT_PUBLIC_SSO_PROVIDER=keycloak`) hoặc **Entra ID trực tiếp** (`entra`, cấu hình cũ — chỉ có nút Microsoft 365; Redirect URI SPA `{origin}/dang-nhap/sso/callback`).
- **Mock/dev** (`NEXT_PUBLIC_AUTH_MODE=mock`, mặc định): "Tài khoản trường" là form gọi `auth-api` của euni-api-mock (đóng vai IdS); có nút vào cổng demo theo vai trò.
- Backend kiểm tra JWT của IdS (JWKS của issuer, `aud = cms-api` — đặt `NEXT_PUBLIC_SSO_API_SCOPE`).

Tenant (website theo đơn vị, §2): trang công khai suy ra tenant từ host theo `NEXT_PUBLIC_TENANT_HOSTS` (vd. `cntt.humg.edu.vn=cntt`),
không khớp → `NEXT_PUBLIC_DEFAULT_TENANT`. Mọi lời gọi API gửi header `X-Tenant` (`src/shared/services/tenantService.js`; phía server: `src/lib/datasets/server.js`).

Thông báo: các trang Thông báo của cổng Sinh viên / Giảng viên / Phụ huynh và chuông trên topbar đọc hộp thư `/cms-api/api/v1/me/announcements`
(`src/shared/portal/AnnouncementInbox.jsx`) — thông báo do CMS soạn theo đối tượng (vai trò, đơn vị/lớp, cá nhân), có xác nhận đã đọc.

## Cấu trúc

```text
src/
├─ app/                     Next.js App Router
│  ├─ layout.jsx            Layout gốc (font, providers, CSS)
│  ├─ (site)/               Website công khai — mỗi trang là server component nạp dữ liệu từ API
│  ├─ (auth)/               Trang đăng nhập / quên / đổi mật khẩu
│  ├─ (portal)/euni/*       My eUni Portal theo vai trò (layout bảo vệ bằng PortalShell)
│  ├─ module-styles.js      Nạp CSS của mọi module theo đúng thứ tự cascade
│  └─ error.jsx, not-found.jsx
├─ modules/                 Giao diện theo nghiệp vụ (client components)
│  ├─ public/<module>/      about · admissions · audience · content · cooperation · education · home ·
│  │                        library · life · research · staff-hub · student-hub · utilities
│  │                          └─ pages/ + shared.jsx + <module>.css   (không còn data.js)
│  ├─ portal/<role>/        student · staff (lecturer + staff) · parent · leader (manager)  (pages/ + shared.jsx + css)
│  └─ authentication/       Các trang đăng nhập
├─ lib/
│  ├─ api/client.js         Client gọi gateway: api(SERVICE.cms).get(...), tự gắn Bearer token
│  ├─ datasets/             Lớp dữ liệu cho giao diện
│  │  ├─ loaders.js         ★ NƠI DUY NHẤT map module → endpoint + adapter (đổi khi nối API thật)
│  │  ├─ server.js          loadDatasets() cho server component — tenant theo host của request
│  │  ├─ useModuleData.jsx  Hook useModuleData('about') + DatasetProvider + ClientDatasets
│  │  ├─ helpers.js         Hàm tra cứu getArticle/getUnit… dựng từ dữ liệu
│  │  └─ format.js          Định dạng ngày/giờ/dung lượng từ dữ liệu API
│  └─ router.jsx            Lớp tương thích react-router-dom → next/navigation (Link, useNavigate…)
├─ lib/sso/                 Đăng nhập OIDC (Identity Server / Keycloak / Entra): config.js, oidc.js (PKCE, discovery, refresh, logout, claim → người dùng)
├─ shared/                  Component dùng chung: layout (Header/Footer/PortalLayout), ui (page.jsx),
│                           auth (AuthContext), guards, services (authService, tokenService), portal/PortalShell
├─ config/                  env.js · apps.js (link chéo sang admin) · static/ (menu/nav tĩnh của giao diện)
├─ routes/sitemap.js        Menu chính, header, footer, danh sách route & cấu hình các cổng portal
├─ i18n/                    Chuyển Việt/Anh
└─ views/                   NotFound, PlaceholderPage
```

## Luồng dữ liệu

```text
Trang (server component)  ──loadDatasets(['about'])──►  lib/datasets/server.js (X-Tenant theo host) ──► loaders.js ──► api-gateway ──► service
        │                                                         │ (CMS: adapter đổi ISO/entity → dạng giao diện)
        └─ <DatasetProvider> ──► component: const { units, getUnit } = useModuleData('about')

Portal (client)  ──<ClientDatasets modules=['portal-student']>──► loaders.js (kèm Bearer token) ──► API
```

- Dữ liệu CMS (`content`, `home`) gọi `cms-api` mỗi request (`cache: 'no-store'`) → admin sửa, trang public đổi ngay.
- Dữ liệu từ hệ thống khác (nhân sự, KHCN, đào tạo, portal) gọi `GET /{service}/api/v1/public/datasets/{module}`.
- Map module → service nằm ở `MODULE_SERVICE` trong `loaders.js`.

## Thêm / sửa

- **Thêm trang công khai**: tạo `src/app/(site)/<đường-dẫn>/page.jsx` (server component, mẫu: xem trang bất kỳ), component giao diện đặt ở `modules/public/<module>/pages/`.
- **Nối API thật cho một module**: sửa `loadDataset()` trong `lib/datasets/loaders.js` (gọi endpoint thật + adapter về shape giao diện). Không phải sửa trang.
- **Link sang app khác**: cứ viết `/cms/...`; `lib/router.jsx` tự đổi thành URL tuyệt đối tới admin.
- **Giao diện dùng dữ liệu**: luôn qua `useModuleData(module)`; không import dữ liệu tĩnh trong `modules/`.

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_API_GATEWAY_URL` | `http://127.0.0.1:3000` | Gateway (mock hoặc `https://api-gateway-demo.humg.edu.vn`) |
| `NEXT_PUBLIC_API_TIMEOUT` | `15000` | Timeout (ms) |
| `NEXT_PUBLIC_API_LOG` | `false` | Log request ra console |
| `NEXT_PUBLIC_PUBLIC_URL` / `NEXT_PUBLIC_ADMIN_URL` | `:3002` / `:3001` | URL các app, dùng cho link chéo |
| `NEXT_PUBLIC_SSO_ENABLED` / `_PROVIDER` / `_TENANT_ID` / `_CLIENT_ID` / `_API_SCOPE` | `true` / `entra` / tenant HUMG / `5a7cce06-…` / (trống) | Đăng nhập SSO Microsoft 365 (`_ISSUER`, `_IDP_HINT` chỉ cho Keycloak) |

## Ghi chú vận hành

- Mọi trang chạy `force-dynamic` (không prerender) vì nội dung CMS và cổng portal thay đổi theo thời gian/tài khoản.
  Khi lên production có thể thêm `revalidate` ngắn hoặc webhook từ CMS nếu cần cache.
- Phiên đăng nhập mock lưu ở `sessionStorage`; khi backend phát refresh-token HttpOnly cookie, chỉ cần sửa `shared/services/authService.js`.
- Nội dung đa ngôn ngữ: bài viết/tin nổi bật có bản dịch EN **đã hoàn tất** sẽ hiển thị tiếng Anh khi chọn EN (`lib/datasets/helpers.js` → `localizers`); thiếu bản dịch tự dùng tiếng Việt. Khung giao diện dịch qua `i18n`.
- Bài viết soạn bằng WYSIWYG lưu HTML; website làm sạch bằng `sanitize-html` (`lib/datasets/sanitize.js`, chỉ chạy phía server) rồi hiển thị trong `ArticleBody`.
