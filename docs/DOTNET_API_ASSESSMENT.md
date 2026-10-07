# Đánh giá tác động: chuyển `euni-api-mock` (Node.js) sang .NET

> Viết **trước khi xây dựng** repo mới `euni-api-dotnet/`. Cơ sở: tài liệu *Kiến trúc code cms-api* (modular monolith .NET),
> mã nguồn `euni-api-mock/src/*`, và cách `euni-admin`, `euni-public`, `tools/migration/*` gọi API.

## 1. Kết luận

**Không phải sửa `euni-admin` và `euni-public`** — với điều kiện bản .NET giữ nguyên *hợp đồng HTTP* của mock hiện tại
(`euni-api-mock/contract/API_CONTRACT.md`). Cả hai app chỉ biết đến:

- một base URL (`NEXT_PUBLIC_API_GATEWAY_URL`) ghép chuỗi với `/<service>/api/v1/...`;
- header `X-Tenant`, `Authorization: Bearer`;
- JSON `{ items, pageIndex, pageSize, totalItems, totalPages }` và lỗi `{ message }`.

Không app nào import code của mock; không có SDK/generated client. Đổi công nghệ phía sau gateway là trong suốt với FE.
Việc cần làm ở FE chỉ là **đổi biến môi trường** khi muốn trỏ sang bản .NET (nếu .NET chạy cổng khác 3000).

Mock cũ **giữ nguyên, không xóa**: repo mới được tạo thêm, chạy song song để đối chiếu.

## 2. Điểm FE đang phụ thuộc → cách bản .NET giữ nguyên

| # | FE phụ thuộc vào | Rủi ro nếu lệch | Cách giữ nguyên trong .NET |
|---|---|---|---|
| 1 | Base URL ghép chuỗi `${gateway}/${service}${path}` (`client.js`), mock nhận **cả có và không có** tiền tố `BASE_PATH` (`/euni-mock-api`) | 404 khi chạy sau API gateway | Middleware `UsePathBase` + vẫn phục vụ đường dẫn không tiền tố |
| 2 | Cổng 3000 (`.env.example` của 2 app, `scripts/dev-all.ps1`, 14 script trong `tools/migration/*`) | App/test không kết nối được | .NET mặc định lắng nghe `127.0.0.1:3000` (`PORT`, `HOST` như Node) |
| 3 | CORS: origin 3001/3002, header tùy biến `X-Tenant`, `Authorization`, `If-Match`; FE đọc `ETag`, `X-Total-Count` | Preflight bị chặn → admin không lưu được | `CORS_ORIGINS` đọc cùng biến; cho phép mọi header/method; `ExposedHeaders = ETag, X-Total-Count` |
| 4 | Tenant: `X-Tenant` → host → mặc định; `*` = mọi trang; `/admin/tenants` không bị chặn bởi trang đang tắt; tenant lạ/tắt → **400** | Website Khoa (`cntt.localhost`) hiện sai trang | Port nguyên logic `tenant.js` thành middleware |
| 5 | Phản hồi **thô** (không bọc `{success,data}`); FE `unwrap()` chấp nhận cả hai | Không có (FE đã tương thích) | Giữ thô như mock; bọc envelope chỉ làm khi backend thật chốt |
| 6 | Tên trường JSON **camelCase**, id số nguyên, ngày là chuỗi ISO, trường `null` vẫn có mặt (vd. `pendingRevision: null`) | Form admin/website hiển thị thiếu dữ liệu | Bản ghi giữ dạng tài liệu JSON (`JsonObject`) đúng như mock; không đổi tên trường |
| 7 | Mã trạng thái có nghĩa: 201 tạo, 202 *bản sửa đổi chờ duyệt*, 204 xóa, 409 xung đột version (kèm `currentVersion`), 422 validate, 403/401 | FE hiểu sai kết quả lưu | Port đúng từng mã; kiểm thử bằng chính `smoke.mjs` |
| 8 | Concurrency: `If-Match` hoặc `body.version`, trả `ETag: "<version>"` | Mất cập nhật đồng thời | Port `checkVersion` |
| 9 | `allowedActions` trên từng bản ghi quyết định nút hiện ra | Nút sai quyền | Port nguyên `acl.js` vào `Domain/AccessControl` |
| 10 | URL media **tương đối** (`cms-api/uploads/x.png`), không bắt đầu bằng `/` (`mediaUrl()` + tiền tố gateway) | Ảnh vỡ khi chạy sau gateway | Giữ quy ước; phục vụ tĩnh `/cms-api/uploads` |
| 11 | Đăng nhập mock `auth-api` (`AUTH_MODE=mock`): `login/me/refresh/logout`, tài khoản `tvanminh…`, mật khẩu `Humg@2025`, 5 vai demo | Không đăng nhập được khi dev | Port `auth.js`; JWT HS256 cùng tên claim (`sub, roles, perms, tenants, units, staff_code, student_code`) |
| 12 | `POST /cms-api/api/v1/dev/reset` (dùng bởi e2e, `sync-test`) | Bộ test e2e hỏng | Giữ endpoint (chỉ bật ngoài Production) |
| 13 | Dataset các service ngoài `qlns/qlkhcn/edusoft/esb` + dataset tĩnh của cms (`cooperation/life/utilities`) từ `mock-data/*.json` | Trang Giới thiệu/Đào tạo/Portal trống | Port `datasets.js`, dùng lại đúng các file JSON |
| 14 | Multipart: `media/upload` (field `file`, `altText`, `caption`, `folder`), `backups/restore` | Upload hỏng | `IFormFile` cùng tên field |
| 15 | Hợp đồng `openapi.json` phục vụ ở `/docs/openapi.json` | Tài liệu BE lệch | Copy nguyên `contract/`, phục vụ cùng đường dẫn |

