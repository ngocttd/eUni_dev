# HUMG eUni — workspace

Cổng thông tin điện tử Trường Đại học Mỏ - Địa chất, đã **chuyển từ React (Vite) sang Next.js** và **tách thành các repo độc lập**.
Giao diện chỉ làm việc với **API**; dữ liệu mock trong code đã được thay bằng lời gọi API (có gateway mock để chạy khi backend chưa xong).

```text
euni_api_ready/
├─ euni-public/       REPO 1 — Website công khai + My eUni Portal (sinh viên/giảng viên/phụ huynh/lãnh đạo) + đăng nhập   :3002
├─ euni-admin/        REPO 2 — CMS quản trị nội dung                                                                    :3001
├─ euni-api-mock/     Gateway giả lập + HỢP ĐỒNG API cho backend (contract/) + schema PostgreSQL tham khảo (database/)  :3000
├─ docs/              Cấu trúc website, quy trình Git, ghi chú chuyển đổi
├─ design/            Wireframe & sitemap gốc (PNG)
├─ tools/migration/   Công cụ đã dùng để chuyển đổi + bộ kiểm thử (e2e, đồng bộ CMS, crawl) — không thuộc repo nào
└─ scripts/           dev-all.ps1 (mở 3 cửa sổ), git-init.mjs
```

Mỗi thư mục `euni-*` là **một repo git riêng** (đẩy lên 2 repo git: `euni-public` và `euni-admin`; `euni-api-mock` là công cụ dev/hợp đồng, đẩy repo thứ 3 hoặc gộp tùy bạn).

## Chạy nhanh

```bash
npm run install:all          # cài 3 project
# 3 terminal (hoặc: powershell scripts/dev-all.ps1)
npm run dev:api              # http://127.0.0.1:3000   API mock
npm run dev:public           # http://localhost:3002   website + portal
npm run dev:admin            # http://localhost:3001   CMS  (đăng nhập: tvanminh / Humg@2025)
```

Mỗi app cần `.env.local` (copy từ `.env.example`); mặc định đã trỏ gateway mock.

## Đồng bộ CMS ↔ website

CMS admin và website public **cùng đọc/ghi `cms-api`**. Website không cache dữ liệu CMS, nên khi admin tạo/sửa/xóa
bài viết, sự kiện, banner, khối trang chủ… thì lần tải trang kế tiếp trên website đã thấy thay đổi.
Kiểm thử tự động: `node tools/migration/sync-test.mjs` (10 kịch bản: tạo/sửa/ẩn/xóa bài, bài nổi bật, hero slide, đối tác, sự kiện, video).

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/design/CMS_DESIGN.md](docs/design/CMS_DESIGN.md) | **Thiết kế CMS giai đoạn 1** (.NET · PostgreSQL · Redis · MinIO): multi-tenant, đăng nhập qua Identity Server (tài khoản trường + M365), song ngữ, workflow + hẹn giờ, phân quyền mức bản ghi, revision / soft delete / audit, tin tức vs thông báo, tìm kiếm tiếng Việt |
| [euni-api-mock/database/v2/schema.sql](euni-api-mock/database/v2/schema.sql) | DDL PostgreSQL đích cho backend (RLS theo tenant, unaccent + pg_trgm) + `test.sql` |
| [docs/SITE_STRUCTURE.md](docs/SITE_STRUCTURE.md) | Cấu trúc website sau khi tách: repo, thư mục, sơ đồ route, luồng dữ liệu |
| [euni-api-mock/contract/API_CONTRACT.md](euni-api-mock/contract/API_CONTRACT.md) | **Hợp đồng API cho backend** (+ `openapi.json`) |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Quy trình branch / PR cho các repo |
| [docs/MIGRATION.md](docs/MIGRATION.md) | Đã chuyển đổi gì, kiểm thử ra sao, cách khôi phục bản Vite cũ |

## Đăng nhập: tài khoản trường + Microsoft 365

Mọi đăng nhập đi qua **Identity Server** của trường (OIDC + PKCE): trang đăng nhập có 2 lựa chọn **Tài khoản trường (HUMG ID)** và **Microsoft 365**;
IdS đã liên kết hai loại tài khoản nên là cùng một người dùng (`sub`). App không nhận mật khẩu; user / role / tenant / đơn vị lấy từ claim của IdS
(CMS không quản lý người dùng, chỉ phân quyền mức bản ghi). Cấu hình: `NEXT_PUBLIC_AUTH_MODE=oidc`, `NEXT_PUBLIC_SSO_PROVIDER=ids`, `NEXT_PUBLIC_SSO_ISSUER=…`
(xem `.env.example` của từng app). Khi dev (`AUTH_MODE=mock`, mặc định) `euni-api-mock` đóng vai IdS. Chế độ cũ đăng nhập thẳng Entra ID
(client `5a7cce06-…`) vẫn còn (`NEXT_PUBLIC_SSO_PROVIDER=entra`). Kiểm thử: `node tools/migration/sso-test.mjs` (3 chế độ).

## Kiểm thử

```bash
npm --prefix euni-api-mock test                     # 67 kiểm tra hành vi API (tự chạy server tạm)
psql … -f euni-api-mock/database/v2/schema.sql -f euni-api-mock/database/v2/test.sql   # schema v2 + RLS
# với 3 app đang chạy (mock dữ liệu gốc, public build với NEXT_PUBLIC_TENANT_HOSTS="cntt.localhost:3002=cntt"):
node tools/migration/e2e-v2.mjs                     # 24 bước trình duyệt: workflow, tenant, thông báo, phân quyền
node tools/migration/sync-test.mjs                  # đồng bộ CMS → website
```

## Nối backend thật

Đổi `NEXT_PUBLIC_API_GATEWAY_URL` ở `euni-public` và `euni-admin` (vd. `https://api-gateway-demo.humg.edu.vn`).
Điểm chỉnh duy nhất khi shape dữ liệu thật khác hợp đồng: `src/lib/datasets/loaders.js` của từng repo (adapter).
FE đã tương thích envelope của backend hiện có (`{success,message,data}` / `{code,message,data}`) và danh sách dạng mảng thuần.
