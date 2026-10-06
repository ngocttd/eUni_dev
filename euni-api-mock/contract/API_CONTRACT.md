# HUMG eUni — Hợp đồng API (FE ↔ BE)

> **Tài liệu do FE định nghĩa để backend triển khai.** Sinh tự động từ `euni-api-mock` (`npm run contract`), đi kèm `openapi.json`. FE chạy được ngay với mock; khi backend làm đúng hợp đồng này chỉ cần đổi `NEXT_PUBLIC_API_GATEWAY_URL`.

## 1. Quy ước chung

- **Gateway**: `{gateway}/{service}/...` — mock trên máy dev `http://127.0.0.1:3000`; mock trên server **tích hợp qua gateway** `https://api-gateway-demo.humg.edu.vn/euni-mock-api` (như qlns-api, qlkhcn-api, edusoft-api); backend thật `https://api-gateway-demo.humg.edu.vn`. Base URL có thể có tiền tố nên client **ghép chuỗi** `{gateway}/{service}{path}`; mọi URL API trả về (vd. media `cms-api/uploads/x.png`) là **tương đối** với gateway, không bắt đầu bằng `/`.
- **Service**: `cms-api` (nội dung CMS + nội dung tĩnh của website), `auth-api` (mock IdS), `qlns-api` (nhân sự), `qlkhcn-api` (khoa học công nghệ), `edusoft-api` (đào tạo), `esb-api` (tích hợp hệ thống ngoài, vd. thư viện). Không có `portal-api`: web và mobile gọi thẳng các service qua API gateway.
- **Tên endpoint**: chữ thường, ngăn cách bằng `-`, có version: `/api/v1/{nhóm}/{tài-nguyên}` (vd. `/api/v1/public/category-post`). Nhóm: `public` (không cần đăng nhập) · `me` (người dùng đã đăng nhập, dữ liệu của chính họ) · `admin` (quản trị, cần quyền). Gateway/backend có thể áp chính sách xác thực theo tiền tố nhóm.
- **JSON camelCase**, thời gian ISO-8601 có múi giờ (`2025-05-15T08:00:00+07:00`), ngày `yyyy-MM-dd`. Giao diện tự định dạng hiển thị (dd/MM/yyyy…), API **không** trả chuỗi đã format.
- **Phân trang** (mọi danh sách): query `pageIndex` (≥1), `pageSize`, `keyword`; response `{ items, pageIndex, pageSize, totalItems, totalPages }`.
- **Envelope**: FE chấp nhận cả response thô (như mock) lẫn envelope của backend — cms-api `{ "success": true, "message": "...", "data": ... }`, qlns/qlkhcn `{ "code": 200, "message": "...", "data": ... }`. FE tự bóc `data`; `success:false` hoặc `code` ngoài 2xx được coi là lỗi. Danh sách có thể là **mảng thuần** hoặc đối tượng phân trang — FE chuẩn hóa (`asPage`). Các ví dụ dưới đây là dạng đã bóc `data`.
- **Xác thực**: `Authorization: Bearer <accessToken>`. 401 chưa đăng nhập / hết hạn · 403 thiếu quyền · 404 · 409 trùng · 422 sai dữ liệu `{ message, errors? }`.
- **Id** là số nguyên (int64). Bài viết **xóa mềm**. `contentBody` là **chuỗi HTML** do trình soạn thảo WYSIWYG của CMS tạo (p, h2–h4, ul/ol, blockquote, a, img, table…; **backend nên làm sạch HTML khi lưu**, website cũng làm sạch khi hiển thị), hoặc — với dữ liệu cũ — chuỗi JSON mảng khối (`"Đoạn văn"` | `{type:"h2"|"quote"|"img"|"list", ...}`).
- **Tenant**: mọi request gửi header `X-Tenant: <tenant>` (vd. `humg`, `cntt`). Thiếu header → backend suy ra từ host, cuối cùng là tenant mặc định. API quản trị: user phải có ít nhất một grant trong tenant đó (trừ `cms.*`), sai → 403 — phạm vi tenant là tầng 3, do CMS tự phân, không lấy từ SSO. Hộp thư `/api/v1/me/announcements` nhận `X-Tenant: *` = mọi tenant của user. Thiết kế: `docs/design/CMS_DESIGN.md` §2.
- **Workflow**: `status` là chuỗi `draft | pending_review | published | archived` (mã số cũ 0..3 vẫn nhận khi ghi). Bài công khai = `published` và `publishAt <= now` và (`expireAt` trống hoặc > now). Đổi trạng thái chỉ qua `POST …/workflow/{action}`.
- **Concurrency**: bản ghi có `version`; gửi `version` trong body hoặc header `If-Match: "<version>"` khi sửa → 409 `{ message, currentVersion }` nếu đã có người khác sửa.
- **Quyền** (2 tầng trên SSO + tầng 3 trong app): tầng 1 realm role `student lecturer staff manager parent applicant alumni`; tầng 2 client role có tiền tố theo app (`cms.viewer cms.author cms.reviewer cms.editor cms.admin`, `euni.*`, `edusoft.*`, `qlns.*`, `qlkhcn.*`) — bảng `GET /api/v1/admin/directory/roles`; tầng 3 phân quyền mức tenant/chuyên mục/đơn vị/bản ghi `/api/v1/admin/grants` do CMS tự quản lý. Mỗi bản ghi trả `allowedActions[]` để UI chỉ hiện nút hợp lệ; backend vẫn kiểm tra lại.
- Không có endpoint quản lý user/role trong CMS — user và role (tầng 1, 2) quản lý trên SSO; CMS chỉ đọc danh bạ.
- **Đồng bộ CMS → website**: website **không cache** dữ liệu CMS (fetch `no-store`). Khi admin ghi (POST/PUT/DELETE) thì lần đọc `/api/v1/public/*` kế tiếp phải thấy thay đổi.

## 2. auth-api

> **Identity Server**: người dùng thật đăng nhập qua IdS (OIDC + PKCE) bằng **tài khoản trường** hoặc **Microsoft 365** (IdS federate, cùng một `sub`). FE gửi `Authorization: Bearer <access_token của IdS>` (aud = cms-api); backend xác thực JWT bằng JWKS của IdS. Claim cần có: `sub, name, email`, realm role + client role (Keycloak: `realm_access.roles`, `resource_access.{client}.roles`; IdS: `role[]`), `unit[]`, `staff_code, student_code`. Không cần claim tenant (tầng 3 do app tự phân) (xem docs/design/CMS_DESIGN.md §3). `auth-api` bên dưới **chỉ là mock của IdS** khi phát triển.

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/v1/auth/login` | `{ username, password }` → `{ accessToken, user }`. Mock cho phép `{ role: "student|lecturer|staff|manager|parent" }` để vào cổng demo. |
| GET | `/api/v1/auth/me` | → `{ user }` |
| POST | `/api/v1/auth/refresh` | → `{ accessToken, user }` |
| POST | `/api/v1/auth/logout` | 204 |

`user`: `{ sub, username, name, email, role, roles[], permissions[], tenants[], units[], staffCode, studentCode, portal }`. `roles` là role trên SSO (realm role + client role, vd. `lecturer`, `cms.editor`, `edusoft.academic-advisor`); `role` là vai trò chính để FE điều hướng; `tenants` chỉ là membership (trang user thuộc về, cho hộp thư thông báo), không phải quyền quản trị. `permissions` = quyền chức năng suy ra từ roles (wildcard `cms.*`).

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "u-tvanminh",
    "sub": "u-tvanminh",
    "username": "tvanminh",
    "name": "Trần Văn Minh",
    "email": "tvanminh@humg.edu.vn",
    "role": "cms-admin",
    "roles": [
      "cms.admin"
    ],
    "roleLabel": "Quản trị CMS",
    "permissions": [
      "cms.*"
    ],
    "tenants": [
      "humg"
    ],
    "units": [
      "P-TT"
    ],
    "staffCode": "CB0001",
    "studentCode": null,
    "portal": "/cms"
  }
}
```

## 3. cms-api — các endpoint

