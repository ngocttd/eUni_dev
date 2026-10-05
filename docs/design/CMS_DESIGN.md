# Thiết kế CMS HUMG eUni — giai đoạn 1

> Phạm vi: backend CMS (.NET · PostgreSQL · Redis · MinIO) và những thay đổi tương ứng ở `euni-public`, `euni-admin`, `euni-api-mock`.
> Tài liệu đi kèm: [`euni-api-mock/database/v2/schema.sql`](../../euni-api-mock/database/v2/schema.sql) (DDL tham chiếu),
> [`euni-api-mock/contract/API_CONTRACT.md`](../../euni-api-mock/contract/API_CONTRACT.md) (hợp đồng API, sinh từ mock).

## 0. Giả định cần xác nhận

Các điểm dưới đây chưa được chốt; thiết kế chọn phương án hợp lý nhất và **chỉ ra chỗ phải đổi nếu giả định sai**.

| # | Giả định | Nếu sai thì đổi ở đâu |
|---|---|---|
| A1 | **Tenant = một đơn vị có website riêng** trong HUMG (Trường `humg`, Khoa CNTT `cntt`, …). Mỗi tenant có một hoặc nhiều domain. Nội dung có thể **chia sẻ** từ tenant này sang tenant khác. | §2. Nếu là nhiều trường độc lập: bỏ bảng chia sẻ, cân nhắc tách schema/DB. |
| A2 | **Identity Server (IdS)** là OIDC provider duy nhất. Nó tự xử lý cả **tài khoản trường** và **Microsoft 365** (federation), và đã link hai loại tài khoản thành một `sub`. | §3. Nếu IdS không federate M365 thì FE vẫn gọi IdS, chỉ khác tham số `idp`. |
| A3 | Token của IdS có các claim `sub`, `name`, `email`, `role[]`, `tenant[]`, `unit[]`, `staff_code`/`student_code`. Lớp, bộ môn, khoa của user lấy từ claim `unit[]`, hoặc từ **Membership API** (QLĐT/QLNS) khi token không đủ. | §6.4. |
| A4 | Workflow chạy trên **bản ghi gốc**. Bản dịch EN chỉ có trạng thái dịch (`missing`/`in_progress`/`done`) và chỉ hiển thị công khai khi `done`. | §4. |
| A5 | Giai đoạn 1 **chưa viết code .NET** trong repo này. Repo cung cấp hợp đồng API, DDL và mock chạy đúng hành vi để FE làm việc song song. | — |

## 1. Kiến trúc tổng thể

```text
                    ┌─────────────────────────── Identity Server (OIDC) ───────────────────────────┐
                    │  Tài khoản trường (username/password)   ·   Microsoft 365 (Entra ID, federated) │
                    │  users · roles · tenants · units  →  claims trong token                          │
                    └───────────────▲──────────────────────────────────────▲───────────────────────────┘
                                    │ Authorization Code + PKCE            │ JWKS
 Trình duyệt ── euni-public (Next) ─┤                                      │
 Trình duyệt ── euni-admin  (Next) ─┘                                      │
        │  Bearer JWT + X-Tenant                                           │
        ▼                                                                  │
 API Gateway ──► cms-api (.NET 8, modular monolith) ───────────────────────┘
                   ├─ PostgreSQL 16  (dữ liệu, revision, audit, tìm kiếm unaccent + pg_trgm, RLS theo tenant)
                   ├─ Redis 7        (cache public, membership/ACL cache, lock của job, rate limit)
                   ├─ MinIO          (cms-public: ảnh tin tức · cms-private: tệp đính kèm thông báo)
                   └─ Worker (Hangfire/Quartz) — đăng bài hẹn giờ, hết hạn, gửi thông báo, đồng bộ đơn vị, outbox
```

### 1.1 Cấu trúc solution .NET (gợi ý)

```text
src/
├─ Humg.Cms.Api               ASP.NET Core: controllers, auth, middleware tenant, ProblemDetails, OpenAPI
├─ Humg.Cms.Application       use case (command/query), validator (FluentValidation), DTO, interface hạ tầng
├─ Humg.Cms.Domain            entity, value object, state machine workflow, quy tắc ACL, domain event
├─ Humg.Cms.Infrastructure    EF Core (Npgsql), interceptor audit/revision/tenant, Redis, MinIO, Membership client
└─ Humg.Cms.Worker            Hangfire/Quartz: PublishScheduler, ExpireScheduler, NotificationDispatcher, OrgUnitSync, OutboxRelay
tests/  Humg.Cms.*.Tests  (xUnit + Testcontainers PostgreSQL/Redis/MinIO)
```

