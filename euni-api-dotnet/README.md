# euni-api-dotnet — cms-api (.NET 8 + PostgreSQL)

Bản **.NET** của `euni-api-mock` (Node.js), xây theo tài liệu *Kiến trúc code cms-api*: **modular monolith** một API – một database,
dữ liệu **đọc/ghi trực tiếp từ PostgreSQL (lược đồ quan hệ v2)**, cô lập tenant bằng **Row-Level Security**.
Giữ **nguyên hợp đồng HTTP** của mock (`contract/API_CONTRACT.md`) nên `euni-admin` và `euni-public` **không phải sửa gì** —
chỉ cần chạy API ở cổng 3000 (hoặc đổi `NEXT_PUBLIC_API_GATEWAY_URL`). Đánh giá tác động: [`docs/danh-gia-tac-dong.md`](docs/danh-gia-tac-dong.md) · **Hướng dẫn triển khai (trang web, kể cả khi tách 3 repo): [`docs/huong-dan-trien-khai.html`](docs/huong-dan-trien-khai.html)** · thiết kế: [`docs/CMS_DESIGN.md`](docs/CMS_DESIGN.md).

> `euni-api-mock` (Node) vẫn giữ nguyên để đối chiếu. Chỉ chạy **một** trong hai ở cổng 3000.

## Chạy

```bash
# 1) PostgreSQL 16 + role + database (dev; chạy bằng superuser)
sudo -u postgres ./database/v2/setup-dev.sh             # DB euni_cms, role cms_admin (BYPASSRLS) và cms_app (NOBYPASSRLS)
# hoặc: docker compose up --build                        # API + PostgreSQL + MinIO

# 2) API  → http://127.0.0.1:3000   (lần đầu tự áp lược đồ v2 + nạp dữ liệu mẫu nếu DB trống)
dotnet run --project src/HUMG.CMS.Api
```

Tài khoản dev (`AUTH_MODE=mock`, mật khẩu `Humg@2025`): `tvanminh` (cms.admin, mọi trang) · `nthoa` (biên tập trang Trường) · `pvloc` (biên tập Khoa CNTT) ·
`vthuong` (duyệt thông báo P.Đào tạo) · `ltmai` (tác giả) · `dvtung` (CTV chuyên mục Nghiên cứu). Cổng demo: `POST /auth-api/api/v1/auth/login {"role":"student"|"lecturer"|"staff"|"parent"|"manager"}`.
Tenant mẫu `humg` (mặc định) và `cntt` (gửi `X-Tenant: cntt`).
`POST /cms-api/api/v1/dev/reset` đặt lại dữ liệu mẫu (chỉ để phát triển).

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Kết nối của **ứng dụng**: role `cms_app` (NOBYPASSRLS). Chuỗi Npgsql hoặc `postgres://user:pass@host/db` |
| `DATABASE_ADMIN_URL` | Kết nối **bảo trì**: role `cms_admin` (BYPASSRLS) — áp lược đồ, nạp dữ liệu mẫu, sao lưu/phục hồi, `/dev/reset`, worker outbox |
| `DB_MIGRATE=false` | Không tự áp `database/v2/schema.sql` + `amendments.sql` khi khởi động (DBA tự chạy) |
| `STORAGE_PROVIDER` | `local` (đĩa, mặc định) hoặc `s3` (MinIO/S3): `S3_ENDPOINT` `S3_ACCESS_KEY` `S3_SECRET_KEY` `S3_BUCKET` (cms-public) `S3_REGION` `S3_FORCE_PATH_STYLE` |
| `AUTH_MODE` | `mock` (mặc định: tự phát hành JWT HS256 khi dev) hoặc `oidc` (chỉ kiểm tra token của nhà cung cấp định danh) |
| `OIDC_PROVIDER=entra` | **Microsoft Entra ID**: `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID` (cùng giá trị `NEXT_PUBLIC_SSO_TENANT_ID` / `NEXT_PUBLIC_SSO_CLIENT_ID` của hai website). Tự suy ra issuer v2 + v1, audience = client id và `api://{client id}` |
| `OIDC_AUTHORITY` `OIDC_AUDIENCE` `OIDC_ROLE_CLIENT` `OIDC_REQUIRE_HTTPS` | Nhà cung cấp OIDC khác (Keycloak, Identity Server…) |
| `OIDC_GROUP_ROLES` | Entra: `groupObjectId=cms.admin;groupObjectId2=cms.editor,staff` (claim `groups` → role) |
| `CMS_BOOTSTRAP_ADMINS` | Danh sách email (phân tách dấu phẩy) tự có vai trò `cms.admin` khi đăng nhập SSO — tài khoản quản trị đầu tiên |
| `OUTBOX_RELAY=false` · `OUTBOX_POLL_SECONDS` | Tắt worker outbox cùng API (chạy tiến trình riêng) · chu kỳ quét (mặc định 5s) |
| `PORT` `HOST` `BASE_PATH` `CORS_ORIGINS` `JWT_SECRET` `JWT_EXPIRES_IN` `API_LOG` | Như mock Node (`BASE_PATH` mặc định `/euni-mock-api`; nhận cả URL có và không có tiền tố) |