## 3. Cơ sở dữ liệu (theo tài liệu kiến trúc) và các điểm khác mock

**Yêu cầu bổ sung từ người đặt bài: dữ liệu phải đọc trực tiếp từ database, không lấy từ file JSON như mock Node.** Bản .NET dùng PostgreSQL
làm nguồn duy nhất lúc chạy; `mock-data/*.json` chỉ còn để *nạp* database trống lần đầu và làm dataset cho các hệ thống ngoài (qlns, qlkhcn, edusoft, esb).

| Nội dung tài liệu | Bản .NET |
|---|---|
| Modular monolith: `Api → Application → Domain`, `Infrastructure` cài interface | **Có** — 4 project, chia `Features/*`; endpoint chỉ gọi use case |
| Workflow chỉ qua use case (`Submit/Approve/Reject/Publish/RestoreRevision`), không PUT tùy ý đổi trạng thái | **Có** — `WorkflowTransitions` dùng chung tin tức + thông báo, aggregate/profile riêng |
| Ghi nhất quán trong **một transaction**: nội dung + revision + workflow history + audit (+ outbox) | **Có** (trừ outbox) — unit-of-work trên PostgreSQL, commit ngay sau use case, lỗi → rollback |
| Version/ETag phát hiện cập nhật đồng thời | **Có** |
| Authorization: quyền chức năng từ token + grant theo tenant/category/unit/record; backend kiểm tra lại từng lệnh | **Có** |
| **Tenant isolation: resolve tenant đầu request, áp vào truy vấn, đặt tenant context cho RLS trong transaction; role ứng dụng không BYPASSRLS; tác vụ đồng bộ có quyền riêng** | **Có** — `cms_app` (NOBYPASSRLS, `FORCE ROW LEVEL SECURITY`), `set_config('app.tenant_ids'/'app.tenant_id', …, true)` mỗi transaction; `cms_admin` (BYPASSRLS) riêng cho seed/sao lưu/migrate |
| **Rà soát RLS bảng con** (`announcement_translations/targets/receipts`, attachments…) — RLS không tự kế thừa qua JOIN | **Đã rà và vá** ở `database/v2/schema.sql`: 10 bảng con thiếu RLS trong khi `cms_app` có quyền trực tiếp → tenant khác đọc được (test tái hiện: `cntt` đọc 5 dòng `announcement_targets` của `humg`). Đã thêm policy theo bảng cha + test. Lược đồ `cms_api` đang dùng không có bảng con tách rời (con nằm trong tài liệu của cha, mang `tenant_id` của cha) |
| EF Core + `CmsDbContext` + lược đồ quan hệ v2 | **Chưa** — dùng Npgsql + tài liệu JSONB để giữ trọn hợp đồng mock. Chuyển sang v2 cần bổ sung schema v2 (menu `heading`/`icon`, `url` nullable, `path` trang hệ thống, `username/status/tenants` danh bạ, bảng backups) rồi viết adapter EF — Application/Api không đổi |
| Outbox + worker (hẹn giờ xuất bản, sự kiện) | **Chưa** — "đang hiển thị" tính tại thời điểm đọc (`publishAt ≤ now < expireAt`) |
| MinIO cho media | `IFileStorage` + lưu đĩa; MinIO = adapter mới |
| JWT/audience, APISIX ở biên | JWT HS256 tự phát hành (token dùng chung được với mock Node); nối IdS thật = đổi sang JwtBearer. Không đổi SSO/gateway |