Quyền: *public* = không cần đăng nhập; còn lại cần Bearer + quyền ghi trong cột.

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/v1/public/site-content` | public | Toàn bộ nội dung công khai cho website: danh mục, bài viết đã xuất bản (kèm contentBody và translations.en — chỉ bản dịch ĐÃ HOÀN TẤT, thiếu thì website dùng tiếng Việt), sự kiện, album, video, podcast, trang tĩnh cho tìm kiếm. ?lang=vi|en (thiếu bản dịch → tự quay về vi). |
| GET | `/api/v1/public/home` | public | Dữ liệu trang chủ: heroSlides, quickLinks, audiences, strengths, partners, heroStats, universityStats, heroChips, featuredNews, newsList (3 bài), upcomingEvents (5), mediaTabs. |
| GET | `/api/v1/public/menus/{code}` | public | Mục menu đang hiển thị của nhóm (header = menu đầu trang, footer = các cột chân trang, utility = liên kết dòng cuối chân trang), danh sách phẳng có parentId để dựng cây: { id, parentId, label, url, icon, type page|link|category|heading, sortOrder, openInNewTab, translations.en.label }. Website lấy làm menu, không cache. |
| GET | `/api/v1/public/banners` | public | Banner đang hiệu lực (isVisible và hôm nay nằm trong startsOn..endsOn): { id, position, title, subtitle, linkUrl, imageUrl (tương đối với gateway), sortOrder }. Vị trí: home_slider (dải dưới slide trang chủ), home_popup (cửa sổ nổi trang chủ), sidebar_right (cột phải trang tin), footer (dải trên chân trang). |
| GET | `/api/v1/public/pages/slug/{slug}` | public | Trang tĩnh soạn ở CMS (template khác system, status published): { id, slug, title, bodyHtml, language, parents[{title,url}], updatedAt }. 404 nếu nháp/không có. Website hiển thị ở /trang/{slug}. Trang template=system là trang có sẵn trong code website, không trả ở đây. |
| GET | `/api/v1/public/settings` | public | Cấu hình công khai (general, seo, language). |
| GET | `/api/v1/public/search` | public | Tìm kiếm toàn site (bài viết, sự kiện, media, trang). |
| GET | `/api/v1/public/contents` | public | Danh sách bài viết đã xuất bản (không có contentBody), phân trang. |
| GET | `/api/v1/public/contents/slug/{slug}` | public | Chi tiết bài viết đã xuất bản theo slug. |
| POST | `/api/v1/public/contents/{id}/views` | public | Ghi nhận +1 lượt xem cho bài viết. |
| GET | `/api/v1/public/categories` | public | Danh mục (cây qua parentId). |
| GET | `/api/v1/public/datasets/{module}` | public | Nội dung tĩnh của website do CMS quản lý: cooperation, life, utilities (xem §4). |
| GET | `/api/v1/public/languages` | public | Ngôn ngữ hỗ trợ. |
| GET | `/api/v1/public/media/{id}/url` | public | URL tải file media. |
| GET | `/api/v1/public/tenant` | public | Tenant đang phục vụ (theo X-Tenant / host). |
| GET | `/api/v1/me/context` | đăng nhập | Ngữ cảnh người dùng: tenants được quản trị, permissions (từ role trong token), đơn vị (kèm đơn vị cha), can.{news|announcement}.{view|edit|review|publish}. |
| GET | `/api/v1/admin/contents` | news.view + ACL | Quản trị: danh sách bài viết user được xem (lọc theo grant). Mỗi dòng có allowedActions[], isScheduled, pendingRevision, version. |
| GET | `/api/v1/admin/contents/trash` | news.edit|publish + ACL | Thùng rác (bài đã xóa mềm). |
| GET | `/api/v1/admin/contents/{id}` | news.view + ACL | Chi tiết bài viết (kèm bản dịch). Header ETag = version. |
| POST | `/api/v1/admin/contents` | news.edit + ACL (phạm vi chuyên mục/đơn vị) | Tạo bản nháp. ownerUnitCode mặc định = đơn vị đầu tiên của user. Có thể gửi status=pending_review|published để chuyển trạng thái ngay (cần quyền tương ứng). |
| PUT | `/api/v1/admin/contents/{id}` | news.edit + ACL | Sửa nội dung (status KHÔNG đổi qua PUT). Gửi version (hoặc If-Match) → 409 nếu đã có người sửa. Bài đang published mà user không có publish → 202, lưu thành bản sửa đổi chờ duyệt (pendingRevision). |
| DELETE | `/api/v1/admin/contents/{id}` | allowedActions có delete | Xóa mềm (deletedAt, deletedBy). |
| POST | `/api/v1/admin/contents/{id}/restore` | allowedActions có restore | Khôi phục từ thùng rác. |
| DELETE | `/api/v1/admin/contents/{id}/purge` | cms.* | Xóa vĩnh viễn bài trong thùng rác. |
| POST | `/api/v1/admin/contents/{id}/workflow/{action}` | theo action | action: submit (edit) · reject (review, body.note bắt buộc) · approve (review) · publish (publish) · unpublish · archive (publish) · approve-revision / reject-revision (review). Body: { note?, publishAt?, version? }. publishAt tương lai = hẹn giờ. |
| GET | `/api/v1/admin/contents/{id}/revisions` | news.view + ACL | Danh sách phiên bản (state current | superseded | proposed | rejected). |
| GET | `/api/v1/admin/contents/{id}/revisions/{version}` | news.view + ACL | Một phiên bản: snapshot + changesFromCurrent. |
| POST | `/api/v1/admin/contents/{id}/revisions/{version}/restore` | news.edit/publish + ACL | Khôi phục nội dung phiên bản cũ → tạo phiên bản mới (không ghi đè lịch sử). |
| GET | `/api/v1/admin/contents/{id}/history` | news.view + ACL | Lịch sử workflow + audit của bản ghi. |
| GET/POST/PUT/DELETE | `/api/v1/admin/announcements …` | announcement.* + ACL | Thông báo: cùng bộ endpoint vòng đời như /api/v1/admin/contents (trash, restore, workflow, revisions, history). Body có targets[] = [{ audience?, unitCode?, userSub? | userKey? (mã CB/mã SV/email), isExclude? }], priority 0|1|2, category, requireAck, channels[], pinnedUntil, expireAt. archive kèm note = thu hồi (recallReason). |
| GET | `/api/v1/admin/announcements/{id}/stats` | announcement.view + ACL | Người nhận (ước tính từ danh bạ/Membership API), đã đọc, đã xác nhận. |
| GET | `/api/v1/admin/announcements/meta/options` | announcement.view | Danh mục audiences, categories, priorities, channels. |
| GET | `/api/v1/me/announcements` | đăng nhập (mọi vai trò) | Hộp thư thông báo của tôi: so khớp targets với role (audience) + đơn vị (kèm đơn vị cha) + sub. Ghim → ưu tiên → mới nhất. X-Tenant: * = mọi tenant của user. |
| GET | `/api/v1/me/announcements/unread-count` | đăng nhập | Số thông báo chưa đọc. |
| POST | `/api/v1/me/announcements/{id}/read · /api/v1/me/announcements/{id}/ack · /api/v1/me/announcements/read-all` | đăng nhập | Đánh dấu đã đọc / xác nhận đã đọc (requireAck) / đọc tất cả. |
| GET/POST/PUT/DELETE | `/api/v1/admin/grants` | grant.manage | Phân quyền mức bản ghi: { principalType user|unit|role, principalId, resourceType *|news|announcement|page|media, scopeType tenant|category|unit|record, scopeId, permissions[view|edit|review|publish|manage], expiresAt?, note? }. Grant theo đơn vị áp dụng cả đơn vị con. |
| GET | `/api/v1/admin/grants/effective/{sub}` | grant.manage | Quyền chức năng + các grant đang áp dụng cho một người. |
| GET | `/api/v1/admin/directory/users` | cms.access | Danh bạ (IdS) — tìm theo tên, email, mã CB, mã SV. Chỉ đọc; user/role quản lý ở Identity Server. |
| GET | `/api/v1/admin/directory/roles` | cms.access | Danh mục role trên SSO: realm role (tầng 1) và client role theo app (tầng 2), kèm quyền chức năng CMS tương ứng (cấu hình tĩnh). |
| GET | `/api/v1/admin/org-units` | cms.access | Cây đơn vị (bản sao QLNS/QLĐT): code, name, kind, parentCode, path, depth. |
| GET/POST | `/api/v1/admin/categories · PUT/DELETE /api/v1/admin/categories/{id}` | category.manage | CRUD danh mục (theo tenant, xóa mềm, POST /{id}/restore). |
| GET | `/api/v1/admin/media` | media.manage | Thư viện media của tenant. |
| POST | `/api/v1/admin/media/upload` | media.manage | multipart/form-data: file, altText, caption, folder. |
| DELETE | `/api/v1/admin/media/{id}` | media.manage | Xóa mềm media. |
| CRUD | `/api/v1/admin/events · /api/v1/admin/albums · /api/v1/admin/videos · /api/v1/admin/podcasts` | site.manage | Sự kiện, album ảnh, video, podcast (theo tenant, xóa mềm + /{id}/restore, /trash). |
| CRUD | `/api/v1/admin/pages · /api/v1/admin/menu-items` | page.manage / menu.manage | Trang: { title, slug, parentId, template default|system, status published|draft, bodyHtml, sortOrder, translations.en{title,bodyHtml} }. Mục menu: { groupCode header|footer|utility, parentId, label, url, type, icon, isVisible, openInNewTab, sortOrder, translations.en.label }. |
| CRUD | `/api/v1/admin/banners` | site.manage | Banner: { title, subtitle, position, linkUrl, imageId, isVisible, startsOn, endsOn, sortOrder }. |
| CRUD | `/api/v1/admin/hero-slides · /api/v1/admin/quick-links · /api/v1/admin/audiences · /api/v1/admin/strengths · /api/v1/admin/partners · /api/v1/admin/site-stats` | site.manage | Các khối trang chủ. |
| GET/PUT | `/api/v1/admin/settings · /api/v1/admin/settings/{group}` | settings.manage | Cấu hình theo tenant, theo nhóm: general, seo, email, language, backup, home. |
| GET | `/api/v1/admin/audit-logs` | log.view | Audit log chỉ ghi thêm: actorSub, action, entityType, entityId, changes {field:[cũ,mới]}, ip. (/api/v1/admin/activity-logs = tên cũ.) |
| GET/POST | `/api/v1/admin/backups` | backup.manage | Lịch sử sao lưu / tạo sao lưu thủ công. |
| DELETE | `/api/v1/admin/backups/{id}` | backup.manage | Xóa bản sao lưu. |
| GET | `/api/v1/admin/backups/{id}/download` | backup.manage | Tải tệp sao lưu (JSON). |
| POST | `/api/v1/admin/backups/{id}/restore` | backup.manage | Phục hồi dữ liệu CMS từ một bản sao lưu. |
| POST | `/api/v1/admin/backups/restore` | backup.manage | multipart/form-data: file — phục hồi từ tệp sao lưu tải lên. |
| POST | `/api/v1/admin/settings/email/test` | settings.manage | Gửi email thử: { to } → { ok, message }. |
| GET | `/api/v1/admin/dashboard` | cms.access | Số liệu tổng quan theo quyền của user, kèm awaitingReview[]. |

### Ví dụ response

#### GET /api/v1/public/site-content
```json
{
  "categories": [
    {
      "id": 1,
      "parentId": null,
      "name": "Tin tức",
      "slug": "tin-tuc"
    }
  ],
  "articles": [
    {
      "id": 19,
      "slug": "thong-bao-tuyen-sinh-dai-hoc-2026",
      "categoryId": 8,
      "categoryName": "Tuyển sinh",
      "unit": "Phòng Đào tạo",
      "tags": [
        "Tuyển sinh"
      ],
      "authorName": "Nguyễn Thị Hoa",
      "title": "Thông báo tuyển sinh đại học chính quy năm 2026",
      "excerpt": "Trường Đại học Mỏ – Địa chất thông báo tuyển sinh đại học chính quy năm 2026 với 52 chương trình đào tạo và 5 phương thức xét tuyển.",
      "metaTitle": null,
      "metaDescription": null,
      "isFeatured": false,
      "showOnHome": false,
      "viewCount": 3120,
      "publishedAt": "2026-05-20T08:00:00+07:00",
      "attachments": [
        {
          "title": "Đề án tuyển sinh 2026",
          "meta": "PDF · 1.2 MB",
          "url": null
        }
      ],
      "language": "vi",
      "translations": {},
      "contentBody": "[\"Năm 2026, HUMG tuyển sinh 52 chương trình đào tạo trình độ đại học, trong đó có các chương trình chất lượng cao và chương trình liên kết quốc tế.\",{\"type\":\"h2\",\"text\":\"Phương thức xét tuyển\"},{\"type\":\"list\",\"items\":[\"Xét tuyển thẳng và ưu tiên xét tuyển\",\"Xét kết quả thi tốt nghiệp THPT\",\"Xét học bạ THPT\",\"Xét tuyển kết hợp\",\"Xét kết quả kỳ thi ĐGNL của ĐHQG Hà Nội\"]},\"Thí sinh theo dõi mốc thời gian và hướng dẫn đăng ký trực tuyến tại chuyên trang Tuyển sinh của Nhà trường.\"]"
    }
  ],
  "events": [
    {
      "id": 1,
      "slug": "hoi-thao-khoa-hoc-quoc-te-dia-chat-khoang-san",
      "title": "Hội thảo khoa học quốc tế về Địa chất và Khoáng sản",
      "startsAt": "2026-05-20T08:00:00+07:00",
      "endsAt": "2026-05-20T17:00:00+07:00",
      "place": "Hội trường A, HUMG",
      "placeFull": "Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Hà Nội",
      "organizer": "Khoa Địa chất & Phòng Hợp tác quốc tế",
      "audience": "Giảng viên, nhà khoa học, nghiên cứu sinh, doanh nghiệp",
      "contact": "hoithao.diachat@humg.edu.vn",
      "status": "upcoming",
      "description": [
        "Hội thảo là diễn đàn để các nhà khoa học trong nước và quốc tế trao đổi kết quả nghiên cứu mới nhất trong lĩnh vực địa chất, khoáng sản và tài nguyên bền vững."
      ],
      "agenda": [
        {
          "time": "08:00",
          "item": "Đón tiếp đại biểu & khai mạc"
        }
      ],
      "isVisible": true,
      "tenantId": "humg"
    }
  ],
  "albums": [
    {
      "id": 1,
      "slug": "le-ky-niem-60-nam",
      "title": "Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường",
      "publishedAt": "2026-05-15",
      "isVisible": true,
      "photos": [
        {
          "id": 1,
          "caption": "Ảnh 1 · Lễ kỷ niệm 60 năm",
          "mediaId": null,
          "sortOrder": 0
        }
      ],
      "tenantId": "humg"
    }
  ],
  "videos": [
    {
      "id": 1,
      "slug": "humg-60-nam-mot-chang-duong",
      "title": "HUMG – 60 năm một chặng đường",
      "channel": "HUMG Media",
      "durationSec": 924,
      "videoUrl": null,
      "viewCount": 8420,
      "publishedAt": "2026-05-12",
      "description": "Phim tài liệu nhìn lại chặng đường 60 năm xây dựng và phát triển của Trường Đại học Mỏ - Địa chất.",
      "isVisible": true,
      "tenantId": "humg"
    }
  ],
  "podcasts": [
    {
      "id": 1,
      "slug": "chuyen-nghe-dia-chat",
      "title": "Chuyện nghề Địa chất",
      "episode": "Tập 05",
      "host": "TS. Trần Văn A",
      "durationSec": 1930,
      "audioUrl": null,
      "playCount": 1240,
      "publishedAt": "2026-05-10",
      "description": "Trò chuyện cùng những người làm nghề địa chất: hành trình vào nghề, gian nan hiện trường và niềm vui khám phá.",
      "notes": [
        "Khách mời: kỹ sư địa chất công trình"
      ],
      "isVisible": true,
      "tenantId": "humg"
    }
  ],
  "searchPages": [
    {
      "type": "Trang",
      "title": "Khoa học & Công nghệ",
      "excerpt": "Trang thông tin về hoạt động nghiên cứu, công bố, đề tài và chuyển giao công nghệ của HUMG.",
      "to": "/nghien-cuu"
    }
  ]
}
```

#### GET /api/v1/public/menus/header (3 mục đầu)
```json
[
  {
    "id": 1,
    "groupCode": "header",
    "parentId": null,
    "type": "page",
    "url": "/gioi-thieu",
    "label": "Giới thiệu HUMG",
    "icon": "building",
    "sortOrder": 1,
    "isVisible": true,
    "openInNewTab": false,
    "translations": {},
    "tenantId": "humg"
  }
]
```

#### GET /api/v1/public/banners
```json
[
  {
    "id": 1,
    "position": "home_slider",
    "title": "Banner tuyển sinh đại học 2025",
    "subtitle": "Xét tuyển 15 ngành Kỹ thuật – Công nghệ, nhận hồ sơ trực tuyến",
    "linkUrl": "/hoc-tap/tuyen-sinh",
    "imageUrl": null,
    "sortOrder": 1,
    "startsOn": "2026-09-26",
    "endsOn": "2026-12-05"
  }
]
```

#### GET /api/v1/public/pages/slug/{slug}
```json
{
  "id": 14,
  "slug": "chinh-sach-bao-mat",
  "title": "Chính sách bảo mật",
  "bodyHtml": "<p>Trường Đại học Mỏ – Địa chất cam kết bảo vệ thông tin cá nhân của người dùng Cổng thông tin điện tử.</p><h2>1. Thông tin thu thập</h2><p>Họ tên, email, số điện thoại khi người dùng gửi liên hệ hoặc đăng ký sự kiện; thông tin đăng nhập do hệ thống SSO của Trường quản lý.</p><h2>2. Mục đích sử dụng</h2><ul><li>Phản hồi yêu cầu, gửi thông báo liên quan.</li><li>Thống kê truy cập để cải thiện dịch vụ.</li></ul><h2>3. Liên hệ</h2><p>Mọi thắc mắc về dữ liệu cá nhân xin gửi về Phòng Truyền thông.</p>",
  "language": "vi",
  "template": "default",
  "parents": [],
  "updatedAt": "2025-05-10T09:00:00+07:00"
}
```

#### GET /api/v1/public/home
```json
{
  "heroSlides": [
    {
      "id": 1,
      "code": "sl-60-nam",
      "kicker": "60 NĂM",
      "title": "XÂY DỰNG, ĐỔI MỚI\nVÀ PHÁT TRIỂN",
      "subtitle": "1966 – 2026",
      "motto": "Tri thức · Bản lĩnh · Sáng tạo · Hội nhập",
      "primaryLabel": "Khám phá HUMG",
      "primaryUrl": "/gioi-thieu",
      "accentLabel": "Tuyển sinh 2026",
      "accentUrl": "/hoc-tap/tuyen-sinh",
      "isVisible": true,
      "sortOrder": 0,
      "tenantId": "humg"
    }
  ],
  "quickLinks": [
    {
      "id": 1,
      "label": "Lịch công tác",
      "icon": "calendar",
      "url": "/lich-cong-tac",
      "isVisible": true,
      "sortOrder": 0,
      "tenantId": "humg"
    }
  ],
  "audiences": [
    {
      "id": 1,
      "code": "thi-sinh",
      "title": "Thí sinh",
      "description": "Tuyển sinh, ngành học, chương trình đào tạo.",
      "icon": "graduation",
      "color": "#1976d2",
      "url": "/hoc-tap/tuyen-sinh",
      "isVisible": true,
      "sortOrder": 0,
      "tenantId": "humg"
    }
  ],
  "strengths": [
    {
      "id": 1,
      "icon": "flask",
      "title": "Đào tạo gắn thực tiễn",
      "text": "Chương trình cập nhật, hệ thống phòng thí nghiệm và thực hành hiện đại.",
      "isVisible": true,
      "sortOrder": 0,
      "tenantId": "humg"
    }
  ],
  "partners": [
    {
      "id": 1,
      "name": "Vinacomin",
      "shortName": "TKV",
      "color": "#0057a8",
      "website": null,
      "isVisible": true,
      "sortOrder": 0,
      "tenantId": "humg"
    }
  ],
  "heroStats": [
    {
      "id": 1,
      "placement": "hero",
      "value": "60+",
      "label": "Năm phát triển",
      "sub": null,
      "isVisible": true,
      "sortOrder": 0,
      "tenantId": "humg"
    }
  ],
  "universityStats": [
    {
      "id": 5,
      "placement": "about",
      "value": "60+",
      "label": "Năm phát triển",
      "sub": "1966 – 2026",
      "isVisible": true,
      "sortOrder": 0,
      "tenantId": "humg"
    }
  ],
  "heroChips": [
    "Trường đại học công lập"
  ],
  "featuredNews": {
    "id": 13,
    "slug": "le-ky-niem-60-nam-thanh-lap",
    "categoryId": 3,
    "categoryName": "Sự kiện",
    "unit": "Văn phòng",
    "tags": [
      "60 năm"
    ],
    "authorName": "Nguyễn Thị Hoa",
    "title": "Lễ kỷ niệm 60 năm thành lập Trường Đại học Mỏ – Địa chất",
    "excerpt": "Sáng 15/05/2025, Trường Đại học Mỏ – Địa chất long trọng tổ chức Lễ kỷ niệm 60 năm thành lập, ôn lại chặng đường xây dựng và phát triển của Nhà trường.",
    "metaTitle": null,
    "metaDescription": null,
    "isFeatured": true,
    "showOnHome": true,
    "viewCount": 1235,
    "publishedAt": "2025-05-15T08:00:00+07:00",
    "attachments": [
      {
        "title": "Diễn văn kỷ niệm 60 năm thành lập Trường",
        "meta": "PDF · 640 KB",
        "url": null
      }
    ],
    "language": "vi",
    "translations": {}
  },
  "newsList": [
    {
      "id": 14,
      "slug": "humg-top-10-dai-hoc-ky-thuat",
      "categoryId": 1,
      "categoryName": "Tin tức",
      "unit": "Phòng KHCN",
      "tags": [
        "Xếp hạng"
      ],
      "authorName": "Nguyễn Thị Hoa",
      "title": "HUMG lọt Top 10 trường đại học kỹ thuật hàng đầu Việt Nam",
      "excerpt": "Theo bảng xếp hạng năm 2025, Trường Đại học Mỏ – Địa chất được ghi nhận trong nhóm 10 cơ sở đào tạo kỹ thuật hàng đầu cả nước.",
      "metaTitle": null,
      "metaDescription": null,
      "isFeatured": false,
      "showOnHome": true,
      "viewCount": 986,
      "publishedAt": "2025-05-10T08:00:00+07:00",
      "attachments": [],
      "language": "vi",
      "translations": {}
    }
  ],
  "upcomingEvents": [
    {
      "id": 1,
      "slug": "hoi-thao-khoa-hoc-quoc-te-dia-chat-khoang-san",
      "title": "Hội thảo khoa học quốc tế về Địa chất và Khoáng sản",
      "startsAt": "2026-05-20T08:00:00+07:00",
      "endsAt": "2026-05-20T17:00:00+07:00",
      "place": "Hội trường A, HUMG",
      "placeFull": "Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Hà Nội",
      "organizer": "Khoa Địa chất & Phòng Hợp tác quốc tế",
      "audience": "Giảng viên, nhà khoa học, nghiên cứu sinh, doanh nghiệp",
      "contact": "hoithao.diachat@humg.edu.vn",
      "status": "upcoming",
      "description": [
        "Hội thảo là diễn đàn để các nhà khoa học trong nước và quốc tế trao đổi kết quả nghiên cứu mới nhất trong lĩnh vực địa chất, khoáng sản và tài nguyên bền vững."
      ],
      "agenda": [
        {
          "time": "08:00",
          "item": "Đón tiếp đại biểu & khai mạc"
        }
      ],
      "isVisible": true,
      "tenantId": "humg"
    }
  ],
  "mediaTabs": {
    "albums": [
      {
        "id": 1,
        "slug": "le-ky-niem-60-nam",
        "title": "Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường",
        "publishedAt": "2026-05-15",
        "isVisible": true,
        "photos": [
          {
            "id": 1,
            "caption": "Ảnh 1 · Lễ kỷ niệm 60 năm",
            "mediaId": null,
            "sortOrder": 0
          }
        ],
        "tenantId": "humg"
      }
    ],
    "videos": [
      {
        "id": 1,
        "slug": "humg-60-nam-mot-chang-duong",
        "title": "HUMG – 60 năm một chặng đường",
        "channel": "HUMG Media",
        "durationSec": 924,
        "videoUrl": null,
        "viewCount": 8420,
        "publishedAt": "2026-05-12",
        "description": "Phim tài liệu nhìn lại chặng đường 60 năm xây dựng và phát triển của Trường Đại học Mỏ - Địa chất.",
        "isVisible": true,
        "tenantId": "humg"
      }
    ],
    "podcasts": [
      {
        "id": 1,
        "slug": "chuyen-nghe-dia-chat",
        "title": "Chuyện nghề Địa chất",
        "episode": "Tập 05",
        "host": "TS. Trần Văn A",
        "durationSec": 1930,
        "audioUrl": null,
        "playCount": 1240,
        "publishedAt": "2026-05-10",
        "description": "Trò chuyện cùng những người làm nghề địa chất: hành trình vào nghề, gian nan hiện trường và niềm vui khám phá.",
        "notes": [
          "Khách mời: kỹ sư địa chất công trình"
        ],
        "isVisible": true,
        "tenantId": "humg"
      }
    ]
  }
}
```

#### GET /api/v1/public/contents/slug/{slug}
```json
{
  "id": 13,
  "slug": "le-ky-niem-60-nam-thanh-lap",
  "categoryId": 3,
  "categoryName": "Sự kiện",
  "unit": "Văn phòng",
  "tags": [
    "60 năm"
  ],
  "authorName": "Nguyễn Thị Hoa",
  "title": "Lễ kỷ niệm 60 năm thành lập Trường Đại học Mỏ – Địa chất",
  "excerpt": "Sáng 15/05/2025, Trường Đại học Mỏ – Địa chất long trọng tổ chức Lễ kỷ niệm 60 năm thành lập, ôn lại chặng đường xây dựng và phát triển của Nhà trường.",
  "metaTitle": null,
  "metaDescription": null,
  "isFeatured": true,
  "showOnHome": true,
  "viewCount": 1235,
  "publishedAt": "2025-05-15T08:00:00+07:00",
  "attachments": [
    {
      "title": "Diễn văn kỷ niệm 60 năm thành lập Trường",
      "meta": "PDF · 640 KB",
      "url": null
    }
  ],
  "language": "vi",
  "translations": {},
  "contentBody": "[\"Trong không khí trang trọng và ấm áp, Trường Đại học Mỏ – Địa chất đã tổ chức Lễ kỷ niệm 60 năm thành lập (1966 – 2026) với sự tham dự của lãnh đạo Bộ Giáo dục và Đào tạo, các thế hệ cán bộ, giảng viên, cựu sinh viên và đối tác trong, ngoài nước.\",{\"type\":\"h2\",\"text\":\"Một chặng đường tự hào\"},\"Từ những ngày đầu thành lập với vài trăm sinh viên, đến nay HUMG đã đào tạo hàng chục nghìn kỹ sư, cử nhân, thạc sĩ và tiến sĩ, đóng góp quan trọng cho ngành công nghiệp mỏ, địa chất, dầu khí và trắc địa – bản đồ của đất nước.\",{\"type\":\"quote\",\"text\":\"“60 năm là hành trình của tri thức, bản lĩnh và khát vọng hội nhập. HUMG sẽ tiếp tục đổi mới để đồng hành cùng sự phát triển bền vững của đất nước.”\"},{\"type\":\"img\",\"label\":\"Toàn cảnh buổi lễ tại Hội trường A\",\"caption\":\"Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường.\"},{\"type\":\"list\",\"items\":[\"Trao Huân chương và bằng khen cho các tập thể, cá nhân tiêu biểu\",\"Ra mắt Quỹ học bổng 60 năm HUMG\",\"Khánh thành không gian truyền thống của Nhà trường\"]},\"Buổi lễ khép lại với chương trình nghệ thuật đặc sắc do sinh viên và cựu sinh viên biểu diễn, thể hiện niềm tự hào và gắn bó với mái trường.\"]"
}
```

#### GET /api/v1/me/context
```json
{
  "user": {
    "sub": "u-tvanminh",
    "name": "Trần Văn Minh",
    "email": "tvanminh@humg.edu.vn",
    "roles": [
      "cms.admin"
    ],
    "units": [
      "P-TT"
    ]
  },
  "permissions": [
    "cms.*"
  ],
  "tenants": [
    {
      "id": "humg",
      "name": "Trường Đại học Mỏ - Địa chất",
      "rootUnit": "HUMG"
    }
  ],
  "currentTenant": "humg",
  "units": [
    {
      "code": "P-TT",
      "name": "Phòng Truyền thông"
    }
  ],
  "can": {
    "news": {
      "view": true,
      "edit": true,
      "review": true,
      "publish": true
    },
    "announcement": {
      "view": true,
      "edit": true,
      "review": true,
      "publish": true
    }
  }
}
```

#### GET /api/v1/admin/contents/{id} (quản trị)
```json
{
  "id": 19,
  "categoryId": 8,
  "ownerUnitCode": "P-DT",
  "title": "Thông báo tuyển sinh đại học chính quy năm 2026",
  "slug": "thong-bao-tuyen-sinh-dai-hoc-2026",
  "excerpt": "Trường Đại học Mỏ – Địa chất thông báo tuyển sinh đại học chính quy năm 2026 với 52 chương trình đào tạo và 5 phương thức xét tuyển.",
  "status": "published",
  "isFeatured": false,
  "showOnHome": false,
  "contentBody": "[\"Năm 2026, HUMG tuyển sinh 52 chương trình đào tạo trình độ đại học, trong đó có các chương trình chất lượng cao và chương trình liên kết quốc tế.\",{\"type\":\"h2\",\"text\":\"Phương thức xét tuyển\"},{\"type\":\"list\",\"items\":[\"Xét tuyển thẳng và ưu tiên xét tuyển\",\"Xét kết quả thi tốt nghiệp THPT\",\"Xét học bạ THPT\",\"Xét tuyển kết hợp\",\"Xét kết quả kỳ thi ĐGNL của ĐHQG Hà Nội\"]},\"Thí sinh theo dõi mốc thời gian và hướng dẫn đăng ký trực tuyến tại chuyên trang Tuyển sinh của Nhà trường.\"]",
  "metaTitle": null,
  "metaDescription": null,
  "metaKeywords": null,
  "featuredImageId": null,
  "attachmentId": null,
  "authorSub": "u-nthoa",
  "authorName": "Nguyễn Thị Hoa",
  "source": null,
  "unit": "Phòng Đào tạo",
  "viewCount": 3120,
  "tags": [
    "Tuyển sinh"
  ],
  "attachments": [
    {
      "title": "Đề án tuyển sinh 2026",
      "meta": "PDF · 1.2 MB",
      "url": null
    }
  ],
  "translations": {},
  "publishAt": "2026-05-20T08:00:00+07:00",
  "expireAt": null,
  "firstPublishedAt": "2026-05-20T08:00:00+07:00",
  "submittedAt": null,
  "submittedBy": null,
  "reviewedAt": null,
  "reviewedBy": null,
  "reviewNote": null,
  "pendingRevisionId": null,
  "version": 1,
  "createdAt": "2026-05-20T08:00:00+07:00",
  "createdBy": "u-nthoa",
  "updatedAt": "2026-05-20T08:00:00+07:00",
  "updatedBy": "u-nthoa",
  "deletedAt": null,
  "deletedBy": null,
  "tenantId": "humg",
  "categoryName": "Tuyển sinh",
  "ownerUnitName": "Phòng Đào tạo",
  "isScheduled": false,
  "isExpired": false,
  "updatedByName": "Nguyễn Thị Hoa",
  "pendingRevision": null,
  "allowedActions": [
    "edit"
  ]
}
```

#### GET /api/v1/admin/contents/{id}/revisions
```json
[
  {
    "id": 1,
    "tenantId": "humg",
    "entityType": "news",
    "entityId": 1,
    "version": 1,
    "state": "current",
    "reason": "Khởi tạo",
    "createdBy": "u-tvanminh",
    "createdAt": "2025-05-16T08:00:00+07:00",
    "createdByName": "Trần Văn Minh",
    "title": "Hội thảo quốc tế về Trắc địa và GIS 2025"
  }
]
```

#### GET /api/v1/admin/contents/{id}/history
```json
{
  "workflow": [],
  "audit": []
}
```

#### GET /api/v1/admin/announcements/{id}
```json
{
  "id": 8,
  "tenantId": "humg",
  "category": "academic",
  "priority": 0,
  "status": "published",
  "expireAt": null,
  "pinnedUntil": null,
  "requireAck": false,
  "channels": [
    "portal"
  ],
  "recallReason": null,
  "bodyHtml": "<p>Cổng đăng ký học phần học kỳ hè mở từ ngày đăng thông báo này.</p>",
  "translations": {},
  "attachments": [],
  "authorSub": "u-nthoa",
  "authorName": "Nguyễn Thị Hoa",
  "submittedAt": null,
  "submittedBy": null,
  "reviewedAt": null,
  "reviewedBy": null,
  "reviewNote": null,
  "pendingRevisionId": null,
  "version": 1,
  "createdBy": "u-nthoa",
  "updatedBy": "u-nthoa",
  "deletedAt": null,
  "deletedBy": null,
  "title": "Đăng ký học phần học kỳ hè (hẹn giờ)",
  "ownerUnitCode": "P-DT",
  "publishAt": "2026-10-09T08:00:00.000Z",
  "targets": [
    {
      "audience": "student",
      "unitCode": null,
      "userSub": null,
      "isExclude": false,
      "label": "Toàn bộ sinh viên"
    }
  ],
  "createdAt": "2026-10-09T08:00:00.000Z",
  "updatedAt": "2026-10-09T08:00:00.000Z",
  "firstPublishedAt": "2026-10-09T08:00:00.000Z",
  "ownerUnitName": "Phòng Đào tạo",
  "categoryLabel": "Đào tạo",
  "priorityLabel": "Bình thường",
  "targetSummary": "Toàn bộ sinh viên",
  "stats": {
    "recipients": 5,
    "read": 0,
    "acked": 0
  },
  "isScheduled": true,
  "isExpired": false,
  "updatedByName": "Nguyễn Thị Hoa",
  "pendingRevision": null,
  "allowedActions": [
    "edit"
  ]
}
```

#### GET /api/v1/me/announcements
```json
{
  "items": [
    {
      "id": 1,
      "tenantId": "humg",
      "title": "Lịch thi học kỳ 2 năm học 2024–2025",
      "bodyHtml": "<p>Phòng Đào tạo thông báo lịch thi học kỳ 2. Sinh viên kiểm tra phòng thi trên My eUni và <strong>xác nhận đã đọc</strong>.</p>",
      "language": "vi",
      "category": "exam",
      "categoryLabel": "Thi cử",
      "priority": 1,
      "priorityLabel": "Quan trọng",
      "ownerUnitCode": "P-DT",
      "ownerUnitName": "Phòng Đào tạo",
      "publishAt": "2026-10-03T08:00:00.000Z",
      "expireAt": null,
      "pinned": true,
      "requireAck": true,
      "attachments": [
        {
          "title": "Lich-thi-HK2.pdf",
          "meta": "PDF · 420 KB"
        }
      ],
      "readAt": null,
      "ackedAt": null
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 5,
  "totalPages": 3,
  "unreadCount": 5,
  "categories": {
    "general": "Chung",
    "academic": "Đào tạo",
    "exam": "Thi cử",
    "tuition": "Học phí",
    "event": "Sự kiện",
    "admin": "Hành chính"
  }
}
```

#### Grant
```json
{
  "id": 1,
  "tenantId": "humg",
  "resourceType": "*",
  "scopeType": "tenant",
  "scopeId": null,
  "note": "Biên tập viên chính — toàn trang Trường",
  "expiresAt": null,
  "createdBy": "u-tvanminh",
  "createdAt": "2025-01-10T08:00:00+07:00",
  "deletedAt": null,
  "principalType": "user",
  "principalId": "u-nthoa",
  "permissions": [
    "view"
  ],
  "principalLabel": "Nguyễn Thị Hoa",
  "scopeLabel": "Toàn trang",
  "createdByName": "Trần Văn Minh"
}
```

#### GET /api/v1/admin/directory/users
```json
{
  "items": [
    {
      "sub": "u-nthoa",
      "name": "Nguyễn Thị Hoa",
      "email": "nthoa@humg.edu.vn",
      "staffCode": "CB0002",
      "studentCode": null,
      "roles": [
        "cms.editor"
      ],
      "units": [
        "P-TT"
      ],
      "active": true
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 4,
  "totalPages": 2
}
```

#### GET /api/v1/admin/org-units
```json
[
  {
    "code": "HUMG",
    "name": "Trường Đại học Mỏ - Địa chất",
    "kind": "school",
    "parentCode": null,
    "depth": 0,
    "path": "HUMG"
  }
]
```

#### Media
```json
{
  "id": 1,
  "fileName": "hoi-thao-gis-2025.png",
  "kind": "image",
  "ext": "png",
  "mimeType": null,
  "sizeBytes": 524288,
  "url": "cms-api/uploads/hoi-thao-gis-2025.png",
  "altText": null,
  "caption": null,
  "folder": null,
  "uploadedBy": "u-ltmai",
  "createdAt": "2025-05-16T08:00:00+07:00",
  "tenantId": "humg"
}
```

#### Banner
```json
{
  "id": 1,
  "position": "home_slider",
  "title": "Banner tuyển sinh đại học 2025",
  "imageId": null,
  "isVisible": true,
  "sortOrder": 1,
  "linkUrl": "/hoc-tap/tuyen-sinh",
  "subtitle": "Xét tuyển 15 ngành Kỹ thuật – Công nghệ, nhận hồ sơ trực tuyến",
  "startsOn": "2026-09-26",
  "endsOn": "2026-12-05",
  "tenantId": "humg"
}
```

#### Event
```json
{
  "id": 1,
  "slug": "hoi-thao-khoa-hoc-quoc-te-dia-chat-khoang-san",
  "title": "Hội thảo khoa học quốc tế về Địa chất và Khoáng sản",
  "startsAt": "2026-05-20T08:00:00+07:00",
  "endsAt": "2026-05-20T17:00:00+07:00",
  "place": "Hội trường A, HUMG",
  "placeFull": "Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Hà Nội",
  "organizer": "Khoa Địa chất & Phòng Hợp tác quốc tế",
  "audience": "Giảng viên, nhà khoa học, nghiên cứu sinh, doanh nghiệp",
  "contact": "hoithao.diachat@humg.edu.vn",
  "status": "upcoming",
  "description": [
    "Hội thảo là diễn đàn để các nhà khoa học trong nước và quốc tế trao đổi kết quả nghiên cứu mới nhất trong lĩnh vực địa chất, khoáng sản và tài nguyên bền vững."
  ],
  "agenda": [
    {
      "time": "08:00",
      "item": "Đón tiếp đại biểu & khai mạc"
    }
  ],
  "isVisible": true,
  "tenantId": "humg"
}
```

#### AuditLog
```json
{
  "id": 1,
  "tenantId": "humg",
  "actorSub": "u-tvanminh",
  "userName": "Trần Văn Minh",
  "entityType": null,
  "entityId": null,
  "changes": null,
  "action": "post.update",
  "targetLabel": "Hội thảo quốc tế về Trắc địa và GIS 2025",
  "ipAddress": "203.113.45.12",
  "createdAt": "2025-05-16T10:15:00+07:00"
}
```

#### GET /api/v1/admin/dashboard
```json
{
  "stats": {
    "posts": 22,
    "pages": 15,
    "categories": 10,
    "announcements": 8
  },
  "status": {
    "total": 22,
    "parts": [
      {
        "label": "published",
        "value": 17,
        "pct": 77.3
      }
    ]
  },
  "awaitingReview": [
    {
      "id": 4,
      "type": "news",
      "title": "Chương trình học bổng HUMG 2025",
      "status": "pending_review",
      "hasPendingRevision": false,
      "updatedAt": "2025-05-14T08:00:00+07:00"
    }
  ],
  "latestPosts": [
    {
      "id": 19,
      "categoryId": 8,
      "ownerUnitCode": "P-DT",
      "title": "Thông báo tuyển sinh đại học chính quy năm 2026",
      "slug": "thong-bao-tuyen-sinh-dai-hoc-2026",
      "excerpt": "Trường Đại học Mỏ – Địa chất thông báo tuyển sinh đại học chính quy năm 2026 với 52 chương trình đào tạo và 5 phương thức xét tuyển.",
      "status": "published",
      "isFeatured": false,
      "showOnHome": false,
      "contentBody": "[\"Năm 2026, HUMG tuyển sinh 52 chương trình đào tạo trình độ đại học, trong đó có các chương trình chất lượng cao và chương trình liên kết quốc tế.\",{\"type\":\"h2\",\"text\":\"Phương thức xét tuyển\"},{\"type\":\"list\",\"items\":[\"Xét tuyển thẳng và ưu tiên xét tuyển\",\"Xét kết quả thi tốt nghiệp THPT\",\"Xét học bạ THPT\",\"Xét tuyển kết hợp\",\"Xét kết quả kỳ thi ĐGNL của ĐHQG Hà Nội\"]},\"Thí sinh theo dõi mốc thời gian và hướng dẫn đăng ký trực tuyến tại chuyên trang Tuyển sinh của Nhà trường.\"]",
      "metaTitle": null,
      "metaDescription": null,
      "metaKeywords": null,
      "featuredImageId": null,
      "attachmentId": null,
      "authorSub": "u-nthoa",
      "authorName": "Nguyễn Thị Hoa",
      "source": null,
      "unit": "Phòng Đào tạo",
      "viewCount": 3120,
      "tags": [
        "Tuyển sinh"
      ],
      "attachments": [
        {
          "title": "Đề án tuyển sinh 2026",
          "meta": "PDF · 1.2 MB",
          "url": null
        }
      ],
      "translations": {},
      "publishAt": "2026-05-20T08:00:00+07:00",
      "expireAt": null,
      "firstPublishedAt": "2026-05-20T08:00:00+07:00",
      "submittedAt": null,
      "submittedBy": null,
      "reviewedAt": null,
      "reviewedBy": null,
      "reviewNote": null,
      "pendingRevisionId": null,
      "version": 1,
      "createdAt": "2026-05-20T08:00:00+07:00",
      "createdBy": "u-nthoa",
      "updatedAt": "2026-05-20T08:00:00+07:00",
      "updatedBy": "u-nthoa",
      "deletedAt": null,
      "deletedBy": null,
      "tenantId": "humg",
      "categoryName": "Tuyển sinh"
    }
  ],
  "upcomingEvents": [
    {
      "id": 1,
      "slug": "hoi-thao-khoa-hoc-quoc-te-dia-chat-khoang-san",
      "title": "Hội thảo khoa học quốc tế về Địa chất và Khoáng sản",
      "startsAt": "2026-05-20T08:00:00+07:00",
      "endsAt": "2026-05-20T17:00:00+07:00",
      "place": "Hội trường A, HUMG",
      "placeFull": "Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Hà Nội",
      "organizer": "Khoa Địa chất & Phòng Hợp tác quốc tế",
      "audience": "Giảng viên, nhà khoa học, nghiên cứu sinh, doanh nghiệp",
      "contact": "hoithao.diachat@humg.edu.vn",
      "status": "upcoming",
      "description": [
        "Hội thảo là diễn đàn để các nhà khoa học trong nước và quốc tế trao đổi kết quả nghiên cứu mới nhất trong lĩnh vực địa chất, khoáng sản và tài nguyên bền vững."
      ],
      "agenda": [
        {
          "time": "08:00",
          "item": "Đón tiếp đại biểu & khai mạc"
        }
      ],
      "isVisible": true,
      "tenantId": "humg"
    }
  ],
  "latestMedia": [
    {
      "id": 1,
      "fileName": "hoi-thao-gis-2025.png",
      "kind": "image",
      "ext": "png",
      "mimeType": null,
      "sizeBytes": 524288,
      "url": "cms-api/uploads/hoi-thao-gis-2025.png",
      "altText": null,
      "caption": null,
      "folder": null,
      "uploadedBy": "u-ltmai",
      "createdAt": "2025-05-16T08:00:00+07:00",
      "tenantId": "humg"
    }
  ],
  "trend": [
    {
      "day": "17/04",
      "published": 380,
      "draft": 210
    }
  ],
  "onlineUsers": 5
}
```

## 4. Dataset theo module (qlns / qlkhcn / edusoft / esb / cms)

Mỗi **module giao diện** có một dataset: `GET /{service}/api/v1/{nhóm}/datasets/{module}` (nhóm `me` cho dữ liệu cá nhân của portal `portal-*`, còn lại `public`) → object gồm các khóa dưới đây; mỗi khóa cũng có endpoint riêng `GET /{service}/api/v1/{nhóm}/{module}/{khoa-kebab-case}` (mảng → phân trang). Nội dung/kiểu dữ liệu từng khóa lấy theo đúng mock trong `mock-data/{module}.json` (cấu trúc đó **là hợp đồng**).

Hai endpoint tương ứng với Swagger gateway demo (đưa về quy ước nhóm): `GET /qlkhcn-api/api/v1/public/research-topic-categories` và `GET /qlns-api/api/v1/public/employees` (`pageIndex,pageSize,keyword[,isCurrentOnly]`).

### qlns-api

**`about`** — `GET /qlns-api/api/v1/public/datasets/about`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `aboutNav` | mảng[7] | `/api/v1/public/about/about-nav` | label, to, icon |
| `achievements` | mảng[4] | `/api/v1/public/about/achievements` | key, label, items |
| `board` | object | `/api/v1/public/about/board` | rector, vices |
| `facultyDepartments` | object | `/api/v1/public/about/faculty-departments` | mo, dia-chat, dau-khi, trac-dia, cntt, co-dien |
| `history` | mảng[5] | `/api/v1/public/about/history` | year, title, text |
| `numbers` | object | `/api/v1/public/about/numbers` | big, enrollment, publications, faculty |
| `orgChart` | object | `/api/v1/public/about/org-chart` | board, support, branches, motto |
| `overview` | object | `/api/v1/public/about/overview` | intro, stats, more, values |
| `rectorMessage` | object | `/api/v1/public/about/rector-message` | name, role, paragraphs, sign, values |
| `units` | object | `/api/v1/public/about/units` | khoa, phong-ban, trung-tam-vien, don-vi-truc-thuoc |
| `vision` | object | `/api/v1/public/about/vision` | mission, visionText, core, principles |

**`staff-hub`** — `GET /qlns-api/api/v1/public/datasets/staff-hub`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `staffDirectory` | object | `/api/v1/public/staff-hub/staff-directory` | units, rooms |
| `staffHub` | object | `/api/v1/public/staff-hub/staff-hub` | intro, stats, quickTools, keyDates, docsNew, notices |
| `staffNav` | mảng[8] | `/api/v1/public/staff-hub/staff-nav` | label, to, icon |
| `staffQuickLinks` | mảng[6] | `/api/v1/public/staff-hub/staff-quick-links` | label, to |
| `stfForms` | object | `/api/v1/public/staff-hub/stf-forms` | intro, categories, list |
| `stfPortal` | object | `/api/v1/public/staff-hub/stf-portal` | intro, benefits, loginTo, guideTo |
| `stfRegulations` | object | `/api/v1/public/staff-hub/stf-regulations` | intro, categories, docs |
| `stfResearch` | object | `/api/v1/public/staff-hub/stf-research` | intro, tiles, news |
| `stfTeaching` | object | `/api/v1/public/staff-hub/stf-teaching` | intro, terms, groups, schedule, resources, quickLinks |
| `stfUtilities` | object | `/api/v1/public/staff-hub/stf-utilities` | intro, tiles, external |

**`portal-staff`** — `GET /qlns-api/api/v1/me/datasets/portal-staff`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `pgAdmin` | object | `/api/v1/me/portal-staff/pg-admin` | tasks, docs, monthLabel, todayDate, agenda, weekEvents |
| `pgClasses` | object | `/api/v1/me/portal-staff/pg-classes` | terms, tools, list, notices |
| `pgDashboard` | object | `/api/v1/me/portal-staff/pg-dashboard` | today, stats, todayClasses, notices, research, admin |
| `pgFinance` | object | `/api/v1/me/portal-staff/pg-finance` | asOf, summary, payslips, teachingLoad, grants |
| `pgGrades` | object | `/api/v1/me/portal-staff/pg-grades` | terms, classes, columns, rows, total, stats |
| `pgInternship` | object | `/api/v1/me/portal-staff/pg-internship` | rounds, statuses, companies, stats, list |
| `pgMaterials` | object | `/api/v1/me/portal-staff/pg-materials` | types, tiles, latest |
| `pgModules` | object | `/api/v1/me/portal-staff/pg-modules` | tools, list |
| `pgNotifications` | object | `/api/v1/me/portal-staff/pg-notifications` | tabs, total, list |
| `pgProfile` | object | `/api/v1/me/portal-staff/pg-profile` | sections, personal, work, degrees, history, documents |
| `pgResearch` | object | `/api/v1/me/portal-staff/pg-research` | tabs, quickStats, projects, papers, conferences, patents |
| `pgSchedule` | object | `/api/v1/me/portal-staff/pg-schedule` | weeks, dayDates, hours, timetable, listView |
| `pgScholar` | object | `/api/v1/me/portal-staff/pg-scholar` | tabs, papers, projectsMine |
| `pgSettings` | object | `/api/v1/me/portal-staff/pg-settings` | account, prefs, sessions |
| `pgStaff` | object | `/api/v1/me/portal-staff/pg-staff` | name, displayName, degree, code, title, role |
| `pgStudents` | object | `/api/v1/me/portal-staff/pg-students` | groups, stats, list |
| `pgSupervision` | object | `/api/v1/me/portal-staff/pg-supervision` | kinds, statuses, stats, list |
| `pgSyllabus` | object | `/api/v1/me/portal-staff/pg-syllabus` | modules, info, files, plan |
| `pgTerm` | string | `/api/v1/me/portal-staff/pg-term` |  |
| `pgTickets` | object | `/api/v1/me/portal-staff/pg-tickets` | stats, statuses, categories, list |
| `pgTools` | object | `/api/v1/me/portal-staff/pg-tools` | utilities, elearning |

**`portal-staff-tools`** — `GET /qlns-api/api/v1/me/datasets/portal-staff-tools`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `staffToolList` | mảng[28] | `/api/v1/me/portal-staff-tools/staff-tool-list` | key, path, title, sub, back, blocks |
| `staffToolMap` | object | `/api/v1/me/portal-staff-tools/staff-tool-map` | lop.danh-sach, lop.diem-danh, lop.nhap-diem, lop.bai-tap, lop.tai-lieu, lop.thong-ke |

**`portal-leader`** — `GET /qlns-api/api/v1/me/datasets/portal-leader`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `plApprovals` | object | `/api/v1/me/portal-leader/pl-approvals` | counts, list, alerts |
| `plBI` | object | `/api/v1/me/portal-leader/pl-bi` | training, research, finance, trend |
| `plDashboard` | object | `/api/v1/me/portal-leader/pl-dashboard` | updatedAt, stats, admissionDonut, revenue, alerts, activity |
| `plDomains` | object | `/api/v1/me/portal-leader/pl-domains` | dao-tao, nghien-cuu-khoa-hoc, sinh-vien, tai-chinh, nhan-su, co-so-vat-chat |
| `plNotifications` | object | `/api/v1/me/portal-leader/pl-notifications` | tabs, list |
| `plPortalSettings` | object | `/api/v1/me/portal-leader/pl-portal-settings` | tabs, themes, colors, display |
| `plReports` | object | `/api/v1/me/portal-leader/pl-reports` | catalog, favorites |
| `plSysLog` | object | `/api/v1/me/portal-leader/pl-sys-log` | eventTypes, total, rows |
| `plSystem` | object | `/api/v1/me/portal-leader/pl-system` | groups, info |
| `plTerms` | mảng[3] | `/api/v1/me/portal-leader/pl-terms` | string |
| `plUnits` | mảng[7] | `/api/v1/me/portal-leader/pl-units` | string |
| `plUser` | object | `/api/v1/me/portal-leader/pl-user` | name, title |
| `plYears` | mảng[3] | `/api/v1/me/portal-leader/pl-years` | string |

### qlkhcn-api

**`research`** — `GET /qlkhcn-api/api/v1/public/datasets/research`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `conferences` | mảng[6] | `/api/v1/public/research/conferences` | slug, name, date, time, place, scope |
| `expertStats` | mảng[4] | `/api/v1/public/research/expert-stats` | value, label |
| `experts` | mảng[9] | `/api/v1/public/research/experts` | id, name, position, faculty, fields, email |
| `labs` | mảng[6] | `/api/v1/public/research/labs` | id, name, faculty, head, desc, equipment |
| `phdTraining` | object | `/api/v1/public/research/phd-training` | intro, stats, fields, steps, docs, notices |
| `projectLevels` | mảng[6] | `/api/v1/public/research/project-levels` | string |
| `projects` | mảng[8] | `/api/v1/public/research/projects` | budget, org, objectives, results, products, members |
| `publicationTypes` | mảng[5] | `/api/v1/public/research/publication-types` | string |
| `publications` | mảng[6] | `/api/v1/public/research/publications` | id, type, quartile, year, citations, downloads |
| `resHub` | object | `/api/v1/public/research/res-hub` | modules, stats, quickLinks, notices |
| `resNav` | mảng[9] | `/api/v1/public/research/res-nav` | label, to, icon |
| `researchFields` | mảng[8] | `/api/v1/public/research/research-fields` | string |
| `researchGroups` | mảng[6] | `/api/v1/public/research/research-groups` | id, name, leader, members, field, established |
| `strongFields` | mảng[5] | `/api/v1/public/research/strong-fields` | label, value |
| `techTransfer` | object | `/api/v1/public/research/tech-transfer` | intro, steps, products, capabilities, faqs |

### edusoft-api

**`admissions`** — `GET /edusoft-api/api/v1/public/datasets/admissions`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `admission` | object | `/api/v1/public/admissions/admission` | tiles, quota, methods, majors, docs, links |
| `admissionAdvisory` | object | `/api/v1/public/admissions/admission-advisory` | channels, note |
| `admissionBenchmarks` | object | `/api/v1/public/admissions/admission-benchmarks` | years, method, data |
| `admissionCombos` | object | `/api/v1/public/admissions/admission-combos` | columns, rows |
| `admissionDossier` | object | `/api/v1/public/admissions/admission-dossier` | common, bySpecial, submit |
| `admissionRegulations` | mảng[5] | `/api/v1/public/admissions/admission-regulations` | name, meta |
| `admissionTimeline` | mảng[7] | `/api/v1/public/admissions/admission-timeline` | phase, time, note |
| `admissionVideos` | mảng[6] | `/api/v1/public/admissions/admission-videos` | title, meta |
| `admissionsNav` | mảng[11] | `/api/v1/public/admissions/admissions-nav` | label, to, icon |

**`education`** — `GET /edusoft-api/api/v1/public/datasets/education`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `academicCalendar` | object | `/api/v1/public/education/academic-calendar` | year, plan, exam, docs, terms, faculties |
| `eduHub` | object | `/api/v1/public/education/edu-hub` | modules, stats, quickLinks, notices |
| `eduNav` | mảng[12] | `/api/v1/public/education/edu-nav` | label, to, icon |
| `generalInfo` | object | `/api/v1/public/education/general-info` | systems, grading, graduation, docs |
| `outcomesGeneral` | object | `/api/v1/public/education/outcomes-general` | intro, years, courseOutcomes, groups |
| `programTypes` | mảng[4] | `/api/v1/public/education/program-types` | string |
| `programs` | mảng[12] | `/api/v1/public/education/programs` | level, type, duration, credits, quota, degree |
| `resultLookup` | object | `/api/v1/public/education/result-lookup` | terms, programs, sample, steps, grading, faqs |
| `studyGuides` | object | `/api/v1/public/education/study-guides` | tiles, videos, docs, faqs |
| `surveys` | object | `/api/v1/public/education/surveys` | open, about, results, closed |
| `tuition` | object | `/api/v1/public/education/tuition` | table, payment, scholarships, waiver, docs, faqs |

**`student-hub`** — `GET /edusoft-api/api/v1/public/datasets/student-hub`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `stuFaq` | mảng[6] | `/api/v1/public/student-hub/stu-faq` | q, a |
| `stuForms` | object | `/api/v1/public/student-hub/stu-forms` | intro, categories, list |
| `stuJobs` | object | `/api/v1/public/student-hub/stu-jobs` | intro, tabs, listings, startup, events |
| `stuLearning` | object | `/api/v1/public/student-hub/stu-learning` | intro, tiles, quickLinks |
| `stuLibrary` | object | `/api/v1/public/student-hub/stu-library` | intro, tabs, featured, quickAccess, elearning, elearningTo |
| `stuLife` | object | `/api/v1/public/student-hub/stu-life` | intro, tiles, note |
| `stuOnboarding` | object | `/api/v1/public/student-hub/stu-onboarding` | intro, steps, checklist, downloads |
| `stuPortal` | object | `/api/v1/public/student-hub/stu-portal` | intro, benefits, loginTo, guideTo |
| `stuRegulations` | object | `/api/v1/public/student-hub/stu-regulations` | intro, categories, docs, note |
| `stuTuition` | object | `/api/v1/public/student-hub/stu-tuition` | intro, tabs, years, tuitionRows, payTiles, scholarships |
| `studentHub` | object | `/api/v1/public/student-hub/student-hub` | intro, stats, keyDates, publicTools, notices, events |
| `studentNavGroups` | mảng[2] | `/api/v1/public/student-hub/student-nav-groups` | title, items |
| `studentQuickLinks` | mảng[6] | `/api/v1/public/student-hub/student-quick-links` | label, to |

**`portal-student`** — `GET /edusoft-api/api/v1/me/datasets/portal-student`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `psDashboard` | object | `/api/v1/me/portal-student/ps-dashboard` | stats, termInfo, today, notices, progress, quickLinks |
| `psForms` | object | `/api/v1/me/portal-student/ps-forms` | categories, list, mine |
| `psLibrary` | object | `/api/v1/me/portal-student/ps-library` | tiles, elearning, borrowing |
| `psNotifications` | object | `/api/v1/me/portal-student/ps-notifications` | tabs, total, list |
| `psProgress` | object | `/api/v1/me/portal-student/ps-progress` | program, overall, credits, next |
| `psRegCourses` | object | `/api/v1/me/portal-student/ps-reg-courses` | window, conditions, types, offered, maxCredits |
| `psRegIntern` | object | `/api/v1/me/portal-student/ps-reg-intern` | round, conditions, companies |
| `psRegThesis` | object | `/api/v1/me/portal-student/ps-reg-thesis` | round, conditions, advisors, topics |
| `psResults` | object | `/api/v1/me/portal-student/ps-results` | terms, summary, courses, cumulative |
| `psSchedule` | object | `/api/v1/me/portal-student/ps-schedule` | terms, weeks, dayDates, hours, timetable, exams |
| `psServices` | object | `/api/v1/me/portal-student/ps-services` | tiles, requests |
| `psSettings` | object | `/api/v1/me/portal-student/ps-settings` | account, prefs, sessions |
| `psStudent` | object | `/api/v1/me/portal-student/ps-student` | name, mssv, dob, gender, faculty, class |
| `psStudyCorner` | object | `/api/v1/me/portal-student/ps-study-corner` | plan, courses |
| `psTerm` | string | `/api/v1/me/portal-student/ps-term` |  |
| `psTickets` | object | `/api/v1/me/portal-student/ps-tickets` | stats, statuses, categories, list |
| `psTuition` | object | `/api/v1/me/portal-student/ps-tuition` | asOf, balance, term, fees, history, scholarships |

**`portal-parent`** — `GET /edusoft-api/api/v1/me/datasets/portal-parent`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `ppAttendance` | object | `/api/v1/me/portal-parent/pp-attendance` | terms, subjects, stats, history |
| `ppChild` | object | `/api/v1/me/portal-parent/pp-child` | name, mssv, dob, gender, ethnic, cccd |
| `ppContactInfo` | mảng[2] | `/api/v1/me/portal-parent/pp-contact-info` | unit, phone, email |
| `ppDashboard` | object | `/api/v1/me/portal-parent/pp-dashboard` | years, stats, gradeDonut, gpaTrend, notices |
| `ppLinks` | mảng[1] | `/api/v1/me/portal-parent/pp-links` | 0, 1, 2, 3, 4 |
| `ppNotices` | object | `/api/v1/me/portal-parent/pp-notices` | tabs, total, list |
| `ppParent` | object | `/api/v1/me/portal-parent/pp-parent` | name, relation, child, email, phone, address |
| `ppRequestHistory` | mảng[3] | `/api/v1/me/portal-parent/pp-request-history` | 0, 1, 2, 3, 4 |
| `ppRequestTypes` | mảng[7] | `/api/v1/me/portal-parent/pp-request-types` | string |
| `ppResults` | object | `/api/v1/me/portal-parent/pp-results` | terms, summary, courses, bySubject |
| `ppSchedule` | object | `/api/v1/me/portal-parent/pp-schedule` | weeks, slots, timetable, exams |
| `ppServices` | object | `/api/v1/me/portal-parent/pp-services` | catalog, history |
| `ppTerm` | string | `/api/v1/me/portal-parent/pp-term` |  |
| `ppTuition` | object | `/api/v1/me/portal-parent/pp-tuition` | overview, detailTitle, fees, totalRow, history, invoices |
| `ppWorkingHours` | mảng[2] | `/api/v1/me/portal-parent/pp-working-hours` | string |

### esb-api

**`library`** — `GET /esb-api/api/v1/public/datasets/library`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `collections` | mảng[6] | `/api/v1/public/library/collections` | id, icon, name, count, desc |
| `databaseGroups` | mảng[2] | `/api/v1/public/library/database-groups` | group, items |
| `items` | mảng[6] | `/api/v1/public/library/items` | id, type, title, authors, publisher, year |
| `languageFacets` | mảng[2] | `/api/v1/public/library/language-facets` | 0, 1 |
| `libraryGuide` | object | `/api/v1/public/library/library-guide` | intro, steps, faqs, rules, downloads, hours |
| `libraryHub` | object | `/api/v1/public/library/library-hub` | intro, tabs, stats, quickLinks, notices |
| `libraryNav` | mảng[7] | `/api/v1/public/library/library-nav` | label, to, icon |
| `myItems` | object | `/api/v1/public/library/my-items` | tabs, borrowing, reserved, favorites, history, note |
| `resourceTypeFacets` | mảng[6] | `/api/v1/public/library/resource-type-facets` | key, label, count |
| `searchFaculties` | mảng[9] | `/api/v1/public/library/search-faculties` | string |
| `searchLangs` | mảng[5] | `/api/v1/public/library/search-langs` | string |
| `yearFacets` | mảng[5] | `/api/v1/public/library/year-facets` | 0, 1 |

### cms-api

**`cooperation`** — `GET /cms-api/api/v1/public/datasets/cooperation`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `coopFields` | mảng[6] | `/api/v1/public/cooperation/coop-fields` | string |
| `coopHub` | object | `/api/v1/public/cooperation/coop-hub` | modules, stats, quickLinks, notices, yearActivity |
| `coopNav` | mảng[9] | `/api/v1/public/cooperation/coop-nav` | label, to, icon |
| `coopProgramTypes` | mảng[6] | `/api/v1/public/cooperation/coop-program-types` | string |
| `coopPrograms` | mảng[8] | `/api/v1/public/cooperation/coop-programs` | scope, objectives, results, docs, id, title |
| `exchange` | object | `/api/v1/public/cooperation/exchange` | intro, programs, steps, benefits, eligibility, docs |
| `intlLecturers` | object | `/api/v1/public/cooperation/intl-lecturers` | intro, programs, steps, benefits, docs |
| `intlStudents` | object | `/api/v1/public/cooperation/intl-students` | intro, stats, programs, steps, support, docs |
| `opportunities` | object | `/api/v1/public/cooperation/opportunities` | intro, forms, priorities, commitments, steps, contact |
| `partnerCategories` | mảng[6] | `/api/v1/public/cooperation/partner-categories` | string |
| `partners` | mảng[12] | `/api/v1/public/cooperation/partners` | activities, id, name, country, type, category |

**`life`** — `GET /cms-api/api/v1/public/datasets/life`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `activities` | mảng[6] | `/api/v1/public/life/activities` | organizer, gallery, content, agenda, slug, tag |
| `campus` | object | `/api/v1/public/life/campus` | intro, facilities, address, hours |
| `campusServices` | mảng[6] | `/api/v1/public/life/campus-services` | icon, title, desc |
| `clubCategories` | mảng[6] | `/api/v1/public/life/club-categories` | string |
| `clubs` | mảng[8] | `/api/v1/public/life/clubs` | activities, schedule, achievements, fanpage, gallery, id |
| `dorm` | object | `/api/v1/public/life/dorm` | intro, zones, amenities, fee, steps, rules |
| `health` | object | `/api/v1/public/life/health` | intro, services, insurance, schedule, contact |
| `jobs` | object | `/api/v1/public/life/jobs` | intro, stats, listings, services |
| `lifeHub` | object | `/api/v1/public/life/life-hub` | intro, features, stats, feed |
| `lifeNav` | mảng[11] | `/api/v1/public/life/life-nav` | label, to, icon |
| `sportsCulture` | object | `/api/v1/public/life/sports-culture` | intro, facilities, events, teams |
| `studentSupport` | object | `/api/v1/public/life/student-support` | intro, channels, steps, faqs, hotline |
| `youthUnion` | object | `/api/v1/public/life/youth-union` | intro, bodies, movements, achievements, contact |

**`utilities`** — `GET /cms-api/api/v1/public/datasets/utilities`

| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |
|---|---|---|---|
| `admission` | object | `/api/v1/public/utilities/admission` | tiles, quota, methods, majors, docs, links |
| `contact` | object | `/api/v1/public/utilities/contact` | cards, subjects, hours, transport, faqs |
| `digilib` | object | `/api/v1/public/utilities/digilib` | access, resources, latest, stats, help |
| `elearning` | object | `/api/v1/public/utilities/elearning` | tiles, systems, courses, docs |
| `forms` | object | `/api/v1/public/utilities/forms` | categories |
| `utilityGroups` | mảng[3] | `/api/v1/public/utilities/utility-groups` | title, items |
| `webmail` | object | `/api/v1/public/utilities/webmail` | docs, faqs, links |
| `workCalendar` | object | `/api/v1/public/utilities/work-calendar` | week, days, notices |


> Các khóa `*Nav`, `*QuickLinks`, `forms`, `staffToolList`, `studentNavGroups`, `libraryGuide`… là **cấu hình giao diện tĩnh** (đã nằm trong code FE `src/config/static`); backend có thể bỏ qua hoặc cung cấp tùy ý, FE không phụ thuộc vào chúng khi gọi API.

## 5. Cơ sở dữ liệu CMS tham khảo

**`database/v2/schema.sql`** — schema đích cho backend .NET (PostgreSQL 16): multi-tenant + Row-Level Security, workflow, revisions, audit (partition), access_grants, announcements/targets/receipts, tìm kiếm `unaccent` + `pg_trgm`. Kiểm thử: `database/v2/test.sql`. Thư mục `database/` gốc (`schema.sql`, `seed.sql`) là bản v1 — chỉ để tham khảo lịch sử.
