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
| [docs/SITE_STRUCTURE.md](docs/SITE_STRUCTURE.md) | Cấu trúc website sau khi tách: repo, thư mục, sơ đồ route, luồng dữ liệu |
| [euni-api-mock/contract/API_CONTRACT.md](euni-api-mock/contract/API_CONTRACT.md) | **Hợp đồng API cho backend** (+ `openapi.json`) |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Quy trình branch / PR cho các repo |
| [docs/MIGRATION.md](docs/MIGRATION.md) | Đã chuyển đổi gì, kiểm thử ra sao, cách khôi phục bản Vite cũ |

## Đăng nhập SSO (Microsoft 365)

Cả hai app có nút "Đăng nhập với Microsoft 365": đăng nhập trực tiếp **Microsoft Entra ID** của HUMG (OIDC + PKCE; client ID `5a7cce06-4b5c-4612-b1fa-0ef7f0702a27`, tenant `c852d62b-3032-4cdc-96ab-30e4368fabd7`).
App Azure cần Redirect URI loại SPA `{origin}/dang-nhap/sso/callback` cho từng địa chỉ chạy (website :3002, admin :3001 khi dev). Có thể chuyển sang Keycloak HUMG bằng `NEXT_PUBLIC_SSO_PROVIDER=keycloak`. Kiểm thử: `node tools/migration/sso-test.mjs`.

## Nối backend thật

Đổi `NEXT_PUBLIC_API_GATEWAY_URL` ở `euni-public` và `euni-admin` (vd. `https://api-gateway-demo.humg.edu.vn`).
Điểm chỉnh duy nhất khi shape dữ liệu thật khác hợp đồng: `src/lib/datasets/loaders.js` của từng repo (adapter).
FE đã tương thích envelope của backend hiện có (`{success,message,data}` / `{code,message,data}`) và danh sách dạng mảng thuần.
