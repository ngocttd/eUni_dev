# Cấu trúc website sau khi tách

## 1. Các repo

| Repo | Vai trò | Công nghệ | Cổng dev |
|---|---|---|---|
| `euni-public` | Website công khai · My eUni Portal (4 cổng theo vai trò) · đăng nhập | Next.js 15 App Router, React 19 | 3002 |
| `euni-admin` | CMS quản trị nội dung (theo tenant, workflow, thông báo, phân quyền mức bản ghi) | Next.js 15 App Router, React 19 | 3001 |
| `euni-api-mock` | Gateway giả lập + hợp đồng API + DB tham khảo (không phải backend thật) | Node.js, Express | 3000 |

Hai app FE độc lập (build/deploy riêng). Chúng chỉ giao tiếp với nhau qua **API gateway** và qua **link chéo**
(vd. link `/cms` trong website sang app admin) do `src/lib/router.jsx` + `src/config/apps.js` xử lý.

```text
                         ┌───────────────────────── API gateway ─────────────────────────┐
 Trình duyệt ──► euni-public (:3002) ─┐                                                   │
                                      ├──► cms-api · auth-api · qlns-api · qlkhcn-api ·   │──► backend / DB
 Trình duyệt ──► euni-admin  (:3001) ─┘    edusoft-api · esb-api                          │
                         └─────────────────────────────────────────────────────────────┘
        (dev: euni-api-mock :3000 đóng vai gateway; trên server: {gateway}/euni-mock-api)   admin ghi cms-api ⇒ public đọc lại thấy ngay
        Web và mobile đều gọi qua API gateway — không có portal-api. Endpoint: /api/v1/{public|me|admin}/... (chữ thường, '-')
```

## 2. euni-public

```text
src/
├─ app/                      Next.js App Router (đường dẫn = cấu trúc thư mục)
│  ├─ layout.jsx             Layout gốc: font, providers (ngôn ngữ, đăng nhập), CSS
│  ├─ (site)/                128 trang công khai — server component, nạp dữ liệu từ API rồi render
│  │  ├─ page.jsx            Trang chủ                       ├─ gioi-thieu/…   Giới thiệu HUMG
│  │  ├─ hoc-tap/…           Học tập, Tuyển sinh             ├─ nghien-cuu/…   Khoa học & công nghệ
│  │  ├─ hop-tac/…           Hợp tác                         ├─ doi-song/…     Đời sống
│  │  ├─ thu-vien/…          Thư viện                        ├─ sinh-vien/ giang-vien/ phu-huynh/ cuu-sinh-vien   Cổng đối tượng
│  │  └─ tin-tuc/ su-kien/ media/ tim-kiem/ lien-he/ tien-ich/ …
│  ├─ (auth)/                dang-nhap · dang-nhap-phu-huynh · doi-mat-khau · quen-mat-khau
│  ├─ (portal)/euni/         My eUni Portal — layout bảo vệ (đăng nhập + vai trò)
│  │  ├─ sinh-vien/ (16 trang)   ├─ giang-vien/ (47)   ├─ phu-huynh/ (10)   └─ lanh-dao/ (15)
│  ├─ module-styles.js       CSS mọi module theo đúng thứ tự cascade
│  └─ error.jsx · not-found.jsx
├─ modules/                  Giao diện theo nghiệp vụ (component dùng chung cho các route)
│  ├─ public/                about · admissions · audience · content · cooperation · education · home ·
│  │                         library · life · research · staff-hub · student-hub · utilities
│  ├─ portal/                student · staff (giảng viên + cán bộ) · parent · leader (role manager)
│  └─ authentication/        trang đăng nhập
│        mỗi module:  pages/*.jsx + shared.jsx + <module>.css      (không còn data.js)
├─ lib/
│  ├─ api/client.js          api(SERVICE.cms).get(…) — gắn token, timeout, bóc envelope, asPage()
│  ├─ datasets/loaders.js    ★ map module → endpoint + adapter   · useModuleData.jsx · helpers.js · format.js
│  └─ router.jsx             Tương thích react-router-dom → Next (Link, NavLink, useNavigate, useParams…)
├─ shared/                   layout (Header/Footer/PublicLayout/PortalLayout/AuthLayout), ui, auth, guards, services
├─ config/                   env.js · apps.js (link chéo) · static/ (menu/nav tĩnh)
├─ routes/sitemap.js         Menu chính, header, footer, route khai báo, cấu hình các cổng portal
├─ i18n/                     Việt/Anh        └─ views/  NotFound · PlaceholderPage
```

## 3. euni-admin

