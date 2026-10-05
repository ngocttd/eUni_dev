# Ghi chú chuyển đổi: React/Vite → Next.js, tách repo, mock data → API

## Đã làm

1. **Chuyển sang Next.js 15 (App Router)**: 128 trang công khai + 88 trang My eUni Portal + 4 trang đăng nhập + 17 trang CMS thành route thật.
   Trang công khai render phía server; `react-router-dom` được thay bằng lớp tương thích `src/lib/router.jsx` nên component giữ nguyên.
2. **Tách repo**: `euni-public` (website + My eUni Portal + đăng nhập), `euni-admin` (CMS), `euni-api-mock` (gateway giả lập + hợp đồng API).
   Portal không có phần quản trị riêng nên nằm chung `euni-public`.
3. **Thay data mock bằng API**: 18 file `data.js` (~6.000 dòng) được bỏ khỏi mã nguồn FE; trang đọc dữ liệu qua `useModuleData(module)`,
   dữ liệu lấy từ API gateway. Hàm tra cứu (`getArticle`, `getUnit`…) dựng lại ở `lib/datasets/helpers.js`.
   Menu/nav tĩnh chuyển thành cấu hình tĩnh `src/config/static`.
4. **CMS có database & API**: schema PostgreSQL (`euni-api-mock/database`) và API CMS theo mẫu Swagger gateway demo (+ phần mở rộng).
5. **Đồng bộ CMS ↔ public**: cùng đọc/ghi `cms-api`, public fetch `no-store`.
6. **Hợp đồng API** cho backend: `euni-api-mock/contract/API_CONTRACT.md` + `openapi.json`.

## Đã kiểm thử

| Kiểm thử | Kết quả |
|---|---|
| `next build` cả 2 app | Pass |
| Mở 220 route của euni-public (SSR, tham số động có dữ liệu thật) | 220/220 không lỗi |
| Trình duyệt thật (Edge): 88 trang portal (4 vai trò) + 21 trang CMS, bắt lỗi JS | 109/109 không lỗi; chưa đăng nhập bị chuyển tới `/dang-nhap` |
| Đồng bộ admin → public (`tools/migration/sync-test.mjs`) | 10/10 kịch bản đạt |
| Thao tác ghi trên giao diện CMS bằng Edge thật (`e2e-cms-write.mjs`): video, podcast, album, đối tác, chỉ số, slide, chip, banner | 11/11 bước đạt, public đổi theo |
| Lưu/xóa trên Bài viết, Danh mục, Media, Người dùng, Vai trò & Phân quyền, Trang & Menu, Cấu hình, Sao lưu (`e2e-cms-write2.mjs`, Edge thật) | 14/14 bước đạt (gồm: Editor gọi được /Users sau khi bật quyền, bị 403 sau khi tắt) |
| So sánh pixel với bản Vite cũ (109 trang công khai + 88 portal) | Gần như giống hệt (<2% pixel khác), trừ `/tin-tuc`, `/tim-kiem` (+7 bài viết do CMS mock nay xuất bản) và thứ tự video/podcast (sắp theo ngày mới nhất) |
| Luồng SSO OIDC + PKCE (`sso-test.mjs`, IdP giả lập) — cả chế độ Entra và Keycloak | 9/9 đạt mỗi chế độ: PKCE, state, nonce, đổi code, refresh, logout, ánh xạ vai trò (kể cả app role của Entra) |
| Nút "Đăng nhập với Microsoft 365" trên Edge thật (`e2e-sso.mjs`) | Chuyển đúng sang trang đăng nhập Microsoft của HUMG ("Chào mừng kỷ niệm 60 năm thành lập HUMG!") với client ID `5a7cce06-…`, PKCE. **Chưa đăng nhập thử bằng tài khoản M365 thật** |
| Trình soạn WYSIWYG, ảnh, bản dịch EN, sao lưu/phục hồi, email thử (`e2e-cms-write3.mjs`, Edge thật) | 10/10 bước đạt (gồm: HTML độc hại bị loại, mở được bài cũ dạng khối JSON, tải & phục hồi sao lưu) |
| Gọi API thật `api-gateway-demo.humg.edu.vn` (cms-api Categories/Contents/Users/Media, qlns employees, qlkhcn research-topic-categories) | Client + `loadCms()` chạy được (xem README) |

