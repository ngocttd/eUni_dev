-- ============================================================================
-- HUMG eUni cms-api — DỮ LIỆU BAN ĐẦU (dữ liệu mẫu đầy đủ) cho lược đồ v2 + v2.1
-- Sinh bằng: dotnet HUMG.CMS.Api.dll --init-db  →  pg_dump --data-only --column-inserts  (2026-10-07)
--
-- Dùng khi DBA muốn nạp dữ liệu bằng tay thay vì để API tự nạp (API tự nạp khi database TRỐNG; xem README, mục "Nạp dữ liệu").
--   1) áp lược đồ:  psql -v ON_ERROR_STOP=1 -f database/v2/schema.sql -f database/v2/amendments.sql      (role cms_admin)
--   2) nạp dữ liệu: psql -v ON_ERROR_STOP=1 -f database/v2/seed-data.sql                                 (role cms_admin, database TRỐNG)
--   3) chạy API với DB_MIGRATE=false hoặc mặc định (API thấy app_meta.schemaVersion nên KHÔNG nạp lại)
--
-- Gồm: 2 tenant (humg, cntt), cây đơn vị, danh bạ + tài khoản mẫu, bài viết + bản dịch + revision, thông báo + đối tượng nhận, danh mục, trang + menu,
--      banner, sự kiện, album/video/podcast, khối trang chủ, cấu hình theo tenant, phân quyền (grants), nhật ký và sao lưu mẫu.
-- LƯU Ý: ngày của banner / thông báo hẹn giờ trong dữ liệu mẫu tính theo ngày sinh file này; muốn mốc ngày tính theo ngày triển khai, để API tự nạp
--        (hoặc: dotnet HUMG.CMS.Api.dll --init-db --fresh). Dữ liệu mẫu là TÀI KHOẢN/NỘI DUNG DEMO — thay bằng dữ liệu thật trước khi mở cho người dùng.
-- Tất cả FK được hoãn tới COMMIT nên thứ tự bảng không quan trọng; chạy trong MỘT transaction (lỗi → không nạp gì).
-- ============================================================================
BEGIN;
SET LOCAL row_security = off;           -- cms_admin (BYPASSRLS) ghi mọi tenant
SET LOCAL client_min_messages = warning;
DELETE FROM cms.languages;               -- schema.sql đã chèn vi/en cơ bản; bản dưới đây đầy đủ hơn (cờ ngôn ngữ)
--
-- Data for Name: tenants; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.tenants (id, name, root_unit, default_lang, is_active, created_at, extra, created_by, updated_at, updated_by) OVERRIDING SYSTEM VALUE VALUES
	('humg', 'Trường Đại học Mỏ - Địa chất', 'HUMG', 'vi', true, '2026-10-07 11:58:15.706+00', '{}', NULL, NULL, NULL),
	('cntt', 'Khoa Công nghệ thông tin', 'CNTT', 'vi', true, '2026-10-07 11:58:15.711+00', '{}', NULL, NULL, NULL);


