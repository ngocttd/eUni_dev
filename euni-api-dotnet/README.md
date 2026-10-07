# euni-api-dotnet — cms-api (.NET 8 + PostgreSQL)

Bản **.NET** của `euni-api-mock` (Node.js), xây theo tài liệu *Kiến trúc code cms-api*: **modular monolith** một API – một database,
dữ liệu **đọc/ghi trực tiếp từ PostgreSQL**, cô lập tenant bằng **Row-Level Security**.
Giữ **nguyên hợp đồng HTTP** của mock (`contract/API_CONTRACT.md`) nên `euni-admin` và `euni-public` **không phải sửa gì** —
chỉ cần chạy API ở cổng 3000 (hoặc đổi `NEXT_PUBLIC_API_GATEWAY_URL`). Đánh giá tác động: [`../docs/DOTNET_API_ASSESSMENT.md`](../docs/DOTNET_API_ASSESSMENT.md).

> `euni-api-mock` (Node) vẫn giữ nguyên để đối chiếu. Chỉ chạy **một** trong hai ở cổng 3000.

## Chạy

```bash
# 1) PostgreSQL 16 + role + database (dev; chạy bằng superuser)
sudo -u postgres ./database/cms-api/setup-dev.sh        # tạo DB euni_cms, role cms_admin (BYPASSRLS) và cms_app (NOBYPASSRLS)
# hoặc: docker compose up --build                         # API + PostgreSQL

# 2) API  → http://127.0.0.1:3000   (lần đầu tự áp lược đồ + nạp dữ liệu mẫu nếu DB trống)
cp .env.example .env   # (tùy chọn) rồi export các biến, hoặc dùng mặc định
dotnet run --project src/HUMG.CMS.Api
```

Tài khoản mẫu, tenant, token… giống mock: xem `../euni-api-mock/README.md` (`tvanminh` / `Humg@2025`, `X-Tenant: cntt`, …).
`POST /cms-api/api/v1/dev/reset` đặt lại dữ liệu mẫu (chỉ để phát triển).

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Kết nối của **ứng dụng**: role `cms_app` (NOBYPASSRLS). Chuỗi Npgsql hoặc `postgres://user:pass@host/db` |
| `DATABASE_ADMIN_URL` | Kết nối **bảo trì**: role `cms_admin` (BYPASSRLS) — áp lược đồ, nạp dữ liệu mẫu, sao lưu/phục hồi, `/dev/reset` |
| `DB_MIGRATE=false` | Không tự áp `database/cms-api/schema.sql` khi khởi động |
| `PORT` `HOST` `BASE_PATH` `CORS_ORIGINS` `JWT_SECRET` `JWT_EXPIRES_IN` `API_LOG` | Như mock Node (`BASE_PATH` mặc định `/euni-mock-api`; nhận cả URL có và không có tiền tố) |

## Kiến trúc

```text
src/
  HUMG.CMS.Api/             HTTP, endpoint theo module, xác thực token, xác định tenant, lỗi chuẩn hóa, OpenAPI — KHÔNG chứa quy tắc nghiệp vụ
  HUMG.CMS.Application/     use case + phân quyền + điều phối (Features/*: Tenants, Content, Publishing, Announcements, Media,
                            SiteContent, AccessControl, Directory, Audit, Backups, Settings, Datasets, Auth)
  HUMG.CMS.Domain/          quy tắc thuần: bảng chuyển trạng thái workflow, chính sách quyền (grants), đối tượng nhận thông báo, chuẩn hóa tiếng Việt
  HUMG.CMS.Infrastructure/  PostgreSQL (Npgsql), unit-of-work, bảo trì dữ liệu, JWT, lưu file, nạp dữ liệu mẫu
tests/
  HUMG.CMS.Tests/           xUnit: Domain, token, và RLS/transaction trên PostgreSQL thật
  contract/smoke.mjs        118 kiểm tra hành vi API (chính bộ test của mock Node, chạy vào bản .NET)
tools/parity.mjs            so sánh phản hồi mock Node ↔ .NET trên ~720 yêu cầu
database/cms-api/           lược đồ đang dùng (schema.sql), setup role, kiểm thử RLS
database/v2/                lược đồ quan hệ đích (đã vá RLS bảng con) + test
mock-data/ contract/        dữ liệu mẫu (chỉ để NẠP DB trống / dataset hệ thống ngoài) · hợp đồng API + OpenAPI
```

Phụ thuộc một chiều `Api → Application → Domain`; `Infrastructure` cài các interface của Application (`IDocumentStore`, `IDataMaintenance`, `ITokenService`, `IFileStorage`).

Các nguyên tắc của tài liệu và nơi thực hiện:

| Nguyên tắc | Thực hiện |
|---|---|
| Workflow chỉ đi qua use case, không PUT tùy ý đổi trạng thái | `Domain/Workflow/WorkflowTransitions` + `WorkflowService.DoTransition`; `POST …/workflow/{submit,approve,reject,publish,unpublish,archive,approve-revision,reject-revision}`; PUT chỉ nhận nội dung |
| Tin tức và thông báo dùng chung bộ quy tắc nhưng aggregate riêng | `IWorkflowProfile`: `NewsProfile`, `AnnouncementProfile` (targets, receipts, thu hồi, kênh gửi) |
| Ghi nhất quán trong **một transaction** (nội dung + revision + workflow history + audit) | `PostgresDocumentStore`: theo dõi thay đổi cả request, `Flush()` một transaction ngay sau use case (`WithTransactionPerRequest`); lỗi → rollback |
| Version/ETag phát hiện cập nhật đồng thời | `If-Match` / `version` → 409 kèm `currentVersion`; response có `ETag` |
| Phân quyền: quyền chức năng từ token **và** grant theo tenant/category/unit/record; `allowedActions` chỉ để UI, backend kiểm tra lại từng lệnh | `Domain/AccessControl/AccessPolicy`, `AuthorizationService`, kiểm tra quyền bản ghi trong từng use case |
| Tenant từ `X-Tenant`/host chỉ là phạm vi request, không là bằng chứng quyền | `TenantService.Resolve` chỉ chọn phạm vi; quyền suy từ token + grants |
| **Tenant isolation bằng RLS**, role ứng dụng không BYPASSRLS, đặt tenant context trong transaction | `database/cms-api/schema.sql` (policy + `FORCE ROW LEVEL SECURITY`), `app.tenant_ids` (được đọc) / `app.tenant_id` (đang ghi, `WITH CHECK`) đặt bằng `set_config(..., true)` ở mỗi transaction |
| Tác vụ đồng bộ/seed/sao lưu có quyền riêng | role `cms_admin` (BYPASSRLS) qua `IDataMaintenance`, tách khỏi `cms_app` |
| Không để bảng con lọt khỏi RLS | `cms_api`: bản ghi con nằm trong tài liệu của cha và mang `tenant_id` của cha; `database/v2`: đã thêm policy theo bảng cha cho 10 bảng con + test |
| Media: metadata ở DB, file ở object storage | `MediaService` + `IFileStorage` (hiện: đĩa; MinIO = adapter mới) |

### Lược đồ dữ liệu hiện tại và lộ trình

`database/cms-api/schema.sql` lưu mỗi collection (contents, announcements, grants, revisions, audit…) dưới dạng **tài liệu JSONB có id số**,
tách `global_documents` (tenant, danh bạ, cây đơn vị, ngôn ngữ, sao lưu, metadata) và `tenant_documents` (có RLS). Cách này giữ trọn hợp đồng API của mock
nhưng **chưa phải lược đồ quan hệ** `database/v2/schema.sql`. Việc còn lại để tới schema v2 (bảng `news`, `news_translations`, `access_grants`, `audit_logs` partition…):

1. Quyết định bổ sung schema v2 cho các trường mock đang dùng nhưng v2 chưa có: menu loại `heading` + `icon`, `url` cho phép null, `path` của trang hệ thống, `username/status/tenants` của danh bạ, bảng backups.
2. Viết adapter EF Core (`CmsDbContext`) cài `IDocumentStore`/use case tương ứng ở Infrastructure — Application và Api không đổi.
3. Outbox + worker (hẹn giờ xuất bản, sự kiện): hiện tính "đang hiển thị" tại thời điểm đọc (`publishAt ≤ now < expireAt`), FE thấy hành vi giống nhau.
4. Thay `Hs256TokenService` bằng xác thực JwtBearer (issuer IdS, audience `cms-api`); đổi cấu hình SSO/gateway không thuộc phạm vi dự án này.

## Kiểm thử

```bash
dotnet test                                         # đơn vị + RLS (đặt TEST_DATABASE_URL / TEST_DATABASE_ADMIN_URL để chạy phần PostgreSQL)
node tests/contract/smoke.mjs                       # 118 kiểm tra hành vi API (tự chạy API ở cổng 3999, dùng DB SMOKE_DB, mặc định euni_cms)
node tools/parity.mjs                               # đối chiếu mock Node ↔ .NET (cần ../euni-api-mock đã npm ci; DB PARITY_DB, mặc định euni_parity)
sudo -u postgres psql -d euni_cms -f database/cms-api/test.sql          # RLS lược đồ cms_api
psql -d <db trống> -f database/v2/schema.sql -f database/v2/test.sql    # schema v2 (kể cả RLS bảng con)
node ../tools/migration/sync-test.mjs               # 25 kịch bản CMS → website (cần API :3000 + euni-public :3002)
```

Khác biệt **chủ ý** so với mock Node: (1) `GET announcements/{id}/stats` trả 403 khi người dùng không có quyền xem thông báo đó (mock để lộ danh sách người nhận);
(2) mock rò trường `en` vào bản ghi menu Khoa CNTT do seed sai — bản .NET không có; (3) lỗi giữa chừng thì **rollback cả request** (mock giữ lại phần đã ghi);
(4) tenant khác không đọc được dữ liệu của trang này kể cả khi code lọc sót — do RLS.