Các quy ước xuyên suốt:
- **Tenant:** EF Core Global Query Filter, cộng thêm `SET LOCAL app.tenant_id` để kích hoạt **RLS**.
- **Soft delete:** Global Query Filter `deleted_at IS NULL`.
- **Optimistic concurrency:** dùng cột hệ thống `xmin` (`UseXminAsConcurrencyToken`). API nhận `If-Match: "<version>"`; lệch phiên bản thì trả **409**.
- **Outbox:** mỗi sự kiện (`ContentPublished`, `AnnouncementPublished`, …) được ghi cùng transaction rồi relay sang Redis pub/sub và các job. Nhờ vậy xóa cache và gửi thông báo không bị mất khi tiến trình chết.

## 2. Multi-tenant

### 2.1 Mô hình
- **Shared database, shared schema** (`cms`). Mọi bảng nghiệp vụ có cột `tenant_id varchar(32) NOT NULL`.
- Hai lớp chặn:
  1. EF Core Global Query Filter `e.TenantId == _tenant.Id`.
  2. **PostgreSQL Row-Level Security.** Policy `tenant_id = current_setting('app.tenant_id')`. Ứng dụng kết nối bằng role **không** có `BYPASSRLS`, nên kể cả câu SQL thuần quên `WHERE` cũng không lộ dữ liệu tenant khác.
- Mọi unique index đều có `tenant_id`, ví dụ `(tenant_id, lang, slug) WHERE deleted_at IS NULL`.
- Redis key có prefix `t:{tenant}:`. Đường dẫn MinIO có dạng `{bucket}/{tenant}/yyyy/MM/{uuid}.{ext}`.

### 2.2 Xác định tenant của request

| Kênh | Nguồn | Kiểm tra |
|---|---|---|
| API công khai (`/api/Public/*`) | Header `X-Tenant` do website gửi. Website suy ra tenant từ **host**, ví dụ `cntt.humg.edu.vn` → `cntt`. Thiếu header thì lấy theo host của gateway, cuối cùng mới về tenant mặc định. | Tenant phải tồn tại và đang bật. |
| API quản trị | Header `X-Tenant` (tenant đang chọn ở CMS) | Tenant phải có trong claim `tenant[]` của token, hoặc user có `cms.*`. Sai thì trả **403**. |
| Portal (`/api/Me/*`) | Header `X-Tenant` | Thông báo của user được lọc theo tenant đang xem. Muốn gom mọi tenant thì gửi `X-Tenant: *`, chỉ hợp lệ với `/api/Me/announcements`. |

### 2.3 Chia sẻ nội dung giữa tenant
Bảng `content_shares(tenant_id nguồn, entity_type, entity_id, target_tenant_id, approved_by, approved_at)`.
- Website của tenant B hiển thị bài của tenant A đã được chia sẻ **và đã được B chấp nhận**, ở chế độ chỉ đọc. Link canonical trỏ về A để tránh trùng lặp SEO.
- Giai đoạn 1 mới có bảng và API đọc; màn hình duyệt chia sẻ để giai đoạn 2.

## 3. Đăng nhập: tài khoản trường và Microsoft 365

### 3.1 Nguyên tắc
1. **Mọi đăng nhập đều đi qua IdS** (Authorization Code + PKCE). App **không bao giờ nhận mật khẩu**. Form mật khẩu nằm trên trang của IdS. Không dùng ROPC vì OAuth 2.1 đã bỏ và nó không hỗ trợ MFA.
2. Trang đăng nhập của app có 2 lựa chọn:
   - **Tài khoản trường (HUMG ID):** chuyển sang IdS không kèm gợi ý, IdS hiện form username/password.
   - **Microsoft 365:** chuyển sang IdS kèm gợi ý nhà cung cấp, nên IdS chuyển tiếp thẳng sang Entra ID. Tham số gợi ý có thể cấu hình: Duende dùng `acr_values=idp:<scheme>`, Keycloak dùng `kc_idp_hint=<alias>`.
3. Hai cách đăng nhập cho ra **cùng một `sub`**, vì IdS đã link sẵn. Mọi dữ liệu CMS (tác giả, quyền, người nhận thông báo, lượt đọc) đều tham chiếu `sub`, không tham chiếu email hay mã cán bộ.
4. Backend chỉ tin **một issuer**: JwtBearer với `Authority` là IdS, kiểm tra `aud = cms-api`.
5. Phụ huynh có tài khoản cục bộ trên IdS, với role `parent` và claim `student_code[]` của các con.

