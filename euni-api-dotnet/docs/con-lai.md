# euni-api-dotnet — các phần chưa làm

Cập nhật: sau khi chuyển sang lược đồ quan hệ v2, outbox, S3/MinIO, OIDC. Nội dung đã làm và kết quả kiểm chứng: [danh-gia-tac-dong.md](danh-gia-tac-dong.md) · [README.md](../README.md) · [huong-dan-trien-khai.html](huong-dan-trien-khai.html).

## 1. Chưa kiểm chứng được (đã viết nhưng chưa chạy thật)

| Việc | Hiện trạng | Cần để hoàn tất |
|---|---|---|
| `docker-compose.yml` (API + PostgreSQL + MinIO) | Đã viết, chưa chạy vì môi trường dựng không có Docker | Chạy `docker compose up --build`, kiểm tra API lên và upload file đi vào MinIO |
| MinIO thật | `S3FileStorage` chỉ thử với máy chủ S3 tương thích (moto) | Chạy test với MinIO thật: `TEST_S3_ENDPOINT=<minio>` rồi `dotnet test`; thử `S3_FORCE_PATH_STYLE`, bucket, quyền |
| Đăng nhập Microsoft Entra ID thật (tenant `c852d62b-…`, app SPA `5a7cce06-…`) | API đã hỗ trợ (`AUTH_MODE=oidc`, `OIDC_PROVIDER=entra`): tải được discovery + JWKS thật của tenant (test `TEST_ENTRA_LIVE=1`), kiểm tra issuer v2/v1, audience, ghép danh bạ theo email, app role/nhóm → role CMS, `CMS_BOOTSTRAP_ADMINS`. **Chưa thử với một lần đăng nhập thật** (cần tài khoản người dùng) | Ở Azure: đăng ký Redirect URI của hai website (loại SPA), tạo **App roles** `cms.admin`… và gán cho người dùng/nhóm (FE `euni-admin` quyết định vào `/cms` dựa trên claim `roles` trong id_token), đặt `CMS_BOOTSTRAP_ADMINS`; đăng nhập thử và xem `/me/context` |
| Nhà cung cấp OIDC khác (Keycloak/Identity Server) | Hỗ trợ qua `OIDC_AUTHORITY`/`OIDC_AUDIENCE`, mới thử bằng khóa cục bộ + discovery giả lập | Kiểm tra tên claim thật, chỉnh `OidcTokenService.ToPrincipal` nếu khác |
| CI GitHub Actions (`euni-api-dotnet/.github/workflows/ci.yml`) | Chưa chạy trên GitHub | Đẩy lên repo có Actions, sửa lỗi môi trường nếu có (moto, PostgreSQL service, quyền role) |
| Bộ e2e giao diện cũ (`tools/migration/e2e-cms-write*.mjs`, `e2e-v2`, `e2e-tenants`, `e2e-logout`) | 21/33 bước lỗi trên cả mock Node lẫn .NET (kết quả giống hệt): script lỗi thời so với giao diện hiện tại (selector, dữ liệu mong đợi) | Cập nhật selector/kỳ vọng theo giao diện `euni-admin` hiện tại, rồi chạy lại để có bộ e2e ghi dữ liệu qua UI |

## 2. Chưa làm (tính năng / kỹ thuật)