Khác biệt hành vi **chủ ý** so với mock: (1) `GET announcements/{id}/stats` trả 403 khi không có quyền xem thông báo (mock để lộ danh sách người nhận);
(2) lỗi giữa chừng → rollback cả request (mock giữ phần đã ghi); (3) tenant khác không thể đọc dữ liệu của trang này kể cả khi code lọc sót (RLS);
(4) mock rò trường `en` vào bản ghi menu Khoa CNTT do seed sai — .NET không có.

## 4. Rủi ro và cách kiểm soát

1. **Lệch hành vi tinh vi** (thứ tự sắp xếp, mã lỗi, thông điệp tiếng Việt).
   → Chạy lại **cùng bộ kiểm thử hành vi** `smoke.mjs` trỏ vào bản .NET, cộng script so sánh phản hồi hai bản (`tools/parity.mjs`), cộng chạy `euni-public` thật.
2. **Ngày tương đối** (banner, thông báo hẹn giờ trong dữ liệu mẫu tính theo "hôm nay").
   → Seed viết lại bằng C# với cùng quy tắc ngày.
3. **Chuỗi/Unicode** (`norm()` bỏ dấu tiếng Việt, `đ`→`d`) → port bằng `NormalizationForm.FormD` + cùng bước thay thế.
4. **Song song**: mock đơn luồng, .NET đa luồng → mỗi request chạy tuần tự qua một cổng (như mock) và là một transaction; bỏ cổng khi cần mở rộng, lúc đó dựa vào `version`/ETag.
5. **Hai bản cùng tồn tại** dễ nhầm → cổng mặc định như nhau; chỉ chạy một bản mỗi lần (`npm run dev:api` hoặc `npm run dev:api:dotnet`).

## 5. Phạm vi thay đổi trong workspace

- **Thêm mới**: `euni-api-dotnet/` (repo độc lập, cùng quy ước các repo `euni-*`), tài liệu này.
- **Sửa nhỏ, không phá vỡ**: `package.json` gốc (thêm script `dev:api:dotnet`, `test:api:dotnet`), `README.md` gốc (giới thiệu repo), `scripts/git-init.mjs` (thêm repo vào danh sách).
- **Không đổi**: `euni-admin`, `euni-public`, `euni-api-mock` (kể cả hợp đồng).

## 6. Kết quả kiểm chứng (sau khi xây dựng)

| Kiểm tra | Kết quả |
|---|---|
| `smoke.mjs` — bộ 118 kiểm tra hành vi của mock Node (tenant, workflow, ACL, revision, bản sửa đổi chờ duyệt, concurrency, thùng rác, audit, thông báo + hộp thư, trang đơn vị) chạy vào bản .NET + PostgreSQL | **118/118 đạt** |
| `tools/parity.mjs` — 724 yêu cầu (public, dataset hệ thống ngoài, auth, admin theo 6 vai trò × 2 tenant, hộp thư 6 vai trò × 3 phạm vi tenant, chuỗi ghi: tạo → sửa → xung đột version → gửi duyệt → duyệt → đề xuất sửa → duyệt bản sửa → khôi phục revision → xóa/khôi phục, thông báo, grants, tenants, sao lưu) so với mock Node | **0 khác biệt không chủ ý**; 11 khác biệt chủ ý (mục 3); token phát hành bởi bản này dùng được ở bản kia |
| `tools/migration/sync-test.mjs` — **`euni-public` Next.js thật** chạy trên API .NET, 25 kịch bản CMS → website (gồm website Khoa, trang đơn vị mới) | **25/25 đạt**, không sửa dòng nào của `euni-public` |
| `dotnet test` — 32 test: quy tắc Domain, token, RLS/transaction trên PostgreSQL thật bằng role `cms_app` | 32/32 đạt |
| `database/cms-api/test.sql`, `database/v2/test.sql` (kèm kiểm thử RLS bảng con) | đạt |
| Khởi động trên database trống | tự áp lược đồ và nạp dữ liệu mẫu; chạy qua `BASE_PATH` lẫn không tiền tố |

Chưa chạy: UI của `euni-admin` bằng trình duyệt (e2e Playwright). Lý do tin vẫn đúng: hợp đồng được đối chiếu ở mức phản hồi (mục trên) và admin chỉ dùng chính các endpoint/hình dạng đó.