## Nạp dữ liệu vào database

| Cách | Khi nào | Lệnh |
|---|---|---|
| **Tự động** | Mặc định: API khởi động, thấy database TRỐNG → áp lược đồ + nạp dữ liệu (mẫu, mốc ngày tính theo hôm nay) | `dotnet run --project src/HUMG.CMS.Api` |
| **Lệnh khởi tạo** | Muốn nạp trước khi chạy dịch vụ (CI/CD, bước triển khai) | `dotnet HUMG.CMS.Api.dll --init-db` (thêm `--fresh` để xóa sạch và nạp lại) |
| **File SQL** | DBA nạp tay, không chạy ứng dụng | `psql -f database/v2/schema.sql -f database/v2/amendments.sql` rồi `psql -f database/v2/seed-data.sql` (role `cms_admin`, database trống) |

Dữ liệu nạp gồm: 2 tenant (`humg`, `cntt`), cây đơn vị, danh bạ + tài khoản demo, tin tức + bản dịch + revision, thông báo, danh mục, trang + menu, banner, sự kiện, album/video/podcast,
khối trang chủ, cấu hình theo tenant, phân quyền, nhật ký. **Đây là dữ liệu demo**; khi dùng SSO thật, đặt `CMS_BOOTSTRAP_ADMINS` để có quản trị viên đầu tiên rồi thay dần bằng dữ liệu thật
(danh bạ `cms.user_directory`, đơn vị `cms.org_units` do job đồng bộ từ IdS/QLNS ghi bằng role `cms_admin`).

## Kiến trúc

```text
src/
  HUMG.CMS.Api/             HTTP, endpoint theo module, xác định tenant, lỗi chuẩn hóa — KHÔNG chứa quy tắc nghiệp vụ
  HUMG.CMS.Application/     use case + phân quyền + điều phối (Features/*: Tenants, Content, Publishing, Announcements, Media,
                            SiteContent, AccessControl, Directory, Audit, Backups, Settings, Datasets, Auth)
  HUMG.CMS.Domain/          quy tắc thuần: bảng chuyển trạng thái workflow, chính sách quyền (grants), đối tượng nhận thông báo, chuẩn hóa tiếng Việt
  HUMG.CMS.Infrastructure/  PostgreSQL: unit-of-work + ánh xạ tài liệu ↔ bảng v2 (Persistence/Relational), bảo trì dữ liệu, outbox relay,
                            JWT mock + OIDC, lưu file (đĩa / S3-MinIO), nạp dữ liệu mẫu
tests/
  HUMG.CMS.Tests/           xUnit (50): Domain, token, OIDC (kể cả discovery), RLS/transaction/bù trừ/outbox/S3 trên dịch vụ thật
  contract/smoke.mjs        118 kiểm tra hành vi API (chính bộ test của mock Node, chạy vào bản .NET)
  contract/outbox.mjs       thông báo hẹn giờ → worker outbox chốt người nhận đúng lúc đến hạn
  ui/admin-routes.mjs       euni-admin thật (Chromium): đăng nhập bằng form, 21 màn hình, bắt lỗi JS và lỗi API
tools/parity.mjs            so sánh phản hồi mock Node ↔ .NET trên ~720 yêu cầu
database/v2/                schema.sql (v2, đã vá RLS bảng con) + amendments.sql (v2.1) + test.sql + setup-dev.sh
mock-data/ contract/        dữ liệu mẫu (chỉ để NẠP DB trống / dataset hệ thống ngoài) · hợp đồng API + OpenAPI
```

