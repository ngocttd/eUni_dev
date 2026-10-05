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
| `cms-api` | Bài viết, danh mục, media, người dùng, vai trò, sự kiện, album/video/podcast, trang/menu, banner, khối trang chủ, cấu hình, nhật ký, sao lưu — **có ghi**, thay đổi hiện ngay ở `/Public/*` | `src/store.js` (bộ nhớ, lưu `data/store.json`) |
| `auth-api` | login / me / refresh / logout (JWT) | `src/auth.js` |
| `qlns-api` · `qlkhcn-api` · `qldt-api` · `portal-api` | Dữ liệu các phân hệ ngoài (about, research, education, portal sinh viên…) — chỉ đọc | `mock-data/*.json` |

Tài khoản CMS mock: `tvanminh` · `nthoa` · `ltmai`… mật khẩu `Humg@2025`. Cổng demo: `POST /auth-api/api/auth/login {"role":"student"}`.

## Hợp đồng API (cho backend)

- `contract/API_CONTRACT.md` — quy ước chung, danh sách endpoint, quyền, ví dụ request/response, cấu trúc dữ liệu từng service.
- `contract/openapi.json` — OpenAPI 3 (cũng phục vụ ở `GET /docs/openapi.json`).
- Sinh lại sau khi sửa mock: chạy mock rồi `npm run contract`.

## Tham khảo cho backend

- `database/schema.sql`, `database/seed.sql` — PostgreSQL (schema `cms`, 44 bảng) gợi ý cho cms-api. Nạp: `npm run db:fresh` (cấu hình DB trong `.env`).
- `mock-data/*.json` — dữ liệu mẫu của từng module (được xuất từ prototype React cũ bằng `scripts/export-mock-data.mjs`).

## Cấu trúc

```text
src/server.js     Express app, CORS, gắn service
src/cms.js        cms-api (Public/* + quản trị + CRUD chung)
src/auth.js       auth-api + middleware requireCms(permission)
src/datasets.js   qlns/qlkhcn/qldt/portal: /api/v1/datasets/{module} và /api/v1/{module}/{resource}
src/store.js      Kho dữ liệu CMS trong bộ nhớ
mock-data/        JSON dữ liệu các module
contract/         openapi.json + API_CONTRACT.md
database/         schema + seed PostgreSQL tham khảo
scripts/          export-mock-data · gen-contract · reset
```