1. **Repo GitHub riêng cho `euni-api-dotnet`** — hiện chỉ là thư mục trong repo này (giống `euni-admin`, `euni-public`). Tách bằng `git subtree split` hoặc `scripts/git-init.mjs` khi cần.
2. **Bucket `cms-private`** (đính kèm thông báo, presigned URL) — file đính kèm thông báo hiện chỉ lưu tiêu đề/mô tả (`announcement_attachments.media_id` để trống).
3. **Kênh gửi email/push của thông báo** — `AnnouncementFanOutHandler` mới chốt số người nhận (`recipient_count`); chưa có hạ tầng gửi, chưa ghi `delivered_at`.
4. **Tìm kiếm trong database** — `GET /public/search` và lọc từ khóa vẫn chạy trong bộ nhớ sau khi nạp bản ghi. Chuyển sang `search_text` (unaccent + pg_trgm) có sẵn ở v2 khi dữ liệu lớn.
5. **Nạp dữ liệu theo tenant ở tầng SQL** — mỗi request nạp cả collection (đã bị RLS giới hạn theo tenant) rồi lọc/phân trang trong bộ nhớ. Cần đẩy lọc/sắp xếp/phân trang xuống SQL (dùng các chỉ mục `ix_news_*`, `ix_ann_*` của v2) trước khi dữ liệu lớn (đặc biệt `activityLogs`/`audit_logs`).
6. **Bỏ cổng tuần tự hóa request** — mỗi request đang chạy lần lượt qua một cổng (như mock Node). Muốn mở rộng ngang: bỏ cổng, dựa vào `version`/ETag + transaction PostgreSQL, kiểm thử tải.
7. **EF Core / `CmsDbContext`** — tài liệu đề xuất EF Core; hiện dùng Npgsql + ánh xạ khai báo (`Persistence/Relational`). Application/Api chỉ phụ thuộc `IDocumentStore`, nên đổi được mà không sửa use case, nhưng chưa làm.
8. **Tách worker outbox** thành tiến trình riêng (`OUTBOX_RELAY=false` ở API) — cơ chế đã có, chưa có project/Dockerfile riêng; chưa có handler xóa cache (chưa có Redis).
9. **Partition audit hằng tháng** — `cms.ensure_audit_partition(date)` tạo tháng hiện tại và tháng sau khi khởi động; cần job định kỳ (hoặc pg_partman) gọi hàm này.
10. **Ràng buộc DB nới lỏng so với v2 gốc** (ghi trong `database/v2/amendments.sql`) cần đội backend xác nhận có giữ hay siết lại khi dữ liệu thật thay dữ liệu mẫu: bỏ UNIQUE `staff_code` (dữ liệu mẫu trùng mã), bỏ UNIQUE slug của trang (trang hệ thống), bỏ CHECK ngày banner (cho phép "hết hạn ngay"), quyền ghi `tenants`/`tenant_domains` cho role ứng dụng (API quản lý trang đơn vị).
11. **Bảo mật khi triển khai** — đổi mật khẩu dev (`cms_app_dev`, `cms_admin_dev`), `JWT_SECRET`, tắt `POST /dev/reset` ở môi trường thật (hiện chỉ chặn bằng việc không dùng), bật `OIDC_REQUIRE_HTTPS`.
12. **Hợp đồng OpenAPI** — `contract/openapi.json` là bản sao từ mock; chưa sinh từ bản .NET và chưa có test hợp đồng tự động so khớp schema.

## 3. Khác biệt chủ ý so với mock Node (không phải việc còn lại, để tham chiếu)

`announcements/{id}/stats` kiểm tra quyền bản ghi (403); lỗi giữa chừng rollback cả request; bản ghi có `createdAt/updatedAt`; id khối trang chủ/album-video-podcast dùng dãy chung; vi phạm ràng buộc DB → 409/422; mock rò trường `en` vào menu Khoa CNTT (bản .NET không có).

## Dataset phân hệ ngoài vẫn đọc từ file JSON

Các dataset của `qlns-api`, `qlkhcn-api`, `edusoft-api`, `esb-api` (về, tổ chức, khoa học công nghệ, tuyển sinh, đào tạo, thư viện, cổng My eUni) và `cooperation`, `life`, `utilities` của cms-api được nạp từ `mock-data/*.json` khi API khởi động qua `FileMockData`. Chúng chưa nằm trong PostgreSQL. Nội dung CMS (tin, thông báo, trang, menu, banner, người dùng, quyền…) thì đã đọc trực tiếp từ database. Khi có hệ thống nguồn thật (QLNS, QLKHCN, Edusoft, ESB), thay `DatasetService` bằng client gọi hệ thống đó, hoặc đưa dữ liệu vào bảng riêng nếu CMS tự quản.
