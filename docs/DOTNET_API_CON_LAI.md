# euni-api-dotnet — các phần chưa làm

Cập nhật: sau khi chuyển sang lược đồ quan hệ v2, outbox, S3/MinIO, OIDC. Nội dung đã làm và kết quả kiểm chứng: [DOTNET_API_ASSESSMENT.md](DOTNET_API_ASSESSMENT.md) · [euni-api-dotnet/README.md](../euni-api-dotnet/README.md).

## 1. Chưa kiểm chứng được (đã viết nhưng chưa chạy thật)

| Việc | Hiện trạng | Cần để hoàn tất |
|---|---|---|
| `docker-compose.yml` (API + PostgreSQL + MinIO) | Đã viết, chưa chạy vì môi trường dựng không có Docker | Chạy `docker compose up --build`, kiểm tra API lên và upload file đi vào MinIO |
| MinIO thật | `S3FileStorage` chỉ thử với máy chủ S3 tương thích (moto) | Chạy test với MinIO thật: `TEST_S3_ENDPOINT=<minio>` rồi `dotnet test`; thử `S3_FORCE_PATH_STYLE`, bucket, quyền |
| Identity Server thật (`AUTH_MODE=oidc`) | Thử bằng khóa RSA cục bộ + discovery giả lập | Đăng ký audience `cms-api`, kiểm tra tên claim thật của IdS (`roles`, `realm_access`, `resource_access`, `tenants`, `units`, `staff_code`, `student_code`); chỉnh `OidcTokenService.ToPrincipal` nếu khác. Không đổi cấu hình SSO/gateway |
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