## Bản Vite cũ

Mã nguồn cũ được sao lưu ở `../euni_legacy_vite_backup.zip` (ngoài thư mục project). Muốn chạy lại công cụ chuyển đổi:
giải nén vào `tools/migration/legacy/` rồi `cd tools/migration && npm install && node scaffold.mjs public|admin`
(công cụ sinh lại toàn bộ `src/` của repo đích — chỉ dùng khi cần so sánh, vì các repo đã được chỉnh tay sau đó).

## Cập nhật theo thiết kế CMS v2 (`docs/design/CMS_DESIGN.md`)

- Multi-tenant (`X-Tenant`, website theo host), đăng nhập qua Identity Server (tài khoản trường + M365), workflow Draft → PendingReview → Published → Archived + hẹn giờ,
  bản sửa đổi chờ duyệt, revision / thùng rác / audit, phân quyền mức bản ghi (grants), thông báo theo đối tượng + hộp thư My eUni.
- Bỏ màn hình & API Người dùng / Vai trò của CMS (quản lý trên Identity Server). `e2e-cms-write2.mjs` thay các bước người dùng/vai trò bằng bước phân quyền nội dung.
- Kiểm thử: `npm --prefix euni-api-mock test` (67), `database/v2/test.sql`, `tools/migration/e2e-v2.mjs` (24 bước), `sso-test.mjs` (3 chế độ),
  `sync-test.mjs`, `e2e-cms-write*.mjs` (chạy được bằng Chromium: `CHROME=/đường/dẫn/chrome`). Toàn bộ 133 route công khai × 2 tenant trả 200.

## Việc còn lại / lưu ý

- **Identity Server**: FE đã sẵn sàng (`NEXT_PUBLIC_SSO_PROVIDER=ids`, discovery). Cần IdS đăng ký client public + PKCE, Redirect URI `{origin}/dang-nhap/sso/callback`,
  cấp claim `role`, `tenant`, `unit`, `staff_code`, `student_code` và API scope `cms-api`; xác nhận tên scheme M365 để đặt `NEXT_PUBLIC_SSO_M365_VALUE` (mặc định `idp:Microsoft`).
  Chưa thử đăng nhập bằng tài khoản thật. Chế độ Entra trực tiếp (app `5a7cce06-…`) vẫn giữ để chuyển tiếp.
  Backend phải xác thực JWT của Entra ID (hoặc đặt `NEXT_PUBLIC_SSO_API_SCOPE` cho access token riêng); `euni-api-mock` chỉ nhận token của mock nên đăng nhập SSO khi chạy với mock thì các lời gọi API bị 401.
- **Màn hình CMS**: đọc/ghi đầy đủ qua API, gồm trình soạn WYSIWYG, chọn ảnh từ Media, sao lưu/phục hồi, email thử. Mock lưu file trong thư mục `uploads/`; backend thật cần kho lưu trữ file và dịch vụ gửi email/sao lưu tương ứng.
- **Nội dung đa ngôn ngữ**: bản dịch EN đã hoàn tất của bài viết/tin nổi bật hiển thị khi chọn EN; các nội dung khác (sự kiện, trang…) hiện chỉ tiếng Việt.
- **Phiên đăng nhập** mock lưu `sessionStorage`; backend thật nên dùng refresh token HttpOnly cookie (sửa `shared/services/authService.js`).
- **Backend thật hiện có** (cms-api) mới có Categories/Contents/Media/Users; các endpoint `Public/*` và phần mở rộng cần bổ sung theo hợp đồng.
  Lưu ý bảo mật: `GET /api/Users` của backend demo đang trả `passwordHash`.
- Cache: mọi trang đang `force-dynamic`; khi lên production có thể dùng `revalidate` ngắn / webhook từ CMS.