Phụ thuộc một chiều `Api → Application → Domain`; `Infrastructure` cài các interface của Application
(`IDocumentStore`, `IDataMaintenance`, `ITokenService`, `IFileStorage`, `IOutboxHandler`).

| Nguyên tắc của tài liệu | Thực hiện |
|---|---|
| Workflow chỉ đi qua use case, không PUT tùy ý đổi trạng thái | `Domain/Workflow/WorkflowTransitions` + `WorkflowService.DoTransition`; `POST …/workflow/{submit,approve,reject,publish,unpublish,archive,approve-revision,reject-revision}`; PUT chỉ nhận nội dung |
| Tin tức và thông báo dùng chung bộ quy tắc nhưng aggregate riêng | `IWorkflowProfile`: `NewsProfile`, `AnnouncementProfile` (targets, receipts, thu hồi, kênh gửi) |
| Ghi nhất quán trong **một transaction** (nội dung + revision + workflow history + audit + outbox) | `PostgresDocumentStore`: theo dõi thay đổi cả request, `Flush()` một transaction ngay sau use case; lỗi → rollback |
| Version/ETag phát hiện cập nhật đồng thời | `If-Match` / `version` → 409 kèm `currentVersion`; response có `ETag` |
| Phân quyền: quyền chức năng từ token **và** grant theo tenant/category/unit/record; backend kiểm tra lại từng lệnh | `Domain/AccessControl/AccessPolicy`, `AuthorizationService`, kiểm tra quyền bản ghi trong từng use case |
| Tenant từ `X-Tenant`/host chỉ là phạm vi request, không là bằng chứng quyền | `TenantService.Resolve` chỉ chọn phạm vi; quyền suy từ token + grants |
| **Tenant isolation bằng RLS**, role ứng dụng không BYPASSRLS, tenant context đặt trong transaction | `cms_app` NOBYPASSRLS; mỗi transaction `set_config('app.tenant_ids', …, true)` (được đọc) và `app.tenant_id` (đang ghi, `WITH CHECK`) |
| Tác vụ đồng bộ/seed/sao lưu có quyền riêng | role `cms_admin` (BYPASSRLS) qua `IDataMaintenance` và worker outbox |
| Rà soát RLS bảng con | `database/v2/schema.sql`: 10 bảng con thiếu RLS đã được vá bằng policy theo bảng cha + test (xem đánh giá) |
| Outbox cho công việc khởi phát từ giao dịch ghi (lịch xuất bản, sự kiện) | sự kiện `NewsPublished`, `AnnouncementPublished`… ghi vào `cms.outbox` **cùng transaction**, `available_at` = `publishAt`; `OutboxRelay` (SKIP LOCKED, thử lại lùi dần) → `IOutboxHandler` (vd. `AnnouncementFanOutHandler` chốt `recipient_count`) |
| Media: metadata ở DB, file ở object storage; upload + ghi DB là quy trình có **bù trừ**, lỗi dọn file không bị nuốt | `S3FileStorage` (MinIO/S3, `object_key` = `{tenant}/yyyy/MM/{uuid}.{ext}`); `MediaService` đăng ký `OnDiscard(xóa object)`; lỗi bù trừ → `AggregateException` |
| Xác thực JWT/audience; APISIX chỉ làm gateway; không đổi SSO/gateway | `OidcTokenService`: kiểm tra chữ ký (khóa từ discovery của IdS), issuer, audience, hạn dùng; role realm+client → quyền chức năng; chỉ đọc claim |

### Lược đồ dữ liệu

Dữ liệu nằm ở **lược đồ quan hệ `cms` của schema v2** (bảng `news` + `news_translations` + `news_attachments`, `announcements` + `announcement_targets/receipts/translations/attachments`,
`access_grants`, `revisions`, `workflow_history`, `audit_logs` partition theo tháng, `outbox`, `media`, `pages`, `menu_items`, `banners`, `events`, `media_items`, `home_blocks`, `settings`…).
`database/v2/amendments.sql` (v2.1, áp sau schema.sql, idempotent) bổ sung những gì API đang dùng mà v2 chưa có, mỗi mục có ghi lý do:
cột `extra jsonb` cho trường dài đuôi, FK `DEFERRABLE INITIALLY DEFERRED` (một transaction ghi nhiều bảng không phụ thuộc thứ tự), menu loại `heading` + `icon`, `url` nullable, `path` trang hệ thống,
`username/status/tenants` của danh bạ, bảng `backups`/`backup_snapshots`/`app_meta`, policy RLS đọc đa trang (`app.tenant_ids`), quyền ghi `tenants` cho API quản lý trang đơn vị, bỏ CHECK ngày banner.