--
-- Data for Name: access_grants; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.access_grants (id, tenant_id, principal_type, principal_id, resource_type, scope_type, scope_id, permissions, note, expires_at, created_by, created_at, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'user', 'u-nthoa', '*', 'tenant', NULL, '{view,edit,review,publish}', 'Biên tập viên chính — toàn trang Trường', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(2, 'humg', 'role', 'cms.author', '*', 'tenant', NULL, '{view}', 'Tác giả xem được mọi bài của Trường', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(3, 'humg', 'role', 'cms.viewer', '*', 'tenant', NULL, '{view}', 'Người xem CMS xem được mọi bài của Trường', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(4, 'humg', 'unit', 'P-TT', 'news', 'unit', 'P-TT', '{edit}', 'Thành viên Phòng Truyền thông sửa bài của phòng', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(5, 'humg', 'user', 'u-pvloc', '*', 'unit', 'CNTT', '{view,edit,review,publish}', 'Phụ trách nội dung Khoa CNTT trên trang Trường', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(6, 'humg', 'user', 'u-vthuong', 'announcement', 'unit', 'P-DT', '{review}', 'Duyệt thông báo của Phòng Đào tạo', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(7, 'humg', 'unit', 'P-DT', 'announcement', 'unit', 'P-DT', '{edit}', 'Cán bộ Phòng Đào tạo soạn thông báo của phòng', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(8, 'humg', 'user', 'u-dvtung', 'news', 'category', '4', '{edit}', 'Cộng tác viên chuyên mục Nghiên cứu', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(9, 'cntt', 'user', 'u-pvloc', '*', 'tenant', NULL, '{manage}', 'Quản trị trang Khoa CNTT', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}'),
	(10, 'cntt', 'unit', 'BM-KHMT', '*', 'unit', 'BM-KHMT', '{edit}', 'Bộ môn KHMT tự soạn bài/thông báo của bộ môn', NULL, 'u-tvanminh', '2025-01-10 01:00:00+00', NULL, NULL, '{}');


--
-- Data for Name: org_units; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.org_units (code, name, kind, parent_code, path, is_active, synced_at) OVERRIDING SYSTEM VALUE VALUES
	('HUMG', 'Trường Đại học Mỏ - Địa chất', 'school', NULL, 'HUMG', true, '2026-10-07 11:58:15.501487+00'),
	('VP', 'Văn phòng Trường', 'office', 'HUMG', 'HUMG.VP', true, '2026-10-07 11:58:15.501487+00'),
	('P-TT', 'Phòng Truyền thông', 'office', 'HUMG', 'HUMG.P_TT', true, '2026-10-07 11:58:15.501487+00'),
	('P-DT', 'Phòng Đào tạo', 'office', 'HUMG', 'HUMG.P_DT', true, '2026-10-07 11:58:15.501487+00'),
	('P-CTSV', 'Phòng Công tác sinh viên', 'office', 'HUMG', 'HUMG.P_CTSV', true, '2026-10-07 11:58:15.501487+00'),
	('P-KHCN', 'Phòng Khoa học công nghệ', 'office', 'HUMG', 'HUMG.P_KHCN', true, '2026-10-07 11:58:15.501487+00'),
	('P-HTQT', 'Phòng Hợp tác quốc tế', 'office', 'HUMG', 'HUMG.P_HTQT', true, '2026-10-07 11:58:15.501487+00'),
	('CNTT', 'Khoa Công nghệ thông tin', 'faculty', 'HUMG', 'HUMG.CNTT', true, '2026-10-07 11:58:15.501487+00'),
	('BM-KHMT', 'Bộ môn Khoa học máy tính', 'department', 'CNTT', 'HUMG.CNTT.BM_KHMT', true, '2026-10-07 11:58:15.501487+00'),
	('BM-CNPM', 'Bộ môn Công nghệ phần mềm', 'department', 'CNTT', 'HUMG.CNTT.BM_CNPM', true, '2026-10-07 11:58:15.501487+00'),
	('DCCTKT66A', 'Lớp DCCTKT66A', 'class', 'BM-KHMT', 'HUMG.CNTT.BM_KHMT.DCCTKT66A', true, '2026-10-07 11:58:15.501487+00'),
	('DCCTKT66B', 'Lớp DCCTKT66B', 'class', 'BM-CNPM', 'HUMG.CNTT.BM_CNPM.DCCTKT66B', true, '2026-10-07 11:58:15.501487+00'),
	('MO', 'Khoa Mỏ', 'faculty', 'HUMG', 'HUMG.MO', true, '2026-10-07 11:58:15.501487+00'),
	('BM-KTM', 'Bộ môn Khai thác mỏ', 'department', 'MO', 'HUMG.MO.BM_KTM', true, '2026-10-07 11:58:15.501487+00'),
	('DCKTM66', 'Lớp DCKTM66', 'class', 'BM-KTM', 'HUMG.MO.BM_KTM.DCKTM66', true, '2026-10-07 11:58:15.501487+00'),
	('TDBD', 'Khoa Trắc địa – Bản đồ', 'faculty', 'HUMG', 'HUMG.TDBD', true, '2026-10-07 11:58:15.501487+00');


--
-- Data for Name: revisions; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.revisions (id, tenant_id, entity_type, entity_id, version, state, snapshot, reason, created_by, created_at, extra, review_note) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'news', 1, 1, 'current', '{"slug": "hoi-thao-trac-dia-gis-2025", "tags": ["Hội thảo", "Trắc địa", "GIS"], "unit": "Khoa Trắc địa – Bản đồ", "title": "Hội thảo quốc tế về Trắc địa và GIS 2025", "source": null, "status": "published", "excerpt": "Hội thảo là diễn đàn học thuật uy tín nhằm chia sẻ các xu hướng, công nghệ mới nhất trong lĩnh vực Trắc địa, Bản đồ và Hệ thống thông tin địa lý (GIS).", "expireAt": null, "authorSub": "u-tvanminh", "createdAt": "2025-05-16T08:00:00+07:00", "createdBy": "u-tvanminh", "metaTitle": "Hội thảo quốc tế về Trắc địa và GIS 2025 – HUMG", "publishAt": "2025-05-16T08:00:00+07:00", "authorName": "Trần Văn Minh", "categoryId": 1, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [{"url": null, "meta": "PDF · 4.2 MB", "title": "Báo cáo tổng kết Hội thảo Trắc địa & GIS 2025"}], "contentBody": "[\"Nhập nội dung bài viết ở đây… (trình soạn thảo WYSIWYG)\\n\\nHội thảo quốc tế về Trắc địa và GIS 2025 quy tụ các chuyên gia đầu ngành trong nước và quốc tế…\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": "trắc địa, GIS, hội thảo quốc tế, HUMG", "translations": {"en": {"title": "International Conference on Geodesy and GIS 2025", "status": "done", "excerpt": "The conference is a prestigious academic forum to share the latest trends and technologies in Geodesy, Cartography and Geographic Information Systems (GIS).", "metaTitle": "International Conference on Geodesy and GIS 2025 – HUMG", "contentBody": "[\"Enter the post content here… (WYSIWYG editor)\\n\\nThe International Conference on Geodesy and GIS 2025 brings together leading experts from Vietnam and abroad…\"]", "metaKeywords": "geodesy, GIS, international conference, HUMG", "metaDescription": "Program, speakers and registration for the International Conference on Geodesy – GIS 2025 at Hanoi University of Mining and Geology."}}, "ownerUnitCode": "TDBD", "featuredImageId": null, "metaDescription": "Thông tin chương trình, diễn giả và đăng ký tham dự Hội thảo quốc tế Trắc địa – GIS 2025 tại Trường Đại học Mỏ – Địa chất.", "firstPublishedAt": "2025-05-16T08:00:00+07:00"}', 'Khởi tạo', 'u-tvanminh', '2025-05-16 01:00:00+00', '{}', NULL),
	(2, 'humg', 'news', 2, 1, 'current', '{"slug": "thong-bao-lich-thi-hoc-ky-2-2024-2025", "tags": [], "unit": null, "title": "Thông báo lịch thi học kỳ 2 (2024 – 2025)", "source": null, "status": "published", "excerpt": "Thông báo lịch thi học kỳ 2 (2024 – 2025).", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-05-15T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-05-15T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 2, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Thông báo lịch thi học kỳ 2 (2024 – 2025).\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {"en": {"title": "Thông báo lịch thi học kỳ 2 (2024 – 2025)", "status": "in_progress"}}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-15T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-05-15 01:00:00+00', '{}', NULL),
	(3, 'humg', 'news', 3, 1, 'current', '{"slug": "nghien-cuu-ung-dung-ai-trong-quan-ly-dao-tao", "tags": [], "unit": null, "title": "Nghiên cứu ứng dụng AI trong quản lý đào tạo", "source": null, "status": "draft", "excerpt": "Nghiên cứu ứng dụng AI trong quản lý đào tạo.", "expireAt": null, "authorSub": "u-hunglq", "createdAt": "2025-05-15T08:00:00+07:00", "createdBy": "u-hunglq", "metaTitle": null, "publishAt": null, "authorName": "Lê Quốc Hùng", "categoryId": 4, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Nghiên cứu ứng dụng AI trong quản lý đào tạo.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "CNTT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": null}', 'Khởi tạo', 'u-hunglq', '2025-05-15 01:00:00+00', '{}', NULL),
	(4, 'humg', 'news', 4, 1, 'current', '{"slug": "chuong-trinh-hoc-bong-humg-2025", "tags": [], "unit": null, "title": "Chương trình học bổng HUMG 2025", "source": null, "status": "pending_review", "excerpt": "Chương trình học bổng HUMG 2025.", "expireAt": null, "authorSub": "u-lanpt", "createdAt": "2025-05-14T08:00:00+07:00", "createdBy": "u-lanpt", "metaTitle": null, "publishAt": null, "authorName": "Phạm Thị Lan", "categoryId": 8, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Chương trình học bổng HUMG 2025.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {"en": {"title": "Chương trình học bổng HUMG 2025", "status": "in_progress"}}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": null}', 'Khởi tạo', 'u-lanpt', '2025-05-14 01:00:00+00', '{}', NULL),
	(5, 'humg', 'news', 5, 1, 'current', '{"slug": "ket-qua-xet-tuyen-dot-1-nam-hoc-2024-2025", "tags": [], "unit": null, "title": "Kết quả xét tuyển đợt 1 năm học 2024 – 2025", "source": null, "status": "published", "excerpt": "Kết quả xét tuyển đợt 1 năm học 2024 – 2025.", "expireAt": null, "authorSub": "u-annv", "createdAt": "2025-05-12T08:00:00+07:00", "createdBy": "u-annv", "metaTitle": null, "publishAt": "2025-05-12T08:00:00+07:00", "authorName": "Nguyễn Văn An", "categoryId": 1, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Kết quả xét tuyển đợt 1 năm học 2024 – 2025.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {"en": {"title": "Kết quả xét tuyển đợt 1 năm học 2024 – 2025", "status": "done"}}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-12T08:00:00+07:00"}', 'Khởi tạo', 'u-annv', '2025-05-12 01:00:00+00', '{}', NULL),
	(6, 'humg', 'news', 6, 1, 'current', '{"slug": "le-khai-giang-nam-hoc-moi-2025-2026", "tags": [], "unit": null, "title": "Lễ khai giảng năm học mới 2025 – 2026", "source": null, "status": "published", "excerpt": "Lễ khai giảng năm học mới 2025 – 2026.", "expireAt": null, "authorSub": "u-ltmai", "createdAt": "2025-05-11T08:00:00+07:00", "createdBy": "u-ltmai", "metaTitle": null, "publishAt": "2025-05-11T08:00:00+07:00", "authorName": "Lê Thị Mai", "categoryId": 3, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Lễ khai giảng năm học mới 2025 – 2026.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-11T08:00:00+07:00"}', 'Khởi tạo', 'u-ltmai', '2025-05-11 01:00:00+00', '{}', NULL),
	(7, 'humg', 'news', 7, 1, 'current', '{"slug": "huong-dan-dang-ky-hoc-phan-hoc-ky-moi", "tags": [], "unit": null, "title": "Hướng dẫn đăng ký học phần học kỳ mới", "source": null, "status": "published", "excerpt": "Hướng dẫn đăng ký học phần học kỳ mới.", "expireAt": null, "authorSub": "u-hdnam", "createdAt": "2025-05-10T08:00:00+07:00", "createdBy": "u-hdnam", "metaTitle": null, "publishAt": "2025-05-10T08:00:00+07:00", "authorName": "Hoàng Đức Nam", "categoryId": 7, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Hướng dẫn đăng ký học phần học kỳ mới.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-10T08:00:00+07:00"}', 'Khởi tạo', 'u-hdnam', '2025-05-10 01:00:00+00', '{}', NULL),
	(8, 'humg', 'news', 8, 1, 'current', '{"slug": "hoi-thao-khoa-hoc-tre-humg-lan-thu-xv", "tags": [], "unit": null, "title": "Hội thảo khoa học trẻ HUMG lần thứ XV", "source": null, "status": "draft", "excerpt": "Hội thảo khoa học trẻ HUMG lần thứ XV.", "expireAt": null, "authorSub": "u-ltmai", "createdAt": "2025-05-09T08:00:00+07:00", "createdBy": "u-ltmai", "metaTitle": null, "publishAt": null, "authorName": "Lê Thị Mai", "categoryId": 3, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Hội thảo khoa học trẻ HUMG lần thứ XV.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": null}', 'Khởi tạo', 'u-ltmai', '2025-05-09 01:00:00+00', '{}', NULL),
	(9, 'humg', 'news', 9, 1, 'current', '{"slug": "thong-bao-tuyen-dung-giang-vien-nam-2025", "tags": [], "unit": null, "title": "Thông báo tuyển dụng giảng viên năm 2025", "source": null, "status": "published", "excerpt": "Thông báo tuyển dụng giảng viên năm 2025.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-05-08T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-05-08T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 2, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Thông báo tuyển dụng giảng viên năm 2025.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {"en": {"title": "Thông báo tuyển dụng giảng viên năm 2025", "status": "in_progress"}}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-08T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-05-08 01:00:00+00', '{}', NULL),
	(10, 'humg', 'news', 10, 1, 'current', '{"slug": "danh-muc-de-tai-nckh-cap-truong-nam-2027", "tags": [], "unit": null, "title": "Danh mục đề tài NCKH cấp Trường năm 2027", "source": null, "status": "pending_review", "excerpt": "Danh mục đề tài NCKH cấp Trường năm 2027.", "expireAt": null, "authorSub": "u-hunglq", "createdAt": "2025-05-07T08:00:00+07:00", "createdBy": "u-hunglq", "metaTitle": null, "publishAt": null, "authorName": "Lê Quốc Hùng", "categoryId": 4, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Danh mục đề tài NCKH cấp Trường năm 2027.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "CNTT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": null}', 'Khởi tạo', 'u-hunglq', '2025-05-07 01:00:00+00', '{}', NULL),
	(11, 'humg', 'news', 11, 1, 'current', '{"slug": "chi-tieu-tuyen-sinh-dai-hoc-chinh-quy-2025", "tags": [], "unit": null, "title": "Chỉ tiêu tuyển sinh đại học chính quy 2025", "source": null, "status": "published", "excerpt": "Chỉ tiêu tuyển sinh đại học chính quy 2025.", "expireAt": null, "authorSub": "u-lanpt", "createdAt": "2025-05-06T08:00:00+07:00", "createdBy": "u-lanpt", "metaTitle": null, "publishAt": "2025-05-06T08:00:00+07:00", "authorName": "Phạm Thị Lan", "categoryId": 8, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Chỉ tiêu tuyển sinh đại học chính quy 2025.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {"en": {"title": "Chỉ tiêu tuyển sinh đại học chính quy 2025", "status": "done"}}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-06T08:00:00+07:00"}', 'Khởi tạo', 'u-lanpt', '2025-05-06 01:00:00+00', '{}', NULL),
	(12, 'humg', 'news', 12, 1, 'current', '{"slug": "ke-hoach-hoc-tap-ren-luyen-nam-hoc-moi", "tags": [], "unit": null, "title": "Kế hoạch học tập – rèn luyện năm học mới", "source": null, "status": "draft", "excerpt": "Kế hoạch học tập – rèn luyện năm học mới.", "expireAt": null, "authorSub": "u-hdnam", "createdAt": "2025-05-05T08:00:00+07:00", "createdBy": "u-hdnam", "metaTitle": null, "publishAt": null, "authorName": "Hoàng Đức Nam", "categoryId": 7, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Kế hoạch học tập – rèn luyện năm học mới.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-TT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": null}', 'Khởi tạo', 'u-hdnam', '2025-05-05 01:00:00+00', '{}', NULL),
	(13, 'humg', 'news', 13, 1, 'current', '{"slug": "le-ky-niem-60-nam-thanh-lap", "tags": ["60 năm", "Truyền thống", "Sự kiện"], "unit": "Văn phòng", "title": "Lễ kỷ niệm 60 năm thành lập Trường Đại học Mỏ – Địa chất", "source": null, "status": "published", "excerpt": "Sáng 15/05/2025, Trường Đại học Mỏ – Địa chất long trọng tổ chức Lễ kỷ niệm 60 năm thành lập, ôn lại chặng đường xây dựng và phát triển của Nhà trường.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-05-15T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-05-15T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 3, "isFeatured": true, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": true, "attachments": [{"url": null, "meta": "PDF · 640 KB", "title": "Diễn văn kỷ niệm 60 năm thành lập Trường"}], "contentBody": "[\"Trong không khí trang trọng và ấm áp, Trường Đại học Mỏ – Địa chất đã tổ chức Lễ kỷ niệm 60 năm thành lập (1966 – 2026) với sự tham dự của lãnh đạo Bộ Giáo dục và Đào tạo, các thế hệ cán bộ, giảng viên, cựu sinh viên và đối tác trong, ngoài nước.\",{\"type\":\"h2\",\"text\":\"Một chặng đường tự hào\"},\"Từ những ngày đầu thành lập với vài trăm sinh viên, đến nay HUMG đã đào tạo hàng chục nghìn kỹ sư, cử nhân, thạc sĩ và tiến sĩ, đóng góp quan trọng cho ngành công nghiệp mỏ, địa chất, dầu khí và trắc địa – bản đồ của đất nước.\",{\"type\":\"quote\",\"text\":\"“60 năm là hành trình của tri thức, bản lĩnh và khát vọng hội nhập. HUMG sẽ tiếp tục đổi mới để đồng hành cùng sự phát triển bền vững của đất nước.”\"},{\"type\":\"img\",\"label\":\"Toàn cảnh buổi lễ tại Hội trường A\",\"caption\":\"Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường.\"},{\"type\":\"list\",\"items\":[\"Trao Huân chương và bằng khen cho các tập thể, cá nhân tiêu biểu\",\"Ra mắt Quỹ học bổng 60 năm HUMG\",\"Khánh thành không gian truyền thống của Nhà trường\"]},\"Buổi lễ khép lại với chương trình nghệ thuật đặc sắc do sinh viên và cựu sinh viên biểu diễn, thể hiện niềm tự hào và gắn bó với mái trường.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "VP", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-15T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-05-15 01:00:00+00', '{}', NULL),
	(28, 'humg', 'announcement', 3, 1, 'current', '{"title": "Họp giao ban Khoa CNTT tháng 6", "status": "published", "targets": [{"label": "Giảng viên Khoa CNTT", "userSub": null, "audience": "lecturer", "unitCode": "CNTT", "isExclude": false}], "bodyHtml": "<p>Kính mời toàn thể giảng viên Khoa CNTT dự họp giao ban lúc 14:00 thứ Sáu tại phòng 302-C.</p>", "category": "admin", "channels": ["portal"], "expireAt": null, "priority": 0, "authorSub": "u-pvloc", "createdAt": "2026-10-06T08:00:00.000Z", "createdBy": "u-pvloc", "publishAt": "2026-10-06T08:00:00.000Z", "authorName": "Phạm Văn Lộc", "requireAck": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {}, "ownerUnitCode": "CNTT", "firstPublishedAt": "2026-10-06T08:00:00.000Z"}', 'Khởi tạo', 'u-pvloc', '2026-10-06 08:00:00+00', '{}', NULL),
	(14, 'humg', 'news', 14, 1, 'current', '{"slug": "humg-top-10-dai-hoc-ky-thuat", "tags": ["Xếp hạng", "Chất lượng", "Đào tạo"], "unit": "Phòng KHCN", "title": "HUMG lọt Top 10 trường đại học kỹ thuật hàng đầu Việt Nam", "source": null, "status": "published", "excerpt": "Theo bảng xếp hạng năm 2025, Trường Đại học Mỏ – Địa chất được ghi nhận trong nhóm 10 cơ sở đào tạo kỹ thuật hàng đầu cả nước.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-05-10T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-05-10T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 1, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": true, "attachments": [], "contentBody": "[\"Kết quả xếp hạng dựa trên các tiêu chí về chất lượng đào tạo, năng lực nghiên cứu, công bố quốc tế, tỷ lệ việc làm của sinh viên sau tốt nghiệp và mức độ hội nhập quốc tế.\",{\"type\":\"h2\",\"text\":\"Thế mạnh về nghiên cứu ứng dụng\"},\"HUMG được đánh giá cao ở các nhóm ngành mũi nhọn: kỹ thuật mỏ, địa chất, dầu khí, trắc địa – bản đồ, cùng năng lực chuyển giao công nghệ cho doanh nghiệp.\",{\"type\":\"list\",\"items\":[\"650+ công bố khoa học trong 5 năm gần đây\",\"Hàng chục đề tài cấp Nhà nước, cấp Bộ được nghiệm thu\",\"Mạng lưới hơn 200 doanh nghiệp đối tác\"]},\"Nhà trường xác định tiếp tục đầu tư cho phòng thí nghiệm trọng điểm, chương trình đào tạo quốc tế và các nhóm nghiên cứu mạnh.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-KHCN", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-10T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-05-10 01:00:00+00', '{}', NULL),
	(15, 'humg', 'news', 15, 1, 'current', '{"slug": "nghien-cuu-vat-lieu-moi-khai-thac-ben-vung", "tags": ["Vật liệu mới", "Khai thác mỏ", "Môi trường"], "unit": "Khoa Mỏ", "title": "Nghiên cứu vật liệu mới trong khai thác bền vững", "source": null, "status": "published", "excerpt": "Nhóm nghiên cứu của HUMG phát triển vật liệu gia cố mới giúp nâng cao an toàn và giảm tác động môi trường trong khai thác hầm lò.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-05-06T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-05-06T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 4, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": true, "attachments": [{"url": null, "meta": "PDF · 1.1 MB", "title": "Tóm tắt kết quả nghiên cứu"}], "contentBody": "[\"Đề tài tập trung vào việc phát triển loại vật liệu gia cố có độ bền cao, thân thiện môi trường, thay thế một phần vật liệu truyền thống trong chống giữ lò.\",{\"type\":\"h2\",\"text\":\"Kết quả thử nghiệm\"},\"Thử nghiệm tại hiện trường cho thấy vật liệu mới giúp giảm 20% chi phí chống giữ và tăng đáng kể hệ số an toàn của công trình ngầm.\",{\"type\":\"quote\",\"text\":\"“Chúng tôi hướng đến các giải pháp vừa hiệu quả kinh tế, vừa giảm phát thải và rác thải trong quá trình khai thác.”\"},\"Kết quả nghiên cứu đã được công bố trên tạp chí quốc tế uy tín và đang được chuyển giao thử nghiệm cho một số đơn vị khai thác.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "MO", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-06T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-05-06 01:00:00+00', '{}', NULL),
	(16, 'humg', 'news', 16, 1, 'current', '{"slug": "sinh-vien-humg-dat-giai-cao-iot-toan-quoc", "tags": ["Sinh viên", "IoT", "Cuộc thi"], "unit": "Khoa CNTT", "title": "Sinh viên HUMG đạt giải cao tại cuộc thi IoT toàn quốc", "source": null, "status": "published", "excerpt": "Đội tuyển sinh viên Khoa Công nghệ thông tin giành giải Nhì chung cuộc với sản phẩm giám sát môi trường mỏ theo thời gian thực.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-05-02T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-05-02T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 1, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": true, "attachments": [], "contentBody": "[\"Sản phẩm dự thi là hệ thống cảm biến – IoT giám sát các thông số khí, bụi, nhiệt độ trong khu vực khai thác và cảnh báo sớm nguy cơ mất an toàn.\",{\"type\":\"img\",\"label\":\"Đội tuyển HUMG tại vòng chung kết\",\"caption\":\"Đội tuyển sinh viên HUMG tại vòng chung kết cuộc thi.\"},\"Ban giám khảo đánh giá cao tính ứng dụng thực tiễn và khả năng triển khai của giải pháp trong điều kiện mỏ hầm lò Việt Nam.\",{\"type\":\"list\",\"items\":[\"Giải Nhì chung cuộc toàn quốc\",\"Giải “Sản phẩm có tính ứng dụng cao”\",\"Được doanh nghiệp đề nghị hợp tác thử nghiệm\"]}]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "CNTT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-02T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-05-02 01:00:00+00', '{}', NULL),
	(17, 'humg', 'news', 17, 1, 'current', '{"slug": "hoi-thao-quoc-te-trac-dia-gis-2025", "tags": ["Hội thảo", "Trắc địa", "GIS"], "unit": "Khoa Trắc địa – Bản đồ", "title": "Hội thảo quốc tế về Trắc địa và GIS 2025", "source": null, "status": "published", "excerpt": "HUMG chủ trì tổ chức thành công Hội thảo quốc tế về Trắc địa và GIS 2025 với hơn 200 đại biểu trong nước và quốc tế.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-05-14T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-05-14T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 3, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [{"url": null, "meta": "PDF · 4.2 MB", "title": "Báo cáo tổng kết Hội thảo Trắc địa & GIS 2025"}], "contentBody": "[\"Trong hai ngày 13–14/05/2025, Trường Đại học Mỏ – Địa chất đã tổ chức Hội thảo quốc tế về Trắc địa và GIS với chủ đề “Ứng dụng trí tuệ nhân tạo kết hợp dữ liệu viễn thám và GIS phục vụ quy hoạch đô thị”.\",{\"type\":\"h2\",\"text\":\"Diễn đàn học thuật uy tín\"},\"Hội thảo quy tụ các nhà khoa học, chuyên gia và doanh nghiệp công nghệ đến từ nhiều quốc gia, cùng trao đổi về xu hướng mới trong lĩnh vực trắc địa, bản đồ và GIS.\",{\"type\":\"quote\",\"text\":\"“Đây là cơ hội quan trọng để kết nối nghiên cứu và ứng dụng, thúc đẩy chuyển giao công nghệ trong thời đại số.”\"},\"Hội thảo mở ra nhiều cơ hội hợp tác nghiên cứu và đào tạo giữa HUMG với các đối tác quốc tế.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "TDBD", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-14T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-05-14 01:00:00+00', '{}', NULL),
	(29, 'humg', 'announcement', 4, 1, 'current', '{"title": "Lớp DCCTKT66A: đổi phòng học môn Cơ sở dữ liệu", "status": "published", "targets": [{"label": "Lớp DCCTKT66A", "userSub": null, "audience": null, "unitCode": "DCCTKT66A", "isExclude": false}], "bodyHtml": "<p>Từ tuần 12, môn Cơ sở dữ liệu của lớp DCCTKT66A chuyển sang phòng 405-A.</p>", "category": "academic", "channels": ["portal"], "expireAt": null, "priority": 0, "authorSub": "u-dvtung", "createdAt": "2026-10-07T09:34:15.662Z", "createdBy": "u-dvtung", "publishAt": "2026-10-07T09:34:15.662Z", "authorName": "Đỗ Văn Tùng", "requireAck": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {}, "ownerUnitCode": "BM-KHMT", "firstPublishedAt": "2026-10-07T09:34:15.662Z"}', 'Khởi tạo', 'u-dvtung', '2026-10-07 09:34:15.662+00', '{}', NULL),
	(18, 'humg', 'news', 18, 1, 'current', '{"slug": "humg-ky-ket-hop-tac-dai-hoc-aachen", "tags": ["Hợp tác quốc tế", "CHLB Đức", "MOU"], "unit": "Phòng Hợp tác quốc tế", "title": "HUMG ký kết hợp tác với Đại học RWTH Aachen (CHLB Đức)", "source": null, "status": "published", "excerpt": "Hai trường ký biên bản ghi nhớ hợp tác trong đào tạo, trao đổi giảng viên – sinh viên và nghiên cứu chung về khai thác bền vững.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-04-28T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-04-28T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 10, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Lễ ký kết diễn ra tại HUMG với sự chứng kiến của lãnh đạo hai trường và đại diện doanh nghiệp trong lĩnh vực khai khoáng.\",{\"type\":\"list\",\"items\":[\"Trao đổi sinh viên, giảng viên hằng năm\",\"Đồng hướng dẫn nghiên cứu sinh\",\"Nghiên cứu chung về khai thác bền vững và kinh tế tuần hoàn\"]},\"Hợp tác mở ra cơ hội học tập và nghiên cứu ở môi trường quốc tế cho sinh viên, học viên của Nhà trường.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-HTQT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-04-28T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-04-28 01:00:00+00', '{}', NULL),
	(19, 'humg', 'news', 19, 1, 'current', '{"slug": "thong-bao-tuyen-sinh-dai-hoc-2026", "tags": ["Tuyển sinh", "2026", "Đại học chính quy"], "unit": "Phòng Đào tạo", "title": "Thông báo tuyển sinh đại học chính quy năm 2026", "source": null, "status": "published", "excerpt": "Trường Đại học Mỏ – Địa chất thông báo tuyển sinh đại học chính quy năm 2026 với 52 chương trình đào tạo và 5 phương thức xét tuyển.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2026-05-20T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2026-05-20T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 8, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [{"url": null, "meta": "PDF · 1.2 MB", "title": "Đề án tuyển sinh 2026"}, {"url": null, "meta": "DOCX · 256 KB", "title": "Mẫu đơn đăng ký xét tuyển"}], "contentBody": "[\"Năm 2026, HUMG tuyển sinh 52 chương trình đào tạo trình độ đại học, trong đó có các chương trình chất lượng cao và chương trình liên kết quốc tế.\",{\"type\":\"h2\",\"text\":\"Phương thức xét tuyển\"},{\"type\":\"list\",\"items\":[\"Xét tuyển thẳng và ưu tiên xét tuyển\",\"Xét kết quả thi tốt nghiệp THPT\",\"Xét học bạ THPT\",\"Xét tuyển kết hợp\",\"Xét kết quả kỳ thi ĐGNL của ĐHQG Hà Nội\"]},\"Thí sinh theo dõi mốc thời gian và hướng dẫn đăng ký trực tuyến tại chuyên trang Tuyển sinh của Nhà trường.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-DT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2026-05-20T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2026-05-20 01:00:00+00', '{}', NULL),
	(20, 'humg', 'news', 20, 1, 'current', '{"slug": "chuong-trinh-hoc-bong-phat-trien-nguon-nhan-luc", "tags": ["Học bổng", "Sinh viên", "Doanh nghiệp"], "unit": "Phòng CTSV", "title": "Chương trình học bổng phát triển nguồn nhân lực năm học 2025 – 2026", "source": null, "status": "published", "excerpt": "Nhà trường phối hợp cùng doanh nghiệp triển khai chương trình học bổng dành cho sinh viên các ngành kỹ thuật mũi nhọn.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2026-04-25T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2026-04-25T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 2, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [{"url": null, "meta": "DOCX · 34 KB", "title": "Mẫu hồ sơ đăng ký học bổng"}], "contentBody": "[\"Chương trình dành cho sinh viên có kết quả học tập tốt, tích cực tham gia nghiên cứu và hoạt động cộng đồng, ưu tiên các ngành kỹ thuật mỏ, dầu khí, địa chất và trắc địa.\",{\"type\":\"list\",\"items\":[\"Giá trị học bổng: từ 50% đến 100% học phí năm học\",\"Cơ hội thực tập và tuyển dụng tại doanh nghiệp tài trợ\",\"Cố vấn nghề nghiệp từ chuyên gia doanh nghiệp\"]},\"Hồ sơ đăng ký nộp tại Phòng Công tác chính trị & Sinh viên trước ngày hết hạn thông báo.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-CTSV", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2026-04-25T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2026-04-25 01:00:00+00', '{}', NULL),
	(21, 'humg', 'news', 21, 1, 'current', '{"slug": "nghiem-thu-de-tai-cap-bo-khai-thac-than-ham-lo", "tags": ["Đề tài cấp Bộ", "Khai thác than", "Nghiệm thu"], "unit": "Phòng KHCN", "title": "Nghiệm thu đề tài cấp Bộ về công nghệ khai thác than hầm lò", "source": null, "status": "published", "excerpt": "Đề tài nghiên cứu công nghệ khai thác than hầm lò thân thiện môi trường được Hội đồng đánh giá xuất sắc.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2026-04-18T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2026-04-18T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 4, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [{"url": null, "meta": "PDF · 1.3 MB", "title": "Báo cáo tóm tắt đề tài (2024)"}], "contentBody": "[\"Đề tài do nhóm nghiên cứu Khoa Mỏ chủ trì, tập trung vào giải pháp giảm tổn thất tài nguyên và giảm phát thải trong khai thác than hầm lò.\",{\"type\":\"quote\",\"text\":\"“Kết quả đề tài có thể áp dụng ngay tại nhiều mỏ than vùng Quảng Ninh.”\"},\"Hội đồng nghiệm thu đánh giá đề tài đạt loại xuất sắc và đề nghị tiếp tục hỗ trợ chuyển giao vào thực tiễn sản xuất.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-KHCN", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2026-04-18T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2026-04-18 01:00:00+00', '{}', NULL),
	(22, 'humg', 'news', 22, 1, 'current', '{"slug": "ngay-hoi-viec-lam-ket-noi-doanh-nghiep-2025", "tags": ["Việc làm", "Doanh nghiệp", "Sinh viên"], "unit": "Phòng CTSV", "title": "Ngày hội việc làm & Kết nối doanh nghiệp 2025", "source": null, "status": "published", "excerpt": "Hơn 50 doanh nghiệp tham gia tuyển dụng và giao lưu cùng sinh viên HUMG tại Ngày hội việc làm năm 2025.", "expireAt": null, "authorSub": "u-nthoa", "createdAt": "2025-04-25T08:00:00+07:00", "createdBy": "u-nthoa", "metaTitle": null, "publishAt": "2025-04-25T08:00:00+07:00", "authorName": "Nguyễn Thị Hoa", "categoryId": 3, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[\"Ngày hội mang đến hàng nghìn vị trí việc làm và thực tập cho sinh viên năm cuối, cùng nhiều hoạt động tư vấn nghề nghiệp, kỹ năng phỏng vấn và viết CV.\",{\"type\":\"list\",\"items\":[\"Hơn 50 doanh nghiệp trong và ngoài ngành\",\"Hàng nghìn vị trí việc làm – thực tập\",\"Phỏng vấn trực tiếp tại gian hàng\"]},\"Nhiều sinh viên đã nhận được lời mời phỏng vấn và thư mời thực tập ngay tại sự kiện.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "P-CTSV", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-04-25T08:00:00+07:00"}', 'Khởi tạo', 'u-nthoa', '2025-04-25 01:00:00+00', '{}', NULL),
	(23, 'cntt', 'news', 23, 1, 'current', '{"slug": "khoa-cntt-khai-giang-chuyen-de-ai", "tags": ["AI", "chuyên đề"], "unit": "Khoa CNTT", "title": "Khoa CNTT khai giảng lớp chuyên đề Trí tuệ nhân tạo ứng dụng", "source": null, "status": "published", "excerpt": "Lớp chuyên đề dành cho sinh viên năm 3, năm 4 các ngành CNTT, KHMT.", "expireAt": null, "authorSub": "u-pvloc", "createdAt": "2025-05-22T08:00:00+07:00", "createdBy": "u-pvloc", "metaTitle": null, "publishAt": "2025-05-22T08:00:00+07:00", "authorName": "Phạm Văn Lộc", "categoryId": 11, "isFeatured": true, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": true, "attachments": [], "contentBody": "[\"Khoa Công nghệ thông tin tổ chức lớp chuyên đề Trí tuệ nhân tạo ứng dụng trong khai thác mỏ và địa chất.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "CNTT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-22T08:00:00+07:00"}', 'Khởi tạo', 'u-pvloc', '2025-05-22 01:00:00+00', '{}', NULL),
	(24, 'cntt', 'news', 24, 1, 'current', '{"slug": "seminar-bm-khmt-thang-6", "tags": [], "unit": "Khoa CNTT", "title": "Seminar Bộ môn Khoa học máy tính tháng 6", "source": null, "status": "published", "excerpt": "Chủ đề: Xử lý ảnh viễn thám bằng học sâu.", "expireAt": null, "authorSub": "u-dvtung", "createdAt": "2025-05-25T14:00:00+07:00", "createdBy": "u-dvtung", "metaTitle": null, "publishAt": "2025-05-25T14:00:00+07:00", "authorName": "Đỗ Văn Tùng", "categoryId": 12, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": true, "attachments": [], "contentBody": "[\"Seminar định kỳ của Bộ môn KHMT.\"]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "BM-KHMT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": "2025-05-25T14:00:00+07:00"}', 'Khởi tạo', 'u-dvtung', '2025-05-25 07:00:00+00', '{}', NULL),
	(25, 'cntt', 'news', 25, 1, 'current', '{"slug": "ke-hoach-thuc-tap-he-2025", "tags": [], "unit": "Khoa CNTT", "title": "Kế hoạch thực tập doanh nghiệp hè 2025 (bản nháp)", "source": null, "status": "draft", "excerpt": "Dự thảo kế hoạch thực tập.", "expireAt": null, "authorSub": "u-pvloc", "createdAt": "2025-05-20T08:00:00+07:00", "createdBy": "u-pvloc", "metaTitle": null, "publishAt": null, "authorName": "Phạm Văn Lộc", "categoryId": 11, "isFeatured": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "showOnHome": false, "attachments": [], "contentBody": "[]", "submittedAt": null, "submittedBy": null, "attachmentId": null, "metaKeywords": null, "translations": {}, "ownerUnitCode": "CNTT", "featuredImageId": null, "metaDescription": null, "firstPublishedAt": null}', 'Khởi tạo', 'u-pvloc', '2025-05-20 01:00:00+00', '{}', NULL),
	(26, 'humg', 'announcement', 1, 1, 'current', '{"title": "Lịch thi học kỳ 2 năm học 2024–2025", "status": "published", "targets": [{"label": "Toàn bộ sinh viên", "userSub": null, "audience": "student", "unitCode": null, "isExclude": false}], "bodyHtml": "<p>Phòng Đào tạo thông báo lịch thi học kỳ 2. Sinh viên kiểm tra phòng thi trên My eUni và <strong>xác nhận đã đọc</strong>.</p>", "category": "exam", "channels": ["portal", "email"], "expireAt": null, "priority": 1, "authorSub": "u-nthoa", "createdAt": "2026-10-04T08:00:00.000Z", "createdBy": "u-nthoa", "publishAt": "2026-10-04T08:00:00.000Z", "authorName": "Nguyễn Thị Hoa", "requireAck": true, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [{"meta": "PDF · 420 KB", "title": "Lich-thi-HK2.pdf"}], "pinnedUntil": "2026-10-17T08:00:00.000Z", "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {"en": {"title": "Semester 2 exam schedule 2024–2025", "status": "done", "bodyHtml": "<p>The Academic Affairs Office announces the semester 2 exam schedule.</p>"}}, "ownerUnitCode": "P-DT", "firstPublishedAt": "2026-10-04T08:00:00.000Z"}', 'Khởi tạo', 'u-nthoa', '2026-10-04 08:00:00+00', '{}', NULL),
	(27, 'humg', 'announcement', 2, 1, 'current', '{"title": "Hạn nộp học phí học kỳ 2", "status": "published", "targets": [{"label": "Toàn bộ sinh viên", "userSub": null, "audience": "student", "unitCode": null, "isExclude": false}, {"label": "Phụ huynh", "userSub": null, "audience": "parent", "unitCode": null, "isExclude": false}], "bodyHtml": "<p>Hạn cuối nộp học phí học kỳ 2 là ngày 30/06. Sinh viên quá hạn sẽ bị khóa đăng ký học phần.</p>", "category": "tuition", "channels": ["portal", "email", "push"], "expireAt": "2026-10-27T08:00:00.000Z", "priority": 2, "authorSub": "u-nthoa", "createdAt": "2026-10-05T08:00:00.000Z", "createdBy": "u-nthoa", "publishAt": "2026-10-05T08:00:00.000Z", "authorName": "Nguyễn Thị Hoa", "requireAck": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {}, "ownerUnitCode": "P-DT", "firstPublishedAt": "2026-10-05T08:00:00.000Z"}', 'Khởi tạo', 'u-nthoa', '2026-10-05 08:00:00+00', '{}', NULL),
	(30, 'humg', 'announcement', 5, 1, 'current', '{"title": "Xác nhận hướng dẫn đồ án tốt nghiệp", "status": "published", "targets": [{"label": "2151000123 – Nguyễn Văn Sinh", "userSub": "SV001", "audience": null, "unitCode": null, "isExclude": false}, {"label": "GV0123 – TS. Nguyễn Thanh Bình", "userSub": "GV002", "audience": null, "unitCode": null, "isExclude": false}], "bodyHtml": "<p>Em Nguyễn Văn Sinh đã được phân công GV hướng dẫn đồ án: TS. Nguyễn Thanh Bình.</p>", "category": "academic", "channels": ["portal"], "expireAt": null, "priority": 1, "authorSub": "u-dvtung", "createdAt": "2026-10-06T08:00:00.000Z", "createdBy": "u-dvtung", "publishAt": "2026-10-06T08:00:00.000Z", "authorName": "Đỗ Văn Tùng", "requireAck": true, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {}, "ownerUnitCode": "BM-KHMT", "firstPublishedAt": "2026-10-06T08:00:00.000Z"}', 'Khởi tạo', 'u-dvtung', '2026-10-06 08:00:00+00', '{}', NULL),
	(31, 'humg', 'announcement', 6, 1, 'current', '{"title": "Khảo sát chất lượng dịch vụ (trừ lớp đang thực tập)", "status": "published", "targets": [{"label": "Toàn bộ sinh viên", "userSub": null, "audience": "student", "unitCode": null, "isExclude": false}, {"label": "Lớp DCKTM66", "userSub": null, "audience": null, "unitCode": "DCKTM66", "isExclude": true}], "bodyHtml": "<p>Mời sinh viên tham gia khảo sát chất lượng dịch vụ hỗ trợ người học.</p>", "category": "general", "channels": ["portal"], "expireAt": null, "priority": 0, "authorSub": "u-nthoa", "createdAt": "2026-10-03T08:00:00.000Z", "createdBy": "u-nthoa", "publishAt": "2026-10-03T08:00:00.000Z", "authorName": "Nguyễn Thị Hoa", "requireAck": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {}, "ownerUnitCode": "P-CTSV", "firstPublishedAt": "2026-10-03T08:00:00.000Z"}', 'Khởi tạo', 'u-nthoa', '2026-10-03 08:00:00+00', '{}', NULL),
	(32, 'humg', 'announcement', 7, 1, 'current', '{"title": "Kế hoạch nghỉ hè 2025 (chờ duyệt)", "status": "pending_review", "targets": [{"label": "Mọi người", "userSub": null, "audience": null, "unitCode": null, "isExclude": false}], "bodyHtml": "<p>Dự thảo kế hoạch nghỉ hè cho cán bộ và sinh viên.</p>", "category": "general", "channels": ["portal"], "expireAt": null, "priority": 0, "authorSub": "u-hdnam", "createdAt": "2026-10-06T08:00:00.000Z", "createdBy": "u-hdnam", "publishAt": null, "authorName": "Hoàng Đức Nam", "requireAck": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": "2026-10-07T10:46:15.662Z", "submittedBy": "u-hdnam", "recallReason": null, "translations": {}, "ownerUnitCode": "P-DT", "firstPublishedAt": null}', 'Khởi tạo', 'u-hdnam', '2026-10-06 08:00:00+00', '{}', NULL),
	(33, 'humg', 'announcement', 8, 1, 'current', '{"title": "Đăng ký học phần học kỳ hè (hẹn giờ)", "status": "published", "targets": [{"label": "Toàn bộ sinh viên", "userSub": null, "audience": "student", "unitCode": null, "isExclude": false}], "bodyHtml": "<p>Cổng đăng ký học phần học kỳ hè mở từ ngày đăng thông báo này.</p>", "category": "academic", "channels": ["portal"], "expireAt": null, "priority": 0, "authorSub": "u-nthoa", "createdAt": "2026-10-10T08:00:00.000Z", "createdBy": "u-nthoa", "publishAt": "2026-10-10T08:00:00.000Z", "authorName": "Nguyễn Thị Hoa", "requireAck": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {}, "ownerUnitCode": "P-DT", "firstPublishedAt": "2026-10-10T08:00:00.000Z"}', 'Khởi tạo', 'u-nthoa', '2026-10-10 08:00:00+00', '{}', NULL),
	(34, 'cntt', 'announcement', 9, 1, 'current', '{"title": "Sinh viên Khoa CNTT đăng ký đề tài NCKH 2025", "status": "published", "targets": [{"label": "Sinh viên Khoa CNTT", "userSub": null, "audience": "student", "unitCode": "CNTT", "isExclude": false}], "bodyHtml": "<p>Khoa CNTT nhận đăng ký đề tài NCKH sinh viên đến hết 15/06.</p>", "category": "academic", "channels": ["portal"], "expireAt": null, "priority": 0, "authorSub": "u-pvloc", "createdAt": "2026-10-05T08:00:00.000Z", "createdBy": "u-pvloc", "publishAt": "2026-10-05T08:00:00.000Z", "authorName": "Phạm Văn Lộc", "requireAck": false, "reviewNote": null, "reviewedAt": null, "reviewedBy": null, "attachments": [], "pinnedUntil": null, "submittedAt": null, "submittedBy": null, "recallReason": null, "translations": {}, "ownerUnitCode": "CNTT", "firstPublishedAt": "2026-10-05T08:00:00.000Z"}', 'Khởi tạo', 'u-pvloc', '2026-10-05 08:00:00+00', '{}', NULL);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.announcements (id, tenant_id, owner_unit_code, category, priority, status, publish_at, expire_at, first_published_at, pinned_until, require_ack, channels, recall_reason, author_sub, submitted_at, submitted_by, reviewed_at, reviewed_by, review_note, pending_revision_id, version, recipient_count, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, extra, author_display) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'P-DT', 'exam', 1, 'published', '2026-10-04 08:00:00+00', NULL, '2026-10-04 08:00:00+00', '2026-10-17 08:00:00+00', true, '{portal,email}', NULL, 'u-nthoa', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-04 08:00:00+00', 'u-nthoa', '2026-10-04 08:00:00+00', 'u-nthoa', NULL, NULL, '{}', 'Nguyễn Thị Hoa'),
	(2, 'humg', 'P-DT', 'tuition', 2, 'published', '2026-10-05 08:00:00+00', '2026-10-27 08:00:00+00', '2026-10-05 08:00:00+00', NULL, false, '{portal,email,push}', NULL, 'u-nthoa', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-05 08:00:00+00', 'u-nthoa', '2026-10-05 08:00:00+00', 'u-nthoa', NULL, NULL, '{}', 'Nguyễn Thị Hoa'),
	(3, 'humg', 'CNTT', 'admin', 0, 'published', '2026-10-06 08:00:00+00', NULL, '2026-10-06 08:00:00+00', NULL, false, '{portal}', NULL, 'u-pvloc', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-06 08:00:00+00', 'u-pvloc', '2026-10-06 08:00:00+00', 'u-pvloc', NULL, NULL, '{}', 'Phạm Văn Lộc'),
	(4, 'humg', 'BM-KHMT', 'academic', 0, 'published', '2026-10-07 09:34:15.662+00', NULL, '2026-10-07 09:34:15.662+00', NULL, false, '{portal}', NULL, 'u-dvtung', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-07 09:34:15.662+00', 'u-dvtung', '2026-10-07 09:34:15.662+00', 'u-dvtung', NULL, NULL, '{}', 'Đỗ Văn Tùng'),
	(5, 'humg', 'BM-KHMT', 'academic', 1, 'published', '2026-10-06 08:00:00+00', NULL, '2026-10-06 08:00:00+00', NULL, true, '{portal}', NULL, 'u-dvtung', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-06 08:00:00+00', 'u-dvtung', '2026-10-06 08:00:00+00', 'u-dvtung', NULL, NULL, '{}', 'Đỗ Văn Tùng'),
	(6, 'humg', 'P-CTSV', 'general', 0, 'published', '2026-10-03 08:00:00+00', NULL, '2026-10-03 08:00:00+00', NULL, false, '{portal}', NULL, 'u-nthoa', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-03 08:00:00+00', 'u-nthoa', '2026-10-03 08:00:00+00', 'u-nthoa', NULL, NULL, '{}', 'Nguyễn Thị Hoa'),
	(7, 'humg', 'P-DT', 'general', 0, 'pending_review', NULL, NULL, NULL, NULL, false, '{portal}', NULL, 'u-hdnam', '2026-10-07 10:46:15.662+00', 'u-hdnam', NULL, NULL, NULL, NULL, 1, NULL, '2026-10-06 08:00:00+00', 'u-hdnam', '2026-10-06 08:00:00+00', 'u-hdnam', NULL, NULL, '{}', 'Hoàng Đức Nam'),
	(8, 'humg', 'P-DT', 'academic', 0, 'published', '2026-10-10 08:00:00+00', NULL, '2026-10-10 08:00:00+00', NULL, false, '{portal}', NULL, 'u-nthoa', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-10 08:00:00+00', 'u-nthoa', '2026-10-10 08:00:00+00', 'u-nthoa', NULL, NULL, '{}', 'Nguyễn Thị Hoa'),
	(9, 'cntt', 'CNTT', 'academic', 0, 'published', '2026-10-05 08:00:00+00', NULL, '2026-10-05 08:00:00+00', NULL, false, '{portal}', NULL, 'u-pvloc', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, '2026-10-05 08:00:00+00', 'u-pvloc', '2026-10-05 08:00:00+00', 'u-pvloc', NULL, NULL, '{}', 'Phạm Văn Lộc');


--
-- Data for Name: media; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.media (id, tenant_id, bucket, object_key, file_name, kind, mime_type, size_bytes, sha256, alt_text, caption, folder, owner_unit_code, variants, uploaded_by, created_at, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'cms-public', 'hoi-thao-gis-2025.png', 'hoi-thao-gis-2025.png', 'image', NULL, 524288, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-16 01:00:00+00', NULL, NULL, '{"ext": "png"}'),
	(2, 'humg', 'cms-public', 'campus-humg.png', 'campus-humg.png', 'image', NULL, 660480, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-15 01:00:00+00', NULL, NULL, '{"ext": "png"}'),
	(3, 'humg', 'cms-public', 'khoa-mo-truong.jpg', 'khoa-mo-truong.jpg', 'image', NULL, 90112, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-15 01:00:00+00', NULL, NULL, '{"ext": "jpg"}'),
	(4, 'humg', 'cms-public', 'logo-humg.png', 'logo-humg.png', 'image', NULL, 43008, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-13 01:00:00+00', NULL, NULL, '{"ext": "png"}'),
	(5, 'humg', 'cms-public', 'banner-tuyensinh.png', 'banner-tuyensinh.png', 'image', NULL, 430080, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-12 01:00:00+00', NULL, NULL, '{"ext": "png"}'),
	(6, 'humg', 'cms-public', 'co-so-vat-chat.jpg', 'co-so-vat-chat.jpg', 'image', NULL, 1258291, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-11 01:00:00+00', NULL, NULL, '{"ext": "jpg"}'),
	(7, 'humg', 'cms-public', 'sinh-vien-hoc-tap.jpg', 'sinh-vien-hoc-tap.jpg', 'image', NULL, 798720, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-11 01:00:00+00', NULL, NULL, '{"ext": "jpg"}'),
	(8, 'humg', 'cms-public', 'thuc-hanh-mine.jpg', 'thuc-hanh-mine.jpg', 'image', NULL, 690176, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-10 01:00:00+00', NULL, NULL, '{"ext": "jpg"}'),
	(9, 'humg', 'cms-public', 'bao-cao-de-tai.pdf', 'bao-cao-de-tai.pdf', 'document', NULL, 2516582, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-09 01:00:00+00', NULL, NULL, '{"ext": "pdf"}'),
	(10, 'humg', 'cms-public', 'quy-dinh-dao-tao.pdf', 'quy-dinh-dao-tao.pdf', 'document', NULL, 1153434, NULL, NULL, NULL, NULL, NULL, '{}', 'u-ltmai', '2025-05-07 01:00:00+00', NULL, NULL, '{"ext": "pdf"}');


--
-- Data for Name: announcement_attachments; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.announcement_attachments (id, announcement_id, media_id, sort_order, title, meta, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 1, NULL, 0, 'Lich-thi-HK2.pdf', 'PDF · 420 KB', '{}');


--
-- Data for Name: announcement_receipts; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--



--
-- Data for Name: announcement_targets; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.announcement_targets (id, announcement_id, audience, unit_code, user_sub, is_exclude, label) OVERRIDING SYSTEM VALUE VALUES
	(1, 1, 'student', NULL, NULL, false, 'Toàn bộ sinh viên'),
	(2, 2, 'student', NULL, NULL, false, 'Toàn bộ sinh viên'),
	(3, 2, 'parent', NULL, NULL, false, 'Phụ huynh'),
	(4, 3, 'lecturer', 'CNTT', NULL, false, 'Giảng viên Khoa CNTT'),
	(5, 4, NULL, 'DCCTKT66A', NULL, false, 'Lớp DCCTKT66A'),
	(6, 5, NULL, NULL, 'SV001', false, '2151000123 – Nguyễn Văn Sinh'),
	(7, 5, NULL, NULL, 'GV002', false, 'GV0123 – TS. Nguyễn Thanh Bình'),
	(8, 6, 'student', NULL, NULL, false, 'Toàn bộ sinh viên'),
	(9, 6, NULL, 'DCKTM66', NULL, true, 'Lớp DCKTM66'),
	(10, 7, NULL, NULL, NULL, false, 'Mọi người'),
	(11, 8, 'student', NULL, NULL, false, 'Toàn bộ sinh viên'),
	(12, 9, 'student', 'CNTT', NULL, false, 'Sinh viên Khoa CNTT');


--
-- Data for Name: languages; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.languages (code, label, is_source, is_enabled, extra, flag) OVERRIDING SYSTEM VALUE VALUES
	('vi', 'Tiếng Việt', true, true, '{}', '🇻🇳'),
	('en', 'English', false, true, '{}', '🇬🇧');


--
-- Data for Name: announcement_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.announcement_translations (announcement_id, lang, title, body_html, body_text, translation_status) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'Lịch thi học kỳ 2 năm học 2024–2025', '<p>Phòng Đào tạo thông báo lịch thi học kỳ 2. Sinh viên kiểm tra phòng thi trên My eUni và <strong>xác nhận đã đọc</strong>.</p>', ' Phòng Đào tạo thông báo lịch thi học kỳ 2. Sinh viên kiểm tra phòng thi trên My eUni và  xác nhận đã đọc . ', 'done'),
	(1, 'en', 'Semester 2 exam schedule 2024–2025', '<p>The Academic Affairs Office announces the semester 2 exam schedule.</p>', ' The Academic Affairs Office announces the semester 2 exam schedule. ', 'done'),
	(2, 'vi', 'Hạn nộp học phí học kỳ 2', '<p>Hạn cuối nộp học phí học kỳ 2 là ngày 30/06. Sinh viên quá hạn sẽ bị khóa đăng ký học phần.</p>', ' Hạn cuối nộp học phí học kỳ 2 là ngày 30/06. Sinh viên quá hạn sẽ bị khóa đăng ký học phần. ', 'done'),
	(3, 'vi', 'Họp giao ban Khoa CNTT tháng 6', '<p>Kính mời toàn thể giảng viên Khoa CNTT dự họp giao ban lúc 14:00 thứ Sáu tại phòng 302-C.</p>', ' Kính mời toàn thể giảng viên Khoa CNTT dự họp giao ban lúc 14:00 thứ Sáu tại phòng 302-C. ', 'done'),
	(4, 'vi', 'Lớp DCCTKT66A: đổi phòng học môn Cơ sở dữ liệu', '<p>Từ tuần 12, môn Cơ sở dữ liệu của lớp DCCTKT66A chuyển sang phòng 405-A.</p>', ' Từ tuần 12, môn Cơ sở dữ liệu của lớp DCCTKT66A chuyển sang phòng 405-A. ', 'done'),
	(5, 'vi', 'Xác nhận hướng dẫn đồ án tốt nghiệp', '<p>Em Nguyễn Văn Sinh đã được phân công GV hướng dẫn đồ án: TS. Nguyễn Thanh Bình.</p>', ' Em Nguyễn Văn Sinh đã được phân công GV hướng dẫn đồ án: TS. Nguyễn Thanh Bình. ', 'done'),
	(6, 'vi', 'Khảo sát chất lượng dịch vụ (trừ lớp đang thực tập)', '<p>Mời sinh viên tham gia khảo sát chất lượng dịch vụ hỗ trợ người học.</p>', ' Mời sinh viên tham gia khảo sát chất lượng dịch vụ hỗ trợ người học. ', 'done'),
	(7, 'vi', 'Kế hoạch nghỉ hè 2025 (chờ duyệt)', '<p>Dự thảo kế hoạch nghỉ hè cho cán bộ và sinh viên.</p>', ' Dự thảo kế hoạch nghỉ hè cho cán bộ và sinh viên. ', 'done'),
	(8, 'vi', 'Đăng ký học phần học kỳ hè (hẹn giờ)', '<p>Cổng đăng ký học phần học kỳ hè mở từ ngày đăng thông báo này.</p>', ' Cổng đăng ký học phần học kỳ hè mở từ ngày đăng thông báo này. ', 'done'),
	(9, 'vi', 'Sinh viên Khoa CNTT đăng ký đề tài NCKH 2025', '<p>Khoa CNTT nhận đăng ký đề tài NCKH sinh viên đến hết 15/06.</p>', ' Khoa CNTT nhận đăng ký đề tài NCKH sinh viên đến hết 15/06. ', 'done');


--
-- Data for Name: app_meta; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.app_meta (key, value) OVERRIDING SYSTEM VALUE VALUES
	('defaultSettings', '{"seo": {"youtube": "https://youtube.com/@humg", "facebook": "https://facebook.com/humg.edu.vn", "metaDesc": "Cổng thông tin điện tử Trường Đại học Mỏ – Địa chất – đào tạo, nghiên cứu khoa học lĩnh vực Trái đất, Mỏ, Năng lượng.", "analytics": "G-XXXXXXXXXX", "metaTitle": "Trường Đại học Mỏ – Địa chất | HUMG"}, "home": {"heroChips": ["Trường đại học công lập", "60 năm truyền thống", "Đa ngành – Đa lĩnh vực"]}, "email": {"fromName": "HUMG Digital Portal", "smtpHost": "smtp.humg.edu.vn", "smtpPort": "587", "fromEmail": "no-reply@humg.edu.vn"}, "backup": {"storagePath": "/backup/cms_humg", "cronSchedule": "0 3 * * *", "retentionCount": 7}, "general": {"email": "cskh@humg.edu.vn", "phone": "024.3838.0355", "address": "18 Phố Viên, Đức Thắng, Bắc Từ Liêm, Hà Nội", "siteName": "Trường Đại học Mỏ – Địa chất"}, "language": {"urlNote": "Lựa chọn ngôn ngữ được ghi nhớ theo trình duyệt của người dùng (localStorage), áp dụng đồng thời cho cả website công khai và My eUni Portal.", "fallback": "Hiển thị bản Tiếng Việt (khuyến nghị)", "defaultCode": "vi", "enabledCodes": ["vi", "en"], "fallbackOptions": ["Hiển thị bản Tiếng Việt (khuyến nghị)", "Ẩn nội dung cho đến khi có bản dịch", "Hiển thị nội dung Tiếng Việt kèm nhãn \"Chưa có bản dịch\""]}}'),
	('i18nCoverage', '[{"type": "Bài viết", "total": 238, "translated": 96}, {"type": "Trang tĩnh", "total": 56, "translated": 21}, {"type": "Danh mục", "total": 68, "translated": 68}, {"type": "Mục menu", "total": 8, "translated": 8}, {"type": "Banner / Slider", "total": 5, "translated": 2}]'),
	('trend', '[{"day": "17/04", "draft": 210, "published": 380}, {"day": "22/04", "draft": 250, "published": 300}, {"day": "27/04", "draft": 200, "published": 460}, {"day": "02/05", "draft": 280, "published": 420}, {"day": "07/05", "draft": 240, "published": 520}, {"day": "12/05", "draft": 300, "published": 470}, {"day": "17/05", "draft": 260, "published": 560}]'),
	('searchPages', '[{"to": "/nghien-cuu", "type": "Trang", "title": "Khoa học & Công nghệ", "excerpt": "Trang thông tin về hoạt động nghiên cứu, công bố, đề tài và chuyển giao công nghệ của HUMG."}, {"to": "/hoc-tap/chuong-trinh-dao-tao", "type": "Trang", "title": "Chương trình đào tạo", "excerpt": "Danh mục các chương trình đào tạo đại học, sau đại học và liên kết quốc tế."}, {"to": "/thu-vien-so", "type": "Trang", "title": "Thư viện số HUMG", "excerpt": "CSDL khoa học, sách – tạp chí điện tử, luận văn – luận án và tài liệu số."}, {"to": "/sinh-vien", "type": "Trang", "title": "Cổng sinh viên", "excerpt": "Thông tin, dịch vụ và hỗ trợ dành riêng cho sinh viên HUMG."}, {"to": "/hoc-tap/tuyen-sinh", "type": "Tài liệu", "title": "Đề án tuyển sinh 2026 (PDF)", "excerpt": "Toàn văn đề án tuyển sinh đại học chính quy năm 2026 · PDF · 1.2 MB."}, {"to": "/hoc-tap/thong-tin-chung", "type": "Tài liệu", "title": "Quy chế đào tạo đại học chính quy (PDF)", "excerpt": "Quy chế học vụ áp dụng cho hệ đại học chính quy · PDF · 1.6 MB."}]'),
	('menuGroups', '[{"code": "header", "name": "Menu chính (Header)"}, {"code": "footer", "name": "Menu chân trang (Footer)"}, {"code": "utility", "name": "Menu tiện ích"}]'),
	('schemaVersion', '6');


--
-- Data for Name: audit_logs_2026_10; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--



--
-- Data for Name: audit_logs_2026_11; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--



--
-- Data for Name: audit_logs_default; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.audit_logs_default (id, tenant_id, at, actor_sub, actor_name, action, entity_type, entity_id, entity_label, revision_version, changes, ip, user_agent, correlation_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', '2025-05-16 03:15:00+00', 'u-tvanminh', 'Trần Văn Minh', 'post.update', NULL, NULL, 'Hội thảo quốc tế về Trắc địa và GIS 2025', NULL, NULL, '203.113.45.12', NULL, NULL),
	(2, 'humg', '2025-05-16 02:50:00+00', 'u-nthoa', 'Nguyễn Thị Hoa', 'login', NULL, NULL, 'Hệ thống', NULL, NULL, '203.113.45.20', NULL, NULL),
	(3, 'humg', '2025-05-16 02:30:00+00', 'u-ltmai', 'Lê Thị Mai', 'media.upload', NULL, NULL, 'banner-tuyensinh.jpg', NULL, NULL, '27.68.35.19', NULL, NULL),
	(4, 'humg', '2025-05-15 09:45:00+00', 'u-pvloc', 'Phạm Văn Lộc', 'post.publish', NULL, NULL, 'Thông báo tuyển dụng giảng viên năm 2025', NULL, NULL, '203.113.45.12', NULL, NULL),
	(5, 'humg', '2025-05-15 02:10:00+00', 'u-hdnam', 'Hoàng Đức Nam', 'post.delete', NULL, NULL, 'Bài viết nháp cũ (ID #204)', NULL, NULL, '27.68.35.19', NULL, NULL),
	(6, 'humg', '2025-05-14 08:20:00+00', 'u-dvtung', 'Đỗ Văn Tùng', 'login', NULL, NULL, 'Hệ thống', NULL, NULL, '203.113.45.11', NULL, NULL),
	(7, 'humg', '2025-05-13 03:55:00+00', 'u-vthuong', 'Vũ Thị Hương', 'login', NULL, NULL, 'Hệ thống', NULL, NULL, '203.113.45.14', NULL, NULL),
	(8, 'humg', '2025-05-08 08:30:00+00', 'u-bmduc', 'Bùi Minh Đức', 'login', NULL, NULL, 'Hệ thống', NULL, NULL, '27.68.35.19', NULL, NULL);


--
-- Data for Name: backups; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.backups (id, tenant_id, file_path, size_bytes, trigger, created_by_name, status, created_at, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', '/backup/cms_humg/cms_20250516.sql.gz', 446273946, 'cron', 'Hệ thống (Cron)', 'success', '2025-05-15 20:00:00+00', '{}'),
	(2, 'humg', '/backup/cms_humg/cms_20250515.sql.gz', 438514483, 'cron', 'Hệ thống (Cron)', 'success', '2025-05-14 20:00:00+00', '{}'),
	(3, 'humg', '/backup/cms_humg/cms_20250514.sql.gz', 430650163, 'cron', 'Hệ thống (Cron)', 'success', '2025-05-13 20:00:00+00', '{}'),
	(4, 'humg', '/backup/cms_humg/cms_20250513.sql.gz', 418486682, 'manual', 'Trần Văn Minh', 'success', '2025-05-13 08:12:00+00', '{}');


--
-- Data for Name: banners; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.banners (id, tenant_id, "position", image_id, link_url, is_visible, sort_order, starts_on, ends_on, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'home_slider', NULL, '/hoc-tap/tuyen-sinh', true, 1, '2026-09-27', '2026-12-06', NULL, NULL, '{}'),
	(2, 'humg', 'home_slider', NULL, '/su-kien', true, 2, '2026-10-02', '2026-11-06', NULL, NULL, '{}'),
	(3, 'humg', 'home_popup', NULL, '/gioi-thieu/lich-su', false, 3, '2026-10-04', '2026-11-16', NULL, NULL, '{}'),
	(4, 'humg', 'sidebar_right', NULL, '/doi-song/viec-lam', true, 4, '2026-09-30', '2026-11-21', NULL, NULL, '{}'),
	(5, 'humg', 'footer', NULL, '/hoc-tap/hoc-phi-hoc-bong', true, 5, '2026-10-05', '2026-11-01', NULL, NULL, '{}'),
	(6, 'cntt', 'home_slider', NULL, '/hoc-tap/tuyen-sinh', true, 1, '2026-10-02', '2026-12-06', NULL, NULL, '{}'),
	(7, 'cntt', 'sidebar_right', NULL, '/su-kien', true, 1, '2026-10-04', '2026-11-16', NULL, NULL, '{}');


--
-- Data for Name: banner_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.banner_translations (banner_id, lang, title, subtitle) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'Banner tuyển sinh đại học 2025', 'Xét tuyển 15 ngành Kỹ thuật – Công nghệ, nhận hồ sơ trực tuyến'),
	(2, 'vi', 'Hội thảo quốc tế Trắc địa – GIS 2025', 'Đăng ký tham dự và gửi bài báo'),
	(3, 'vi', 'Chào mừng 60 năm thành lập Trường', '1966 – 2026 · Chuỗi hoạt động kỷ niệm'),
	(4, 'vi', 'Ngày hội việc làm HUMG 2025', 'Hơn 80 doanh nghiệp tuyển dụng'),
	(5, 'vi', 'Thông báo học bổng khuyến khích học tập', 'Hạn nộp hồ sơ trong tháng này'),
	(6, 'vi', 'Tuyển sinh ngành Khoa học dữ liệu 2026', 'Chương trình mới của Khoa CNTT — học bổng cho 20 thí sinh đầu vào'),
	(7, 'vi', 'Ngày hội việc làm CNTT', 'Hơn 20 doanh nghiệp công nghệ');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.categories (id, tenant_id, parent_id, sort_order, is_active, created_at, updated_at, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', NULL, 0, true, '2026-10-07 11:58:15.825+00', '2026-10-07 11:58:15.826+00', NULL, NULL, '{}'),
	(2, 'humg', 1, 1, true, '2026-10-07 11:58:15.831+00', '2026-10-07 11:58:15.831+00', NULL, NULL, '{}'),
	(3, 'humg', NULL, 2, true, '2026-10-07 11:58:15.832+00', '2026-10-07 11:58:15.832+00', NULL, NULL, '{}'),
	(4, 'humg', NULL, 3, true, '2026-10-07 11:58:15.833+00', '2026-10-07 11:58:15.833+00', NULL, NULL, '{}'),
	(5, 'humg', 4, 4, true, '2026-10-07 11:58:15.834+00', '2026-10-07 11:58:15.834+00', NULL, NULL, '{}'),
	(6, 'humg', 4, 5, true, '2026-10-07 11:58:15.835+00', '2026-10-07 11:58:15.835+00', NULL, NULL, '{}'),
	(7, 'humg', NULL, 6, true, '2026-10-07 11:58:15.836+00', '2026-10-07 11:58:15.836+00', NULL, NULL, '{}'),
	(8, 'humg', NULL, 7, true, '2026-10-07 11:58:15.837+00', '2026-10-07 11:58:15.837+00', NULL, NULL, '{}'),
	(9, 'humg', NULL, 8, false, '2026-10-07 11:58:15.837+00', '2026-10-07 11:58:15.837+00', NULL, NULL, '{}'),
	(10, 'humg', NULL, 9, true, '2026-10-07 11:58:15.838+00', '2026-10-07 11:58:15.838+00', NULL, NULL, '{}'),
	(11, 'cntt', NULL, 0, true, '2026-10-07 11:58:15.839+00', '2026-10-07 11:58:15.839+00', NULL, NULL, '{}'),
	(12, 'cntt', NULL, 1, true, '2026-10-07 11:58:15.84+00', '2026-10-07 11:58:15.84+00', NULL, NULL, '{}');


--
-- Data for Name: category_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.category_translations (category_id, lang, tenant_id, name, slug, description) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'humg', 'Tin tức', 'tin-tuc', NULL),
	(2, 'vi', 'humg', 'Thông báo', 'thong-bao', NULL),
	(3, 'vi', 'humg', 'Sự kiện', 'su-kien', NULL),
	(4, 'vi', 'humg', 'Nghiên cứu', 'nghien-cuu', NULL),
	(5, 'vi', 'humg', 'Đề tài – Dự án', 'de-tai-du-an', NULL),
	(6, 'vi', 'humg', 'Tạp chí khoa học', 'tap-chi-khoa-hoc', NULL),
	(7, 'vi', 'humg', 'Học tập', 'hoc-tap', NULL),
	(8, 'vi', 'humg', 'Tuyển sinh', 'tuyen-sinh', NULL),
	(9, 'vi', 'humg', 'Văn bản – Biểu mẫu', 'van-ban-bieu-mau', NULL),
	(10, 'vi', 'humg', 'Hợp tác', 'hop-tac', NULL),
	(11, 'vi', 'cntt', 'Tin tức Khoa', 'tin-tuc-khoa', NULL),
	(12, 'vi', 'cntt', 'Nghiên cứu – Học thuật', 'nghien-cuu-hoc-thuat', NULL);


--
-- Data for Name: content_shares; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.events (id, tenant_id, slug, starts_at, ends_at, status, contact, thumbnail_id, owner_unit_code, is_visible, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'hoi-thao-khoa-hoc-quoc-te-dia-chat-khoang-san', '2026-05-20 01:00:00+00', '2026-05-20 10:00:00+00', 'upcoming', 'hoithao.diachat@humg.edu.vn', NULL, NULL, true, '2026-10-07 11:58:15.967+00', NULL, '2026-10-07 11:58:15.967+00', NULL, NULL, NULL, '{}'),
	(2, 'humg', 'ngay-hoi-viec-lam-ket-noi-doanh-nghiep-2025', '2026-05-25 00:30:00+00', '2026-05-25 09:30:00+00', 'upcoming', 'vieclam@humg.edu.vn', NULL, NULL, true, '2026-10-07 11:58:15.969+00', NULL, '2026-10-07 11:58:15.969+00', NULL, NULL, NULL, '{}'),
	(3, 'humg', 'le-bao-ve-luan-an-tien-si-dot-1-2025', '2026-05-30 01:00:00+00', '2026-05-30 05:00:00+00', 'upcoming', 'saudaihoc@humg.edu.vn', NULL, NULL, true, '2026-10-07 11:58:15.971+00', NULL, '2026-10-07 11:58:15.971+00', NULL, NULL, NULL, '{}'),
	(4, 'humg', 'toa-dam-chuyen-doi-so-trong-dao-tao', '2026-06-05 07:00:00+00', '2026-06-05 10:00:00+00', 'upcoming', 'cntt@humg.edu.vn', NULL, NULL, true, '2026-10-07 11:58:15.972+00', NULL, '2026-10-07 11:58:15.972+00', NULL, NULL, NULL, '{}'),
	(5, 'humg', 'giai-bong-da-sinh-vien-humg-2025', '2026-06-12 08:30:00+00', '2026-06-12 11:00:00+00', 'upcoming', 'doanthanhnien@humg.edu.vn', NULL, NULL, true, '2026-10-07 11:58:15.973+00', NULL, '2026-10-07 11:58:15.973+00', NULL, NULL, NULL, '{}'),
	(6, 'humg', 'workshop-ky-nang-mem-cho-tan-sinh-vien', '2026-06-18 01:30:00+00', '2026-06-18 04:30:00+00', 'upcoming', 'htsv@humg.edu.vn', NULL, NULL, true, '2026-10-07 11:58:15.974+00', NULL, '2026-10-07 11:58:15.974+00', NULL, NULL, NULL, '{}'),
	(7, 'cntt', 'ngay-hoi-viec-lam-cntt-2025', '2025-06-14 01:00:00+00', '2025-06-14 09:30:00+00', 'upcoming', NULL, NULL, NULL, true, '2026-10-07 11:58:15.975+00', NULL, '2026-10-07 11:58:15.975+00', NULL, NULL, NULL, '{}');


--
-- Data for Name: event_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.event_translations (event_id, lang, title, place, place_full, organizer, audience, description, agenda) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'Hội thảo khoa học quốc tế về Địa chất và Khoáng sản', 'Hội trường A, HUMG', 'Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Hà Nội', 'Khoa Địa chất & Phòng Hợp tác quốc tế', 'Giảng viên, nhà khoa học, nghiên cứu sinh, doanh nghiệp', '["Hội thảo là diễn đàn để các nhà khoa học trong nước và quốc tế trao đổi kết quả nghiên cứu mới nhất trong lĩnh vực địa chất, khoáng sản và tài nguyên bền vững.", {"type": "list", "items": ["Địa chất khu vực và kiến tạo", "Tài nguyên khoáng sản và đánh giá trữ lượng", "Địa chất môi trường và tai biến địa chất", "Ứng dụng AI – viễn thám trong thăm dò"]}]', '[{"item": "Đón tiếp đại biểu & khai mạc", "time": "08:00"}, {"item": "Báo cáo phiên toàn thể", "time": "09:00"}, {"item": "Các phiên chuyên đề song song", "time": "10:30"}, {"item": "Phiên poster & triển lãm thiết bị", "time": "13:30"}, {"item": "Thảo luận bàn tròn & bế mạc", "time": "15:30"}]'),
	(2, 'vi', 'Ngày hội việc làm & Kết nối doanh nghiệp 2025', 'Sân vận động HUMG', 'Sân vận động & Nhà thi đấu đa năng – Trường Đại học Mỏ - Địa chất', 'Phòng Công tác chính trị & Sinh viên', 'Sinh viên năm cuối, cựu sinh viên, doanh nghiệp', '["Sự kiện kết nối sinh viên với hơn 50 doanh nghiệp tuyển dụng, cùng chuỗi hội thảo kỹ năng nghề nghiệp và phỏng vấn trực tiếp tại gian hàng."]', '[{"item": "Khai mạc & tham quan gian hàng", "time": "07:30"}, {"item": "Hội thảo “Kỹ năng phỏng vấn & viết CV”", "time": "09:00"}, {"item": "Phỏng vấn trực tiếp tại gian hàng doanh nghiệp", "time": "10:30"}, {"item": "Talkshow “Khởi nghiệp từ ghế nhà trường”", "time": "14:00"}, {"item": "Tổng kết & trao quà may mắn", "time": "16:00"}]'),
	(3, 'vi', 'Lễ bảo vệ luận án Tiến sĩ đợt 1 năm 2025', 'Phòng 602, Nhà A', 'Phòng họp 602, Tầng 6, Nhà A – Trường Đại học Mỏ - Địa chất', 'Phòng Đào tạo Sau đại học', 'Hội đồng, nghiên cứu sinh, khách mời', '["Buổi bảo vệ luận án Tiến sĩ cấp Trường của nghiên cứu sinh chuyên ngành Kỹ thuật Địa chất, theo quy định của Bộ Giáo dục và Đào tạo."]', '[{"item": "Công bố quyết định thành lập Hội đồng", "time": "08:00"}, {"item": "Nghiên cứu sinh trình bày luận án", "time": "08:15"}, {"item": "Phản biện & hỏi đáp", "time": "09:00"}, {"item": "Hội đồng họp riêng & công bố kết quả", "time": "11:00"}]'),
	(4, 'vi', 'Tọa đàm chuyển đổi số trong đào tạo đại học', 'Hội trường B, HUMG', 'Hội trường B, Tầng 1, Nhà C – Trường Đại học Mỏ - Địa chất', 'Trung tâm CNTT & Phòng Đào tạo', 'Cán bộ, giảng viên toàn trường', '["Tọa đàm chia sẻ kinh nghiệm ứng dụng nền tảng số, dữ liệu và AI trong tổ chức đào tạo, khảo thí và quản trị nhà trường."]', '[{"item": "Báo cáo đề dẫn", "time": "14:00"}, {"item": "Tham luận từ các khoa", "time": "14:40"}, {"item": "Thảo luận & đề xuất", "time": "15:40"}, {"item": "Kết luận tọa đàm", "time": "16:40"}]'),
	(5, 'vi', 'Khai mạc Giải bóng đá sinh viên HUMG 2025', 'Sân vận động HUMG', 'Sân vận động Trường Đại học Mỏ - Địa chất', 'Đoàn Thanh niên – Hội Sinh viên', 'Sinh viên toàn trường', '["Giải đấu thường niên với sự tham gia của các đội tuyển đến từ tất cả các khoa, hứa hẹn nhiều trận cầu sôi động."]', '[{"item": "Lễ khai mạc & diễu hành các đội", "time": "15:30"}, {"item": "Trận đấu khai mạc", "time": "16:00"}, {"item": "Trao cờ lưu niệm", "time": "17:45"}]'),
	(6, 'vi', 'Workshop kỹ năng mềm cho tân sinh viên', 'Hội trường A, HUMG', 'Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất', 'Trung tâm Hỗ trợ sinh viên', 'Tân sinh viên khóa mới', '["Trang bị cho tân sinh viên kỹ năng quản lý thời gian, làm việc nhóm, thuyết trình và thích nghi với môi trường đại học."]', '[{"item": "Khởi động & làm quen", "time": "08:30"}, {"item": "Chuyên đề “Học đại học đúng cách”", "time": "09:00"}, {"item": "Thực hành làm việc nhóm", "time": "10:15"}, {"item": "Hỏi đáp & tổng kết", "time": "11:15"}]'),
	(7, 'vi', 'Ngày hội việc làm CNTT 2025', 'Sảnh nhà C', 'Sảnh nhà C, Trường ĐH Mỏ - Địa chất', 'Khoa Công nghệ thông tin', 'Sinh viên Khoa CNTT', '["Gặp gỡ hơn 20 doanh nghiệp công nghệ."]', '[]');


--
-- Data for Name: home_blocks; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.home_blocks (id, tenant_id, kind, data, is_visible, sort_order, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'hero_slide', '{"code": "sl-60-nam", "accentUrl": "/hoc-tap/tuyen-sinh", "primaryUrl": "/gioi-thieu"}', true, 0, NULL, NULL, '{}'),
	(2, 'humg', 'hero_slide', '{"code": "sl-tuyen-sinh", "accentUrl": "/lien-he", "primaryUrl": "/hoc-tap/tuyen-sinh"}', true, 1, NULL, NULL, '{}'),
	(3, 'humg', 'hero_slide', '{"code": "sl-nghien-cuu", "accentUrl": "/nghien-cuu/nhom-nghien-cuu", "primaryUrl": "/nghien-cuu"}', true, 2, NULL, NULL, '{}'),
	(4, 'humg', 'hero_slide', '{"code": "sl-doi-song", "accentUrl": "/doi-song/cau-lac-bo", "primaryUrl": "/doi-song"}', true, 3, NULL, NULL, '{}'),
	(5, 'humg', 'hero_slide', '{"code": "sl-hop-tac", "accentUrl": "/hop-tac/doi-tac-quoc-te", "primaryUrl": "/hop-tac"}', true, 4, NULL, NULL, '{}'),
	(6, 'cntt', 'hero_slide', '{"code": "cntt-hero", "accentUrl": "/hoc-tap/tuyen-sinh", "primaryUrl": "/gioi-thieu"}', true, 0, NULL, NULL, '{}'),
	(7, 'humg', 'quick_link', '{"url": "/lich-cong-tac", "icon": "calendar"}', true, 0, NULL, NULL, '{}'),
	(8, 'humg', 'quick_link', '{"url": "/thu-vien-so", "icon": "library"}', true, 1, NULL, NULL, '{}'),
	(9, 'humg', 'quick_link', '{"url": "/hoc-tap/e-learning", "icon": "play"}', true, 2, NULL, NULL, '{}'),
	(10, 'humg', 'quick_link', '{"url": "/hoc-tap/tuyen-sinh", "icon": "search"}', true, 3, NULL, NULL, '{}'),
	(11, 'humg', 'quick_link', '{"url": "/hoc-tap/bieu-mau", "icon": "file"}', true, 4, NULL, NULL, '{}'),
	(12, 'humg', 'quick_link', '{"url": "/webmail", "icon": "mail"}', true, 5, NULL, NULL, '{}'),
	(13, 'humg', 'quick_link', '{"url": "/tien-ich", "icon": "grid"}', true, 6, NULL, NULL, '{}'),
	(14, 'humg', 'quick_link', '{"url": "/lien-he", "icon": "phone"}', true, 7, NULL, NULL, '{}'),
	(15, 'cntt', 'quick_link', '{"url": "/lich-cong-tac", "icon": "calendar"}', true, 0, NULL, NULL, '{}'),
	(16, 'cntt', 'quick_link', '{"url": "/thu-vien-so", "icon": "library"}', true, 1, NULL, NULL, '{}'),
	(17, 'cntt', 'quick_link', '{"url": "/hoc-tap/e-learning", "icon": "play"}', true, 2, NULL, NULL, '{}'),
	(18, 'cntt', 'quick_link', '{"url": "/hoc-tap/tuyen-sinh", "icon": "search"}', true, 3, NULL, NULL, '{}'),
	(19, 'humg', 'audience', '{"url": "/hoc-tap/tuyen-sinh", "code": "thi-sinh", "icon": "graduation", "color": "#1976d2"}', true, 0, NULL, NULL, '{}'),
	(20, 'humg', 'audience', '{"url": "/sinh-vien", "code": "sinh-vien", "icon": "user", "color": "#0f9d8c"}', true, 1, NULL, NULL, '{}'),
	(21, 'humg', 'audience', '{"url": "/phu-huynh", "code": "phu-huynh", "icon": "users", "color": "#f57c00"}', true, 2, NULL, NULL, '{}'),
	(22, 'humg', 'audience', '{"url": "/cuu-sinh-vien", "code": "cuu-sinh-vien", "icon": "award", "color": "#7b3fe4"}', true, 3, NULL, NULL, '{}'),
	(23, 'humg', 'audience', '{"url": "/giang-vien", "code": "giang-vien", "icon": "briefcase", "color": "#2e7d32"}', true, 4, NULL, NULL, '{}'),
	(24, 'humg', 'audience', '{"url": "/hop-tac", "code": "doi-tac", "icon": "handshake", "color": "#3949ab"}', true, 5, NULL, NULL, '{}'),
	(25, 'cntt', 'audience', '{"url": "/hoc-tap/tuyen-sinh", "code": "thi-sinh", "icon": "graduation", "color": "#1976d2"}', true, 0, NULL, NULL, '{}'),
	(26, 'cntt', 'audience', '{"url": "/sinh-vien", "code": "sinh-vien", "icon": "user", "color": "#0f9d8c"}', true, 1, NULL, NULL, '{}'),
	(27, 'cntt', 'audience', '{"url": "/phu-huynh", "code": "phu-huynh", "icon": "users", "color": "#f57c00"}', true, 2, NULL, NULL, '{}'),
	(28, 'cntt', 'audience', '{"url": "/cuu-sinh-vien", "code": "cuu-sinh-vien", "icon": "award", "color": "#7b3fe4"}', true, 3, NULL, NULL, '{}'),
	(29, 'cntt', 'audience', '{"url": "/giang-vien", "code": "giang-vien", "icon": "briefcase", "color": "#2e7d32"}', true, 4, NULL, NULL, '{}'),
	(30, 'cntt', 'audience', '{"url": "/hop-tac", "code": "doi-tac", "icon": "handshake", "color": "#3949ab"}', true, 5, NULL, NULL, '{}'),
	(31, 'humg', 'strength', '{"icon": "flask"}', true, 0, NULL, NULL, '{}'),
	(32, 'humg', 'strength', '{"icon": "award"}', true, 1, NULL, NULL, '{}'),
	(33, 'humg', 'strength', '{"icon": "graduation"}', true, 2, NULL, NULL, '{}'),
	(34, 'humg', 'strength', '{"icon": "briefcase"}', true, 3, NULL, NULL, '{}'),
	(35, 'cntt', 'strength', '{"icon": "flask"}', true, 0, NULL, NULL, '{}'),
	(36, 'cntt', 'strength', '{"icon": "award"}', true, 1, NULL, NULL, '{}'),
	(37, 'cntt', 'strength', '{"icon": "graduation"}', true, 2, NULL, NULL, '{}'),
	(38, 'humg', 'partner', '{"color": "#0057a8", "website": null, "shortName": "TKV"}', true, 0, NULL, NULL, '{}'),
	(39, 'humg', 'partner', '{"color": "#e2231a", "website": null, "shortName": "PVN"}', true, 1, NULL, NULL, '{}'),
	(40, 'humg', 'partner', '{"color": "#004b87", "website": null, "shortName": "BGR"}', true, 2, NULL, NULL, '{}'),
	(41, 'humg', 'partner', '{"color": "#1a7f5a", "website": null, "shortName": "KIGAM"}', true, 3, NULL, NULL, '{}'),
	(42, 'humg', 'partner', '{"color": "#e60012", "website": null, "shortName": "JICA"}', true, 4, NULL, NULL, '{}'),
	(43, 'humg', 'partner', '{"color": "#9e1b32", "website": null, "shortName": "HUST"}', true, 5, NULL, NULL, '{}'),
	(44, 'humg', 'partner', '{"color": "#51247a", "website": null, "shortName": "UQ"}', true, 6, NULL, NULL, '{}'),
	(45, 'humg', 'partner', '{"color": "#00693e", "website": null, "shortName": "AGH"}', true, 7, NULL, NULL, '{}'),
	(46, 'humg', 'partner', '{"color": "#0067b1", "website": null, "shortName": "PVEP"}', true, 8, NULL, NULL, '{}'),
	(47, 'humg', 'partner', '{"color": "#003f87", "website": null, "shortName": "VAST"}', true, 9, NULL, NULL, '{}'),
	(48, 'humg', 'partner', '{"color": "#e21836", "website": null, "shortName": "HAL"}', true, 10, NULL, NULL, '{}'),
	(49, 'humg', 'partner', '{"color": "#0014dc", "website": null, "shortName": "SLB"}', true, 11, NULL, NULL, '{}'),
	(50, 'humg', 'partner', '{"color": "#1f6f43", "website": null, "shortName": "DGMV"}', true, 12, NULL, NULL, '{}');
INSERT INTO cms.home_blocks (id, tenant_id, kind, data, is_visible, sort_order, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(51, 'humg', 'partner', '{"color": "#0060a9", "website": null, "shortName": "VCI"}', true, 13, NULL, NULL, '{}'),
	(52, 'cntt', 'partner', '{"color": "#0057a8", "website": null, "shortName": "TKV"}', true, 0, NULL, NULL, '{}'),
	(53, 'cntt', 'partner', '{"color": "#e2231a", "website": null, "shortName": "PVN"}', true, 1, NULL, NULL, '{}'),
	(54, 'cntt', 'partner', '{"color": "#004b87", "website": null, "shortName": "BGR"}', true, 2, NULL, NULL, '{}'),
	(55, 'cntt', 'partner', '{"color": "#1a7f5a", "website": null, "shortName": "KIGAM"}', true, 3, NULL, NULL, '{}'),
	(56, 'humg', 'stat_hero', '{"value": "60+", "placement": "hero"}', true, 0, NULL, NULL, '{}'),
	(57, 'humg', 'stat_hero', '{"value": "20.000+", "placement": "hero"}', true, 1, NULL, NULL, '{}'),
	(58, 'humg', 'stat_hero', '{"value": "52", "placement": "hero"}', true, 2, NULL, NULL, '{}'),
	(59, 'humg', 'stat_hero', '{"value": "600+", "placement": "hero"}', true, 3, NULL, NULL, '{}'),
	(60, 'humg', 'stat_about', '{"value": "60+", "placement": "about"}', true, 0, NULL, NULL, '{}'),
	(61, 'humg', 'stat_about', '{"value": "20.000+", "placement": "about"}', true, 1, NULL, NULL, '{}'),
	(62, 'humg', 'stat_about', '{"value": "600+", "placement": "about"}', true, 2, NULL, NULL, '{}'),
	(63, 'humg', 'stat_about', '{"value": "12", "placement": "about"}', true, 3, NULL, NULL, '{}'),
	(64, 'humg', 'stat_about', '{"value": "52", "placement": "about"}', true, 4, NULL, NULL, '{}'),
	(65, 'cntt', 'stat_hero', '{"value": "60+", "placement": "hero"}', true, 0, NULL, NULL, '{}'),
	(66, 'cntt', 'stat_hero', '{"value": "20.000+", "placement": "hero"}', true, 1, NULL, NULL, '{}'),
	(67, 'cntt', 'stat_hero', '{"value": "52", "placement": "hero"}', true, 2, NULL, NULL, '{}'),
	(68, 'cntt', 'stat_hero', '{"value": "600+", "placement": "hero"}', true, 3, NULL, NULL, '{}'),
	(69, 'cntt', 'stat_about', '{"value": "60+", "placement": "about"}', true, 0, NULL, NULL, '{}'),
	(70, 'cntt', 'stat_about', '{"value": "20.000+", "placement": "about"}', true, 1, NULL, NULL, '{}'),
	(71, 'cntt', 'stat_about', '{"value": "600+", "placement": "about"}', true, 2, NULL, NULL, '{}'),
	(72, 'cntt', 'stat_about', '{"value": "12", "placement": "about"}', true, 3, NULL, NULL, '{}'),
	(73, 'cntt', 'stat_about', '{"value": "52", "placement": "about"}', true, 4, NULL, NULL, '{}');


--
-- Data for Name: home_block_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.home_block_translations (block_id, lang, data) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', '{"motto": "Tri thức · Bản lĩnh · Sáng tạo · Hội nhập", "title": "XÂY DỰNG, ĐỔI MỚI\nVÀ PHÁT TRIỂN", "kicker": "60 NĂM", "subtitle": "1966 – 2026", "accentLabel": "Tuyển sinh 2026", "primaryLabel": "Khám phá HUMG"}'),
	(2, 'vi', '{"motto": "5 phương thức xét tuyển · Học bổng đến 100% học phí", "title": "CHỌN NGÀNH TƯƠNG LAI\nTẠI HUMG", "kicker": "TUYỂN SINH ĐẠI HỌC 2026", "subtitle": "52 chương trình đào tạo", "accentLabel": "Đăng ký tư vấn", "primaryLabel": "Xem thông tin tuyển sinh"}'),
	(3, 'vi', '{"motto": "Địa chất · Mỏ · Dầu khí · Trắc địa – Bản đồ · CNTT", "title": "KIẾN TẠO TRI THỨC\nCHUYỂN GIAO GIÁ TRỊ", "kicker": "KHOA HỌC & CÔNG NGHỆ", "subtitle": "142 đề tài · 650+ công bố quốc tế", "accentLabel": "Nhóm nghiên cứu mạnh", "primaryLabel": "Khám phá nghiên cứu"}'),
	(4, 'vi', '{"motto": "Ký túc xá · Thể thao – Văn hóa · Khởi nghiệp · Việc làm", "title": "TRẢI NGHIỆM ĐẠI HỌC\nTRỌN VẸN TẠI HUMG", "kicker": "ĐỜI SỐNG SINH VIÊN", "subtitle": "200+ CLB & đội nhóm", "accentLabel": "Câu lạc bộ sinh viên", "primaryLabel": "Khám phá đời sống"}'),
	(5, 'vi', '{"motto": "Đào tạo · Nghiên cứu chung · Trao đổi sinh viên & giảng viên", "title": "KẾT NỐI TRI THỨC\nMỞ RỘNG TƯƠNG LAI", "kicker": "HỢP TÁC & HỘI NHẬP", "subtitle": "128 đối tác · 46 quốc gia", "accentLabel": "Đối tác quốc tế", "primaryLabel": "Khám phá hợp tác"}'),
	(6, 'vi', '{"motto": "Tri thức · Bản lĩnh · Sáng tạo · Hội nhập", "title": "CÔNG NGHỆ THÔNG TIN\nCHO NGÀNH MỎ – ĐỊA CHẤT", "kicker": "KHOA CNTT", "subtitle": "HUMG", "accentLabel": "Tuyển sinh", "primaryLabel": "Giới thiệu Khoa"}'),
	(7, 'vi', '{"label": "Lịch công tác"}'),
	(8, 'vi', '{"label": "Thư viện số"}'),
	(9, 'vi', '{"label": "E-learning"}'),
	(10, 'vi', '{"label": "Tra cứu tuyển sinh"}'),
	(11, 'vi', '{"label": "Biểu mẫu"}'),
	(12, 'vi', '{"label": "Webmail"}'),
	(13, 'vi', '{"label": "Tiện ích khác"}'),
	(14, 'vi', '{"label": "Liên hệ"}'),
	(15, 'vi', '{"label": "Lịch công tác"}'),
	(16, 'vi', '{"label": "Thư viện số"}'),
	(17, 'vi', '{"label": "E-learning"}'),
	(18, 'vi', '{"label": "Tra cứu tuyển sinh"}'),
	(19, 'vi', '{"title": "Thí sinh", "description": "Tuyển sinh, ngành học, chương trình đào tạo."}'),
	(20, 'vi', '{"title": "Sinh viên", "description": "Học tập, rèn luyện, đời sống sinh viên."}'),
	(21, 'vi', '{"title": "Phụ huynh", "description": "Theo dõi kết quả học tập và học phí của con."}'),
	(22, 'vi', '{"title": "Cựu sinh viên", "description": "Kết nối & phát triển cộng đồng."}'),
	(23, 'vi', '{"title": "Giảng viên", "description": "Giảng dạy, nghiên cứu, quản lý công việc."}'),
	(24, 'vi', '{"title": "Đối tác", "description": "Hợp tác, liên kết, phát triển bền vững."}'),
	(25, 'vi', '{"title": "Thí sinh", "description": "Tuyển sinh, ngành học, chương trình đào tạo."}'),
	(26, 'vi', '{"title": "Sinh viên", "description": "Học tập, rèn luyện, đời sống sinh viên."}'),
	(27, 'vi', '{"title": "Phụ huynh", "description": "Theo dõi kết quả học tập và học phí của con."}'),
	(28, 'vi', '{"title": "Cựu sinh viên", "description": "Kết nối & phát triển cộng đồng."}'),
	(29, 'vi', '{"title": "Giảng viên", "description": "Giảng dạy, nghiên cứu, quản lý công việc."}'),
	(30, 'vi', '{"title": "Đối tác", "description": "Hợp tác, liên kết, phát triển bền vững."}'),
	(31, 'vi', '{"text": "Chương trình cập nhật, hệ thống phòng thí nghiệm và thực hành hiện đại.", "title": "Đào tạo gắn thực tiễn"}'),
	(32, 'vi', '{"text": "Nhóm nghiên cứu mạnh, hàng trăm công bố quốc tế và sản phẩm chuyển giao.", "title": "Nghiên cứu & Chuyển giao"}'),
	(33, 'vi', '{"text": "Học bổng đến 100% học phí cùng quỹ đồng hành và hỗ trợ sinh viên.", "title": "Học bổng & Hỗ trợ"}'),
	(34, 'vi', '{"text": "Mạng lưới doanh nghiệp rộng, ngày hội việc làm và kết nối tuyển dụng.", "title": "Việc làm sau tốt nghiệp"}'),
	(35, 'vi', '{"text": "Chương trình cập nhật, hệ thống phòng thí nghiệm và thực hành hiện đại.", "title": "Đào tạo gắn thực tiễn"}'),
	(36, 'vi', '{"text": "Nhóm nghiên cứu mạnh, hàng trăm công bố quốc tế và sản phẩm chuyển giao.", "title": "Nghiên cứu & Chuyển giao"}'),
	(37, 'vi', '{"text": "Học bổng đến 100% học phí cùng quỹ đồng hành và hỗ trợ sinh viên.", "title": "Học bổng & Hỗ trợ"}'),
	(38, 'vi', '{"name": "Vinacomin"}'),
	(39, 'vi', '{"name": "Petrovietnam"}'),
	(40, 'vi', '{"name": "BGR – CHLB Đức"}'),
	(41, 'vi', '{"name": "KIGAM – Hàn Quốc"}'),
	(42, 'vi', '{"name": "JICA – Nhật Bản"}'),
	(43, 'vi', '{"name": "ĐH Bách khoa Hà Nội"}'),
	(44, 'vi', '{"name": "The University of Queensland"}'),
	(45, 'vi', '{"name": "AGH – Ba Lan"}'),
	(46, 'vi', '{"name": "PVEP"}'),
	(47, 'vi', '{"name": "Viện HLKH&CN Việt Nam"}'),
	(48, 'vi', '{"name": "Halliburton"}'),
	(49, 'vi', '{"name": "SLB (Schlumberger)"}'),
	(50, 'vi', '{"name": "Tổng cục Địa chất & Khoáng sản"}');
INSERT INTO cms.home_block_translations (block_id, lang, data) OVERRIDING SYSTEM VALUE VALUES
	(51, 'vi', '{"name": "Tập đoàn Hóa chất Việt Nam"}'),
	(52, 'vi', '{"name": "Vinacomin"}'),
	(53, 'vi', '{"name": "Petrovietnam"}'),
	(54, 'vi', '{"name": "BGR – CHLB Đức"}'),
	(55, 'vi', '{"name": "KIGAM – Hàn Quốc"}'),
	(56, 'vi', '{"sub": null, "label": "Năm phát triển"}'),
	(57, 'vi', '{"sub": null, "label": "Sinh viên, học viên"}'),
	(58, 'vi', '{"sub": null, "label": "Chương trình đào tạo"}'),
	(59, 'vi', '{"sub": null, "label": "Giảng viên, cán bộ"}'),
	(60, 'vi', '{"sub": "1966 – 2026", "label": "Năm phát triển"}'),
	(61, 'vi', '{"sub": "Tính đến 2025", "label": "Sinh viên, học viên"}'),
	(62, 'vi', '{"sub": "Tính đến 2025", "label": "Giảng viên, cán bộ"}'),
	(63, 'vi', '{"sub": null, "label": "Đơn vị trực thuộc"}'),
	(64, 'vi', '{"sub": null, "label": "Chương trình đào tạo"}'),
	(65, 'vi', '{"sub": null, "label": "Năm phát triển"}'),
	(66, 'vi', '{"sub": null, "label": "Sinh viên, học viên"}'),
	(67, 'vi', '{"sub": null, "label": "Chương trình đào tạo"}'),
	(68, 'vi', '{"sub": null, "label": "Giảng viên, cán bộ"}'),
	(69, 'vi', '{"sub": "1966 – 2026", "label": "Năm phát triển"}'),
	(70, 'vi', '{"sub": "Tính đến 2025", "label": "Sinh viên, học viên"}'),
	(71, 'vi', '{"sub": "Tính đến 2025", "label": "Giảng viên, cán bộ"}'),
	(72, 'vi', '{"sub": null, "label": "Đơn vị trực thuộc"}'),
	(73, 'vi', '{"sub": null, "label": "Chương trình đào tạo"}');


--
-- Data for Name: media_items; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.media_items (id, tenant_id, kind, slug, data, view_count, published_on, is_visible, created_at, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'album', 'le-ky-niem-60-nam', '{"photos": [{"id": 1, "caption": "Ảnh 1 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 0}, {"id": 2, "caption": "Ảnh 2 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 1}, {"id": 3, "caption": "Ảnh 3 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 2}, {"id": 4, "caption": "Ảnh 4 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 3}, {"id": 5, "caption": "Ảnh 5 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 4}, {"id": 6, "caption": "Ảnh 6 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 5}, {"id": 7, "caption": "Ảnh 7 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 6}, {"id": 8, "caption": "Ảnh 8 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 7}, {"id": 9, "caption": "Ảnh 9 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 8}, {"id": 10, "caption": "Ảnh 10 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 9}, {"id": 11, "caption": "Ảnh 11 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 10}, {"id": 12, "caption": "Ảnh 12 · Lễ kỷ niệm 60 năm", "mediaId": null, "sortOrder": 11}]}', 0, '2026-05-15', true, '2026-10-07 11:58:15.978+00', NULL, NULL, '{}'),
	(2, 'humg', 'album', 'phong-thi-nghiem-trong-diem', '{"photos": [{"id": 1, "caption": "Ảnh 1 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 0}, {"id": 2, "caption": "Ảnh 2 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 1}, {"id": 3, "caption": "Ảnh 3 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 2}, {"id": 4, "caption": "Ảnh 4 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 3}, {"id": 5, "caption": "Ảnh 5 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 4}, {"id": 6, "caption": "Ảnh 6 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 5}, {"id": 7, "caption": "Ảnh 7 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 6}, {"id": 8, "caption": "Ảnh 8 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 7}, {"id": 9, "caption": "Ảnh 9 · Phòng thí nghiệm", "mediaId": null, "sortOrder": 8}]}', 0, '2026-04-20', true, '2026-10-07 11:58:15.981+00', NULL, NULL, '{}'),
	(3, 'humg', 'album', 'hoat-dong-sinh-vien-2025', '{"photos": [{"id": 1, "caption": "Ảnh 1 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 0}, {"id": 2, "caption": "Ảnh 2 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 1}, {"id": 3, "caption": "Ảnh 3 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 2}, {"id": 4, "caption": "Ảnh 4 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 3}, {"id": 5, "caption": "Ảnh 5 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 4}, {"id": 6, "caption": "Ảnh 6 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 5}, {"id": 7, "caption": "Ảnh 7 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 6}, {"id": 8, "caption": "Ảnh 8 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 7}, {"id": 9, "caption": "Ảnh 9 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 8}, {"id": 10, "caption": "Ảnh 10 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 9}, {"id": 11, "caption": "Ảnh 11 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 10}, {"id": 12, "caption": "Ảnh 12 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 11}, {"id": 13, "caption": "Ảnh 13 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 12}, {"id": 14, "caption": "Ảnh 14 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 13}, {"id": 15, "caption": "Ảnh 15 · Hoạt động sinh viên", "mediaId": null, "sortOrder": 14}]}', 0, '2026-04-10', true, '2026-10-07 11:58:15.982+00', NULL, NULL, '{}'),
	(4, 'humg', 'album', 'khuon-vien-humg', '{"photos": [{"id": 1, "caption": "Ảnh 1 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 0}, {"id": 2, "caption": "Ảnh 2 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 1}, {"id": 3, "caption": "Ảnh 3 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 2}, {"id": 4, "caption": "Ảnh 4 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 3}, {"id": 5, "caption": "Ảnh 5 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 4}, {"id": 6, "caption": "Ảnh 6 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 5}, {"id": 7, "caption": "Ảnh 7 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 6}, {"id": 8, "caption": "Ảnh 8 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 7}, {"id": 9, "caption": "Ảnh 9 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 8}, {"id": 10, "caption": "Ảnh 10 · Khuôn viên HUMG", "mediaId": null, "sortOrder": 9}]}', 0, '2026-04-01', true, '2026-10-07 11:58:15.983+00', NULL, NULL, '{}'),
	(5, 'humg', 'video', 'humg-60-nam-mot-chang-duong', '{"channel": "HUMG Media", "videoUrl": null, "durationSec": 924}', 8420, '2026-05-12', true, '2026-10-07 11:58:15.984+00', NULL, NULL, '{}'),
	(6, 'humg', 'video', 'gioi-thieu-nganh-ky-thuat-mo', '{"channel": "Tư vấn tuyển sinh", "videoUrl": null, "durationSec": 372}', 3110, '2026-04-28', true, '2026-10-07 11:58:15.985+00', NULL, NULL, '{}'),
	(7, 'humg', 'video', 'campus-tour-humg', '{"channel": "HUMG Media", "videoUrl": null, "durationSec": 527}', 5230, '2026-04-15', true, '2026-10-07 11:58:15.986+00', NULL, NULL, '{}'),
	(8, 'humg', 'video', 'huong-dan-dang-ky-xet-tuyen', '{"channel": "Tư vấn tuyển sinh", "videoUrl": null, "durationSec": 298}', 6740, '2026-05-05', true, '2026-10-07 11:58:15.987+00', NULL, NULL, '{}'),
	(9, 'cntt', 'video', 'gioi-thieu-khoa-cntt', '{"channel": "Khoa CNTT", "videoUrl": null, "durationSec": 185}', 820, '2025-04-02', true, '2026-10-07 11:58:15.988+00', NULL, NULL, '{}'),
	(10, 'humg', 'podcast', 'chuyen-nghe-dia-chat', '{"host": "TS. Trần Văn A", "notes": ["Khách mời: kỹ sư địa chất công trình", "Chủ đề: khảo sát địa chất cho công trình ngầm", "Q&A từ thính giả sinh viên"], "episode": "Tập 05", "audioUrl": null, "playCount": 1240, "durationSec": 1930}', 0, '2026-05-10', true, '2026-10-07 11:58:15.99+00', NULL, NULL, '{}'),
	(11, 'humg', 'podcast', 'hanh-trinh-khoi-nghiep-cuu-sv', '{"host": "ThS. Nguyễn Thị B", "notes": ["Từ đồ án tốt nghiệp đến sản phẩm thương mại", "Gọi vốn và xây dựng đội ngũ", "Lời khuyên cho sinh viên muốn khởi nghiệp"], "episode": "Tập 04", "audioUrl": null, "playCount": 980, "durationSec": 1725}', 0, '2026-04-26', true, '2026-10-07 11:58:15.993+00', NULL, NULL, '{}'),
	(12, 'humg', 'podcast', 'hoi-dap-tuyen-sinh-2026', '{"host": "Phòng Đào tạo", "notes": ["Phương thức xét tuyển & tổ hợp môn", "Học phí và chính sách học bổng", "Cơ hội việc làm theo nhóm ngành"], "episode": "Tập 03", "audioUrl": null, "playCount": 2150, "durationSec": 1290}', 0, '2026-05-05', true, '2026-10-07 11:58:15.995+00', NULL, NULL, '{}'),
	(13, 'humg', 'podcast', 'song-xanh-trong-khai-thac-mo', '{"host": "PGS.TS. Lê Văn D", "notes": ["Xu hướng ESG trong ngành mỏ", "Công nghệ giảm phát thải", "Vai trò của kỹ sư trẻ"], "episode": "Tập 02", "audioUrl": null, "playCount": 760, "durationSec": 1565}', 0, '2026-04-18', true, '2026-10-07 11:58:15.997+00', NULL, NULL, '{}');


--
-- Data for Name: media_item_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.media_item_translations (media_item_id, lang, title, description) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường', NULL),
	(2, 'vi', 'Phòng thí nghiệm trọng điểm', NULL),
	(3, 'vi', 'Hoạt động sinh viên năm học 2025', NULL),
	(4, 'vi', 'Khuôn viên Trường Đại học Mỏ - Địa chất', NULL),
	(5, 'vi', 'HUMG – 60 năm một chặng đường', 'Phim tài liệu nhìn lại chặng đường 60 năm xây dựng và phát triển của Trường Đại học Mỏ - Địa chất.'),
	(6, 'vi', 'Giới thiệu ngành Kỹ thuật Mỏ', 'Tổng quan về ngành Kỹ thuật Mỏ: chương trình đào tạo, cơ hội nghề nghiệp và chia sẻ từ cựu sinh viên.'),
	(7, 'vi', 'Campus tour Trường Đại học Mỏ - Địa chất', 'Dạo quanh khuôn viên, giảng đường, thư viện, phòng thí nghiệm và khu ký túc xá của HUMG.'),
	(8, 'vi', 'Hướng dẫn đăng ký xét tuyển trực tuyến', 'Các bước đăng ký xét tuyển trực tuyến vào HUMG năm 2026, kèm lưu ý quan trọng cho thí sinh.'),
	(9, 'vi', 'Giới thiệu Khoa Công nghệ thông tin', 'Video giới thiệu ngành học và cơ sở vật chất của Khoa.'),
	(10, 'vi', 'Chuyện nghề Địa chất', 'Trò chuyện cùng những người làm nghề địa chất: hành trình vào nghề, gian nan hiện trường và niềm vui khám phá.'),
	(11, 'vi', 'Hành trình khởi nghiệp của cựu sinh viên', 'Câu chuyện khởi nghiệp trong lĩnh vực công nghệ đo đạc – bản đồ của một nhóm cựu sinh viên HUMG.'),
	(12, 'vi', 'Hỏi đáp tuyển sinh 2026', 'Giải đáp trực tiếp các thắc mắc phổ biến của thí sinh và phụ huynh về kỳ tuyển sinh 2026.'),
	(13, 'vi', 'Sống xanh trong khai thác mỏ', 'Bàn về khai thác mỏ bền vững, hoàn nguyên môi trường và kinh tế tuần hoàn trong ngành khoáng sản.');


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.menu_items (id, tenant_id, group_code, parent_id, type, url, sort_order, is_visible, open_in_new_tab, deleted_at, deleted_by, extra, icon) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 'header', NULL, 'page', '/gioi-thieu', 1, true, false, NULL, NULL, '{}', 'building'),
	(2, 'humg', 'header', 1, 'page', '/gioi-thieu', 1, true, false, NULL, NULL, '{}', NULL),
	(3, 'humg', 'header', 1, 'page', '/gioi-thieu/thong-diep-hieu-truong', 2, true, false, NULL, NULL, '{}', NULL),
	(4, 'humg', 'header', 1, 'page', '/gioi-thieu/lich-su', 3, true, false, NULL, NULL, '{}', NULL),
	(5, 'humg', 'header', 1, 'page', '/gioi-thieu/tam-nhin-su-mang', 4, true, false, NULL, NULL, '{}', NULL),
	(6, 'humg', 'header', 1, 'page', '/gioi-thieu/thanh-tuu', 5, true, false, NULL, NULL, '{}', NULL),
	(7, 'humg', 'header', 1, 'page', '/gioi-thieu/co-cau-to-chuc', 6, true, false, NULL, NULL, '{}', NULL),
	(8, 'humg', 'header', 1, 'page', '/gioi-thieu/giang-vien', 7, true, false, NULL, NULL, '{}', NULL),
	(9, 'humg', 'header', NULL, 'page', '/hoc-tap', 2, true, false, NULL, NULL, '{}', 'graduation'),
	(10, 'humg', 'header', 9, 'page', '/hoc-tap', 1, true, false, NULL, NULL, '{}', NULL),
	(11, 'humg', 'header', 9, 'page', '/hoc-tap/tuyen-sinh', 2, true, false, NULL, NULL, '{}', NULL),
	(12, 'humg', 'header', 9, 'page', '/hoc-tap/chuong-trinh-dao-tao', 3, true, false, NULL, NULL, '{}', NULL),
	(13, 'humg', 'header', 9, 'page', '/hoc-tap/chuan-dau-ra', 4, true, false, NULL, NULL, '{}', NULL),
	(14, 'humg', 'header', 9, 'page', '/hoc-tap/thong-tin-chung', 5, true, false, NULL, NULL, '{}', NULL),
	(15, 'humg', 'header', 9, 'page', '/hoc-tap/hoc-phi-hoc-bong', 6, true, false, NULL, NULL, '{}', NULL),
	(16, 'humg', 'header', 9, 'page', '/hoc-tap/bieu-mau', 7, true, false, NULL, NULL, '{}', NULL),
	(17, 'humg', 'header', 9, 'page', '/hoc-tap/lich-hoc', 8, true, false, NULL, NULL, '{}', NULL),
	(18, 'humg', 'header', 9, 'page', '/hoc-tap/tra-cuu-ket-qua', 9, true, false, NULL, NULL, '{}', NULL),
	(19, 'humg', 'header', 9, 'page', '/hoc-tap/huong-dan', 10, true, false, NULL, NULL, '{}', NULL),
	(20, 'humg', 'header', 9, 'page', '/hoc-tap/e-learning', 11, true, false, NULL, NULL, '{}', NULL),
	(21, 'humg', 'header', 9, 'page', '/hoc-tap/khao-sat', 12, true, false, NULL, NULL, '{}', NULL),
	(22, 'humg', 'header', NULL, 'page', '/nghien-cuu', 3, true, false, NULL, NULL, '{}', 'flask'),
	(23, 'humg', 'header', 22, 'page', '/nghien-cuu', 1, true, false, NULL, NULL, '{}', NULL),
	(24, 'humg', 'header', 22, 'page', '/nghien-cuu/de-tai', 2, true, false, NULL, NULL, '{}', NULL),
	(25, 'humg', 'header', 22, 'page', '/nghien-cuu/cong-bo', 3, true, false, NULL, NULL, '{}', NULL),
	(26, 'humg', 'header', 22, 'page', '/nghien-cuu/chuyen-gia', 4, true, false, NULL, NULL, '{}', NULL),
	(27, 'humg', 'header', 22, 'page', '/nghien-cuu/nhom-nghien-cuu', 5, true, false, NULL, NULL, '{}', NULL),
	(28, 'humg', 'header', 22, 'page', '/nghien-cuu/hoi-nghi-hoi-thao', 6, true, false, NULL, NULL, '{}', NULL),
	(29, 'humg', 'header', 22, 'page', '/nghien-cuu/phong-thi-nghiem', 7, true, false, NULL, NULL, '{}', NULL),
	(30, 'humg', 'header', 22, 'page', '/nghien-cuu/chuyen-giao-cong-nghe', 8, true, false, NULL, NULL, '{}', NULL),
	(31, 'humg', 'header', 22, 'page', '/nghien-cuu/nghien-cuu-sinh', 9, true, false, NULL, NULL, '{}', NULL),
	(32, 'humg', 'header', NULL, 'page', '/hop-tac', 4, true, false, NULL, NULL, '{}', 'handshake'),
	(33, 'humg', 'header', 32, 'page', '/hop-tac', 1, true, false, NULL, NULL, '{}', NULL),
	(34, 'humg', 'header', 32, 'page', '/hop-tac/doi-tac', 2, true, false, NULL, NULL, '{}', NULL),
	(35, 'humg', 'header', 32, 'page', '/hop-tac/doi-tac-trong-nuoc', 3, true, false, NULL, NULL, '{}', NULL),
	(36, 'humg', 'header', 32, 'page', '/hop-tac/doi-tac-quoc-te', 4, true, false, NULL, NULL, '{}', NULL),
	(37, 'humg', 'header', 32, 'page', '/hop-tac/chuong-trinh-du-an', 5, true, false, NULL, NULL, '{}', NULL),
	(38, 'humg', 'header', 32, 'page', '/hop-tac/trao-doi', 6, true, false, NULL, NULL, '{}', NULL),
	(39, 'humg', 'header', 32, 'page', '/hop-tac/sinh-vien-quoc-te', 7, true, false, NULL, NULL, '{}', NULL),
	(40, 'humg', 'header', 32, 'page', '/hop-tac/giang-vien-quoc-te', 8, true, false, NULL, NULL, '{}', NULL),
	(41, 'humg', 'header', 32, 'page', '/hop-tac/co-hoi-hop-tac', 9, true, false, NULL, NULL, '{}', NULL),
	(42, 'humg', 'header', NULL, 'page', '/doi-song', 5, true, false, NULL, NULL, '{}', 'heart'),
	(43, 'humg', 'header', 42, 'page', '/doi-song', 1, true, false, NULL, NULL, '{}', NULL),
	(44, 'humg', 'header', 42, 'page', '/doi-song/campus-co-so-vat-chat', 2, true, false, NULL, NULL, '{}', NULL),
	(45, 'humg', 'header', 42, 'page', '/doi-song/hoat-dong-sinh-vien', 3, true, false, NULL, NULL, '{}', NULL),
	(46, 'humg', 'header', 42, 'page', '/doi-song/cau-lac-bo', 4, true, false, NULL, NULL, '{}', NULL),
	(47, 'humg', 'header', 42, 'page', '/doi-song/doan-hoi', 5, true, false, NULL, NULL, '{}', NULL),
	(48, 'humg', 'header', 42, 'page', '/doi-song/the-thao-van-hoa', 6, true, false, NULL, NULL, '{}', NULL),
	(49, 'humg', 'header', 42, 'page', '/doi-song/ky-tuc-xa', 7, true, false, NULL, NULL, '{}', NULL),
	(50, 'humg', 'header', 42, 'page', '/doi-song/y-te', 8, true, false, NULL, NULL, '{}', NULL);
INSERT INTO cms.menu_items (id, tenant_id, group_code, parent_id, type, url, sort_order, is_visible, open_in_new_tab, deleted_at, deleted_by, extra, icon) OVERRIDING SYSTEM VALUE VALUES
	(51, 'humg', 'header', 42, 'page', '/doi-song/dich-vu-campus', 9, true, false, NULL, NULL, '{}', NULL),
	(52, 'humg', 'header', 42, 'page', '/doi-song/ho-tro-sinh-vien', 10, true, false, NULL, NULL, '{}', NULL),
	(53, 'humg', 'header', 42, 'page', '/doi-song/viec-lam-khoi-nghiep', 11, true, false, NULL, NULL, '{}', NULL),
	(54, 'humg', 'header', NULL, 'page', '/thu-vien', 6, true, false, NULL, NULL, '{}', 'library'),
	(55, 'humg', 'header', NULL, 'page', '/sinh-vien', 7, true, false, NULL, NULL, '{}', 'user'),
	(56, 'humg', 'header', NULL, 'page', '/giang-vien', 8, true, false, NULL, NULL, '{}', 'users'),
	(57, 'humg', 'footer', NULL, 'heading', NULL, 1, true, false, NULL, NULL, '{}', NULL),
	(58, 'humg', 'footer', 57, 'page', '/gioi-thieu', 1, true, false, NULL, NULL, '{}', NULL),
	(59, 'humg', 'footer', 57, 'page', '/hoc-tap/tuyen-sinh', 2, true, false, NULL, NULL, '{}', NULL),
	(60, 'humg', 'footer', 57, 'page', '/hoc-tap/chuong-trinh-dao-tao', 3, true, false, NULL, NULL, '{}', NULL),
	(61, 'humg', 'footer', 57, 'page', '/nghien-cuu', 4, true, false, NULL, NULL, '{}', NULL),
	(62, 'humg', 'footer', 57, 'page', '/hop-tac', 5, true, false, NULL, NULL, '{}', NULL),
	(63, 'humg', 'footer', 57, 'page', '/doi-song', 6, true, false, NULL, NULL, '{}', NULL),
	(64, 'humg', 'footer', 57, 'page', '/tin-tuc', 7, true, false, NULL, NULL, '{}', NULL),
	(65, 'humg', 'footer', NULL, 'heading', NULL, 2, true, false, NULL, NULL, '{}', NULL),
	(66, 'humg', 'footer', 65, 'page', '/trang/chinh-sach-bao-mat', 1, true, false, NULL, NULL, '{}', NULL),
	(67, 'humg', 'footer', 65, 'page', '/hoc-tap/thong-tin-chung', 2, true, false, NULL, NULL, '{}', NULL),
	(68, 'humg', 'footer', 65, 'page', '/trang/dieu-khoan-su-dung', 3, true, false, NULL, NULL, '{}', NULL),
	(69, 'humg', 'footer', 65, 'page', '/lien-he', 4, true, false, NULL, NULL, '{}', NULL),
	(70, 'humg', 'footer', 65, 'page', '/sitemap', 5, true, false, NULL, NULL, '{}', NULL),
	(71, 'humg', 'utility', NULL, 'page', '/sitemap', 1, true, false, NULL, NULL, '{}', NULL),
	(72, 'humg', 'utility', NULL, 'page', '/lien-he', 2, true, false, NULL, NULL, '{}', NULL),
	(73, 'cntt', 'header', NULL, 'page', '/trang/gioi-thieu-khoa', 1, true, false, NULL, NULL, '{}', 'building'),
	(74, 'cntt', 'header', 73, 'page', '/trang/gioi-thieu-khoa', 1, true, false, NULL, NULL, '{}', NULL),
	(75, 'cntt', 'header', 73, 'page', '/trang/cac-bo-mon', 2, true, false, NULL, NULL, '{}', NULL),
	(76, 'cntt', 'header', NULL, 'page', '/hoc-tap/chuong-trinh-dao-tao', 2, true, false, NULL, NULL, '{}', 'graduation'),
	(77, 'cntt', 'header', 76, 'page', '/hoc-tap/chuong-trinh-dao-tao', 1, true, false, NULL, NULL, '{}', NULL),
	(78, 'cntt', 'header', 76, 'page', '/hoc-tap/tuyen-sinh', 2, true, false, NULL, NULL, '{}', NULL),
	(79, 'cntt', 'header', 76, 'page', '/hoc-tap/lich-hoc', 3, true, false, NULL, NULL, '{}', NULL),
	(80, 'cntt', 'header', NULL, 'page', '/tin-tuc', 3, true, false, NULL, NULL, '{}', 'newspaper'),
	(81, 'cntt', 'header', 80, 'page', '/tin-tuc', 1, true, false, NULL, NULL, '{}', NULL),
	(82, 'cntt', 'header', 80, 'page', '/su-kien', 2, true, false, NULL, NULL, '{}', NULL),
	(83, 'cntt', 'header', 80, 'page', '/media', 3, true, false, NULL, NULL, '{}', NULL),
	(84, 'cntt', 'header', NULL, 'page', '/trang/lien-he-khoa', 4, true, false, NULL, NULL, '{}', 'phone'),
	(85, 'cntt', 'header', NULL, 'link', 'https://humg.edu.vn', 5, true, true, NULL, NULL, '{}', 'globe'),
	(86, 'cntt', 'footer', NULL, 'heading', NULL, 1, true, false, NULL, NULL, '{}', NULL),
	(87, 'cntt', 'footer', 86, 'page', '/trang/gioi-thieu-khoa', 1, true, false, NULL, NULL, '{}', NULL),
	(88, 'cntt', 'footer', 86, 'page', '/trang/cac-bo-mon', 2, true, false, NULL, NULL, '{}', NULL),
	(89, 'cntt', 'footer', 86, 'page', '/tin-tuc', 3, true, false, NULL, NULL, '{}', NULL),
	(90, 'cntt', 'footer', 86, 'page', '/trang/lien-he-khoa', 4, true, false, NULL, NULL, '{}', NULL),
	(91, 'cntt', 'footer', NULL, 'heading', NULL, 2, true, false, NULL, NULL, '{}', NULL),
	(92, 'cntt', 'footer', 91, 'page', '/trang/chinh-sach-bao-mat', 1, true, false, NULL, NULL, '{}', NULL),
	(93, 'cntt', 'footer', 91, 'page', '/trang/dieu-khoan-su-dung', 2, true, false, NULL, NULL, '{}', NULL),
	(94, 'cntt', 'utility', NULL, 'page', '/trang/lien-he-khoa', 1, true, false, NULL, NULL, '{}', NULL),
	(95, 'cntt', 'utility', NULL, 'link', 'https://humg.edu.vn', 2, true, true, NULL, NULL, '{}', NULL);


--
-- Data for Name: menu_item_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.menu_item_translations (menu_item_id, lang, label, translation_status) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'Giới thiệu HUMG', 'done'),
	(1, 'en', 'About HUMG', 'done'),
	(2, 'vi', 'Tổng quan', 'done'),
	(2, 'en', 'Overview', 'done'),
	(3, 'vi', 'Thông điệp Hiệu trưởng', 'done'),
	(3, 'en', 'President''s Message', 'done'),
	(4, 'vi', 'Lịch sử phát triển', 'done'),
	(4, 'en', 'History', 'done'),
	(5, 'vi', 'Sứ mạng – Tầm nhìn – Giá trị', 'done'),
	(5, 'en', 'Mission – Vision – Values', 'done'),
	(6, 'vi', 'Thành tựu & con số nổi bật', 'done'),
	(6, 'en', 'Achievements & Key Figures', 'done'),
	(7, 'vi', 'Cơ cấu tổ chức', 'done'),
	(7, 'en', 'Organization', 'done'),
	(8, 'vi', 'Đội ngũ cán bộ, giảng viên', 'done'),
	(8, 'en', 'Faculty & Staff', 'done'),
	(9, 'vi', 'Học tập', 'done'),
	(9, 'en', 'Academics', 'done'),
	(10, 'vi', 'Tổng quan Học tập', 'done'),
	(10, 'en', 'Academics Overview', 'done'),
	(11, 'vi', 'Tuyển sinh', 'done'),
	(11, 'en', 'Admissions', 'done'),
	(12, 'vi', 'Chương trình đào tạo', 'done'),
	(12, 'en', 'Study Programs', 'done'),
	(13, 'vi', 'Chuẩn đầu ra', 'done'),
	(13, 'en', 'Learning Outcomes', 'done'),
	(14, 'vi', 'Thông tin chung', 'done'),
	(14, 'en', 'General Information', 'done'),
	(15, 'vi', 'Học phí & Học bổng', 'done'),
	(15, 'en', 'Tuition & Scholarships', 'done'),
	(16, 'vi', 'Biểu mẫu', 'done'),
	(16, 'en', 'Forms', 'done'),
	(17, 'vi', 'Lịch học – Lịch thi', 'done'),
	(17, 'en', 'Class & Exam Schedule', 'done'),
	(18, 'vi', 'Tra cứu kết quả học tập', 'done'),
	(18, 'en', 'Academic Results Lookup', 'done'),
	(19, 'vi', 'Hướng dẫn học tập', 'done'),
	(19, 'en', 'Study Guides', 'done'),
	(20, 'vi', 'E-learning & LMS', 'done'),
	(20, 'en', 'E-learning & LMS', 'done'),
	(21, 'vi', 'Khảo sát & Đánh giá', 'done'),
	(21, 'en', 'Surveys & Evaluation', 'done'),
	(22, 'vi', 'Nghiên cứu', 'done'),
	(22, 'en', 'Research', 'done'),
	(23, 'vi', 'Khoa học & Công nghệ (Tổng quan)', 'done'),
	(23, 'en', 'Science & Technology (Overview)', 'done'),
	(24, 'vi', 'Đề tài / Dự án', 'done'),
	(24, 'en', 'Projects', 'done'),
	(25, 'vi', 'Công bố khoa học', 'done'),
	(25, 'en', 'Publications', 'done');
INSERT INTO cms.menu_item_translations (menu_item_id, lang, label, translation_status) OVERRIDING SYSTEM VALUE VALUES
	(26, 'vi', 'Danh sách chuyên gia', 'done'),
	(26, 'en', 'Experts Directory', 'done'),
	(27, 'vi', 'Nhóm nghiên cứu', 'done'),
	(27, 'en', 'Research Groups', 'done'),
	(28, 'vi', 'Hội nghị / Hội thảo', 'done'),
	(28, 'en', 'Conferences / Seminars', 'done'),
	(29, 'vi', 'Phòng thí nghiệm', 'done'),
	(29, 'en', 'Laboratories', 'done'),
	(30, 'vi', 'Chuyển giao công nghệ', 'done'),
	(30, 'en', 'Technology Transfer', 'done'),
	(31, 'vi', 'Nghiên cứu sinh', 'done'),
	(31, 'en', 'PhD Candidates', 'done'),
	(32, 'vi', 'Hợp tác', 'done'),
	(32, 'en', 'Cooperation', 'done'),
	(33, 'vi', 'Tổng quan hợp tác', 'done'),
	(33, 'en', 'Cooperation Overview', 'done'),
	(34, 'vi', 'Danh sách đối tác', 'done'),
	(34, 'en', 'Partners', 'done'),
	(35, 'vi', 'Đối tác trong nước', 'done'),
	(35, 'en', 'Domestic Partners', 'done'),
	(36, 'vi', 'Đối tác quốc tế', 'done'),
	(36, 'en', 'International Partners', 'done'),
	(37, 'vi', 'Chương trình / Dự án', 'done'),
	(37, 'en', 'Programs / Projects', 'done'),
	(38, 'vi', 'Chương trình trao đổi', 'done'),
	(38, 'en', 'Exchange Programs', 'done'),
	(39, 'vi', 'Sinh viên quốc tế', 'done'),
	(39, 'en', 'International Students', 'done'),
	(40, 'vi', 'Giảng viên quốc tế', 'done'),
	(40, 'en', 'International Faculty', 'done'),
	(41, 'vi', 'Cơ hội hợp tác', 'done'),
	(41, 'en', 'Cooperation Opportunities', 'done'),
	(42, 'vi', 'Đời sống', 'done'),
	(42, 'en', 'Campus Life', 'done'),
	(43, 'vi', 'Đời sống HUMG (Hub)', 'done'),
	(43, 'en', 'Campus Life at HUMG', 'done'),
	(44, 'vi', 'Campus & Cơ sở vật chất', 'done'),
	(44, 'en', 'Campus & Facilities', 'done'),
	(45, 'vi', 'Hoạt động sinh viên', 'done'),
	(45, 'en', 'Student Activities', 'done'),
	(46, 'vi', 'Câu lạc bộ sinh viên', 'done'),
	(46, 'en', 'Student Clubs', 'done'),
	(47, 'vi', 'Đoàn – Hội', 'done'),
	(47, 'en', 'Youth Union – Associations', 'done'),
	(48, 'vi', 'Thể thao – Văn hóa', 'done'),
	(48, 'en', 'Sports – Culture', 'done'),
	(49, 'vi', 'Ký túc xá', 'done'),
	(49, 'en', 'Dormitory', 'done'),
	(50, 'vi', 'Y tế – Chăm sóc sức khỏe', 'done'),
	(50, 'en', 'Health Care', 'done');
INSERT INTO cms.menu_item_translations (menu_item_id, lang, label, translation_status) OVERRIDING SYSTEM VALUE VALUES
	(51, 'vi', 'Dịch vụ Campus', 'done'),
	(51, 'en', 'Campus Services', 'done'),
	(52, 'vi', 'Hỗ trợ sinh viên', 'done'),
	(52, 'en', 'Student Support', 'done'),
	(53, 'vi', 'Việc làm – Khởi nghiệp', 'done'),
	(53, 'en', 'Careers & Startups', 'done'),
	(54, 'vi', 'Thư viện', 'done'),
	(54, 'en', 'Library', 'done'),
	(55, 'vi', 'Sinh viên', 'done'),
	(55, 'en', 'Students', 'done'),
	(56, 'vi', 'Giảng viên / Cán bộ', 'done'),
	(56, 'en', 'Faculty / Staff', 'done'),
	(57, 'vi', 'Liên kết nhanh', 'done'),
	(57, 'en', 'Quick Links', 'done'),
	(58, 'vi', 'Giới thiệu HUMG', 'done'),
	(58, 'en', 'About HUMG', 'done'),
	(59, 'vi', 'Tuyển sinh', 'done'),
	(59, 'en', 'Admissions', 'done'),
	(60, 'vi', 'Đào tạo', 'done'),
	(60, 'en', 'Training', 'done'),
	(61, 'vi', 'Khoa học – Công nghệ', 'done'),
	(61, 'en', 'Science & Technology', 'done'),
	(62, 'vi', 'Hợp tác quốc tế', 'done'),
	(62, 'en', 'International Cooperation', 'done'),
	(63, 'vi', 'Đời sống', 'done'),
	(63, 'en', 'Campus Life', 'done'),
	(64, 'vi', 'Tin tức', 'done'),
	(64, 'en', 'News', 'done'),
	(65, 'vi', 'Chính sách & Quy định', 'done'),
	(65, 'en', 'Policies & Regulations', 'done'),
	(66, 'vi', 'Chính sách bảo mật', 'done'),
	(66, 'en', 'Privacy Policy', 'done'),
	(67, 'vi', 'Quy chế học vụ', 'done'),
	(67, 'en', 'Academic Regulations', 'done'),
	(68, 'vi', 'Điều khoản sử dụng', 'done'),
	(68, 'en', 'Terms of Use', 'done'),
	(69, 'vi', 'Thông tin truy cập chính phủ', 'done'),
	(69, 'en', 'Government Access Information', 'done'),
	(70, 'vi', 'Sơ đồ trang', 'done'),
	(70, 'en', 'Sitemap', 'done'),
	(71, 'vi', 'Sơ đồ trang', 'done'),
	(71, 'en', 'Sitemap', 'done'),
	(72, 'vi', 'Liên hệ', 'done'),
	(72, 'en', 'Contact', 'done'),
	(73, 'vi', 'Giới thiệu Khoa', 'done'),
	(73, 'en', 'About', 'done'),
	(74, 'vi', 'Giới thiệu chung', 'done'),
	(74, 'en', 'Overview', 'done'),
	(75, 'vi', 'Các bộ môn', 'done'),
	(75, 'en', 'Departments', 'done');
INSERT INTO cms.menu_item_translations (menu_item_id, lang, label, translation_status) OVERRIDING SYSTEM VALUE VALUES
	(76, 'vi', 'Đào tạo', 'done'),
	(76, 'en', 'Education', 'done'),
	(77, 'vi', 'Chương trình đào tạo', 'done'),
	(77, 'en', 'Programs', 'done'),
	(78, 'vi', 'Tuyển sinh', 'done'),
	(78, 'en', 'Admissions', 'done'),
	(79, 'vi', 'Lịch học – Lịch thi', 'done'),
	(79, 'en', 'Timetable & Exams', 'done'),
	(80, 'vi', 'Tin tức – Sự kiện', 'done'),
	(80, 'en', 'News & Events', 'done'),
	(81, 'vi', 'Tin tức Khoa', 'done'),
	(81, 'en', 'Faculty news', 'done'),
	(82, 'vi', 'Sự kiện', 'done'),
	(82, 'en', 'Events', 'done'),
	(83, 'vi', 'Media', 'done'),
	(83, 'en', 'Media', 'done'),
	(84, 'vi', 'Liên hệ', 'done'),
	(84, 'en', 'Contact', 'done'),
	(85, 'vi', 'Website Trường', 'done'),
	(85, 'en', 'University website', 'done'),
	(86, 'vi', 'Khoa Công nghệ thông tin', 'done'),
	(86, 'en', 'Faculty of IT', 'done'),
	(87, 'vi', 'Giới thiệu Khoa', 'done'),
	(87, 'en', 'About', 'done'),
	(88, 'vi', 'Các bộ môn', 'done'),
	(88, 'en', 'Departments', 'done'),
	(89, 'vi', 'Tin tức Khoa', 'done'),
	(89, 'en', 'Faculty news', 'done'),
	(90, 'vi', 'Liên hệ Khoa', 'done'),
	(90, 'en', 'Contact', 'done'),
	(91, 'vi', 'Chính sách & Quy định', 'done'),
	(91, 'en', 'Policies', 'done'),
	(92, 'vi', 'Chính sách bảo mật', 'done'),
	(92, 'en', 'Privacy policy', 'done'),
	(93, 'vi', 'Điều khoản sử dụng', 'done'),
	(93, 'en', 'Terms of use', 'done'),
	(94, 'vi', 'Liên hệ', 'done'),
	(94, 'en', 'Contact', 'done'),
	(95, 'vi', 'Website Trường', 'done'),
	(95, 'en', 'University website', 'done');


--
-- Data for Name: news; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.news (id, tenant_id, category_id, owner_unit_code, status, publish_at, expire_at, first_published_at, is_featured, show_on_home, featured_image_id, tags, source, author_sub, author_display, view_count, submitted_at, submitted_by, reviewed_at, reviewed_by, review_note, pending_revision_id, version, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', 1, 'TDBD', 'published', '2025-05-16 01:00:00+00', NULL, '2025-05-16 01:00:00+00', false, false, NULL, '{"Hội thảo","Trắc địa",GIS}', NULL, 'u-tvanminh', 'Trần Văn Minh', 1235, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-16 01:00:00+00', 'u-tvanminh', '2025-05-16 01:00:00+00', 'u-tvanminh', NULL, NULL, '{"unit": "Khoa Trắc địa – Bản đồ", "attachmentId": null}'),
	(2, 'humg', 2, 'P-TT', 'published', '2025-05-15 01:00:00+00', NULL, '2025-05-15 01:00:00+00', false, false, NULL, '{}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-15 01:00:00+00', 'u-nthoa', '2025-05-15 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(3, 'humg', 4, 'CNTT', 'draft', NULL, NULL, NULL, false, false, NULL, '{}', NULL, 'u-hunglq', 'Lê Quốc Hùng', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-15 01:00:00+00', 'u-hunglq', '2025-05-15 01:00:00+00', 'u-hunglq', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(4, 'humg', 8, 'P-TT', 'pending_review', NULL, NULL, NULL, false, false, NULL, '{}', NULL, 'u-lanpt', 'Phạm Thị Lan', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-14 01:00:00+00', 'u-lanpt', '2025-05-14 01:00:00+00', 'u-lanpt', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(5, 'humg', 1, 'P-TT', 'published', '2025-05-12 01:00:00+00', NULL, '2025-05-12 01:00:00+00', false, false, NULL, '{}', NULL, 'u-annv', 'Nguyễn Văn An', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-12 01:00:00+00', 'u-annv', '2025-05-12 01:00:00+00', 'u-annv', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(6, 'humg', 3, 'P-TT', 'published', '2025-05-11 01:00:00+00', NULL, '2025-05-11 01:00:00+00', false, false, NULL, '{}', NULL, 'u-ltmai', 'Lê Thị Mai', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-11 01:00:00+00', 'u-ltmai', '2025-05-11 01:00:00+00', 'u-ltmai', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(7, 'humg', 7, 'P-TT', 'published', '2025-05-10 01:00:00+00', NULL, '2025-05-10 01:00:00+00', false, false, NULL, '{}', NULL, 'u-hdnam', 'Hoàng Đức Nam', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-10 01:00:00+00', 'u-hdnam', '2025-05-10 01:00:00+00', 'u-hdnam', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(8, 'humg', 3, 'P-TT', 'draft', NULL, NULL, NULL, false, false, NULL, '{}', NULL, 'u-ltmai', 'Lê Thị Mai', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-09 01:00:00+00', 'u-ltmai', '2025-05-09 01:00:00+00', 'u-ltmai', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(9, 'humg', 2, 'P-TT', 'published', '2025-05-08 01:00:00+00', NULL, '2025-05-08 01:00:00+00', false, false, NULL, '{}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-08 01:00:00+00', 'u-nthoa', '2025-05-08 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(10, 'humg', 4, 'CNTT', 'pending_review', NULL, NULL, NULL, false, false, NULL, '{}', NULL, 'u-hunglq', 'Lê Quốc Hùng', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-07 01:00:00+00', 'u-hunglq', '2025-05-07 01:00:00+00', 'u-hunglq', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(11, 'humg', 8, 'P-TT', 'published', '2025-05-06 01:00:00+00', NULL, '2025-05-06 01:00:00+00', false, false, NULL, '{}', NULL, 'u-lanpt', 'Phạm Thị Lan', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-06 01:00:00+00', 'u-lanpt', '2025-05-06 01:00:00+00', 'u-lanpt', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(12, 'humg', 7, 'P-TT', 'draft', NULL, NULL, NULL, false, false, NULL, '{}', NULL, 'u-hdnam', 'Hoàng Đức Nam', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-05 01:00:00+00', 'u-hdnam', '2025-05-05 01:00:00+00', 'u-hdnam', NULL, NULL, '{"unit": null, "attachmentId": null}'),
	(13, 'humg', 3, 'VP', 'published', '2025-05-15 01:00:00+00', NULL, '2025-05-15 01:00:00+00', true, true, NULL, '{"60 năm","Truyền thống","Sự kiện"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 1235, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-15 01:00:00+00', 'u-nthoa', '2025-05-15 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Văn phòng", "attachmentId": null}'),
	(14, 'humg', 1, 'P-KHCN', 'published', '2025-05-10 01:00:00+00', NULL, '2025-05-10 01:00:00+00', false, true, NULL, '{"Xếp hạng","Chất lượng","Đào tạo"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 986, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-10 01:00:00+00', 'u-nthoa', '2025-05-10 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Phòng KHCN", "attachmentId": null}'),
	(15, 'humg', 4, 'MO', 'published', '2025-05-06 01:00:00+00', NULL, '2025-05-06 01:00:00+00', false, true, NULL, '{"Vật liệu mới","Khai thác mỏ","Môi trường"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 742, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-06 01:00:00+00', 'u-nthoa', '2025-05-06 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Khoa Mỏ", "attachmentId": null}'),
	(16, 'humg', 1, 'CNTT', 'published', '2025-05-02 01:00:00+00', NULL, '2025-05-02 01:00:00+00', false, true, NULL, '{"Sinh viên",IoT,"Cuộc thi"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 1527, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-02 01:00:00+00', 'u-nthoa', '2025-05-02 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Khoa CNTT", "attachmentId": null}'),
	(17, 'humg', 3, 'TDBD', 'published', '2025-05-14 01:00:00+00', NULL, '2025-05-14 01:00:00+00', false, false, NULL, '{"Hội thảo","Trắc địa",GIS}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 1235, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-14 01:00:00+00', 'u-nthoa', '2025-05-14 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Khoa Trắc địa – Bản đồ", "attachmentId": null}'),
	(18, 'humg', 10, 'P-HTQT', 'published', '2025-04-28 01:00:00+00', NULL, '2025-04-28 01:00:00+00', false, false, NULL, '{"Hợp tác quốc tế","CHLB Đức",MOU}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 640, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-04-28 01:00:00+00', 'u-nthoa', '2025-04-28 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Phòng Hợp tác quốc tế", "attachmentId": null}'),
	(19, 'humg', 8, 'P-DT', 'published', '2026-05-20 01:00:00+00', NULL, '2026-05-20 01:00:00+00', false, false, NULL, '{"Tuyển sinh",2026,"Đại học chính quy"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 3120, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-20 01:00:00+00', 'u-nthoa', '2026-05-20 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Phòng Đào tạo", "attachmentId": null}'),
	(20, 'humg', 2, 'P-CTSV', 'published', '2026-04-25 01:00:00+00', NULL, '2026-04-25 01:00:00+00', false, false, NULL, '{"Học bổng","Sinh viên","Doanh nghiệp"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 880, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-25 01:00:00+00', 'u-nthoa', '2026-04-25 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Phòng CTSV", "attachmentId": null}'),
	(21, 'humg', 4, 'P-KHCN', 'published', '2026-04-18 01:00:00+00', NULL, '2026-04-18 01:00:00+00', false, false, NULL, '{"Đề tài cấp Bộ","Khai thác than","Nghiệm thu"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 512, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-18 01:00:00+00', 'u-nthoa', '2026-04-18 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Phòng KHCN", "attachmentId": null}'),
	(22, 'humg', 3, 'P-CTSV', 'published', '2025-04-25 01:00:00+00', NULL, '2025-04-25 01:00:00+00', false, false, NULL, '{"Việc làm","Doanh nghiệp","Sinh viên"}', NULL, 'u-nthoa', 'Nguyễn Thị Hoa', 2103, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-04-25 01:00:00+00', 'u-nthoa', '2025-04-25 01:00:00+00', 'u-nthoa', NULL, NULL, '{"unit": "Phòng CTSV", "attachmentId": null}'),
	(23, 'cntt', 11, 'CNTT', 'published', '2025-05-22 01:00:00+00', NULL, '2025-05-22 01:00:00+00', true, true, NULL, '{AI,"chuyên đề"}', NULL, 'u-pvloc', 'Phạm Văn Lộc', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-22 01:00:00+00', 'u-pvloc', '2025-05-22 01:00:00+00', 'u-pvloc', NULL, NULL, '{"unit": "Khoa CNTT", "attachmentId": null}'),
	(24, 'cntt', 12, 'BM-KHMT', 'published', '2025-05-25 07:00:00+00', NULL, '2025-05-25 07:00:00+00', false, true, NULL, '{}', NULL, 'u-dvtung', 'Đỗ Văn Tùng', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-25 07:00:00+00', 'u-dvtung', '2025-05-25 07:00:00+00', 'u-pvloc', NULL, NULL, '{"unit": "Khoa CNTT", "attachmentId": null}'),
	(25, 'cntt', 11, 'CNTT', 'draft', NULL, NULL, NULL, false, false, NULL, '{}', NULL, 'u-pvloc', 'Phạm Văn Lộc', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-05-20 01:00:00+00', 'u-pvloc', '2025-05-20 01:00:00+00', 'u-pvloc', NULL, NULL, '{"unit": "Khoa CNTT", "attachmentId": null}');


--
-- Data for Name: news_attachments; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.news_attachments (id, news_id, media_id, title, meta, sort_order, url, extra) OVERRIDING SYSTEM VALUE VALUES
	(1, 1, NULL, 'Báo cáo tổng kết Hội thảo Trắc địa & GIS 2025', 'PDF · 4.2 MB', 0, NULL, '{}'),
	(2, 13, NULL, 'Diễn văn kỷ niệm 60 năm thành lập Trường', 'PDF · 640 KB', 0, NULL, '{}'),
	(3, 15, NULL, 'Tóm tắt kết quả nghiên cứu', 'PDF · 1.1 MB', 0, NULL, '{}'),
	(4, 17, NULL, 'Báo cáo tổng kết Hội thảo Trắc địa & GIS 2025', 'PDF · 4.2 MB', 0, NULL, '{}'),
	(5, 19, NULL, 'Đề án tuyển sinh 2026', 'PDF · 1.2 MB', 0, NULL, '{}'),
	(6, 19, NULL, 'Mẫu đơn đăng ký xét tuyển', 'DOCX · 256 KB', 1, NULL, '{}'),
	(7, 20, NULL, 'Mẫu hồ sơ đăng ký học bổng', 'DOCX · 34 KB', 0, NULL, '{}'),
	(8, 21, NULL, 'Báo cáo tóm tắt đề tài (2024)', 'PDF · 1.3 MB', 0, NULL, '{}');


--
-- Data for Name: news_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.news_translations (news_id, lang, tenant_id, slug, title, excerpt, body_html, body_text, meta_title, meta_description, meta_keywords, translation_status) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'humg', 'hoi-thao-trac-dia-gis-2025', 'Hội thảo quốc tế về Trắc địa và GIS 2025', 'Hội thảo là diễn đàn học thuật uy tín nhằm chia sẻ các xu hướng, công nghệ mới nhất trong lĩnh vực Trắc địa, Bản đồ và Hệ thống thông tin địa lý (GIS).', '["Nhập nội dung bài viết ở đây… (trình soạn thảo WYSIWYG)\n\nHội thảo quốc tế về Trắc địa và GIS 2025 quy tụ các chuyên gia đầu ngành trong nước và quốc tế…"]', '["Nhập nội dung bài viết ở đây… (trình soạn thảo WYSIWYG)\n\nHội thảo quốc tế về Trắc địa và GIS 2025 quy tụ các chuyên gia đầu ngành trong nước và quốc tế…"]', 'Hội thảo quốc tế về Trắc địa và GIS 2025 – HUMG', 'Thông tin chương trình, diễn giả và đăng ký tham dự Hội thảo quốc tế Trắc địa – GIS 2025 tại Trường Đại học Mỏ – Địa chất.', 'trắc địa, GIS, hội thảo quốc tế, HUMG', 'done'),
	(1, 'en', 'humg', 'hoi-thao-trac-dia-gis-2025', 'International Conference on Geodesy and GIS 2025', 'The conference is a prestigious academic forum to share the latest trends and technologies in Geodesy, Cartography and Geographic Information Systems (GIS).', '["Enter the post content here… (WYSIWYG editor)\n\nThe International Conference on Geodesy and GIS 2025 brings together leading experts from Vietnam and abroad…"]', '["Enter the post content here… (WYSIWYG editor)\n\nThe International Conference on Geodesy and GIS 2025 brings together leading experts from Vietnam and abroad…"]', 'International Conference on Geodesy and GIS 2025 – HUMG', 'Program, speakers and registration for the International Conference on Geodesy – GIS 2025 at Hanoi University of Mining and Geology.', 'geodesy, GIS, international conference, HUMG', 'done'),
	(2, 'vi', 'humg', 'thong-bao-lich-thi-hoc-ky-2-2024-2025', 'Thông báo lịch thi học kỳ 2 (2024 – 2025)', 'Thông báo lịch thi học kỳ 2 (2024 – 2025).', '["Thông báo lịch thi học kỳ 2 (2024 – 2025)."]', '["Thông báo lịch thi học kỳ 2 (2024 – 2025)."]', NULL, NULL, NULL, 'done'),
	(2, 'en', 'humg', 'thong-bao-lich-thi-hoc-ky-2-2024-2025', 'Thông báo lịch thi học kỳ 2 (2024 – 2025)', NULL, NULL, NULL, NULL, NULL, NULL, 'in_progress'),
	(3, 'vi', 'humg', 'nghien-cuu-ung-dung-ai-trong-quan-ly-dao-tao', 'Nghiên cứu ứng dụng AI trong quản lý đào tạo', 'Nghiên cứu ứng dụng AI trong quản lý đào tạo.', '["Nghiên cứu ứng dụng AI trong quản lý đào tạo."]', '["Nghiên cứu ứng dụng AI trong quản lý đào tạo."]', NULL, NULL, NULL, 'done'),
	(4, 'vi', 'humg', 'chuong-trinh-hoc-bong-humg-2025', 'Chương trình học bổng HUMG 2025', 'Chương trình học bổng HUMG 2025.', '["Chương trình học bổng HUMG 2025."]', '["Chương trình học bổng HUMG 2025."]', NULL, NULL, NULL, 'done'),
	(4, 'en', 'humg', 'chuong-trinh-hoc-bong-humg-2025', 'Chương trình học bổng HUMG 2025', NULL, NULL, NULL, NULL, NULL, NULL, 'in_progress'),
	(5, 'vi', 'humg', 'ket-qua-xet-tuyen-dot-1-nam-hoc-2024-2025', 'Kết quả xét tuyển đợt 1 năm học 2024 – 2025', 'Kết quả xét tuyển đợt 1 năm học 2024 – 2025.', '["Kết quả xét tuyển đợt 1 năm học 2024 – 2025."]', '["Kết quả xét tuyển đợt 1 năm học 2024 – 2025."]', NULL, NULL, NULL, 'done'),
	(5, 'en', 'humg', 'ket-qua-xet-tuyen-dot-1-nam-hoc-2024-2025', 'Kết quả xét tuyển đợt 1 năm học 2024 – 2025', NULL, NULL, NULL, NULL, NULL, NULL, 'done'),
	(6, 'vi', 'humg', 'le-khai-giang-nam-hoc-moi-2025-2026', 'Lễ khai giảng năm học mới 2025 – 2026', 'Lễ khai giảng năm học mới 2025 – 2026.', '["Lễ khai giảng năm học mới 2025 – 2026."]', '["Lễ khai giảng năm học mới 2025 – 2026."]', NULL, NULL, NULL, 'done'),
	(7, 'vi', 'humg', 'huong-dan-dang-ky-hoc-phan-hoc-ky-moi', 'Hướng dẫn đăng ký học phần học kỳ mới', 'Hướng dẫn đăng ký học phần học kỳ mới.', '["Hướng dẫn đăng ký học phần học kỳ mới."]', '["Hướng dẫn đăng ký học phần học kỳ mới."]', NULL, NULL, NULL, 'done'),
	(8, 'vi', 'humg', 'hoi-thao-khoa-hoc-tre-humg-lan-thu-xv', 'Hội thảo khoa học trẻ HUMG lần thứ XV', 'Hội thảo khoa học trẻ HUMG lần thứ XV.', '["Hội thảo khoa học trẻ HUMG lần thứ XV."]', '["Hội thảo khoa học trẻ HUMG lần thứ XV."]', NULL, NULL, NULL, 'done'),
	(9, 'vi', 'humg', 'thong-bao-tuyen-dung-giang-vien-nam-2025', 'Thông báo tuyển dụng giảng viên năm 2025', 'Thông báo tuyển dụng giảng viên năm 2025.', '["Thông báo tuyển dụng giảng viên năm 2025."]', '["Thông báo tuyển dụng giảng viên năm 2025."]', NULL, NULL, NULL, 'done'),
	(9, 'en', 'humg', 'thong-bao-tuyen-dung-giang-vien-nam-2025', 'Thông báo tuyển dụng giảng viên năm 2025', NULL, NULL, NULL, NULL, NULL, NULL, 'in_progress'),
	(10, 'vi', 'humg', 'danh-muc-de-tai-nckh-cap-truong-nam-2027', 'Danh mục đề tài NCKH cấp Trường năm 2027', 'Danh mục đề tài NCKH cấp Trường năm 2027.', '["Danh mục đề tài NCKH cấp Trường năm 2027."]', '["Danh mục đề tài NCKH cấp Trường năm 2027."]', NULL, NULL, NULL, 'done'),
	(11, 'vi', 'humg', 'chi-tieu-tuyen-sinh-dai-hoc-chinh-quy-2025', 'Chỉ tiêu tuyển sinh đại học chính quy 2025', 'Chỉ tiêu tuyển sinh đại học chính quy 2025.', '["Chỉ tiêu tuyển sinh đại học chính quy 2025."]', '["Chỉ tiêu tuyển sinh đại học chính quy 2025."]', NULL, NULL, NULL, 'done'),
	(11, 'en', 'humg', 'chi-tieu-tuyen-sinh-dai-hoc-chinh-quy-2025', 'Chỉ tiêu tuyển sinh đại học chính quy 2025', NULL, NULL, NULL, NULL, NULL, NULL, 'done'),
	(12, 'vi', 'humg', 'ke-hoach-hoc-tap-ren-luyen-nam-hoc-moi', 'Kế hoạch học tập – rèn luyện năm học mới', 'Kế hoạch học tập – rèn luyện năm học mới.', '["Kế hoạch học tập – rèn luyện năm học mới."]', '["Kế hoạch học tập – rèn luyện năm học mới."]', NULL, NULL, NULL, 'done'),
	(13, 'vi', 'humg', 'le-ky-niem-60-nam-thanh-lap', 'Lễ kỷ niệm 60 năm thành lập Trường Đại học Mỏ – Địa chất', 'Sáng 15/05/2025, Trường Đại học Mỏ – Địa chất long trọng tổ chức Lễ kỷ niệm 60 năm thành lập, ôn lại chặng đường xây dựng và phát triển của Nhà trường.', '["Trong không khí trang trọng và ấm áp, Trường Đại học Mỏ – Địa chất đã tổ chức Lễ kỷ niệm 60 năm thành lập (1966 – 2026) với sự tham dự của lãnh đạo Bộ Giáo dục và Đào tạo, các thế hệ cán bộ, giảng viên, cựu sinh viên và đối tác trong, ngoài nước.",{"type":"h2","text":"Một chặng đường tự hào"},"Từ những ngày đầu thành lập với vài trăm sinh viên, đến nay HUMG đã đào tạo hàng chục nghìn kỹ sư, cử nhân, thạc sĩ và tiến sĩ, đóng góp quan trọng cho ngành công nghiệp mỏ, địa chất, dầu khí và trắc địa – bản đồ của đất nước.",{"type":"quote","text":"“60 năm là hành trình của tri thức, bản lĩnh và khát vọng hội nhập. HUMG sẽ tiếp tục đổi mới để đồng hành cùng sự phát triển bền vững của đất nước.”"},{"type":"img","label":"Toàn cảnh buổi lễ tại Hội trường A","caption":"Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường."},{"type":"list","items":["Trao Huân chương và bằng khen cho các tập thể, cá nhân tiêu biểu","Ra mắt Quỹ học bổng 60 năm HUMG","Khánh thành không gian truyền thống của Nhà trường"]},"Buổi lễ khép lại với chương trình nghệ thuật đặc sắc do sinh viên và cựu sinh viên biểu diễn, thể hiện niềm tự hào và gắn bó với mái trường."]', '["Trong không khí trang trọng và ấm áp, Trường Đại học Mỏ – Địa chất đã tổ chức Lễ kỷ niệm 60 năm thành lập (1966 – 2026) với sự tham dự của lãnh đạo Bộ Giáo dục và Đào tạo, các thế hệ cán bộ, giảng viên, cựu sinh viên và đối tác trong, ngoài nước.",{"type":"h2","text":"Một chặng đường tự hào"},"Từ những ngày đầu thành lập với vài trăm sinh viên, đến nay HUMG đã đào tạo hàng chục nghìn kỹ sư, cử nhân, thạc sĩ và tiến sĩ, đóng góp quan trọng cho ngành công nghiệp mỏ, địa chất, dầu khí và trắc địa – bản đồ của đất nước.",{"type":"quote","text":"“60 năm là hành trình của tri thức, bản lĩnh và khát vọng hội nhập. HUMG sẽ tiếp tục đổi mới để đồng hành cùng sự phát triển bền vững của đất nước.”"},{"type":"img","label":"Toàn cảnh buổi lễ tại Hội trường A","caption":"Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường."},{"type":"list","items":["Trao Huân chương và bằng khen cho các tập thể, cá nhân tiêu biểu","Ra mắt Quỹ học bổng 60 năm HUMG","Khánh thành không gian truyền thống của Nhà trường"]},"Buổi lễ khép lại với chương trình nghệ thuật đặc sắc do sinh viên và cựu sinh viên biểu diễn, thể hiện niềm tự hào và gắn bó với mái trường."]', NULL, NULL, NULL, 'done'),
	(14, 'vi', 'humg', 'humg-top-10-dai-hoc-ky-thuat', 'HUMG lọt Top 10 trường đại học kỹ thuật hàng đầu Việt Nam', 'Theo bảng xếp hạng năm 2025, Trường Đại học Mỏ – Địa chất được ghi nhận trong nhóm 10 cơ sở đào tạo kỹ thuật hàng đầu cả nước.', '["Kết quả xếp hạng dựa trên các tiêu chí về chất lượng đào tạo, năng lực nghiên cứu, công bố quốc tế, tỷ lệ việc làm của sinh viên sau tốt nghiệp và mức độ hội nhập quốc tế.",{"type":"h2","text":"Thế mạnh về nghiên cứu ứng dụng"},"HUMG được đánh giá cao ở các nhóm ngành mũi nhọn: kỹ thuật mỏ, địa chất, dầu khí, trắc địa – bản đồ, cùng năng lực chuyển giao công nghệ cho doanh nghiệp.",{"type":"list","items":["650+ công bố khoa học trong 5 năm gần đây","Hàng chục đề tài cấp Nhà nước, cấp Bộ được nghiệm thu","Mạng lưới hơn 200 doanh nghiệp đối tác"]},"Nhà trường xác định tiếp tục đầu tư cho phòng thí nghiệm trọng điểm, chương trình đào tạo quốc tế và các nhóm nghiên cứu mạnh."]', '["Kết quả xếp hạng dựa trên các tiêu chí về chất lượng đào tạo, năng lực nghiên cứu, công bố quốc tế, tỷ lệ việc làm của sinh viên sau tốt nghiệp và mức độ hội nhập quốc tế.",{"type":"h2","text":"Thế mạnh về nghiên cứu ứng dụng"},"HUMG được đánh giá cao ở các nhóm ngành mũi nhọn: kỹ thuật mỏ, địa chất, dầu khí, trắc địa – bản đồ, cùng năng lực chuyển giao công nghệ cho doanh nghiệp.",{"type":"list","items":["650+ công bố khoa học trong 5 năm gần đây","Hàng chục đề tài cấp Nhà nước, cấp Bộ được nghiệm thu","Mạng lưới hơn 200 doanh nghiệp đối tác"]},"Nhà trường xác định tiếp tục đầu tư cho phòng thí nghiệm trọng điểm, chương trình đào tạo quốc tế và các nhóm nghiên cứu mạnh."]', NULL, NULL, NULL, 'done'),
	(15, 'vi', 'humg', 'nghien-cuu-vat-lieu-moi-khai-thac-ben-vung', 'Nghiên cứu vật liệu mới trong khai thác bền vững', 'Nhóm nghiên cứu của HUMG phát triển vật liệu gia cố mới giúp nâng cao an toàn và giảm tác động môi trường trong khai thác hầm lò.', '["Đề tài tập trung vào việc phát triển loại vật liệu gia cố có độ bền cao, thân thiện môi trường, thay thế một phần vật liệu truyền thống trong chống giữ lò.",{"type":"h2","text":"Kết quả thử nghiệm"},"Thử nghiệm tại hiện trường cho thấy vật liệu mới giúp giảm 20% chi phí chống giữ và tăng đáng kể hệ số an toàn của công trình ngầm.",{"type":"quote","text":"“Chúng tôi hướng đến các giải pháp vừa hiệu quả kinh tế, vừa giảm phát thải và rác thải trong quá trình khai thác.”"},"Kết quả nghiên cứu đã được công bố trên tạp chí quốc tế uy tín và đang được chuyển giao thử nghiệm cho một số đơn vị khai thác."]', '["Đề tài tập trung vào việc phát triển loại vật liệu gia cố có độ bền cao, thân thiện môi trường, thay thế một phần vật liệu truyền thống trong chống giữ lò.",{"type":"h2","text":"Kết quả thử nghiệm"},"Thử nghiệm tại hiện trường cho thấy vật liệu mới giúp giảm 20% chi phí chống giữ và tăng đáng kể hệ số an toàn của công trình ngầm.",{"type":"quote","text":"“Chúng tôi hướng đến các giải pháp vừa hiệu quả kinh tế, vừa giảm phát thải và rác thải trong quá trình khai thác.”"},"Kết quả nghiên cứu đã được công bố trên tạp chí quốc tế uy tín và đang được chuyển giao thử nghiệm cho một số đơn vị khai thác."]', NULL, NULL, NULL, 'done'),
	(16, 'vi', 'humg', 'sinh-vien-humg-dat-giai-cao-iot-toan-quoc', 'Sinh viên HUMG đạt giải cao tại cuộc thi IoT toàn quốc', 'Đội tuyển sinh viên Khoa Công nghệ thông tin giành giải Nhì chung cuộc với sản phẩm giám sát môi trường mỏ theo thời gian thực.', '["Sản phẩm dự thi là hệ thống cảm biến – IoT giám sát các thông số khí, bụi, nhiệt độ trong khu vực khai thác và cảnh báo sớm nguy cơ mất an toàn.",{"type":"img","label":"Đội tuyển HUMG tại vòng chung kết","caption":"Đội tuyển sinh viên HUMG tại vòng chung kết cuộc thi."},"Ban giám khảo đánh giá cao tính ứng dụng thực tiễn và khả năng triển khai của giải pháp trong điều kiện mỏ hầm lò Việt Nam.",{"type":"list","items":["Giải Nhì chung cuộc toàn quốc","Giải “Sản phẩm có tính ứng dụng cao”","Được doanh nghiệp đề nghị hợp tác thử nghiệm"]}]', '["Sản phẩm dự thi là hệ thống cảm biến – IoT giám sát các thông số khí, bụi, nhiệt độ trong khu vực khai thác và cảnh báo sớm nguy cơ mất an toàn.",{"type":"img","label":"Đội tuyển HUMG tại vòng chung kết","caption":"Đội tuyển sinh viên HUMG tại vòng chung kết cuộc thi."},"Ban giám khảo đánh giá cao tính ứng dụng thực tiễn và khả năng triển khai của giải pháp trong điều kiện mỏ hầm lò Việt Nam.",{"type":"list","items":["Giải Nhì chung cuộc toàn quốc","Giải “Sản phẩm có tính ứng dụng cao”","Được doanh nghiệp đề nghị hợp tác thử nghiệm"]}]', NULL, NULL, NULL, 'done'),
	(17, 'vi', 'humg', 'hoi-thao-quoc-te-trac-dia-gis-2025', 'Hội thảo quốc tế về Trắc địa và GIS 2025', 'HUMG chủ trì tổ chức thành công Hội thảo quốc tế về Trắc địa và GIS 2025 với hơn 200 đại biểu trong nước và quốc tế.', '["Trong hai ngày 13–14/05/2025, Trường Đại học Mỏ – Địa chất đã tổ chức Hội thảo quốc tế về Trắc địa và GIS với chủ đề “Ứng dụng trí tuệ nhân tạo kết hợp dữ liệu viễn thám và GIS phục vụ quy hoạch đô thị”.",{"type":"h2","text":"Diễn đàn học thuật uy tín"},"Hội thảo quy tụ các nhà khoa học, chuyên gia và doanh nghiệp công nghệ đến từ nhiều quốc gia, cùng trao đổi về xu hướng mới trong lĩnh vực trắc địa, bản đồ và GIS.",{"type":"quote","text":"“Đây là cơ hội quan trọng để kết nối nghiên cứu và ứng dụng, thúc đẩy chuyển giao công nghệ trong thời đại số.”"},"Hội thảo mở ra nhiều cơ hội hợp tác nghiên cứu và đào tạo giữa HUMG với các đối tác quốc tế."]', '["Trong hai ngày 13–14/05/2025, Trường Đại học Mỏ – Địa chất đã tổ chức Hội thảo quốc tế về Trắc địa và GIS với chủ đề “Ứng dụng trí tuệ nhân tạo kết hợp dữ liệu viễn thám và GIS phục vụ quy hoạch đô thị”.",{"type":"h2","text":"Diễn đàn học thuật uy tín"},"Hội thảo quy tụ các nhà khoa học, chuyên gia và doanh nghiệp công nghệ đến từ nhiều quốc gia, cùng trao đổi về xu hướng mới trong lĩnh vực trắc địa, bản đồ và GIS.",{"type":"quote","text":"“Đây là cơ hội quan trọng để kết nối nghiên cứu và ứng dụng, thúc đẩy chuyển giao công nghệ trong thời đại số.”"},"Hội thảo mở ra nhiều cơ hội hợp tác nghiên cứu và đào tạo giữa HUMG với các đối tác quốc tế."]', NULL, NULL, NULL, 'done'),
	(18, 'vi', 'humg', 'humg-ky-ket-hop-tac-dai-hoc-aachen', 'HUMG ký kết hợp tác với Đại học RWTH Aachen (CHLB Đức)', 'Hai trường ký biên bản ghi nhớ hợp tác trong đào tạo, trao đổi giảng viên – sinh viên và nghiên cứu chung về khai thác bền vững.', '["Lễ ký kết diễn ra tại HUMG với sự chứng kiến của lãnh đạo hai trường và đại diện doanh nghiệp trong lĩnh vực khai khoáng.",{"type":"list","items":["Trao đổi sinh viên, giảng viên hằng năm","Đồng hướng dẫn nghiên cứu sinh","Nghiên cứu chung về khai thác bền vững và kinh tế tuần hoàn"]},"Hợp tác mở ra cơ hội học tập và nghiên cứu ở môi trường quốc tế cho sinh viên, học viên của Nhà trường."]', '["Lễ ký kết diễn ra tại HUMG với sự chứng kiến của lãnh đạo hai trường và đại diện doanh nghiệp trong lĩnh vực khai khoáng.",{"type":"list","items":["Trao đổi sinh viên, giảng viên hằng năm","Đồng hướng dẫn nghiên cứu sinh","Nghiên cứu chung về khai thác bền vững và kinh tế tuần hoàn"]},"Hợp tác mở ra cơ hội học tập và nghiên cứu ở môi trường quốc tế cho sinh viên, học viên của Nhà trường."]', NULL, NULL, NULL, 'done'),
	(19, 'vi', 'humg', 'thong-bao-tuyen-sinh-dai-hoc-2026', 'Thông báo tuyển sinh đại học chính quy năm 2026', 'Trường Đại học Mỏ – Địa chất thông báo tuyển sinh đại học chính quy năm 2026 với 52 chương trình đào tạo và 5 phương thức xét tuyển.', '["Năm 2026, HUMG tuyển sinh 52 chương trình đào tạo trình độ đại học, trong đó có các chương trình chất lượng cao và chương trình liên kết quốc tế.",{"type":"h2","text":"Phương thức xét tuyển"},{"type":"list","items":["Xét tuyển thẳng và ưu tiên xét tuyển","Xét kết quả thi tốt nghiệp THPT","Xét học bạ THPT","Xét tuyển kết hợp","Xét kết quả kỳ thi ĐGNL của ĐHQG Hà Nội"]},"Thí sinh theo dõi mốc thời gian và hướng dẫn đăng ký trực tuyến tại chuyên trang Tuyển sinh của Nhà trường."]', '["Năm 2026, HUMG tuyển sinh 52 chương trình đào tạo trình độ đại học, trong đó có các chương trình chất lượng cao và chương trình liên kết quốc tế.",{"type":"h2","text":"Phương thức xét tuyển"},{"type":"list","items":["Xét tuyển thẳng và ưu tiên xét tuyển","Xét kết quả thi tốt nghiệp THPT","Xét học bạ THPT","Xét tuyển kết hợp","Xét kết quả kỳ thi ĐGNL của ĐHQG Hà Nội"]},"Thí sinh theo dõi mốc thời gian và hướng dẫn đăng ký trực tuyến tại chuyên trang Tuyển sinh của Nhà trường."]', NULL, NULL, NULL, 'done'),
	(20, 'vi', 'humg', 'chuong-trinh-hoc-bong-phat-trien-nguon-nhan-luc', 'Chương trình học bổng phát triển nguồn nhân lực năm học 2025 – 2026', 'Nhà trường phối hợp cùng doanh nghiệp triển khai chương trình học bổng dành cho sinh viên các ngành kỹ thuật mũi nhọn.', '["Chương trình dành cho sinh viên có kết quả học tập tốt, tích cực tham gia nghiên cứu và hoạt động cộng đồng, ưu tiên các ngành kỹ thuật mỏ, dầu khí, địa chất và trắc địa.",{"type":"list","items":["Giá trị học bổng: từ 50% đến 100% học phí năm học","Cơ hội thực tập và tuyển dụng tại doanh nghiệp tài trợ","Cố vấn nghề nghiệp từ chuyên gia doanh nghiệp"]},"Hồ sơ đăng ký nộp tại Phòng Công tác chính trị & Sinh viên trước ngày hết hạn thông báo."]', '["Chương trình dành cho sinh viên có kết quả học tập tốt, tích cực tham gia nghiên cứu và hoạt động cộng đồng, ưu tiên các ngành kỹ thuật mỏ, dầu khí, địa chất và trắc địa.",{"type":"list","items":["Giá trị học bổng: từ 50% đến 100% học phí năm học","Cơ hội thực tập và tuyển dụng tại doanh nghiệp tài trợ","Cố vấn nghề nghiệp từ chuyên gia doanh nghiệp"]},"Hồ sơ đăng ký nộp tại Phòng Công tác chính trị & Sinh viên trước ngày hết hạn thông báo."]', NULL, NULL, NULL, 'done'),
	(21, 'vi', 'humg', 'nghiem-thu-de-tai-cap-bo-khai-thac-than-ham-lo', 'Nghiệm thu đề tài cấp Bộ về công nghệ khai thác than hầm lò', 'Đề tài nghiên cứu công nghệ khai thác than hầm lò thân thiện môi trường được Hội đồng đánh giá xuất sắc.', '["Đề tài do nhóm nghiên cứu Khoa Mỏ chủ trì, tập trung vào giải pháp giảm tổn thất tài nguyên và giảm phát thải trong khai thác than hầm lò.",{"type":"quote","text":"“Kết quả đề tài có thể áp dụng ngay tại nhiều mỏ than vùng Quảng Ninh.”"},"Hội đồng nghiệm thu đánh giá đề tài đạt loại xuất sắc và đề nghị tiếp tục hỗ trợ chuyển giao vào thực tiễn sản xuất."]', '["Đề tài do nhóm nghiên cứu Khoa Mỏ chủ trì, tập trung vào giải pháp giảm tổn thất tài nguyên và giảm phát thải trong khai thác than hầm lò.",{"type":"quote","text":"“Kết quả đề tài có thể áp dụng ngay tại nhiều mỏ than vùng Quảng Ninh.”"},"Hội đồng nghiệm thu đánh giá đề tài đạt loại xuất sắc và đề nghị tiếp tục hỗ trợ chuyển giao vào thực tiễn sản xuất."]', NULL, NULL, NULL, 'done'),
	(22, 'vi', 'humg', 'ngay-hoi-viec-lam-ket-noi-doanh-nghiep-2025', 'Ngày hội việc làm & Kết nối doanh nghiệp 2025', 'Hơn 50 doanh nghiệp tham gia tuyển dụng và giao lưu cùng sinh viên HUMG tại Ngày hội việc làm năm 2025.', '["Ngày hội mang đến hàng nghìn vị trí việc làm và thực tập cho sinh viên năm cuối, cùng nhiều hoạt động tư vấn nghề nghiệp, kỹ năng phỏng vấn và viết CV.",{"type":"list","items":["Hơn 50 doanh nghiệp trong và ngoài ngành","Hàng nghìn vị trí việc làm – thực tập","Phỏng vấn trực tiếp tại gian hàng"]},"Nhiều sinh viên đã nhận được lời mời phỏng vấn và thư mời thực tập ngay tại sự kiện."]', '["Ngày hội mang đến hàng nghìn vị trí việc làm và thực tập cho sinh viên năm cuối, cùng nhiều hoạt động tư vấn nghề nghiệp, kỹ năng phỏng vấn và viết CV.",{"type":"list","items":["Hơn 50 doanh nghiệp trong và ngoài ngành","Hàng nghìn vị trí việc làm – thực tập","Phỏng vấn trực tiếp tại gian hàng"]},"Nhiều sinh viên đã nhận được lời mời phỏng vấn và thư mời thực tập ngay tại sự kiện."]', NULL, NULL, NULL, 'done'),
	(23, 'vi', 'cntt', 'khoa-cntt-khai-giang-chuyen-de-ai', 'Khoa CNTT khai giảng lớp chuyên đề Trí tuệ nhân tạo ứng dụng', 'Lớp chuyên đề dành cho sinh viên năm 3, năm 4 các ngành CNTT, KHMT.', '["Khoa Công nghệ thông tin tổ chức lớp chuyên đề Trí tuệ nhân tạo ứng dụng trong khai thác mỏ và địa chất."]', '["Khoa Công nghệ thông tin tổ chức lớp chuyên đề Trí tuệ nhân tạo ứng dụng trong khai thác mỏ và địa chất."]', NULL, NULL, NULL, 'done'),
	(24, 'vi', 'cntt', 'seminar-bm-khmt-thang-6', 'Seminar Bộ môn Khoa học máy tính tháng 6', 'Chủ đề: Xử lý ảnh viễn thám bằng học sâu.', '["Seminar định kỳ của Bộ môn KHMT."]', '["Seminar định kỳ của Bộ môn KHMT."]', NULL, NULL, NULL, 'done'),
	(25, 'vi', 'cntt', 'ke-hoach-thuc-tap-he-2025', 'Kế hoạch thực tập doanh nghiệp hè 2025 (bản nháp)', 'Dự thảo kế hoạch thực tập.', '[]', '[]', NULL, NULL, NULL, 'done');


--
-- Data for Name: outbox; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--



--
-- Data for Name: pages; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.pages (id, tenant_id, parent_id, template, status, sort_order, created_at, updated_at, deleted_at, deleted_by, extra, path) OVERRIDING SYSTEM VALUE VALUES
	(1, 'humg', NULL, 'system', 'published', 0, '2026-10-07 11:58:15.998+00', '2026-10-07 11:58:15.998+00', NULL, NULL, '{}', '/'),
	(2, 'humg', NULL, 'system', 'published', 1, '2026-10-07 11:58:16.001+00', '2026-10-07 11:58:16.001+00', NULL, NULL, '{}', '/gioi-thieu'),
	(3, 'humg', NULL, 'system', 'published', 2, '2026-10-07 11:58:16.003+00', '2026-10-07 11:58:16.003+00', NULL, NULL, '{}', '/media'),
	(4, 'humg', NULL, 'system', 'published', 3, '2026-10-07 11:58:16.004+00', '2026-10-07 11:58:16.004+00', NULL, NULL, '{}', '/don-vi'),
	(5, 'humg', 4, 'system', 'published', 4, '2026-10-07 11:58:16.005+00', '2026-10-07 11:58:16.005+00', NULL, NULL, '{}', '/ban-giam-hieu'),
	(6, 'humg', 4, 'system', 'published', 5, '2026-10-07 11:58:16.006+00', '2026-10-07 11:58:16.006+00', NULL, NULL, '{}', '/phong-ban'),
	(7, 'humg', 4, 'system', 'published', 6, '2026-10-07 11:58:16.007+00', '2026-10-07 11:58:16.007+00', NULL, NULL, '{}', '/khoa'),
	(8, 'humg', NULL, 'system', 'published', 7, '2026-10-07 11:58:16.008+00', '2026-10-07 11:58:16.008+00', NULL, NULL, '{}', '/dao-tao'),
	(9, 'humg', NULL, 'system', 'published', 8, '2026-10-07 11:58:16.01+00', '2026-10-07 11:58:16.01+00', NULL, NULL, '{}', '/nghien-cuu'),
	(10, 'humg', NULL, 'system', 'published', 9, '2026-10-07 11:58:16.011+00', '2026-10-07 11:58:16.011+00', NULL, NULL, '{}', '/sinh-vien'),
	(11, 'humg', NULL, 'system', 'published', 10, '2026-10-07 11:58:16.013+00', '2026-10-07 11:58:16.013+00', NULL, NULL, '{}', '/tin-tuc'),
	(12, 'humg', NULL, 'system', 'published', 11, '2026-10-07 11:58:16.014+00', '2026-10-07 11:58:16.014+00', NULL, NULL, '{}', '/thu-vien-so'),
	(13, 'humg', NULL, 'system', 'published', 12, '2026-10-07 11:58:16.016+00', '2026-10-07 11:58:16.016+00', NULL, NULL, '{}', '/lien-he'),
	(14, 'humg', NULL, 'default', 'published', 13, '2026-10-07 11:58:16.017+00', '2025-05-10 02:00:00+00', NULL, NULL, '{}', NULL),
	(15, 'humg', NULL, 'default', 'published', 14, '2026-10-07 11:58:16.018+00', '2025-05-10 02:00:00+00', NULL, NULL, '{}', NULL),
	(16, 'cntt', NULL, 'default', 'published', 0, '2025-05-20 01:00:00+00', '2025-05-20 01:00:00+00', NULL, NULL, '{}', NULL),
	(17, 'cntt', 16, 'default', 'published', 1, '2025-05-20 01:00:00+00', '2025-05-20 01:00:00+00', NULL, NULL, '{}', NULL),
	(18, 'cntt', NULL, 'default', 'published', 2, '2025-05-20 01:00:00+00', '2025-05-20 01:00:00+00', NULL, NULL, '{}', NULL),
	(19, 'cntt', NULL, 'default', 'published', 10, '2025-05-20 01:00:00+00', '2025-05-20 01:00:00+00', NULL, NULL, '{}', NULL),
	(20, 'cntt', NULL, 'default', 'published', 11, '2025-05-20 01:00:00+00', '2025-05-20 01:00:00+00', NULL, NULL, '{}', NULL);


--
-- Data for Name: page_translations; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.page_translations (page_id, lang, tenant_id, slug, title, body_html, seo_title, seo_description, translation_status) OVERRIDING SYSTEM VALUE VALUES
	(1, 'vi', 'humg', '', 'Trang chủ', '', NULL, NULL, 'done'),
	(1, 'en', 'humg', '', 'Home', NULL, NULL, NULL, 'done'),
	(2, 'vi', 'humg', 'gioi-thieu', 'Giới thiệu', '', NULL, NULL, 'done'),
	(2, 'en', 'humg', 'gioi-thieu', 'About', NULL, NULL, NULL, 'done'),
	(3, 'vi', 'humg', 'media', 'Media thư viện', '', NULL, NULL, 'done'),
	(3, 'en', 'humg', 'media', 'Media library', NULL, NULL, NULL, 'done'),
	(4, 'vi', 'humg', 'don-vi', 'Đơn vị', '', NULL, NULL, 'done'),
	(4, 'en', 'humg', 'don-vi', 'Units', NULL, NULL, NULL, 'done'),
	(5, 'vi', 'humg', 'ban-giam-hieu', 'Ban giám hiệu', '', NULL, NULL, 'done'),
	(5, 'en', 'humg', 'ban-giam-hieu', 'Board of Rectors', NULL, NULL, NULL, 'done'),
	(6, 'vi', 'humg', 'phong-ban', 'Phòng ban chức năng', '', NULL, NULL, 'done'),
	(6, 'en', 'humg', 'phong-ban', 'Offices', NULL, NULL, NULL, 'done'),
	(7, 'vi', 'humg', 'khoa', 'Khoa chuyên môn', '', NULL, NULL, 'done'),
	(7, 'en', 'humg', 'khoa', 'Faculties', NULL, NULL, NULL, 'done'),
	(8, 'vi', 'humg', 'dao-tao', 'Đào tạo', '', NULL, NULL, 'done'),
	(8, 'en', 'humg', 'dao-tao', 'Education', NULL, NULL, NULL, 'done'),
	(9, 'vi', 'humg', 'nghien-cuu', 'Nghiên cứu', '', NULL, NULL, 'done'),
	(9, 'en', 'humg', 'nghien-cuu', 'Research', NULL, NULL, NULL, 'done'),
	(10, 'vi', 'humg', 'sinh-vien', 'Sinh viên', '', NULL, NULL, 'done'),
	(10, 'en', 'humg', 'sinh-vien', 'Students', NULL, NULL, NULL, 'done'),
	(11, 'vi', 'humg', 'tin-tuc', 'Tin tức – Sự kiện', '', NULL, NULL, 'done'),
	(11, 'en', 'humg', 'tin-tuc', 'News & Events', NULL, NULL, NULL, 'done'),
	(12, 'vi', 'humg', 'thu-vien-so', 'Thư viện số', '', NULL, NULL, 'done'),
	(12, 'en', 'humg', 'thu-vien-so', 'Digital library', NULL, NULL, NULL, 'done'),
	(13, 'vi', 'humg', 'lien-he', 'Liên hệ', '', NULL, NULL, 'done'),
	(13, 'en', 'humg', 'lien-he', 'Contact', NULL, NULL, NULL, 'done'),
	(14, 'vi', 'humg', 'chinh-sach-bao-mat', 'Chính sách bảo mật', '<p>Trường Đại học Mỏ – Địa chất cam kết bảo vệ thông tin cá nhân của người dùng Cổng thông tin điện tử.</p><h2>1. Thông tin thu thập</h2><p>Họ tên, email, số điện thoại khi người dùng gửi liên hệ hoặc đăng ký sự kiện; thông tin đăng nhập do hệ thống SSO của Trường quản lý.</p><h2>2. Mục đích sử dụng</h2><ul><li>Phản hồi yêu cầu, gửi thông báo liên quan.</li><li>Thống kê truy cập để cải thiện dịch vụ.</li></ul><h2>3. Liên hệ</h2><p>Mọi thắc mắc về dữ liệu cá nhân xin gửi về Phòng Truyền thông.</p>', NULL, NULL, 'done'),
	(14, 'en', 'humg', 'chinh-sach-bao-mat', 'Privacy policy', '<p>Hanoi University of Mining and Geology is committed to protecting the personal data of portal users.</p><h2>1. Data we collect</h2><p>Name, email and phone number when you contact us or register for events; sign-in data is managed by the University SSO.</p><h2>2. How we use it</h2><ul><li>To answer requests and send related notices.</li><li>Usage statistics to improve our services.</li></ul><h2>3. Contact</h2><p>Questions about personal data can be sent to the Communications Office.</p>', NULL, NULL, 'done'),
	(15, 'vi', 'humg', 'dieu-khoan-su-dung', 'Điều khoản sử dụng', '<p>Khi truy cập Cổng thông tin, người dùng đồng ý với các điều khoản dưới đây.</p><h2>Bản quyền nội dung</h2><p>Nội dung, hình ảnh thuộc quyền của Trường Đại học Mỏ – Địa chất. Trích dẫn cần ghi rõ nguồn.</p><h2>Trách nhiệm người dùng</h2><p>Không sử dụng Cổng thông tin cho mục đích trái pháp luật hoặc gây ảnh hưởng tới hệ thống.</p>', NULL, NULL, 'done'),
	(15, 'en', 'humg', 'dieu-khoan-su-dung', 'Terms of use', '<p>By using the portal you agree to the following terms.</p><h2>Copyright</h2><p>Content and images belong to Hanoi University of Mining and Geology. Please cite the source when quoting.</p><h2>User responsibilities</h2><p>Do not use the portal for unlawful purposes or in ways that harm the system.</p>', NULL, NULL, 'done'),
	(16, 'vi', 'cntt', 'gioi-thieu-khoa', 'Giới thiệu Khoa', '<p>Khoa Công nghệ thông tin được thành lập năm 2001, đào tạo kỹ sư và thạc sĩ Công nghệ thông tin, Khoa học máy tính, Hệ thống thông tin, gắn với ứng dụng trong ngành Mỏ – Địa chất – Năng lượng.</p><h2>Sứ mạng</h2><p>Đào tạo nguồn nhân lực CNTT chất lượng cao, nghiên cứu và chuyển giao công nghệ số cho các lĩnh vực Trái đất và Tài nguyên.</p><h2>Con số</h2><ul><li>4 bộ môn, hơn 60 cán bộ, giảng viên</li><li>Hơn 2.000 sinh viên đang học</li><li>3 phòng thí nghiệm chuyên sâu: AI, GIS, An toàn thông tin</li></ul>', NULL, NULL, 'done'),
	(16, 'en', 'cntt', 'gioi-thieu-khoa', 'About the Faculty', '<p>The Faculty of Information Technology was founded in 2001 and trains engineers and masters in IT, Computer Science and Information Systems, with applications in mining, geology and energy.</p>', NULL, NULL, 'done'),
	(17, 'vi', 'cntt', 'cac-bo-mon', 'Các bộ môn', '<ul><li><strong>Bộ môn Khoa học máy tính</strong> — trí tuệ nhân tạo, xử lý ảnh viễn thám.</li><li><strong>Bộ môn Công nghệ phần mềm</strong> — phát triển phần mềm, kiểm thử.</li><li><strong>Bộ môn Hệ thống thông tin</strong> — cơ sở dữ liệu, GIS.</li><li><strong>Bộ môn Mạng máy tính</strong> — mạng, an toàn thông tin.</li></ul>', NULL, NULL, 'done'),
	(17, 'en', 'cntt', 'cac-bo-mon', 'Departments', NULL, NULL, NULL, 'done'),
	(18, 'vi', 'cntt', 'lien-he-khoa', 'Liên hệ Khoa', '<p><strong>Văn phòng Khoa Công nghệ thông tin</strong></p><p>Tầng 3, nhà C12, Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Bắc Từ Liêm, Hà Nội</p><p>Điện thoại: 024.3838.9633 · Email: cntt@humg.edu.vn</p><p>Giờ làm việc: 7h30 – 17h00, thứ Hai đến thứ Sáu.</p>', NULL, NULL, 'done'),
	(18, 'en', 'cntt', 'lien-he-khoa', 'Contact the Faculty', NULL, NULL, NULL, 'done'),
	(19, 'vi', 'cntt', 'chinh-sach-bao-mat', 'Chính sách bảo mật', '<p>Trường Đại học Mỏ – Địa chất cam kết bảo vệ thông tin cá nhân của người dùng Cổng thông tin điện tử.</p><h2>1. Thông tin thu thập</h2><p>Họ tên, email, số điện thoại khi người dùng gửi liên hệ hoặc đăng ký sự kiện; thông tin đăng nhập do hệ thống SSO của Trường quản lý.</p><h2>2. Mục đích sử dụng</h2><ul><li>Phản hồi yêu cầu, gửi thông báo liên quan.</li><li>Thống kê truy cập để cải thiện dịch vụ.</li></ul><h2>3. Liên hệ</h2><p>Mọi thắc mắc về dữ liệu cá nhân xin gửi về Phòng Truyền thông.</p>', NULL, NULL, 'done'),
	(19, 'en', 'cntt', 'chinh-sach-bao-mat', 'Privacy policy', '<p>Hanoi University of Mining and Geology is committed to protecting the personal data of portal users.</p><h2>1. Data we collect</h2><p>Name, email and phone number when you contact us or register for events; sign-in data is managed by the University SSO.</p><h2>2. How we use it</h2><ul><li>To answer requests and send related notices.</li><li>Usage statistics to improve our services.</li></ul><h2>3. Contact</h2><p>Questions about personal data can be sent to the Communications Office.</p>', NULL, NULL, 'done'),
	(20, 'vi', 'cntt', 'dieu-khoan-su-dung', 'Điều khoản sử dụng', '<p>Khi truy cập Cổng thông tin, người dùng đồng ý với các điều khoản dưới đây.</p><h2>Bản quyền nội dung</h2><p>Nội dung, hình ảnh thuộc quyền của Trường Đại học Mỏ – Địa chất. Trích dẫn cần ghi rõ nguồn.</p><h2>Trách nhiệm người dùng</h2><p>Không sử dụng Cổng thông tin cho mục đích trái pháp luật hoặc gây ảnh hưởng tới hệ thống.</p>', NULL, NULL, 'done'),
	(20, 'en', 'cntt', 'dieu-khoan-su-dung', 'Terms of use', '<p>By using the portal you agree to the following terms.</p><h2>Copyright</h2><p>Content and images belong to Hanoi University of Mining and Geology. Please cite the source when quoting.</p><h2>User responsibilities</h2><p>Do not use the portal for unlawful purposes or in ways that harm the system.</p>', NULL, NULL, 'done');


--
-- Data for Name: settings; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.settings (tenant_id, group_key, value, updated_at, updated_by) OVERRIDING SYSTEM VALUE VALUES
	('humg', 'general', '{"email": "cskh@humg.edu.vn", "phone": "024.3838.0355", "address": "18 Phố Viên, Đức Thắng, Bắc Từ Liêm, Hà Nội", "siteName": "Trường Đại học Mỏ – Địa chất"}', '2026-10-07 11:58:15.501487+00', NULL),
	('humg', 'seo', '{"youtube": "https://youtube.com/@humg", "facebook": "https://facebook.com/humg.edu.vn", "metaDesc": "Cổng thông tin điện tử Trường Đại học Mỏ – Địa chất – đào tạo, nghiên cứu khoa học lĩnh vực Trái đất, Mỏ, Năng lượng.", "analytics": "G-XXXXXXXXXX", "metaTitle": "Trường Đại học Mỏ – Địa chất | HUMG"}', '2026-10-07 11:58:15.501487+00', NULL),
	('humg', 'email', '{"fromName": "HUMG Digital Portal", "smtpHost": "smtp.humg.edu.vn", "smtpPort": "587", "fromEmail": "no-reply@humg.edu.vn"}', '2026-10-07 11:58:15.501487+00', NULL),
	('humg', 'language', '{"urlNote": "Lựa chọn ngôn ngữ được ghi nhớ theo trình duyệt của người dùng (localStorage), áp dụng đồng thời cho cả website công khai và My eUni Portal.", "fallback": "Hiển thị bản Tiếng Việt (khuyến nghị)", "defaultCode": "vi", "enabledCodes": ["vi", "en"], "fallbackOptions": ["Hiển thị bản Tiếng Việt (khuyến nghị)", "Ẩn nội dung cho đến khi có bản dịch", "Hiển thị nội dung Tiếng Việt kèm nhãn \"Chưa có bản dịch\""]}', '2026-10-07 11:58:15.501487+00', NULL),
	('humg', 'backup', '{"storagePath": "/backup/cms_humg", "cronSchedule": "0 3 * * *", "retentionCount": 7}', '2026-10-07 11:58:15.501487+00', NULL),
	('humg', 'home', '{"heroChips": ["Trường đại học công lập", "60 năm truyền thống", "Đa ngành – Đa lĩnh vực"]}', '2026-10-07 11:58:15.501487+00', NULL),
	('cntt', 'general', '{"email": "cntt@humg.edu.vn", "phone": "024.3838.9633", "address": "Tầng 3, nhà C12, Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Bắc Từ Liêm, Hà Nội", "tagline": "Trường Đại học Mỏ - Địa chất", "siteName": "Khoa Công nghệ thông tin – HUMG", "brandName": "KHOA CÔNG NGHỆ THÔNG TIN", "taglineEn": "Hanoi University of Mining and Geology", "brandNameEn": "FACULTY OF INFORMATION TECHNOLOGY"}', '2026-10-07 11:58:15.501487+00', NULL),
	('cntt', 'seo', '{"youtube": "", "facebook": "https://facebook.com/cntt.humg", "metaDesc": "Cổng thông tin điện tử Trường Đại học Mỏ – Địa chất – đào tạo, nghiên cứu khoa học lĩnh vực Trái đất, Mỏ, Năng lượng.", "analytics": "G-XXXXXXXXXX", "metaTitle": "Khoa Công nghệ thông tin | HUMG"}', '2026-10-07 11:58:15.501487+00', NULL),
	('cntt', 'email', '{"fromName": "HUMG Digital Portal", "smtpHost": "smtp.humg.edu.vn", "smtpPort": "587", "fromEmail": "no-reply@humg.edu.vn"}', '2026-10-07 11:58:15.501487+00', NULL),
	('cntt', 'language', '{"urlNote": "Lựa chọn ngôn ngữ được ghi nhớ theo trình duyệt của người dùng (localStorage), áp dụng đồng thời cho cả website công khai và My eUni Portal.", "fallback": "Hiển thị bản Tiếng Việt (khuyến nghị)", "defaultCode": "vi", "enabledCodes": ["vi", "en"], "fallbackOptions": ["Hiển thị bản Tiếng Việt (khuyến nghị)", "Ẩn nội dung cho đến khi có bản dịch", "Hiển thị nội dung Tiếng Việt kèm nhãn \"Chưa có bản dịch\""]}', '2026-10-07 11:58:15.501487+00', NULL),
	('cntt', 'backup', '{"storagePath": "/backup/cms_humg", "cronSchedule": "0 3 * * *", "retentionCount": 7}', '2026-10-07 11:58:15.501487+00', NULL),
	('cntt', 'home', '{"heroChips": ["Trường đại học công lập", "60 năm truyền thống", "Đa ngành – Đa lĩnh vực"]}', '2026-10-07 11:58:15.501487+00', NULL);


--
-- Data for Name: tenant_domains; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.tenant_domains (host, tenant_id, is_primary) OVERRIDING SYSTEM VALUE VALUES
	('localhost:3002', 'humg', true),
	('127.0.0.1:3002', 'humg', false),
	('cntt.localhost:3002', 'cntt', true);


--
-- Data for Name: user_directory; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--

INSERT INTO cms.user_directory (sub, display_name, email, staff_code, student_code, roles, units, last_seen_at, synced_at, extra, legacy_id, username, tenants, status, created_at) OVERRIDING SYSTEM VALUE VALUES
	('u-tvanminh', 'Trần Văn Minh', 'tvanminh@humg.edu.vn', 'CB0001', NULL, '{cms.admin,staff}', '{P-TT}', '2025-05-16 02:15:00+00', '2026-10-07 11:58:15.501487+00', '{}', 1, 'tvanminh', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-nthoa', 'Nguyễn Thị Hoa', 'nthoa@humg.edu.vn', 'CB0002', NULL, '{cms.editor,staff}', '{P-TT}', '2025-05-16 01:30:00+00', '2026-10-07 11:58:15.501487+00', '{}', 2, 'nthoa', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-pvloc', 'Phạm Văn Lộc', 'pvloc@humg.edu.vn', 'CB0003', NULL, '{cms.editor,lecturer}', '{CNTT}', '2025-05-15 09:45:00+00', '2026-10-07 11:58:15.501487+00', '{}', 3, 'pvloc', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-ltmai', 'Lê Thị Mai', 'ltmai@humg.edu.vn', 'CB0004', NULL, '{cms.author,staff}', '{P-TT}', '2025-05-15 07:20:00+00', '2026-10-07 11:58:15.501487+00', '{}', 4, 'ltmai', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-hdnam', 'Hoàng Đức Nam', 'hdnam@humg.edu.vn', 'CB0005', NULL, '{cms.author,staff}', '{P-DT}', '2025-05-10 04:00:00+00', '2026-10-07 11:58:15.501487+00', '{}', 5, 'hdnam', '{humg}', 0, '2025-01-10 01:00:00+00'),
	('u-dvtung', 'Đỗ Văn Tùng', 'dvtung@humg.edu.vn', 'CB0006', NULL, '{cms.author,lecturer}', '{BM-KHMT}', '2025-05-14 03:05:00+00', '2026-10-07 11:58:15.501487+00', '{}', 6, 'dvtung', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-vthuong', 'Vũ Thị Hương', 'vthuong@humg.edu.vn', 'CB0007', NULL, '{cms.reviewer,staff}', '{P-DT}', '2025-05-13 03:55:00+00', '2026-10-07 11:58:15.501487+00', '{}', 7, 'vthuong', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-bmduc', 'Bùi Minh Đức', 'bmduc@humg.edu.vn', 'CB0008', NULL, '{cms.viewer,staff}', '{P-DT}', '2025-05-08 08:30:00+00', '2026-10-07 11:58:15.501487+00', '{}', 8, 'bmduc', '{humg}', 0, '2025-01-10 01:00:00+00'),
	('SV001', 'Nguyễn Văn Sinh', '2151000123@student.humg.edu.vn', NULL, '2151000123', '{student}', '{DCCTKT66A}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 9, '2151000123', '{humg,cntt}', 1, '2025-01-10 01:00:00+00'),
	('GV001', 'Giảng viên HUMG', 'giangvien@humg.edu.vn', 'GV0001', NULL, '{lecturer}', '{BM-KHMT}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 10, 'giangvien', '{humg,cntt}', 1, '2025-01-10 01:00:00+00'),
	('PH001', 'Phụ huynh', 'phuhuynh@gmail.com', NULL, NULL, '{parent}', '{DCCTKT66A}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 11, 'phuhuynh', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('LD001', 'Lãnh đạo HUMG', 'lanhdao@humg.edu.vn', 'CB0100', NULL, '{manager,lecturer,euni.dashboard-viewer,euni.report-viewer}', '{HUMG}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 12, 'lanhdao', '{humg,cntt}', 1, '2025-01-10 01:00:00+00'),
	('CB001', 'Chuyên viên Phòng Đào tạo', 'canbo@humg.edu.vn', 'CB0001', NULL, '{staff,edusoft.training-officer}', '{P-DT}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 13, 'canbo', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('SV002', 'Trần Thị Lan', '2151000124@student.humg.edu.vn', NULL, '2151000124', '{student}', '{DCCTKT66A}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 14, '2151000124', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('SV003', 'Lê Minh Quân', '2151000125@student.humg.edu.vn', NULL, '2151000125', '{student}', '{DCCTKT66A}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 15, '2151000125', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('SV004', 'Phạm Thu Hà', '2151000201@student.humg.edu.vn', NULL, '2151000201', '{student}', '{DCCTKT66B}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 16, '2151000201', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('SV005', 'Hoàng Văn Đức', '2151000301@student.humg.edu.vn', NULL, '2151000301', '{student}', '{DCKTM66}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 17, '2151000301', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('GV002', 'TS. Nguyễn Thanh Bình', 'ntbinh@humg.edu.vn', 'GV0123', NULL, '{lecturer,edusoft.academic-advisor}', '{BM-CNPM}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 18, 'ntbinh', '{humg,cntt}', 1, '2025-01-10 01:00:00+00'),
	('GV003', 'PGS.TS. Lê Văn Khoa', 'lvkhoa@humg.edu.vn', 'GV0456', NULL, '{lecturer,qlkhcn.researcher}', '{BM-KTM}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 19, 'lvkhoa', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-hunglq', 'Lê Quốc Hùng', 'hunglq@humg.edu.vn', NULL, NULL, '{cms.author,staff}', '{P-TT}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 20, 'hunglq', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-lanpt', 'Phạm Thị Lan', 'lanpt@humg.edu.vn', NULL, NULL, '{cms.author,staff}', '{P-TT}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 21, 'lanpt', '{humg}', 1, '2025-01-10 01:00:00+00'),
	('u-annv', 'Nguyễn Văn An', 'annv@humg.edu.vn', NULL, NULL, '{cms.author,staff}', '{P-TT}', NULL, '2026-10-07 11:58:15.501487+00', '{}', 22, 'annv', '{humg}', 1, '2025-01-10 01:00:00+00');


--
-- Data for Name: workflow_history; Type: TABLE DATA; Schema: cms; Owner: cms_admin
--



--
-- Name: access_grants_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.access_grants_id_seq', 10, true);


--
-- Name: announcement_attachments_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.announcement_attachments_id_seq', 1, true);


--
-- Name: announcement_receipts_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.announcement_receipts_id_seq', 1, false);


--
-- Name: announcement_targets_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.announcement_targets_id_seq', 12, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.announcements_id_seq', 9, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.audit_logs_id_seq', 8, true);


--
-- Name: backups_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.backups_id_seq', 4, true);


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.banners_id_seq', 7, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.categories_id_seq', 12, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.events_id_seq', 7, true);


--
-- Name: home_blocks_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.home_blocks_id_seq', 73, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.media_id_seq', 10, true);


--
-- Name: media_items_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.media_items_id_seq', 13, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.menu_items_id_seq', 95, true);


--
-- Name: news_attachments_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.news_attachments_id_seq', 8, true);


--
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.news_id_seq', 25, true);


--
-- Name: outbox_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.outbox_id_seq', 1, false);


--
-- Name: pages_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.pages_id_seq', 20, true);


--
-- Name: revisions_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.revisions_id_seq', 34, true);


--
-- Name: workflow_history_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: cms_admin
--

SELECT pg_catalog.setval('cms.workflow_history_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

COMMIT;