### 3.2 Claim cần có trong access token

| Claim | Ví dụ | Dùng cho |
|---|---|---|
| `sub` | `8b1f…` | Định danh duy nhất |
| `name`, `email` | | Hiển thị |
| `role[]` | `cms.editor`, `student`, `staff` | Quyền chức năng (§5.1) và đối tượng của thông báo |
| `tenant[]` | `humg`, `cntt` | Tenant user được quản trị |
| `unit[]` | `BM-KHMT`, `DCCTKT66A` | Đơn vị hoặc lớp **trực tiếp**. CMS tự mở rộng lên các đơn vị cha (§6.4). |
| `staff_code` / `student_code` | `GV0123` / `2151000123` | Tra cứu khi nhắm thông báo theo mã |

Nếu đưa `unit[]` vào token làm token quá lớn, CMS gọi **Membership API** (`GET /qldt-api/api/v1/users/{sub}/memberships`) và cache 15 phút ở `u:{sub}:membership`.

### 3.3 Phiên đăng nhập ở FE
- **Giai đoạn 1:** SPA public client + PKCE. Token giữ trong bộ nhớ và `sessionStorage` như hiện tại. `NEXT_PUBLIC_AUTH_MODE=oidc` bật luồng IdS. `mock` giữ form username/password gọi `auth-api` của mock, chỉ dùng khi phát triển.
- **Giai đoạn 2 (khuyến nghị):** **BFF**. Next.js route handler giữ refresh token ở cookie HttpOnly và proxy `/api/*` sang gateway, để trình duyệt không cầm token.
- Bỏ cách dùng id_token làm Bearer (đang có ở chế độ Entra trực tiếp). Access token phải có `aud = cms-api`.

## 4. Song ngữ Việt – Anh

- Tiếng Việt là bản gốc, nằm ngay trên bảng chính. Bản dịch nằm ở `*_translations(entity_id, lang, …, translation_status)`. Thiết kế hiện tại đã đi đúng hướng này và được giữ lại.
- **Slug riêng theo ngôn ngữ**, đặt trong bảng translation và unique theo `(tenant_id, lang, slug)`.
- Công khai: chỉ bản dịch `done` mới được trả về. Thiếu bản dịch thì quay về tiếng Việt, kèm `language: "vi"` để FE gắn nhãn.
- Workflow không tách theo ngôn ngữ (A4). Sửa bản dịch của bài đang Published cũng đi qua cơ chế "bản sửa đổi chờ duyệt" như sửa bản gốc (§7.2).
- FE (giai đoạn 2): route `/en/...` cùng `hreflang` và canonical. Hiện tại ngôn ngữ chọn bằng state ở client nên công cụ tìm kiếm không index được bản EN.
- Tìm kiếm: `unaccent` chỉ áp cho `vi`; bản `en` dùng `lower()` (§9).

## 5. Phân quyền

### 5.1 Hai lớp quyền

```text
Quyền hiệu lực(user, hành động, bản ghi) =
      Quyền chức năng  — role trong token → tập permission (cấu hình tĩnh ở CMS, không có màn hình quản lý role)
  AND Phạm vi          — có grant khớp (user | đơn vị của user | role của user) × (tenant | chuyên mục | đơn vị sở hữu | chính bản ghi)
  (ngoại lệ: tác giả luôn xem/sửa được bản nháp của mình; cms.* bỏ qua mọi kiểm tra)
```

Bảng ánh xạ role sang quyền chức năng nằm trong `appsettings.json`, mục `Cms:RolePermissions`:

| Role (IdS) | Quyền chức năng |
|---|---|
| `cms.admin` | `cms.*` |
| `cms.editor` | `cms.access`, `news.*`, `announcement.*`, `media.manage`, `category.manage`, `page.manage`, `menu.manage`, `log.view` |
| `cms.reviewer` | `cms.access`, `news.view`, `news.review`, `announcement.view`, `announcement.review` |
| `cms.author` | `cms.access`, `news.view`, `news.edit`, `announcement.view`, `announcement.edit`, `media.manage` |
| (chỉ `cms.admin`) | `grant.manage`, `settings.manage`, `backup.manage` |
| `staff`, `student`, `parent`, `leader` | `portal.<role>.view` (đọc hộp thư thông báo của chính mình) |

