# HUMG eUni — workspace

Cổng thông tin điện tử Trường Đại học Mỏ - Địa chất, đã **chuyển từ React (Vite) sang Next.js** và **tách thành các repo độc lập**.
Giao diện chỉ làm việc với **API**; dữ liệu mock trong code đã được thay bằng lời gọi API (có gateway mock để chạy khi backend chưa xong).

```text
euni_api_ready/
├─ euni-public/       REPO 1 — Website công khai + My eUni Portal (sinh viên/giảng viên/phụ huynh/lãnh đạo) + đăng nhập   :3002
├─ euni-admin/        REPO 2 — CMS quản trị nội dung                                                                    :3001
├─ euni-api-mock/     Gateway giả lập + HỢP ĐỒNG API cho backend (contract/) + schema PostgreSQL tham khảo (database/)  :3000
├─ euni-api-dotnet/   REPO 4 — cms-api bản .NET 8 + PostgreSQL (RLS theo tenant), cùng hợp đồng với mock: thay thế mock mà FE không đổi  :3000
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

CMS admin và website public **cùng đọc/ghi `cms-api`**. Website không cache dữ liệu CMS, nên khi admin tạo/sửa/ẩn/xóa thì lần tải trang
kế tiếp trên website đã thấy thay đổi (khi người dùng chuyển trang trong website, menu/cấu hình/banner cũng được nạp lại ngầm).

| Màn hình admin | Hiển thị trên website |
|---|---|
| Bài viết, Danh mục, Sự kiện/Tuyển sinh/… (lối tắt chuyên mục) | `/tin-tuc`, chi tiết bài, trang chủ, tìm kiếm |
| Album, Video, Podcast | `/media`, khối media trang chủ |
| Trang chủ (slide, lối tắt, nhóm đối tượng, thế mạnh, đối tác, chỉ số, chip) | Trang chủ |
| Thông báo | Hộp thư My eUni (SV, GV, phụ huynh) |
| Trang & Menu → Menu | Menu đầu trang (`header`, gồm menu thả xuống), các cột chân trang (`footer`), liên kết dòng cuối chân trang (`utility`) |
| Trang & Menu → Cây trang | Trang nội dung soạn ở CMS hiện ở `/trang/{slug}`; “trang hệ thống” giữ route có sẵn |
| Banner / Slider | Dải banner trang chủ, popup trang chủ, cột phải trang tin/sự kiện, dải trên chân trang — theo khoảng ngày |
| Cấu hình → Thông tin chung, SEO & Mạng xã hội | Tên trường, địa chỉ, điện thoại, email, mạng xã hội ở chân trang |

**Website đơn vị (vd. Khoa CNTT, tenant `cntt`)** dùng chung API và màn hình quản trị với Trường, dữ liệu tách riêng theo header `X-Tenant`:
người quản trị chọn trang ở góc trên CMS; website suy ra tenant theo tên miền (tra `GET /api/v1/public/tenants/resolve?host=`, hoặc cố định qua `NEXT_PUBLIC_TENANT_HOSTS`; dev: `cntt.localhost:3002`).
Tên cạnh logo, liên hệ, menu, banner, trang tĩnh, tin tức của Khoa đều lấy từ dữ liệu của Khoa; nút “Xem website” trong CMS mở đúng website của trang đang quản trị.

### Thêm website cho Khoa / Phòng ban mới (không cần sửa code, không build lại)

1. Đăng nhập CMS bằng tài khoản `cms.admin` → **Quản trị → Trang đơn vị** → *Thêm trang đơn vị*.
2. Nhập **Tên trang** (mã trang tự sinh, vd. “Khoa Địa chất” → `dia-chat`; mã không đổi được sau khi tạo), chọn **Đơn vị gốc** trong cây tổ chức,
   nhập **Tên miền** (mỗi dòng một tên miền, vd. `diachat.humg.edu.vn`; môi trường thử: `diachat.localhost:3002`), chọn **Người phụ trách** (được cấp toàn quyền nội dung trang này).
3. Giữ bật **Tạo sẵn nội dung mẫu**: CMS sinh cấu hình theo tên trang, menu đầu/chân trang, trang Giới thiệu, Liên hệ, Chính sách, Điều khoản, chuyên mục Tin tức, slide và các khối trang chủ.
4. Trỏ DNS tên miền về máy chủ website (cùng máy chủ với website Trường; reverse proxy giữ header `Host`/`X-Forwarded-Host`). Website nhận tên miền trong vòng ~15 giây.
5. Bấm **Quản trị** ở dòng của trang để chuyển CMS sang trang đó và biên tập Cấu hình, Menu, Trang, Banner, Bài viết. Cấp thêm người qua **Phân quyền** (grant), không phải sửa SSO.

Tắt trang (cột *Trạng thái*): tên miền về website Trường, API công khai của trang trả 400, dữ liệu vẫn giữ; bật lại là dùng tiếp. Trang Trường (`humg`) không tắt được.
API: `GET/POST /api/v1/admin/tenants`, `PUT /api/v1/admin/tenants/{id}` (chỉ `cms.admin`), `GET /api/v1/public/tenants/resolve?host=` — xem `euni-api-mock/contract/API_CONTRACT.md`.

Nếu `cms-api` lỗi, header/footer dùng cấu hình tĩnh `euni-public/src/routes/sitemap.js` để website vẫn chạy.
Kiểm thử tự động: `node tools/migration/sync-test.mjs` (25 kịch bản, gồm 6 kịch bản website Khoa, 2 kịch bản trang đơn vị mới tạo/tắt: bài viết, hero slide, đối tác, sự kiện, video, cấu hình chân trang,
menu đầu trang/chân trang, banner theo vị trí và hạn hiển thị, trang tĩnh xuất bản/nháp/xóa).

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/DOTNET_API_ASSESSMENT.md](docs/DOTNET_API_ASSESSMENT.md) | **Đánh giá tác động** khi chuyển mock Node sang .NET (admin/web có bị ảnh hưởng không) + kết quả kiểm chứng; hướng dẫn repo mới: [euni-api-dotnet/README.md](euni-api-dotnet/README.md) · phần chưa làm: [docs/DOTNET_API_CON_LAI.md](docs/DOTNET_API_CON_LAI.md) · **trang hướng dẫn triển khai**: [docs/huong-dan-trien-khai-dotnet.html](docs/huong-dan-trien-khai-dotnet.html) |
| [docs/design/CMS_DESIGN.md](docs/design/CMS_DESIGN.md) | **Thiết kế CMS giai đoạn 1** (.NET · PostgreSQL · Redis · MinIO): multi-tenant, đăng nhập qua Identity Server (tài khoản trường + M365), song ngữ, workflow + hẹn giờ, phân quyền mức bản ghi, revision / soft delete / audit, tin tức vs thông báo, tìm kiếm tiếng Việt |
| [euni-api-mock/database/v2/schema.sql](euni-api-mock/database/v2/schema.sql) | DDL PostgreSQL đích cho backend (RLS theo tenant, unaccent + pg_trgm) + `test.sql` |
| [docs/SITE_STRUCTURE.md](docs/SITE_STRUCTURE.md) | Cấu trúc website sau khi tách: repo, thư mục, sơ đồ route, luồng dữ liệu |
| [euni-api-mock/contract/API_CONTRACT.md](euni-api-mock/contract/API_CONTRACT.md) | **Hợp đồng API cho backend** (+ `openapi.json`) |
| [docs/ban-giao-be.html](docs/ban-giao-be.html) | **Trang bàn giao cho đội Backend** (mở bằng trình duyệt): kiến trúc, quy ước endpoint, phân quyền, tra cứu endpoint, dataset, CSDL, việc cần làm |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Quy trình branch / PR cho các repo |
| [docs/MIGRATION.md](docs/MIGRATION.md) | Đã chuyển đổi gì, kiểm thử ra sao, cách khôi phục bản Vite cũ |

## Đăng nhập: tài khoản trường + Microsoft 365

Mọi đăng nhập đi qua **Identity Server** của trường (OIDC + PKCE): trang đăng nhập có 2 lựa chọn **Tài khoản trường (HUMG ID)** và **Microsoft 365**;
IdS đã liên kết hai loại tài khoản nên là cùng một người dùng (`sub`). App không nhận mật khẩu; user / role / tenant / đơn vị lấy từ claim của IdS
(CMS không quản lý người dùng, chỉ phân quyền mức bản ghi). Cấu hình: `NEXT_PUBLIC_AUTH_MODE=oidc`, `NEXT_PUBLIC_SSO_PROVIDER=ids`, `NEXT_PUBLIC_SSO_ISSUER=…`
(xem `.env.example` của từng app). Khi dev (`AUTH_MODE=mock`, mặc định) `euni-api-mock` đóng vai IdS. Chế độ cũ đăng nhập thẳng Entra ID
(client `5a7cce06-…`) vẫn còn (`NEXT_PUBLIC_SSO_PROVIDER=entra`). Kiểm thử: `node tools/migration/sso-test.mjs` (3 chế độ).

## Kiểm thử

Đăng xuất: nút **Đăng xuất** ở thanh trên cùng CMS và cổng My eUni, và ở header website khi đã đăng nhập; đăng xuất xong về `/dang-nhap` của chính app.
Với SSO cần đăng ký Post-logout redirect URI `{origin}/dang-nhap` cho cả 2 app. Kiểm thử: `node tools/migration/e2e-logout.mjs` (15 bước).

```bash
npm --prefix euni-api-mock test                     # 118 kiểm tra hành vi API (tự chạy server tạm)
psql … -f euni-api-mock/database/v2/schema.sql -f euni-api-mock/database/v2/test.sql   # schema v2 + RLS
# với 3 app đang chạy (mock dữ liệu gốc, public build với NEXT_PUBLIC_TENANT_HOSTS="cntt.localhost:3002=cntt"):
node tools/migration/e2e-v2.mjs                     # 24 bước trình duyệt: workflow, tenant, thông báo, phân quyền
node tools/migration/sync-test.mjs                  # đồng bộ CMS → website
node tools/migration/e2e-tenants.mjs                # màn Trang đơn vị: tạo trang mới → website nhận tên miền → tắt trang
```

## Nối backend thật

Đổi `NEXT_PUBLIC_API_GATEWAY_URL` ở `euni-public` và `euni-admin`:

| Môi trường | `NEXT_PUBLIC_API_GATEWAY_URL` |
|---|---|
| Dev (mock chạy máy) | `http://127.0.0.1:3000` |
| Mock trên server (tích hợp qua gateway như qlns-api, qlkhcn-api, edusoft-api) | `https://api-gateway-demo.humg.edu.vn/euni-mock-api` |
| Backend thật | `https://api-gateway-demo.humg.edu.vn` |

FE ghép chuỗi `{gateway}/{service}/api/v1/...` nên tiền tố `/euni-mock-api` được giữ nguyên; URL media/tệp do API trả về là đường dẫn tương đối.
Tên endpoint: chữ thường, `-`, có version, nhóm `/api/v1/public/` · `/api/v1/me/` · `/api/v1/admin/`. Service: `cms-api`, `edusoft-api` (đào tạo), `qlns-api`, `qlkhcn-api`, `esb-api`;
web và mobile đều gọi qua API gateway (không có `portal-api`). Role: 2 tầng trên SSO (realm role + client role có tiền tố), tầng 3 do từng app tự phân — xem `docs/design/CMS_DESIGN.md` §5.1.
Điểm chỉnh duy nhất khi shape dữ liệu thật khác hợp đồng: `src/lib/datasets/loaders.js` của từng repo (adapter).
FE đã tương thích envelope của backend hiện có (`{success,message,data}` / `{code,message,data}`) và danh sách dạng mảng thuần.
