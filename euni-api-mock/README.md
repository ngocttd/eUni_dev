# euni-api-mock — API gateway giả lập + hợp đồng API

> **Đây KHÔNG phải backend thật.** Backend do đội khác triển khai theo hợp đồng trong `contract/`.
> Repo này để 2 app FE (`euni-public`, `euni-admin`) chạy được khi chưa có backend, và là bản mẫu chính xác của hợp đồng.

## Chạy

```bash
npm install
cp .env.example .env
npm run dev          # http://127.0.0.1:3000   (npm run reset: nạp lại dữ liệu gốc)
```

Gateway mock phục vụ cùng cấu trúc với `https://api-gateway-demo.humg.edu.vn`:

| Service | Nội dung | Nguồn dữ liệu mock |
|---|---|---|
| `cms-api` | Theo **tenant** (`X-Tenant`): tin tức + **thông báo** (workflow, hẹn giờ, revision, thùng rác, bản sửa đổi chờ duyệt), phân quyền mức bản ghi (grants), danh bạ & cây đơn vị (chỉ đọc), hộp thư `/api/Me/announcements`, danh mục, media, sự kiện, album/video/podcast, trang/menu, banner, khối trang chủ, cấu hình, audit, sao lưu — thay đổi hiện ngay ở `/Public/*` | `src/cms.js`, `lifecycle.js`, `acl.js`, `announcements.js`, `store.js` (bộ nhớ, lưu `data/store.json`) |
| `auth-api` | **Đóng vai Identity Server** khi dev: login / me / refresh / logout (JWT mang claim `sub, roles, tenants, units, staff_code, student_code`) | `src/auth.js` |
| `qlns-api` · `qlkhcn-api` · `qldt-api` · `portal-api` | Dữ liệu các phân hệ ngoài (about, research, education, portal sinh viên…) — chỉ đọc | `mock-data/*.json` |

Tài khoản CMS mock (mật khẩu `Humg@2025`): `tvanminh` (cms.admin, 2 tenant) · `nthoa` (biên tập trang Trường) · `pvloc` (biên tập Khoa CNTT) ·
`vthuong` (duyệt thông báo P.Đào tạo) · `ltmai` (tác giả P.Truyền thông) · `dvtung` (CTV chuyên mục Nghiên cứu). Phân quyền mẫu: `GET /cms-api/api/Grants`.
Cổng demo: `POST /auth-api/api/auth/login {"role":"student"}` (SV lớp DCCTKT66A), `staff` (GV BM-KHMT), `parent`, `leader`.
Tenant mẫu: `humg` (mặc định) và `cntt` (Khoa CNTT) — gửi header `X-Tenant: cntt`.

Kiểm thử hành vi: `npm test` (tự chạy server tạm, 67 kiểm tra).

## Hợp đồng API (cho backend)

- `contract/API_CONTRACT.md` — quy ước chung, danh sách endpoint, quyền, ví dụ request/response, cấu trúc dữ liệu từng service.
- `contract/openapi.json` — OpenAPI 3 (cũng phục vụ ở `GET /docs/openapi.json`).
- Sinh lại sau khi sửa mock: chạy mock rồi `npm run contract`.

## Tham khảo cho backend

- **`database/v2/schema.sql`** — schema đích cho backend .NET (PostgreSQL 16): multi-tenant + Row-Level Security, workflow, revisions, audit (partition),
  access_grants, announcements/targets/receipts, tìm kiếm `unaccent` + `pg_trgm`. Kiểm thử: `npm run db:v2:test` (biến PG* trỏ tới DB trống).
- `database/schema.sql`, `database/seed.sql` — bản v1 (trước thiết kế mới), chỉ để tham khảo lịch sử.
- Thiết kế đầy đủ: `../docs/design/CMS_DESIGN.md`.
- `mock-data/*.json` — dữ liệu mẫu của từng module (được xuất từ prototype React cũ bằng `scripts/export-mock-data.mjs`).

## Cấu trúc

```text
src/server.js     Express app, CORS, gắn service, middleware tenant
src/tenant.js     X-Tenant → host → tenant mặc định
src/auth.js       auth-api (mock IdS) + bảng role → quyền chức năng + middleware requireCms(permission)
src/acl.js        Phân quyền mức bản ghi: can(user, tenant, type, action, record), allowedActions
src/lifecycle.js  Vòng đời dùng chung: workflow, revision, bản sửa đổi chờ duyệt, thùng rác, concurrency, lịch sử
src/audit.js      Audit log + diff
src/announcements.js  Thông báo: targets, receipts, hộp thư /api/Me/announcements
src/cms.js        cms-api (Public/* + tin tức + grants + danh bạ + CRUD chung)
src/datasets.js   qlns/qlkhcn/qldt/portal: /api/v1/datasets/{module} và /api/v1/{module}/{resource}
src/store.js      Kho dữ liệu CMS trong bộ nhớ
mock-data/        JSON dữ liệu các module
contract/         openapi.json + API_CONTRACT.md
database/         schema + seed PostgreSQL tham khảo
scripts/          smoke (npm test) · export-mock-data · gen-contract · reset
```