Các hành động: `view` · `edit` · `review` (duyệt hoặc từ chối) · `publish` (xuất bản, gỡ, lưu trữ) · `manage` (bao gồm tất cả, kể cả cấp quyền trên phạm vi đó).

### 5.2 Grant: phân quyền mức bản ghi

```sql
cms.access_grants(id, tenant_id,
  principal_type  user | unit | role,          principal_id  (sub | unit code | role)
  resource_type   news | announcement | page | media | *,
  scope_type      tenant | category | unit | record,   scope_id (null | category id | unit code | record id)
  permissions     text[]  -- {view, edit, review, publish, manage}
  expires_at, created_by, created_at, deleted_at)
```

- **Ưu tiên cấp theo phạm vi** (chuyên mục hoặc đơn vị sở hữu). Grant `record` chỉ dùng cho ngoại lệ, nếu không bảng sẽ phình rất nhanh.
- Grant theo `unit` **kế thừa xuống đơn vị con.** Ví dụ grant `review` trên `unit:CNTT` áp dụng cho bài của `BM-KHMT`. Việc khớp dùng `org_units.path` (ltree): `record.owner_unit_path <@ grant.scope_path`.
- Principal `unit` nghĩa là **mọi user thuộc đơn vị đó** (theo membership). Principal `role` nghĩa là mọi user có role đó trong tenant.
- Lọc danh sách được làm **trong SQL**, không lọc sau khi đã truy vấn. Query handler gắn `EXISTS (SELECT 1 FROM access_grants g WHERE …)`, với tập principal của user (sub, các unit kèm đơn vị cha, các role) truyền vào dạng mảng.
- Cache tập principal và grant của user ở Redis `t:{tenant}:acl:{sub}`, TTL 5 phút, xóa khi grant đổi.
- Mỗi bản ghi trả về `allowedActions[]` để UI chỉ hiện nút hợp lệ. Backend vẫn kiểm tra lại ở mỗi lệnh.

### 5.3 Dữ liệu đơn vị
`cms.org_units(tenant_id, code, name, kind: school|faculty|department|office|class, parent_code, path ltree, is_active, synced_at)` là **bản sao chỉ đọc**, đồng bộ từ QLNS/QLĐT bằng job `OrgUnitSync` (hằng đêm và khi có webhook). CMS **không** quản lý user, role hay đơn vị. Bảng `cms.user_directory(sub, display_name, email, staff_code, student_code, units[], last_seen_at)` chỉ để hiển thị và tìm người khi cấp quyền hay nhắm thông báo. Bảng này được cập nhật mỗi lần user gọi API, hoặc đồng bộ từ IdS qua SCIM/API.

## 6. News và Announcement

### 6.1 Quyết định: **hai bảng riêng, dùng chung hạ tầng**

| Tiêu chí | News (tin tức) | Announcement (thông báo) |
|---|---|---|
| Ai đọc | Công khai, ẩn danh | **Chỉ người nhận đã đăng nhập** |
| Truy vấn chính | Liệt kê theo chuyên mục, tìm kiếm, cache mạnh | "Hộp thư của tôi", đếm chưa đọc, theo từng user |
| Workflow | Tác giả → Biên tập duyệt → Xuất bản | Đơn vị soạn → **lãnh đạo đơn vị gửi** duyệt → Xuất bản và **phân phát** (portal/email/push) |
| Trường riêng | Chuyên mục, tag, SEO, nổi bật, trang chủ, lượt xem | Đối tượng nhận, ưu tiên, ghim, yêu cầu xác nhận đã đọc, kênh gửi, thu hồi |
| Tệp đính kèm | Bucket public | **Bucket private + presigned URL** |

Gộp hai loại vào một bảng sẽ có rất nhiều cột nullable. Rủi ro lớn hơn là **lộ thông báo nội bộ qua API tin tức công khai** chỉ vì quên một điều kiện lọc. Hai bảng chia sẻ chung: state machine (§7), revision và audit (§8), attachment, mẫu translation, `owner_unit_code` và ACL (§5).

### 6.2 Bảng News
`cms.news` (thay `cms.posts`) có các cột: `tenant_id, category_id, owner_unit_code, status, publish_at, expire_at, is_featured, show_on_home, view_count, author_sub, …`, cùng các cột workflow và vòng đời (§7, §8). `cms.news_translations(news_id, lang, slug, title, excerpt, body_html, body_text, meta_*, translation_status, search_text)`. API giữ tên **`/api/Contents`** để tương thích Swagger hiện có.

### 6.3 Bảng Announcement

