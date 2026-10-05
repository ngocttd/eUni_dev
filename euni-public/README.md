# euni-public — Website công khai + My eUni Portal

Next.js 15 (App Router, React 19). Toàn bộ dữ liệu lấy từ **API gateway**; repo này **không còn data mock trong code**.

| Khu vực | Đường dẫn | Ghi chú |
|---|---|---|
| Website công khai | `/`, `/gioi-thieu`, `/hoc-tap`, `/nghien-cuu`, `/tin-tuc`… (128 trang) | Render phía server (SSR), dữ liệu CMS luôn mới |
| Đăng nhập | `/dang-nhap`, `/dang-nhap-phu-huynh`, `/doi-mat-khau`, `/quen-mat-khau` | Xác thực qua `auth-api` |
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

Đăng nhập:
- **SSO Microsoft 365** — nút "Đăng nhập với Microsoft 365" ở `/dang-nhap`: đăng nhập **trực tiếp Microsoft Entra ID** của HUMG (OIDC Authorization Code + PKCE, tenant `c852d62b-…`, client ID `5a7cce06-4b5c-4612-b1fa-0ef7f0702a27`), đích `/dang-nhap/sso/callback`.
  Trên Azure cần nền tảng **Single-page application** với Redirect URI `{origin}/dang-nhap/sso/callback` (vd. `http://localhost:3002/dang-nhap/sso/callback`) và Post-logout redirect `{origin}/`.
  Vai trò (sinh viên / giảng viên / phụ huynh / lãnh đạo) suy ra từ app role/nhóm trong token — chỉnh ở `src/lib/sso/oidc.js` (`ROLE_RULES`, mặc định sinh viên).
  Chế độ Keycloak HUMG: `NEXT_PUBLIC_SSO_PROVIDER=keycloak` (cần client OIDC trong realm `humg-euni`). Quản lý tài khoản: https://myaccount.microsoft.com/
- **Mock/dev**: chọn "cổng demo" (Sinh viên / Giảng viên / Phụ huynh / Lãnh đạo) hoặc tài khoản qua `auth-api`.
- Backend thật phải kiểm tra JWT của Microsoft Entra ID (JWKS: `https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys`, `aud` = client ID). Nếu chưa đặt `NEXT_PUBLIC_SSO_API_SCOPE`, FE gửi **id_token** làm Bearer.

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
│  ├─ portal/<role>/        student · staff · parent · leader  (pages/ + shared.jsx + css)
│  └─ authentication/       Các trang đăng nhập
├─ lib/
│  ├─ api/client.js         Client gọi gateway: api(SERVICE.cms).get(...), tự gắn Bearer token
│  ├─ datasets/             Lớp dữ liệu cho giao diện
│  │  ├─ loaders.js         ★ NƠI DUY NHẤT map module → endpoint + adapter (đổi khi nối API thật)
│  │  ├─ useModuleData.jsx  Hook useModuleData('about') + DatasetProvider + ClientDatasets
│  │  ├─ helpers.js         Hàm tra cứu getArticle/getUnit… dựng từ dữ liệu
│  │  └─ format.js          Định dạng ngày/giờ/dung lượng từ dữ liệu API
│  └─ router.jsx            Lớp tương thích react-router-dom → next/navigation (Link, useNavigate…)
├─ lib/sso/                 SSO Keycloak/M365: config.js, oidc.js (PKCE, token, refresh, logout, ánh xạ vai trò)
├─ shared/                  Component dùng chung: layout (Header/Footer/PortalLayout), ui (page.jsx),
│                           auth (AuthContext), guards, services (authService, tokenService), portal/PortalShell
├─ config/                  env.js · apps.js (link chéo sang admin) · static/ (menu/nav tĩnh của giao diện)
├─ routes/sitemap.js        Menu chính, header, footer, danh sách route & cấu hình các cổng portal
├─ i18n/                    Chuyển Việt/Anh
└─ views/                   NotFound, PlaceholderPage
```

## Luồng dữ liệu

```text
Trang (server component)  ──loadDatasets(['about'])──►  lib/datasets/loaders.js ──► api-gateway ──► service
        │                                                         │ (CMS: adapter đổi ISO/entity → dạng giao diện)
        └─ <DatasetProvider> ──► component: const { units, getUnit } = useModuleData('about')

Portal (client)  ──<ClientDatasets modules=['portal-student']>──► loaders.js (kèm Bearer token) ──► API
```

- Dữ liệu CMS (`content`, `home`) gọi `cms-api` mỗi request (`cache: 'no-store'`) → admin sửa, trang public đổi ngay.
- Dữ liệu từ hệ thống khác (nhân sự, KHCN, đào tạo, portal) gọi `GET /{service}/api/v1/datasets/{module}`.
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