Lớp ánh xạ tài liệu ↔ bảng viết bằng **Npgsql + khai báo cột** (`Persistence/Relational`), không dùng EF Core: API làm việc với tài liệu JSON đúng hình dạng hợp đồng
(bản ghi + bản dịch + bảng con trong một tài liệu), EF Core sẽ buộc phải dựng ~30 entity chỉ để dịch qua lại — không có lợi thế nào ở giai đoạn này.
Application/Api chỉ biết `IDocumentStore`, nên có thể thay bằng `CmsDbContext` mà không đổi use case.

## Kiểm thử

```bash
dotnet test                                        # 50 test; đặt TEST_DATABASE_URL, TEST_DATABASE_ADMIN_URL (và TEST_S3_ENDPOINT) để chạy phần PostgreSQL/S3
node tests/contract/smoke.mjs                      # 118 kiểm tra hành vi API (tự chạy API ở cổng 3999, DB SMOKE_DB, mặc định euni_cms)
API_URL=http://127.0.0.1:3000 node tests/contract/outbox.mjs     # cần API chạy với OUTBOX_POLL_SECONDS=2
node tools/parity.mjs                              # đối chiếu mock Node ↔ .NET (cần clone euni-api-mock và `npm ci`: MOCK_DIR=…; DB PARITY_DB, mặc định euni_parity)
psql -d <db trống> -f database/v2/schema.sql -f database/v2/amendments.sql -f database/v2/test.sql   # schema v2 (kể cả RLS bảng con, đọc đa trang)
node tests/e2e/sync-test.mjs                      # 25 kịch bản CMS → website (cần API :3000 + euni-public :3002)
CHROME=… PLAYWRIGHT=… node tests/ui/admin-routes.mjs   # giao diện euni-admin thật (cần API :3000 + euni-admin :3001)
```

Khác biệt **chủ ý** so với mock Node: (1) `GET announcements/{id}/stats` trả 403 khi không có quyền xem thông báo đó (mock để lộ danh sách người nhận);
(2) mock rò trường `en` vào bản ghi menu Khoa CNTT do seed sai — bản .NET không có; (3) lỗi giữa chừng thì **rollback cả request** (mock giữ phần đã ghi);
(4) tenant khác không đọc được dữ liệu của trang này kể cả khi code lọc sót — do RLS; (5) bản ghi có thêm `createdAt/updatedAt` (cột NOT NULL của v2), thời gian trả về dạng ISO UTC;
(6) id của các khối trang chủ và album/video/podcast cấp từ một dãy chung (bảng `home_blocks`, `media_items`); (7) vi phạm ràng buộc DB (trùng slug…) trả 409/422 thay vì 500.

## Chưa làm / ghi chú vận hành

Danh sách đầy đủ các phần chưa làm: [`docs/con-lai.md`](docs/con-lai.md).

- `docker-compose.yml` (API + PostgreSQL + MinIO) chưa chạy thử vì môi trường dựng không có Docker; `S3FileStorage` được kiểm thử bằng máy chủ S3 tương thích (moto), chưa chạy với MinIO thật.
- Tìm kiếm công khai vẫn lọc trong bộ nhớ sau khi nạp bản ghi; chuyển sang `search_text` (unaccent + pg_trgm) có sẵn ở v2 khi dữ liệu lớn.
- Bucket `cms-private` (đính kèm thông báo, presigned URL) chưa làm; file đính kèm thông báo hiện chỉ lưu tiêu đề/mô tả.
- Mỗi request chạy tuần tự qua một cổng (như mock). Bỏ cổng để mở rộng ngang: dựa vào `version`/ETag và transaction của PostgreSQL.
- Đổi mật khẩu dev (`cms_app_dev`, `cms_admin_dev`, `JWT_SECRET`) khi triển khai.