```text
cms.announcements(id, tenant_id, owner_unit_code, category, priority normal|high|urgent,
                  status, publish_at, expire_at, pinned_until, require_ack bool, channels text[] {portal,email,push},
                  author_sub, …workflow, …lifecycle)
cms.announcement_translations(announcement_id, lang, title, body_html, body_text, translation_status, search_text)
cms.announcement_targets(id, announcement_id, audience, unit_code, user_sub, is_exclude)
cms.announcement_receipts(announcement_id, user_sub, delivered_at, read_at, acked_at)   -- PK (announcement_id, user_sub)
cms.announcement_attachments(announcement_id, object_key, file_name, size, mime)        -- bucket cms-private
```

**Đối tượng nhận.** Mỗi dòng `announcement_targets` là phép **AND** của các trường khác null. Các dòng với nhau là phép **OR**, sau đó **trừ đi** các dòng `is_exclude`.

| Ví dụ | audience | unit_code | user_sub |
|---|---|---|---|
| Toàn bộ sinh viên | `student` | | |
| Giảng viên Khoa CNTT (kể cả các bộ môn) | `staff` | `CNTT` | |
| Lớp DCCTKT66A | | `DCCTKT66A` | |
| Cá nhân nhập mã `GV0123` hoặc email | | | `sub` tra được từ `user_directory` |
| Mọi người trong tenant | | | (dòng rỗng) |

### 6.4 Hộp thư của user (đọc khi truy vấn, không fan-out)
1. Dựng **membership** của user: `audiences` lấy từ role (`student`, `staff`, `parent`, `leader`); `units` gồm `unit[]` trực tiếp **cộng mọi đơn vị cha**, ví dụ `DCCTKT66A → BM-KHMT → CNTT → HUMG`. Kết quả cache ở Redis.
2. Truy vấn:
```sql
SELECT a.* FROM cms.announcements a
WHERE a.tenant_id = @tenant AND a.status = 'published' AND a.publish_at <= now()
  AND (a.expire_at IS NULL OR a.expire_at > now()) AND a.deleted_at IS NULL
  AND EXISTS (SELECT 1 FROM cms.announcement_targets t WHERE t.announcement_id = a.id AND NOT t.is_exclude
              AND (t.audience  IS NULL OR t.audience  = ANY(@audiences))
              AND (t.unit_code IS NULL OR t.unit_code = ANY(@units))
              AND (t.user_sub  IS NULL OR t.user_sub  = @sub))
  AND NOT EXISTS (… cùng điều kiện với t.is_exclude …)
ORDER BY (a.pinned_until > now()) DESC, a.priority DESC, a.publish_at DESC
```
3. Cách này **tự đúng khi user đổi lớp hay đơn vị**, vì không có danh sách người nhận nào bị đóng băng.
4. **Fan-out** chỉ dùng cho kênh email/push: khi xuất bản, job `NotificationDispatcher` mở rộng danh sách người nhận qua Membership API, ghi `announcement_receipts.delivered_at` (để biết đã gửi cho ai) rồi gửi theo lô.
5. Lượt đọc và xác nhận được ghi vào `announcement_receipts`. Thống kê đọc (đã đọc / tổng người nhận) dùng số người nhận lúc fan-out.

### 6.5 Workflow riêng của Announcement
Dùng cùng 4 trạng thái (§7), khác ở chỗ:
- Người duyệt là user có `review`/`publish` trên **đơn vị sở hữu**, ví dụ trưởng khoa.
- Thông báo `urgent` cho phép người có `publish` đăng thẳng mà không cần duyệt.
- **Thu hồi** bằng cách chuyển sang `archived` kèm lý do. Hộp thư người nhận sẽ ẩn thông báo, còn receipts vẫn được giữ.
- Khi `expire_at` qua, thông báo tự rời hộp thư. Không cần đổi trạng thái.

## 7. Workflow: Draft → PendingReview → Published → Archived

### 7.1 State machine

```text
            submit                    approve (= publish)
  Draft ───────────► PendingReview ─────────────────────► Published ──archive──► Archived
    ▲  ◄─────reject─────┘                                   │  ▲                     │
    │                                                       │  └──── publish ────────┘ (khôi phục)
    └──────────────────────── unpublish ────────────────────┘
  publish (đăng thẳng, cần quyền publish):  Draft ──► Published
```