```text
src/
├─ app/
│  ├─ (auth)/dang-nhap       Đăng nhập CMS
│  ├─ (cms)/cms/             Tổng quan · bai-viet(+moi/[id]) · thong-bao(+moi/[id]) · danh-muc · media · trang-menu · su-kien · tuyen-sinh ·
│  │                         nghien-cuu · hoc-tap · banner · trang-chu · album · video · podcast · phan-quyen (grants) · cau-hinh · nhat-ky · sao-luu
│  └─ page.jsx               / → /cms
├─ modules/cms/              màn hình (pages/), ResourceManager.jsx (CRUD dùng chung), workflow.jsx, pickers.jsx, shared.jsx, css  · modules/authentication/AdminLoginPage
├─ lib/api/cmsApi.js         ★ thao tác ghi (contents/categories/media/users/…) sẵn sàng gắn vào màn hình
├─ lib/datasets/loaders.js   ★ loadCms(): gọi endpoint quản trị → dạng dữ liệu màn hình đang dùng
├─ shared/ · config/ (cmsUi.js = hằng số giao diện) · routes/cmsConfig.js · i18n/
```

## 4. euni-api-mock

```text
src/server.js · cms.js · auth.js · datasets.js · store.js     mock gateway
mock-data/*.json                                              dữ liệu mẫu các module
contract/API_CONTRACT.md · openapi.json                       ★ hợp đồng cho backend
database/schema.sql · seed.sql · migrate.mjs                  PostgreSQL (schema cms, 44 bảng) tham khảo
```

## 5. Nguồn dữ liệu từng khu vực

| Khu vực giao diện | Service | Ghi chú |
|---|---|---|
| Tin tức, sự kiện, media, trang chủ, banner, menu | `cms-api` | Do CMS quản trị theo tenant; ghi ở admin → public đổi ngay (theo workflow & giờ đăng) |
| Thông báo trong My eUni (SV, GV, phụ huynh) | `cms-api` `/api/v1/me/announcements` | Soạn ở CMS theo đối tượng nhận; hộp thư so khớp vai trò + đơn vị/lớp + cá nhân |
| Menu đầu trang, chân trang; thông tin liên hệ; banner | `cms-api` `/api/v1/public/menus/{header\|footer\|utility}`, `/settings`, `/banners` | Nạp ở `app/(site)/layout.jsx` → `shared/site/SiteContext.jsx`; lỗi API thì dùng `routes/sitemap.js` |
| Trang tĩnh soạn ở CMS | `cms-api` `/api/v1/public/pages/slug/{slug}` | Route `/trang/[slug]` |
| Giới thiệu (cơ cấu, giảng viên), cổng Giảng viên, Lãnh đạo | `qlns-api` | Hệ thống nhân sự |
| Nghiên cứu (đề tài, công bố, chuyên gia…) | `qlkhcn-api` | Hệ thống KHCN |
| Học tập, tuyển sinh, cổng Sinh viên/Phụ huynh | `edusoft-api` | Hệ thống đào tạo |
| Thư viện | `esb-api` | Tích hợp hệ thống thư viện qua ESB |
| Hợp tác, đời sống, tiện ích | `cms-api` | Nội dung tĩnh của website (`/api/v1/public/datasets/{module}`) |
| Đăng nhập | Identity Server (OIDC) | Tài khoản trường + Microsoft 365, cùng một `sub`; dev: `auth-api` của mock |

Dữ liệu cá nhân của portal (`portal-*`) nằm ở nhóm `/api/v1/me/datasets/{module}`, còn lại `/api/v1/public/datasets/{module}`.
Map này nằm ở `MODULE_SERVICE` (`src/lib/datasets/loaders.js`) và `euni-api-mock/src/datasets.js`; đổi ở đó nếu backend chia service khác.

## 6. Quy ước làm việc

- Component giao diện **không import dữ liệu**; lấy qua `useModuleData('<module>')`.
- Thêm trang công khai: tạo `app/(site)/<đường-dẫn>/page.jsx` + component trong `modules/public/<module>/pages/`.
- Cần field/endpoint mới: sửa mock + sinh lại `contract/`, báo backend; rồi cập nhật `loaders.js`.
- Link nội bộ cứ viết dạng `/đường-dẫn`; link sang app khác (`/cms`) tự được đổi sang URL tuyệt đối.
- Mọi lời gọi API gửi `X-Tenant`: trang công khai (server) dùng `lib/datasets/server.js` (tenant theo host), trình duyệt dùng `shared/services/tenantService.js`.
- Thiết kế backend & nghiệp vụ CMS: `docs/design/CMS_DESIGN.md`.