| Hành động | Từ | Đến | Quyền | Ghi chú |
|---|---|---|---|---|
| `submit` | Draft | PendingReview | edit | |
| `reject` | PendingReview | Draft | review | **bắt buộc có lý do** (lưu `review_note`, hiện cho tác giả) |
| `approve` | PendingReview | Published | review | Duyệt = đồng ý cho xuất bản (có thể kèm `publishAt` để hẹn giờ). Quyền `publish` dành cho đăng thẳng, gỡ, lưu trữ |
| `publish` | Draft, Archived | Published | publish | |
| `unpublish` | Published | Draft | publish | |
| `archive` | Published, Draft | Archived | publish | |

- **"Đã hẹn giờ" không phải một trạng thái.** Đó là `Published` với `publish_at > now()`. API công khai lọc theo `status = 'published' AND publish_at <= now() AND (expire_at IS NULL OR expire_at > now())`. UI hiển thị nhãn "Hẹn giờ".
- `publish_at` để trống khi xuất bản thì lấy `now()`. `first_published_at` giữ ngày đăng lần đầu để hiển thị.
- **Job `PublishScheduler`** chạy mỗi phút: tìm bản ghi vừa đến `publish_at` hoặc `expire_at`, phát sự kiện để xóa cache Redis và phân phát thông báo. Job giữ lock Redis để nhiều instance không chạy trùng.
- Mỗi chuyển trạng thái ghi một dòng vào `cms.workflow_history(entity_type, entity_id, from, to, action, actor_sub, note, at)`.

### 7.2 Sửa bài đang Published
- Người có `publish`: sửa trực tiếp, tạo revision mới, website đổi ngay.
- Người chỉ có `edit`: thay đổi được lưu thành **bản sửa đổi chờ duyệt** (`revisions.state = 'proposed'`, và bản ghi có `pending_revision_id`). API trả **202**. Bản đang chạy giữ nguyên tới khi người có quyền `review` thực hiện `approve-revision`. Người duyệt cũng có thể `reject-revision` (bắt buộc lý do). Mỗi bản ghi chỉ có tối đa một bản đề xuất đang chờ.

## 8. Revision · Soft delete · Audit

| Cơ chế | Mục đích | Lưu ở đâu |
|---|---|---|
| **Revision** | Xem lại hoặc khôi phục nội dung | `cms.revisions(tenant_id, entity_type, entity_id, version, state current\|proposed\|superseded\|rejected, snapshot jsonb, reason, created_by, created_at)`. Snapshot gồm **bản ghi kèm mọi bản dịch, targets và attachments**. Mỗi lần lưu tăng `version`. "Khôi phục v5" tạo **v(n+1)** có nội dung giống v5, không ghi đè lịch sử. |
| **Soft delete** | Thùng rác, khôi phục | Cột `deleted_at`, `deleted_by`. Global filter ẩn bản ghi đã xóa. Unique index là partial (`WHERE deleted_at IS NULL`) để dùng lại được slug. Xóa vĩnh viễn chỉ có `cms.*`, và job dọn thùng rác sau 90 ngày. |
| **Audit** | Ai làm gì, lúc nào, ở đâu (tuân thủ) | `cms.audit_logs(id, tenant_id, at, actor_sub, actor_name, action, entity_type, entity_id, entity_label, changes jsonb {field: [old,new]}, ip, user_agent, correlation_id)`. **Chỉ ghi thêm**: role ứng dụng không có quyền UPDATE/DELETE. Partition theo tháng. Ghi bằng `SaveChangesInterceptor`, nên ghi cả thao tác không phải nội dung (cấp quyền, cấu hình, đăng nhập vào CMS). |

Revision và audit **không trùng vai trò**: revision lưu nội dung đầy đủ để khôi phục, audit lưu diff gọn để truy vết. Audit tham chiếu `revision_version` khi có.

## 9. Tìm kiếm (PostgreSQL, chưa dùng Elasticsearch)

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- unaccent() là STABLE nên không dùng được trong index/generated column → bọc lại bằng hàm IMMUTABLE
CREATE FUNCTION cms.f_unaccent(text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

ALTER TABLE cms.news_translations ADD COLUMN search_text text GENERATED ALWAYS AS
  (cms.f_unaccent(lower(coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(body_text,'')))) STORED;
CREATE INDEX ix_news_tr_search ON cms.news_translations USING gin (search_text gin_trgm_ops);
```

- Lưu `body_text` là bản đã bỏ thẻ HTML, do backend tính khi lưu.
- Truy vấn dùng `WHERE search_text ILIKE '%' || cms.f_unaccent(lower(@q)) || '%'`, được index trigram hỗ trợ. Có thể thêm `OR search_text % @q` để chịu lỗi gõ sai. Xếp hạng bằng `similarity(...) * 0.7 + độ mới * 0.3`.
- Luôn lọc theo tenant, ngôn ngữ, trạng thái Published và còn hiệu lực. Tìm kiếm thông báo còn phải lọc thêm theo đối tượng nhận (§6.4).
- Bọc sau interface `ISearchService` (`PgSearchService`) để sau này thay bằng Elasticsearch mà không đổi API.

## 10. Redis và MinIO

**Redis:**
- Cache công khai: `t:{tenant}:pub:{lang}:{key}:v{n}`. Xóa cache bằng cách **tăng version** `t:{tenant}:pubver` khi có sự kiện publish, unpublish, sửa hay hẹn giờ đến hạn, thay vì `KEYS *`. TTL 10 phút làm lưới an toàn.
- Membership/ACL: `u:{sub}:membership` (15 phút), `t:{tenant}:acl:{sub}` (5 phút).
- Lock cho job: `lock:publish-scheduler` (RedLock hoặc `SET NX PX`).
- Rate limit API công khai và tìm kiếm.
- Redis **không phải nguồn dữ liệu gốc**. Mất Redis chỉ làm hệ thống chậm đi, không sai dữ liệu.

**MinIO:**

| Bucket | Nội dung | Truy cập |
|---|---|---|
| `cms-public` | Ảnh và tệp của tin tức, banner, media công khai | Public read qua CDN hoặc reverse proxy, URL cố định |
| `cms-private` | Tệp đính kèm thông báo, bản sao lưu | **Presigned GET 5 phút**, chỉ cấp sau khi kiểm tra user là người nhận hoặc có quyền quản trị |

- Upload đi qua backend ở giai đoạn 1: giới hạn kích thước, kiểm tra MIME bằng magic bytes, tùy chọn quét ClamAV. Giai đoạn 2 chuyển sang presigned PUT.
- Ảnh được sinh các biến thể (thumb, 800, 1600, webp) bằng job.
- Bảng `media` lưu `bucket`, `object_key`, `tenant_id`, `owner_unit_code`, và áp ACL như nội dung.

## 11. Hợp đồng API: thay đổi so với hiện tại

Mọi request đều có header **`X-Tenant`**; request quản trị có thêm `Authorization: Bearer <token của IdS>`. Lỗi trả theo ProblemDetails (RFC 7807): `{ type, title, status, detail, errors }`.

| Nhóm | Endpoint | Ghi chú |
|---|---|---|
| Ngữ cảnh | `GET /api/Me/context` | user, `tenants[]` user được quản trị, `permissions[]`, membership |
| Tin tức | `GET/POST /api/Contents`, `GET/PUT/DELETE /api/Contents/{id}` | `status` dạng chuỗi `draft\|pending_review\|published\|archived`. Có `version` (If-Match) và `allowedActions[]`. DELETE là xóa mềm. |
| Workflow | `POST /api/Contents/{id}/workflow/{action}` body `{ note?, publishAt? }` | Các action ở §7.1, cộng `approve-revision` và `reject-revision` |
| Lịch sử | `GET /api/Contents/{id}/revisions`, `GET …/revisions/{version}`, `POST …/revisions/{version}/restore`, `GET /api/Contents/{id}/history` | |
| Thùng rác | `GET /api/Contents/trash`, `POST /api/Contents/{id}/restore` | |
| Thông báo (quản trị) | Như tin tức nhưng là `/api/Announcements…`, thêm `GET /api/Announcements/{id}/stats` | `targets[]` trong body |
| Hộp thư | `GET /api/Me/announcements?unread=&category=`, `GET /api/Me/announcements/unread-count`, `POST /api/Me/announcements/{id}/read`, `POST …/ack`, `POST /api/Me/announcements/read-all` | Dành cho portal SV/GV |
| Phân quyền | `GET/POST /api/Grants`, `PUT/DELETE /api/Grants/{id}` | Thay `/api/Users` và `/api/Roles` (bị bỏ) |
| Danh bạ | `GET /api/Directory/users?keyword=` (tên, email, mã), `GET /api/OrgUnits` | Chỉ đọc |
| Audit | `GET /api/AuditLogs?entityType=&entityId=&actor=&from=&to=` | `/api/ActivityLogs` vẫn giữ làm alias |
| CRUD khác | Banner, album, video, … giữ nguyên | Thêm soft delete và `POST /api/{res}/{id}/restore` |

## 12. Thay đổi ở repo này (đã làm trong nhánh)

Kiểm thử đi kèm (tất cả đạt):

| Lệnh | Phạm vi |
|---|---|
| `cd euni-api-mock && npm test` | 67 kiểm tra hành vi API: tenant, workflow, hẹn giờ, bản sửa đổi chờ duyệt, concurrency, revision, thùng rác, ACL theo đơn vị/chuyên mục/bản ghi, grants, announcements + hộp thư, audit |
| `npm run db:v2:test` (cần PostgreSQL 16) | schema v2 + RLS chặn ghi/đọc chéo tenant, `v_news_live` theo giờ đăng, tìm kiếm không dấu, `news_allowed` theo cây đơn vị, `inbox()` với loại trừ, audit chỉ ghi thêm |
| `node tools/migration/e2e-v2.mjs` | 24 bước trên trình duyệt thật: tác giả → biên tập duyệt, sửa bài đã đăng → duyệt bản sửa đổi, tab lịch sử, chọn tenant, thông báo cho lớp → SV nhận và xác nhận, GV thấy thông báo của khoa cha, phân quyền, audit, website theo host |
| `node tools/migration/sso-test.mjs` (3 chế độ `entra` / `keycloak` / `ids`) | OIDC + PKCE, gợi ý IdP cho nút Microsoft 365, claim chuẩn của IdS (`role`, `tenant`, `unit`, `staff_code`) |
| `sync-test.mjs`, `e2e-cms-write*.mjs` | Kiểm thử cũ đã cập nhật theo workflow mới |


| Repo | Thay đổi |
|---|---|
| `euni-api-mock` | Tenant (`X-Tenant`, 2 tenant mẫu `humg`, `cntt`). Workflow chuỗi, hẹn giờ và hết hạn, bản sửa đổi chờ duyệt. Revision, khôi phục, thùng rác, audit kèm diff, concurrency qua `version`. Grants với ACL theo tenant/chuyên mục/đơn vị/bản ghi, cùng `allowedActions`. Org units, danh bạ, Announcements kèm targets/receipts, hộp thư `/api/Me/*`. `auth-api` đóng vai IdS (claim `role`, `tenant`, `unit`). Bỏ `/api/Users` và `/api/Roles`. Có `database/v2/schema.sql`. |
| `euni-admin` | Chọn tenant. Danh sách bài viết theo trạng thái mới kèm nút workflow và thùng rác. Trình soạn có nút workflow theo `allowedActions`, tab **Lịch sử** (revision, khôi phục, workflow) và xử lý xung đột phiên bản. Màn hình **Thông báo** (soạn, đối tượng nhận, duyệt, thống kê đọc). Màn hình **Phân quyền** chuyển sang grants. Bỏ màn hình Người dùng. |
| `euni-public` | Đăng nhập qua IdS với 2 lựa chọn (tài khoản trường / M365); chế độ `mock` giữ form dev. Gửi `X-Tenant` theo host. Hộp thư thông báo của SV/GV đọc từ `/api/Me/announcements`. |

## 13. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| **1a** (backend) | Khung .NET: auth IdS, tenant và RLS, News với workflow, revision, audit, soft delete, tìm kiếm PG, cache Redis, MinIO public. |
| **1b** | Announcements với targets, hộp thư, receipts, MinIO private, `NotificationDispatcher` (email), Grants, đồng bộ OrgUnits. |
| **2** | BFF và cookie HttpOnly, route `/en`, duyệt chia sẻ nội dung giữa tenant, push notification, presigned upload, Elasticsearch nếu cần. |

## 14. Rủi ro và việc cần quyết

1. **Nguồn membership** (lớp, bộ môn) là phụ thuộc lớn nhất của Announcement. Cần thống nhất với QLĐT/QLNS về API hoặc claim (A3).
2. **Kích thước token** khi `unit[]` dài. Nên đưa membership ra API riêng thay vì đặt trong token.
3. **Fan-out email** cho "toàn bộ sinh viên" (hàng chục nghìn người) cần gửi theo lô và giới hạn tốc độ SMTP. Phải thống nhất nhà cung cấp email.
4. **Đồng bộ đơn vị**: khi đơn vị bị đổi mã hoặc sáp nhập, grant và target dùng mã cũ. Cần có bảng ánh xạ alias, hoặc job remap.
5. **RLS và connection pool**: phải dùng `SET LOCAL` trong transaction và không dùng `SET` thường, nếu không tenant sẽ bị "rò" sang request khác dùng chung kết nối.
