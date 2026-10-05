-- HUMG Digital Portal — dữ liệu mẫu CMS (sinh từ seed.mjs bằng pg_dump).
-- Chạy sau schema.sql:  psql -h localhost -U postgres -d webgis_xlbb -f seed.sql
-- CẢNH BÁO: xóa toàn bộ dữ liệu hiện có trong schema cms. Mật khẩu dev mọi tài khoản: Humg@2025

SET client_encoding = 'UTF8';
BEGIN;
TRUNCATE cms.roles, cms.posts, cms.category_translations, cms.categories, cms.pages, cms.event_translations, cms.events, cms.settings, cms.banner_translations, cms.banners, cms.backups, cms.activity_logs, cms.menu_item_translations, cms.albums, cms.videos, cms.podcasts, cms.hero_slides, cms.quick_links, cms.audiences, cms.menu_items, cms.menu_groups, cms.page_translations, cms.post_attachments, cms.post_tags, cms.tags, cms.post_translations, cms.media, cms.users, cms.role_permissions, cms.permissions, cms.languages, cms.strengths, cms.partners, cms.site_stats, cms.album_translations, cms.album_photos, cms.video_translations, cms.podcast_translations, cms.hero_slide_translations, cms.quick_link_translations, cms.audience_translations, cms.strength_translations, cms.partner_translations, cms.site_stat_translations RESTART IDENTITY CASCADE;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.3
-- Dumped by pg_dump version 17.3

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Data for Name: roles; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.roles (id, code, name, description, is_system, created_at, updated_at) VALUES
	(1, 'super_admin', 'Super Admin', 'Toàn quyền trên toàn bộ hệ thống', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'editor', 'Editor', 'Quản lý, biên tập và xuất bản nội dung', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'author', 'Author', 'Tạo và chỉnh sửa bài viết của chính mình', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'viewer', 'Viewer', 'Chỉ xem nội dung, không chỉnh sửa', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: users; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.users (id, full_name, email, password_hash, external_id, role_id, status, last_login_at, created_at, updated_at) VALUES
	(1, 'Trần Văn Minh', 'tvanminh@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 1, 'active', '2025-05-16 09:15:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'Nguyễn Thị Hoa', 'nthoa@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 2, 'active', '2025-05-16 08:30:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'Phạm Văn Lộc', 'pvloc@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 2, 'active', '2025-05-15 16:45:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'Lê Thị Mai', 'ltmai@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 3, 'active', '2025-05-15 14:20:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(5, 'Hoàng Đức Nam', 'hdnam@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 3, 'inactive', '2025-05-10 11:00:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(6, 'Đỗ Văn Tùng', 'dvtung@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 3, 'active', '2025-05-14 10:05:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(7, 'Vũ Thị Hương', 'vthuong@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 4, 'active', '2025-05-13 10:55:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(8, 'Bùi Minh Đức', 'bmduc@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 4, 'inactive', '2025-05-08 15:30:00+07', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(9, 'Lê Quốc Hùng', 'hunglq@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 3, 'active', NULL, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(10, 'Phạm Thị Lan', 'lanpt@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 3, 'active', NULL, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(11, 'Nguyễn Văn An', 'annv@humg.edu.vn', 'scrypt$cfb014ee06572a00ae388ffc05a2f969$888f64b898a6a07c0aad125c41e8e9cf3889e6e94238093dc76e585606a9a9427e48c325c902cf270adf450b06b855e72a08146d3df7b843804b997250971603', NULL, 3, 'active', NULL, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.activity_logs (id, user_id, user_name, action, target_type, target_id, target_label, ip_address, created_at) VALUES
	(1, 1, 'Trần Văn Minh', 'post.update', NULL, NULL, 'Hội thảo quốc tế về Trắc địa và GIS 2025', '203.113.45.12', '2025-05-16 10:15:00+07'),
	(2, 2, 'Nguyễn Thị Hoa', 'login', NULL, NULL, 'Hệ thống', '203.113.45.20', '2025-05-16 09:50:00+07'),
	(3, 4, 'Lê Thị Mai', 'media.upload', NULL, NULL, 'banner-tuyensinh.jpg', '27.68.35.19', '2025-05-16 09:30:00+07'),
	(4, 3, 'Phạm Văn Lộc', 'post.publish', NULL, NULL, 'Thông báo tuyển dụng giảng viên năm 2025', '203.113.45.12', '2025-05-15 16:45:00+07'),
	(5, 5, 'Hoàng Đức Nam', 'post.delete', NULL, NULL, 'Bài viết nháp cũ (ID #204)', '27.68.35.19', '2025-05-15 09:10:00+07'),
	(6, 6, 'Đỗ Văn Tùng', 'login', NULL, NULL, 'Hệ thống', '203.113.45.11', '2025-05-14 15:20:00+07'),
	(7, 7, 'Vũ Thị Hương', 'login', NULL, NULL, 'Hệ thống', '203.113.45.14', '2025-05-13 10:55:00+07'),
	(8, 8, 'Bùi Minh Đức', 'login', NULL, NULL, 'Hệ thống', '27.68.35.19', '2025-05-08 15:30:00+07');


--
-- Data for Name: media; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.media (id, file_name, kind, ext, mime_type, size_bytes, storage_url, alt_text, folder, uploaded_by, created_at, updated_at) VALUES
	(1, 'hoi-thao-gis-2025.png', 'image', 'png', 'image/png', 524288, '/uploads/hoi-thao-gis-2025.png', NULL, NULL, 4, '2025-05-16 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'campus-humg.png', 'image', 'png', 'image/png', 660480, '/uploads/campus-humg.png', NULL, NULL, 4, '2025-05-15 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'khoa-mo-truong.jpg', 'image', 'jpg', 'image/jpeg', 90112, '/uploads/khoa-mo-truong.jpg', NULL, NULL, 4, '2025-05-15 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'logo-humg.png', 'image', 'png', 'image/png', 43008, '/uploads/logo-humg.png', NULL, NULL, 4, '2025-05-13 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(5, 'banner-tuyensinh.png', 'image', 'png', 'image/png', 430080, '/uploads/banner-tuyensinh.png', NULL, NULL, 4, '2025-05-12 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(6, 'co-so-vat-chat.jpg', 'image', 'jpg', 'image/jpeg', 1258291, '/uploads/co-so-vat-chat.jpg', NULL, NULL, 4, '2025-05-11 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(7, 'sinh-vien-hoc-tap.jpg', 'image', 'jpg', 'image/jpeg', 798720, '/uploads/sinh-vien-hoc-tap.jpg', NULL, NULL, 4, '2025-05-11 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(8, 'thuc-hanh-mine.jpg', 'image', 'jpg', 'image/jpeg', 690176, '/uploads/thuc-hanh-mine.jpg', NULL, NULL, 4, '2025-05-10 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(9, 'bao-cao-de-tai.pdf', 'document', 'pdf', 'application/pdf', 2516582, '/uploads/bao-cao-de-tai.pdf', NULL, NULL, 4, '2025-05-09 00:00:00+07', '2026-10-04 09:32:38.19799+07'),
	(10, 'quy-dinh-dao-tao.pdf', 'document', 'pdf', 'application/pdf', 1153434, '/uploads/quy-dinh-dao-tao.pdf', NULL, NULL, 4, '2025-05-07 00:00:00+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: albums; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.albums (id, slug, cover_id, published_at, is_visible, created_at, updated_at) VALUES
	(1, 'le-ky-niem-60-nam', NULL, '2026-05-15', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'phong-thi-nghiem-trong-diem', NULL, '2026-04-20', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'hoat-dong-sinh-vien-2025', NULL, '2026-04-10', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'khuon-vien-humg', NULL, '2026-04-01', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: album_photos; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.album_photos (id, album_id, media_id, caption, sort_order) VALUES
	(1, 1, NULL, 'Ảnh 1 · Lễ kỷ niệm 60 năm', 0),
	(2, 1, NULL, 'Ảnh 2 · Lễ kỷ niệm 60 năm', 1),
	(3, 1, NULL, 'Ảnh 3 · Lễ kỷ niệm 60 năm', 2),
	(4, 1, NULL, 'Ảnh 4 · Lễ kỷ niệm 60 năm', 3),
	(5, 1, NULL, 'Ảnh 5 · Lễ kỷ niệm 60 năm', 4),
	(6, 1, NULL, 'Ảnh 6 · Lễ kỷ niệm 60 năm', 5),
	(7, 1, NULL, 'Ảnh 7 · Lễ kỷ niệm 60 năm', 6),
	(8, 1, NULL, 'Ảnh 8 · Lễ kỷ niệm 60 năm', 7),
	(9, 1, NULL, 'Ảnh 9 · Lễ kỷ niệm 60 năm', 8),
	(10, 1, NULL, 'Ảnh 10 · Lễ kỷ niệm 60 năm', 9),
	(11, 1, NULL, 'Ảnh 11 · Lễ kỷ niệm 60 năm', 10),
	(12, 1, NULL, 'Ảnh 12 · Lễ kỷ niệm 60 năm', 11),
	(13, 2, NULL, 'Ảnh 1 · Phòng thí nghiệm', 0),
	(14, 2, NULL, 'Ảnh 2 · Phòng thí nghiệm', 1),
	(15, 2, NULL, 'Ảnh 3 · Phòng thí nghiệm', 2),
	(16, 2, NULL, 'Ảnh 4 · Phòng thí nghiệm', 3),
	(17, 2, NULL, 'Ảnh 5 · Phòng thí nghiệm', 4),
	(18, 2, NULL, 'Ảnh 6 · Phòng thí nghiệm', 5),
	(19, 2, NULL, 'Ảnh 7 · Phòng thí nghiệm', 6),
	(20, 2, NULL, 'Ảnh 8 · Phòng thí nghiệm', 7),
	(21, 2, NULL, 'Ảnh 9 · Phòng thí nghiệm', 8),
	(22, 3, NULL, 'Ảnh 1 · Hoạt động sinh viên', 0),
	(23, 3, NULL, 'Ảnh 2 · Hoạt động sinh viên', 1),
	(24, 3, NULL, 'Ảnh 3 · Hoạt động sinh viên', 2),
	(25, 3, NULL, 'Ảnh 4 · Hoạt động sinh viên', 3),
	(26, 3, NULL, 'Ảnh 5 · Hoạt động sinh viên', 4),
	(27, 3, NULL, 'Ảnh 6 · Hoạt động sinh viên', 5),
	(28, 3, NULL, 'Ảnh 7 · Hoạt động sinh viên', 6),
	(29, 3, NULL, 'Ảnh 8 · Hoạt động sinh viên', 7),
	(30, 3, NULL, 'Ảnh 9 · Hoạt động sinh viên', 8),
	(31, 3, NULL, 'Ảnh 10 · Hoạt động sinh viên', 9),
	(32, 3, NULL, 'Ảnh 11 · Hoạt động sinh viên', 10),
	(33, 3, NULL, 'Ảnh 12 · Hoạt động sinh viên', 11),
	(34, 3, NULL, 'Ảnh 13 · Hoạt động sinh viên', 12),
	(35, 3, NULL, 'Ảnh 14 · Hoạt động sinh viên', 13),
	(36, 3, NULL, 'Ảnh 15 · Hoạt động sinh viên', 14),
	(37, 4, NULL, 'Ảnh 1 · Khuôn viên HUMG', 0),
	(38, 4, NULL, 'Ảnh 2 · Khuôn viên HUMG', 1),
	(39, 4, NULL, 'Ảnh 3 · Khuôn viên HUMG', 2),
	(40, 4, NULL, 'Ảnh 4 · Khuôn viên HUMG', 3),
	(41, 4, NULL, 'Ảnh 5 · Khuôn viên HUMG', 4),
	(42, 4, NULL, 'Ảnh 6 · Khuôn viên HUMG', 5),
	(43, 4, NULL, 'Ảnh 7 · Khuôn viên HUMG', 6),
	(44, 4, NULL, 'Ảnh 8 · Khuôn viên HUMG', 7),
	(45, 4, NULL, 'Ảnh 9 · Khuôn viên HUMG', 8),
	(46, 4, NULL, 'Ảnh 10 · Khuôn viên HUMG', 9);


--
-- Data for Name: languages; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.languages (code, label, flag, is_source, is_enabled) VALUES
	('vi', 'Tiếng Việt', '🇻🇳', true, true),
	('en', 'English', '🇬🇧', false, true);


--
-- Data for Name: album_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.album_translations (album_id, lang, title, description) VALUES
	(1, 'vi', 'Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường', NULL),
	(2, 'vi', 'Phòng thí nghiệm trọng điểm', NULL),
	(3, 'vi', 'Hoạt động sinh viên năm học 2025', NULL),
	(4, 'vi', 'Khuôn viên Trường Đại học Mỏ - Địa chất', NULL);


--
-- Data for Name: audiences; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.audiences (id, code, icon, color, url, is_visible, sort_order) VALUES
	(1, 'thi-sinh', 'graduation', '#1976d2', '/hoc-tap/tuyen-sinh', true, 0),
	(2, 'sinh-vien', 'user', '#0f9d8c', '/sinh-vien', true, 1),
	(3, 'phu-huynh', 'users', '#f57c00', '/phu-huynh', true, 2),
	(4, 'cuu-sinh-vien', 'award', '#7b3fe4', '/cuu-sinh-vien', true, 3),
	(5, 'giang-vien', 'briefcase', '#2e7d32', '/giang-vien', true, 4),
	(6, 'doi-tac', 'handshake', '#3949ab', '/hop-tac', true, 5);


--
-- Data for Name: audience_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.audience_translations (audience_id, lang, title, description) VALUES
	(1, 'vi', 'Thí sinh', 'Tuyển sinh, ngành học, chương trình đào tạo.'),
	(2, 'vi', 'Sinh viên', 'Học tập, rèn luyện, đời sống sinh viên.'),
	(3, 'vi', 'Phụ huynh', 'Theo dõi kết quả học tập và học phí của con.'),
	(4, 'vi', 'Cựu sinh viên', 'Kết nối & phát triển cộng đồng.'),
	(5, 'vi', 'Giảng viên', 'Giảng dạy, nghiên cứu, quản lý công việc.'),
	(6, 'vi', 'Đối tác', 'Hợp tác, liên kết, phát triển bền vững.');


--
-- Data for Name: backups; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.backups (id, file_path, size_bytes, trigger, created_by, status, created_at) VALUES
	(1, '/backup/cms_humg/cms_20250516_0300.sql.gz', 446273946, 'cron', NULL, 'success', '2025-05-16 03:00:00+07'),
	(2, '/backup/cms_humg/cms_20250515_0300.sql.gz', 438514483, 'cron', NULL, 'success', '2025-05-15 03:00:00+07'),
	(3, '/backup/cms_humg/cms_20250514_0300.sql.gz', 430650163, 'cron', NULL, 'success', '2025-05-14 03:00:00+07'),
	(4, '/backup/cms_humg/cms_20250513_1512.sql.gz', 418486682, 'manual', 1, 'success', '2025-05-13 15:12:00+07');


--
-- Data for Name: banners; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.banners (id, "position", image_id, link_url, is_visible, sort_order, starts_on, ends_on, created_at, updated_at) VALUES
	(1, 'home_slider', NULL, NULL, true, 1, '2025-05-01', '2025-06-30', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'home_slider', NULL, NULL, true, 2, '2025-05-10', '2025-05-30', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'home_popup', NULL, NULL, false, 3, '2025-11-01', '2025-11-20', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'sidebar_right', NULL, NULL, true, 4, '2025-09-01', '2025-09-28', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(5, 'footer', NULL, NULL, true, 5, '2025-05-15', '2025-06-15', '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: banner_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.banner_translations (banner_id, lang, title, subtitle) VALUES
	(1, 'vi', 'Banner tuyển sinh đại học 2025', NULL),
	(2, 'vi', 'Hội thảo quốc tế Trắc địa – GIS 2025', NULL),
	(3, 'vi', 'Chào mừng 60 năm thành lập Trường', NULL),
	(4, 'vi', 'Ngày hội việc làm HUMG 2025', NULL),
	(5, 'vi', 'Thông báo học bổng khuyến khích học tập', NULL);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.categories (id, parent_id, slug, is_visible, sort_order, created_at, updated_at) VALUES
	(1, NULL, 'tin-tuc', true, 0, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 1, 'thong-bao', true, 1, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, NULL, 'su-kien', true, 2, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, NULL, 'nghien-cuu', true, 3, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(5, 4, 'de-tai-du-an', true, 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(6, 4, 'tap-chi-khoa-hoc', true, 5, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(7, NULL, 'hoc-tap', true, 6, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(8, NULL, 'tuyen-sinh', true, 7, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(9, NULL, 'van-ban-bieu-mau', false, 8, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(10, NULL, 'hop-tac', true, 9, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: category_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.category_translations (category_id, lang, name, description) VALUES
	(1, 'vi', 'Tin tức', NULL),
	(2, 'vi', 'Thông báo', NULL),
	(3, 'vi', 'Sự kiện', NULL),
	(4, 'vi', 'Nghiên cứu', NULL),
	(5, 'vi', 'Đề tài – Dự án', NULL),
	(6, 'vi', 'Tạp chí khoa học', NULL),
	(7, 'vi', 'Học tập', NULL),
	(8, 'vi', 'Tuyển sinh', NULL),
	(9, 'vi', 'Văn bản – Biểu mẫu', NULL),
	(10, 'vi', 'Hợp tác', NULL);


--
-- Data for Name: events; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.events (id, slug, starts_at, ends_at, time_label, status, contact, thumbnail_id, created_by, created_at, updated_at) VALUES
	(1, 'hoi-thao-khoa-hoc-quoc-te-dia-chat-khoang-san', '2026-05-20 08:00:00+07', NULL, '08:00 – 17:00', 'upcoming', 'hoithao.diachat@humg.edu.vn', NULL, 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'ngay-hoi-viec-lam-ket-noi-doanh-nghiep-2025', '2026-05-25 07:30:00+07', NULL, '07:30 – 16:30', 'upcoming', 'vieclam@humg.edu.vn', NULL, 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'le-bao-ve-luan-an-tien-si-dot-1-2025', '2026-05-30 08:00:00+07', NULL, '08:00 – 12:00', 'upcoming', 'saudaihoc@humg.edu.vn', NULL, 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'toa-dam-chuyen-doi-so-trong-dao-tao', '2026-06-05 14:00:00+07', NULL, '14:00 – 17:00', 'upcoming', 'cntt@humg.edu.vn', NULL, 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(5, 'giai-bong-da-sinh-vien-humg-2025', '2026-06-12 15:30:00+07', NULL, '15:30 – 18:00', 'upcoming', 'doanthanhnien@humg.edu.vn', NULL, 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(6, 'workshop-ky-nang-mem-cho-tan-sinh-vien', '2026-06-18 08:30:00+07', NULL, '08:30 – 11:30', 'upcoming', 'htsv@humg.edu.vn', NULL, 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: event_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.event_translations (event_id, lang, title, place, place_full, organizer, audience, description, agenda) VALUES
	(1, 'vi', 'Hội thảo khoa học quốc tế về Địa chất và Khoáng sản', 'Hội trường A, HUMG', 'Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Hà Nội', 'Khoa Địa chất & Phòng Hợp tác quốc tế', 'Giảng viên, nhà khoa học, nghiên cứu sinh, doanh nghiệp', '["Hội thảo là diễn đàn để các nhà khoa học trong nước và quốc tế trao đổi kết quả nghiên cứu mới nhất trong lĩnh vực địa chất, khoáng sản và tài nguyên bền vững.", {"type": "list", "items": ["Địa chất khu vực và kiến tạo", "Tài nguyên khoáng sản và đánh giá trữ lượng", "Địa chất môi trường và tai biến địa chất", "Ứng dụng AI – viễn thám trong thăm dò"]}]', '[{"item": "Đón tiếp đại biểu & khai mạc", "time": "08:00"}, {"item": "Báo cáo phiên toàn thể", "time": "09:00"}, {"item": "Các phiên chuyên đề song song", "time": "10:30"}, {"item": "Phiên poster & triển lãm thiết bị", "time": "13:30"}, {"item": "Thảo luận bàn tròn & bế mạc", "time": "15:30"}]'),
	(2, 'vi', 'Ngày hội việc làm & Kết nối doanh nghiệp 2025', 'Sân vận động HUMG', 'Sân vận động & Nhà thi đấu đa năng – Trường Đại học Mỏ - Địa chất', 'Phòng Công tác chính trị & Sinh viên', 'Sinh viên năm cuối, cựu sinh viên, doanh nghiệp', '["Sự kiện kết nối sinh viên với hơn 50 doanh nghiệp tuyển dụng, cùng chuỗi hội thảo kỹ năng nghề nghiệp và phỏng vấn trực tiếp tại gian hàng."]', '[{"item": "Khai mạc & tham quan gian hàng", "time": "07:30"}, {"item": "Hội thảo “Kỹ năng phỏng vấn & viết CV”", "time": "09:00"}, {"item": "Phỏng vấn trực tiếp tại gian hàng doanh nghiệp", "time": "10:30"}, {"item": "Talkshow “Khởi nghiệp từ ghế nhà trường”", "time": "14:00"}, {"item": "Tổng kết & trao quà may mắn", "time": "16:00"}]'),
	(3, 'vi', 'Lễ bảo vệ luận án Tiến sĩ đợt 1 năm 2025', 'Phòng 602, Nhà A', 'Phòng họp 602, Tầng 6, Nhà A – Trường Đại học Mỏ - Địa chất', 'Phòng Đào tạo Sau đại học', 'Hội đồng, nghiên cứu sinh, khách mời', '["Buổi bảo vệ luận án Tiến sĩ cấp Trường của nghiên cứu sinh chuyên ngành Kỹ thuật Địa chất, theo quy định của Bộ Giáo dục và Đào tạo."]', '[{"item": "Công bố quyết định thành lập Hội đồng", "time": "08:00"}, {"item": "Nghiên cứu sinh trình bày luận án", "time": "08:15"}, {"item": "Phản biện & hỏi đáp", "time": "09:00"}, {"item": "Hội đồng họp riêng & công bố kết quả", "time": "11:00"}]'),
	(4, 'vi', 'Tọa đàm chuyển đổi số trong đào tạo đại học', 'Hội trường B, HUMG', 'Hội trường B, Tầng 1, Nhà C – Trường Đại học Mỏ - Địa chất', 'Trung tâm CNTT & Phòng Đào tạo', 'Cán bộ, giảng viên toàn trường', '["Tọa đàm chia sẻ kinh nghiệm ứng dụng nền tảng số, dữ liệu và AI trong tổ chức đào tạo, khảo thí và quản trị nhà trường."]', '[{"item": "Báo cáo đề dẫn", "time": "14:00"}, {"item": "Tham luận từ các khoa", "time": "14:40"}, {"item": "Thảo luận & đề xuất", "time": "15:40"}, {"item": "Kết luận tọa đàm", "time": "16:40"}]'),
	(5, 'vi', 'Khai mạc Giải bóng đá sinh viên HUMG 2025', 'Sân vận động HUMG', 'Sân vận động Trường Đại học Mỏ - Địa chất', 'Đoàn Thanh niên – Hội Sinh viên', 'Sinh viên toàn trường', '["Giải đấu thường niên với sự tham gia của các đội tuyển đến từ tất cả các khoa, hứa hẹn nhiều trận cầu sôi động."]', '[{"item": "Lễ khai mạc & diễu hành các đội", "time": "15:30"}, {"item": "Trận đấu khai mạc", "time": "16:00"}, {"item": "Trao cờ lưu niệm", "time": "17:45"}]'),
	(6, 'vi', 'Workshop kỹ năng mềm cho tân sinh viên', 'Hội trường A, HUMG', 'Hội trường A, Tầng 2, Nhà A – Trường Đại học Mỏ - Địa chất', 'Trung tâm Hỗ trợ sinh viên', 'Tân sinh viên khóa mới', '["Trang bị cho tân sinh viên kỹ năng quản lý thời gian, làm việc nhóm, thuyết trình và thích nghi với môi trường đại học."]', '[{"item": "Khởi động & làm quen", "time": "08:30"}, {"item": "Chuyên đề “Học đại học đúng cách”", "time": "09:00"}, {"item": "Thực hành làm việc nhóm", "time": "10:15"}, {"item": "Hỏi đáp & tổng kết", "time": "11:15"}]');


--
-- Data for Name: hero_slides; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.hero_slides (id, code, primary_url, accent_url, image_id, is_visible, sort_order) VALUES
	(1, 'sl-60-nam', '/gioi-thieu', '/hoc-tap/tuyen-sinh', NULL, true, 0),
	(2, 'sl-tuyen-sinh', '/hoc-tap/tuyen-sinh', '/lien-he', NULL, true, 1),
	(3, 'sl-nghien-cuu', '/nghien-cuu', '/nghien-cuu/nhom-nghien-cuu', NULL, true, 2),
	(4, 'sl-doi-song', '/doi-song', '/doi-song/cau-lac-bo', NULL, true, 3),
	(5, 'sl-hop-tac', '/hop-tac', '/hop-tac/doi-tac-quoc-te', NULL, true, 4);


--
-- Data for Name: hero_slide_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.hero_slide_translations (slide_id, lang, kicker, title, subtitle, motto, primary_label, accent_label) VALUES
	(1, 'vi', '60 NĂM', 'XÂY DỰNG, ĐỔI MỚI
VÀ PHÁT TRIỂN', '1966 – 2026', 'Tri thức · Bản lĩnh · Sáng tạo · Hội nhập', 'Khám phá HUMG', 'Tuyển sinh 2026'),
	(2, 'vi', 'TUYỂN SINH ĐẠI HỌC 2026', 'CHỌN NGÀNH TƯƠNG LAI
TẠI HUMG', '52 chương trình đào tạo', '5 phương thức xét tuyển · Học bổng đến 100% học phí', 'Xem thông tin tuyển sinh', 'Đăng ký tư vấn'),
	(3, 'vi', 'KHOA HỌC & CÔNG NGHỆ', 'KIẾN TẠO TRI THỨC
CHUYỂN GIAO GIÁ TRỊ', '142 đề tài · 650+ công bố quốc tế', 'Địa chất · Mỏ · Dầu khí · Trắc địa – Bản đồ · CNTT', 'Khám phá nghiên cứu', 'Nhóm nghiên cứu mạnh'),
	(4, 'vi', 'ĐỜI SỐNG SINH VIÊN', 'TRẢI NGHIỆM ĐẠI HỌC
TRỌN VẸN TẠI HUMG', '200+ CLB & đội nhóm', 'Ký túc xá · Thể thao – Văn hóa · Khởi nghiệp · Việc làm', 'Khám phá đời sống', 'Câu lạc bộ sinh viên'),
	(5, 'vi', 'HỢP TÁC & HỘI NHẬP', 'KẾT NỐI TRI THỨC
MỞ RỘNG TƯƠNG LAI', '128 đối tác · 46 quốc gia', 'Đào tạo · Nghiên cứu chung · Trao đổi sinh viên & giảng viên', 'Khám phá hợp tác', 'Đối tác quốc tế');


--
-- Data for Name: menu_groups; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.menu_groups (id, code, name) VALUES
	(1, 'header', 'Menu chính (Header)'),
	(2, 'footer', 'Menu chân trang (Footer)'),
	(3, 'utility', 'Menu tiện ích');


--
-- Data for Name: pages; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.pages (id, parent_id, slug, template, status, sort_order, created_at, updated_at) VALUES
	(1, NULL, '', 'default', 'published', 0, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, NULL, 'gioi-thieu', 'default', 'published', 1, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, NULL, 'media', 'default', 'published', 2, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, NULL, 'don-vi', 'default', 'published', 3, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(5, 4, 'ban-giam-hieu', 'default', 'published', 4, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(6, 4, 'phong-ban', 'default', 'published', 5, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(7, 4, 'khoa', 'default', 'published', 6, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(8, NULL, 'dao-tao', 'default', 'published', 7, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(9, NULL, 'nghien-cuu', 'default', 'published', 8, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(10, NULL, 'sinh-vien', 'default', 'published', 9, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(11, NULL, 'tin-tuc', 'default', 'published', 10, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(12, NULL, 'thu-vien-so', 'default', 'published', 11, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(13, NULL, 'lien-he', 'default', 'published', 12, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.menu_items (id, group_id, parent_id, type, url, page_id, category_id, sort_order, is_visible, open_in_new_tab) VALUES
	(1, 1, NULL, 'page', '/', NULL, NULL, 1, true, false),
	(2, 1, NULL, 'page', '/gioi-thieu', NULL, NULL, 2, true, false),
	(3, 1, NULL, 'page', '/hoc-tap', NULL, NULL, 3, true, false),
	(4, 1, NULL, 'page', '/nghien-cuu', NULL, NULL, 4, true, false),
	(5, 1, NULL, 'page', '/hop-tac', NULL, NULL, 5, true, false),
	(6, 1, NULL, 'page', '/doi-song', NULL, NULL, 6, true, false),
	(7, 1, NULL, 'link', '/thu-vien', NULL, NULL, 7, true, false),
	(8, 1, NULL, 'category', '/tin-tuc', NULL, NULL, 8, true, false);


--
-- Data for Name: menu_item_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.menu_item_translations (menu_item_id, lang, label) VALUES
	(1, 'vi', 'Trang chủ'),
	(2, 'vi', 'Giới thiệu HUMG'),
	(3, 'vi', 'Học tập'),
	(4, 'vi', 'Nghiên cứu'),
	(5, 'vi', 'Hợp tác'),
	(6, 'vi', 'Đời sống'),
	(7, 'vi', 'Thư viện'),
	(8, 'vi', 'Tin tức');


--
-- Data for Name: page_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.page_translations (page_id, lang, title, body, seo_title, seo_description, translation_status) VALUES
	(1, 'vi', 'Trang chủ', '[]', NULL, NULL, 'done'),
	(2, 'vi', 'Giới thiệu', '[]', NULL, NULL, 'done'),
	(3, 'vi', 'Media thư viện', '[]', NULL, NULL, 'done'),
	(4, 'vi', 'Đơn vị', '[]', NULL, NULL, 'done'),
	(5, 'vi', 'Ban giám hiệu', '[]', NULL, NULL, 'done'),
	(6, 'vi', 'Phòng ban chức năng', '[]', NULL, NULL, 'done'),
	(7, 'vi', 'Khoa chuyên môn', '[]', NULL, NULL, 'done'),
	(8, 'vi', 'Đào tạo', '[]', NULL, NULL, 'done'),
	(9, 'vi', 'Nghiên cứu', '[]', NULL, NULL, 'done'),
	(10, 'vi', 'Sinh viên', '[]', NULL, NULL, 'done'),
	(11, 'vi', 'Tin tức – Sự kiện', '[]', NULL, NULL, 'done'),
	(12, 'vi', 'Thư viện số', '[]', NULL, NULL, 'done'),
	(13, 'vi', 'Liên hệ', '[]', NULL, NULL, 'done');


--
-- Data for Name: partners; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.partners (id, short_name, color, logo_id, website, is_visible, sort_order) VALUES
	(1, 'TKV', '#0057a8', NULL, NULL, true, 0),
	(2, 'PVN', '#e2231a', NULL, NULL, true, 1),
	(3, 'BGR', '#004b87', NULL, NULL, true, 2),
	(4, 'KIGAM', '#1a7f5a', NULL, NULL, true, 3),
	(5, 'JICA', '#e60012', NULL, NULL, true, 4),
	(6, 'HUST', '#9e1b32', NULL, NULL, true, 5),
	(7, 'UQ', '#51247a', NULL, NULL, true, 6),
	(8, 'AGH', '#00693e', NULL, NULL, true, 7),
	(9, 'PVEP', '#0067b1', NULL, NULL, true, 8),
	(10, 'VAST', '#003f87', NULL, NULL, true, 9),
	(11, 'HAL', '#e21836', NULL, NULL, true, 10),
	(12, 'SLB', '#0014dc', NULL, NULL, true, 11),
	(13, 'DGMV', '#1f6f43', NULL, NULL, true, 12),
	(14, 'VCI', '#0060a9', NULL, NULL, true, 13);


--
-- Data for Name: partner_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.partner_translations (partner_id, lang, name) VALUES
	(1, 'vi', 'Vinacomin'),
	(2, 'vi', 'Petrovietnam'),
	(3, 'vi', 'BGR – CHLB Đức'),
	(4, 'vi', 'KIGAM – Hàn Quốc'),
	(5, 'vi', 'JICA – Nhật Bản'),
	(6, 'vi', 'ĐH Bách khoa Hà Nội'),
	(7, 'vi', 'The University of Queensland'),
	(8, 'vi', 'AGH – Ba Lan'),
	(9, 'vi', 'PVEP'),
	(10, 'vi', 'Viện HLKH&CN Việt Nam'),
	(11, 'vi', 'Halliburton'),
	(12, 'vi', 'SLB (Schlumberger)'),
	(13, 'vi', 'Tổng cục Địa chất & Khoáng sản'),
	(14, 'vi', 'Tập đoàn Hóa chất Việt Nam');


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.permissions (id, code, module, name, sort_order) VALUES
	(1, 'post.view', 'Bài viết', 'Bài viết · post.view', 0),
	(2, 'post.create', 'Bài viết', 'Bài viết · post.create', 1),
	(3, 'post.update', 'Bài viết', 'Bài viết · post.update', 2),
	(4, 'post.publish', 'Xuất bản bài viết', 'Xuất bản bài viết · post.publish', 3),
	(5, 'category.manage', 'Danh mục', 'Danh mục · category.manage', 4),
	(6, 'media.manage', 'Media thư viện', 'Media thư viện · media.manage', 5),
	(7, 'page.manage', 'Trang & Menu', 'Trang & Menu · page.manage', 6),
	(8, 'menu.manage', 'Trang & Menu', 'Trang & Menu · menu.manage', 7),
	(9, 'user.manage', 'Người dùng', 'Người dùng · user.manage', 8),
	(10, 'settings.manage', 'Cấu hình hệ thống', 'Cấu hình hệ thống · settings.manage', 9),
	(11, 'log.view', 'Nhật ký & Sao lưu', 'Nhật ký & Sao lưu · log.view', 10),
	(12, 'backup.manage', 'Nhật ký & Sao lưu', 'Nhật ký & Sao lưu · backup.manage', 11),
	(13, 'cms.access', 'Truy cập CMS', 'Truy cập CMS', 12);


--
-- Data for Name: podcasts; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.podcasts (id, slug, episode, host, duration_sec, audio_url, cover_id, play_count, published_at, is_visible, created_at, updated_at) VALUES
	(1, 'chuyen-nghe-dia-chat', 'Tập 05', 'TS. Trần Văn A', 1930, NULL, NULL, 1240, '2026-05-10', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'hanh-trinh-khoi-nghiep-cuu-sv', 'Tập 04', 'ThS. Nguyễn Thị B', 1725, NULL, NULL, 980, '2026-04-26', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'hoi-dap-tuyen-sinh-2026', 'Tập 03', 'Phòng Đào tạo', 1290, NULL, NULL, 2150, '2026-05-05', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'song-xanh-trong-khai-thac-mo', 'Tập 02', 'PGS.TS. Lê Văn D', 1565, NULL, NULL, 760, '2026-04-18', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: podcast_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.podcast_translations (podcast_id, lang, title, description, notes) VALUES
	(1, 'vi', 'Chuyện nghề Địa chất', 'Trò chuyện cùng những người làm nghề địa chất: hành trình vào nghề, gian nan hiện trường và niềm vui khám phá.', '["Khách mời: kỹ sư địa chất công trình", "Chủ đề: khảo sát địa chất cho công trình ngầm", "Q&A từ thính giả sinh viên"]'),
	(2, 'vi', 'Hành trình khởi nghiệp của cựu sinh viên', 'Câu chuyện khởi nghiệp trong lĩnh vực công nghệ đo đạc – bản đồ của một nhóm cựu sinh viên HUMG.', '["Từ đồ án tốt nghiệp đến sản phẩm thương mại", "Gọi vốn và xây dựng đội ngũ", "Lời khuyên cho sinh viên muốn khởi nghiệp"]'),
	(3, 'vi', 'Hỏi đáp tuyển sinh 2026', 'Giải đáp trực tiếp các thắc mắc phổ biến của thí sinh và phụ huynh về kỳ tuyển sinh 2026.', '["Phương thức xét tuyển & tổ hợp môn", "Học phí và chính sách học bổng", "Cơ hội việc làm theo nhóm ngành"]'),
	(4, 'vi', 'Sống xanh trong khai thác mỏ', 'Bàn về khai thác mỏ bền vững, hoàn nguyên môi trường và kinh tế tuần hoàn trong ngành khoáng sản.', '["Xu hướng ESG trong ngành mỏ", "Công nghệ giảm phát thải", "Vai trò của kỹ sư trẻ"]');


--
-- Data for Name: posts; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.posts (id, slug, category_id, author_id, status, show_on_home, is_featured, unit, thumbnail_id, view_count, publish_at, expire_at, created_at, updated_at, deleted_at) VALUES
	(1, 'hoi-thao-trac-dia-gis-2025', 1, 1, 'published', true, true, 'Khoa Trắc địa – Bản đồ', NULL, 1235, '2025-05-16 08:00:00+07', NULL, '2025-05-16 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(2, 'thong-bao-lich-thi-hoc-ky-2-2024-2025', 2, 2, 'published', false, false, NULL, NULL, 0, '2025-05-15 08:00:00+07', NULL, '2025-05-15 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(3, 'nghien-cuu-ung-dung-ai-trong-quan-ly-dao-tao', 4, 9, 'draft', false, false, NULL, NULL, 0, NULL, NULL, '2025-05-15 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(4, 'chuong-trinh-hoc-bong-humg-2025', 8, 10, 'pending', false, false, NULL, NULL, 0, NULL, NULL, '2025-05-14 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(5, 'ket-qua-xet-tuyen-dot-1-nam-hoc-2024-2025', 1, 11, 'published', false, false, NULL, NULL, 0, '2025-05-12 08:00:00+07', NULL, '2025-05-12 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(6, 'le-khai-giang-nam-hoc-moi-2025-2026', 3, 4, 'published', false, false, NULL, NULL, 0, '2025-05-11 08:00:00+07', NULL, '2025-05-11 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(7, 'huong-dan-dang-ky-hoc-phan-hoc-ky-moi', 7, 5, 'published', false, false, NULL, NULL, 0, '2025-05-10 08:00:00+07', NULL, '2025-05-10 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(8, 'hoi-thao-khoa-hoc-tre-humg-lan-thu-xv', 3, 4, 'draft', false, false, NULL, NULL, 0, NULL, NULL, '2025-05-09 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(9, 'thong-bao-tuyen-dung-giang-vien-nam-2025', 2, 2, 'published', false, false, NULL, NULL, 0, '2025-05-08 08:00:00+07', NULL, '2025-05-08 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(10, 'danh-muc-de-tai-nckh-cap-truong-nam-2027', 4, 9, 'pending', false, false, NULL, NULL, 0, NULL, NULL, '2025-05-07 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(11, 'chi-tieu-tuyen-sinh-dai-hoc-chinh-quy-2025', 8, 10, 'published', false, false, NULL, NULL, 0, '2025-05-06 08:00:00+07', NULL, '2025-05-06 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(12, 'ke-hoach-hoc-tap-ren-luyen-nam-hoc-moi', 7, 5, 'draft', false, false, NULL, NULL, 0, NULL, NULL, '2025-05-05 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(13, 'le-ky-niem-60-nam-thanh-lap', 3, 2, 'published', false, false, 'Văn phòng', NULL, 1235, '2025-05-15 08:00:00+07', NULL, '2025-05-15 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(14, 'humg-top-10-dai-hoc-ky-thuat', 1, 2, 'published', false, false, 'Phòng KHCN', NULL, 986, '2025-05-10 08:00:00+07', NULL, '2025-05-10 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(15, 'nghien-cuu-vat-lieu-moi-khai-thac-ben-vung', 4, 2, 'published', false, false, 'Khoa Mỏ', NULL, 742, '2025-05-06 08:00:00+07', NULL, '2025-05-06 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(16, 'sinh-vien-humg-dat-giai-cao-iot-toan-quoc', 1, 2, 'published', false, false, 'Khoa CNTT', NULL, 1527, '2025-05-02 08:00:00+07', NULL, '2025-05-02 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(17, 'hoi-thao-quoc-te-trac-dia-gis-2025', 3, 2, 'published', false, false, 'Khoa Trắc địa – Bản đồ', NULL, 1235, '2025-05-14 08:00:00+07', NULL, '2025-05-14 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(18, 'humg-ky-ket-hop-tac-dai-hoc-aachen', 10, 2, 'published', false, false, 'Phòng Hợp tác quốc tế', NULL, 640, '2025-04-28 08:00:00+07', NULL, '2025-04-28 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(19, 'thong-bao-tuyen-sinh-dai-hoc-2026', 8, 2, 'published', false, false, 'Phòng Đào tạo', NULL, 3120, '2026-05-20 08:00:00+07', NULL, '2026-05-20 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(20, 'chuong-trinh-hoc-bong-phat-trien-nguon-nhan-luc', 2, 2, 'published', false, false, 'Phòng CTSV', NULL, 880, '2026-04-25 08:00:00+07', NULL, '2026-04-25 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(21, 'nghiem-thu-de-tai-cap-bo-khai-thac-than-ham-lo', 4, 2, 'published', false, false, 'Phòng KHCN', NULL, 512, '2026-04-18 08:00:00+07', NULL, '2026-04-18 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL),
	(22, 'ngay-hoi-viec-lam-ket-noi-doanh-nghiep-2025', 3, 2, 'published', false, false, 'Phòng CTSV', NULL, 2103, '2025-04-25 08:00:00+07', NULL, '2025-04-25 08:00:00+07', '2026-10-04 09:32:38.19799+07', NULL);


--
-- Data for Name: post_attachments; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.post_attachments (id, post_id, media_id, title, meta, sort_order) VALUES
	(1, 1, NULL, 'Báo cáo tổng kết Hội thảo Trắc địa & GIS 2025', 'PDF · 4.2 MB', 0),
	(2, 13, NULL, 'Diễn văn kỷ niệm 60 năm thành lập Trường', 'PDF · 640 KB', 0),
	(3, 15, NULL, 'Tóm tắt kết quả nghiên cứu', 'PDF · 1.1 MB', 0),
	(4, 17, NULL, 'Báo cáo tổng kết Hội thảo Trắc địa & GIS 2025', 'PDF · 4.2 MB', 0),
	(5, 19, NULL, 'Đề án tuyển sinh 2026', 'PDF · 1.2 MB', 0),
	(6, 19, NULL, 'Mẫu đơn đăng ký xét tuyển', 'DOCX · 256 KB', 1),
	(7, 20, NULL, 'Mẫu hồ sơ đăng ký học bổng', 'DOCX · 34 KB', 0),
	(8, 21, NULL, 'Báo cáo tóm tắt đề tài (2024)', 'PDF · 1.3 MB', 0);


--
-- Data for Name: tags; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.tags (id, slug, name) VALUES
	(1, 'hoi-thao', 'Hội thảo'),
	(2, 'trac-dia', 'Trắc địa'),
	(3, 'gis', 'GIS'),
	(4, '60-nam', '60 năm'),
	(5, 'truyen-thong', 'Truyền thống'),
	(6, 'su-kien', 'Sự kiện'),
	(7, 'xep-hang', 'Xếp hạng'),
	(8, 'chat-luong', 'Chất lượng'),
	(9, 'dao-tao', 'Đào tạo'),
	(10, 'vat-lieu-moi', 'Vật liệu mới'),
	(11, 'khai-thac-mo', 'Khai thác mỏ'),
	(12, 'moi-truong', 'Môi trường'),
	(13, 'sinh-vien', 'Sinh viên'),
	(14, 'iot', 'IoT'),
	(15, 'cuoc-thi', 'Cuộc thi'),
	(16, 'hop-tac-quoc-te', 'Hợp tác quốc tế'),
	(17, 'chlb-duc', 'CHLB Đức'),
	(18, 'mou', 'MOU'),
	(19, 'tuyen-sinh', 'Tuyển sinh'),
	(20, '2026', '2026'),
	(21, 'dai-hoc-chinh-quy', 'Đại học chính quy'),
	(22, 'hoc-bong', 'Học bổng'),
	(23, 'doanh-nghiep', 'Doanh nghiệp'),
	(24, 'de-tai-cap-bo', 'Đề tài cấp Bộ'),
	(25, 'khai-thac-than', 'Khai thác than'),
	(26, 'nghiem-thu', 'Nghiệm thu'),
	(27, 'viec-lam', 'Việc làm');


--
-- Data for Name: post_tags; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.post_tags (post_id, tag_id) VALUES
	(1, 1),
	(1, 2),
	(1, 3),
	(13, 4),
	(13, 5),
	(13, 6),
	(14, 7),
	(14, 8),
	(14, 9),
	(15, 10),
	(15, 11),
	(15, 12),
	(16, 13),
	(16, 14),
	(16, 15),
	(17, 1),
	(17, 2),
	(17, 3),
	(18, 16),
	(18, 17),
	(18, 18),
	(19, 19),
	(19, 20),
	(19, 21),
	(20, 22),
	(20, 13),
	(20, 23),
	(21, 24),
	(21, 25),
	(21, 26),
	(22, 27),
	(22, 23),
	(22, 13);


--
-- Data for Name: post_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.post_translations (post_id, lang, title, excerpt, body, seo_title, seo_description, seo_keywords, translation_status, updated_at) VALUES
	(1, 'vi', 'Hội thảo quốc tế về Trắc địa và GIS 2025', 'Hội thảo là diễn đàn học thuật uy tín nhằm chia sẻ các xu hướng, công nghệ mới nhất trong lĩnh vực Trắc địa, Bản đồ và Hệ thống thông tin địa lý (GIS).', '["Nhập nội dung bài viết ở đây… (trình soạn thảo WYSIWYG)\n\nHội thảo quốc tế về Trắc địa và GIS 2025 quy tụ các chuyên gia đầu ngành trong nước và quốc tế…"]', 'Hội thảo quốc tế về Trắc địa và GIS 2025 – HUMG', 'Thông tin chương trình, diễn giả và đăng ký tham dự Hội thảo quốc tế Trắc địa – GIS 2025 tại Trường Đại học Mỏ – Địa chất.', 'trắc địa, GIS, hội thảo quốc tế, HUMG', 'done', '2026-10-04 09:32:38.19799+07'),
	(1, 'en', 'International Conference on Geodesy and GIS 2025', 'The conference is a prestigious academic forum to share the latest trends and technologies in Geodesy, Cartography and Geographic Information Systems (GIS).', '["Enter the post content here… (WYSIWYG editor)\n\nThe International Conference on Geodesy and GIS 2025 brings together leading experts from Vietnam and abroad…"]', 'International Conference on Geodesy and GIS 2025 – HUMG', 'Program, speakers and registration for the International Conference on Geodesy – GIS 2025 at Hanoi University of Mining and Geology.', 'geodesy, GIS, international conference, HUMG', 'done', '2026-10-04 09:32:38.19799+07'),
	(2, 'vi', 'Thông báo lịch thi học kỳ 2 (2024 – 2025)', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(2, 'en', 'Thông báo lịch thi học kỳ 2 (2024 – 2025)', NULL, '[]', NULL, NULL, NULL, 'in_progress', '2026-10-04 09:32:38.19799+07'),
	(3, 'vi', 'Nghiên cứu ứng dụng AI trong quản lý đào tạo', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(4, 'vi', 'Chương trình học bổng HUMG 2025', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(4, 'en', 'Chương trình học bổng HUMG 2025', NULL, '[]', NULL, NULL, NULL, 'in_progress', '2026-10-04 09:32:38.19799+07'),
	(5, 'vi', 'Kết quả xét tuyển đợt 1 năm học 2024 – 2025', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(5, 'en', 'Kết quả xét tuyển đợt 1 năm học 2024 – 2025', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(6, 'vi', 'Lễ khai giảng năm học mới 2025 – 2026', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(7, 'vi', 'Hướng dẫn đăng ký học phần học kỳ mới', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(8, 'vi', 'Hội thảo khoa học trẻ HUMG lần thứ XV', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(9, 'vi', 'Thông báo tuyển dụng giảng viên năm 2025', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(9, 'en', 'Thông báo tuyển dụng giảng viên năm 2025', NULL, '[]', NULL, NULL, NULL, 'in_progress', '2026-10-04 09:32:38.19799+07'),
	(10, 'vi', 'Danh mục đề tài NCKH cấp Trường năm 2027', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(11, 'vi', 'Chỉ tiêu tuyển sinh đại học chính quy 2025', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(11, 'en', 'Chỉ tiêu tuyển sinh đại học chính quy 2025', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(12, 'vi', 'Kế hoạch học tập – rèn luyện năm học mới', NULL, '[]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(13, 'vi', 'Lễ kỷ niệm 60 năm thành lập Trường Đại học Mỏ – Địa chất', 'Sáng 15/05/2025, Trường Đại học Mỏ – Địa chất long trọng tổ chức Lễ kỷ niệm 60 năm thành lập, ôn lại chặng đường xây dựng và phát triển của Nhà trường.', '["Trong không khí trang trọng và ấm áp, Trường Đại học Mỏ – Địa chất đã tổ chức Lễ kỷ niệm 60 năm thành lập (1966 – 2026) với sự tham dự của lãnh đạo Bộ Giáo dục và Đào tạo, các thế hệ cán bộ, giảng viên, cựu sinh viên và đối tác trong, ngoài nước.", {"text": "Một chặng đường tự hào", "type": "h2"}, "Từ những ngày đầu thành lập với vài trăm sinh viên, đến nay HUMG đã đào tạo hàng chục nghìn kỹ sư, cử nhân, thạc sĩ và tiến sĩ, đóng góp quan trọng cho ngành công nghiệp mỏ, địa chất, dầu khí và trắc địa – bản đồ của đất nước.", {"text": "“60 năm là hành trình của tri thức, bản lĩnh và khát vọng hội nhập. HUMG sẽ tiếp tục đổi mới để đồng hành cùng sự phát triển bền vững của đất nước.”", "type": "quote"}, {"type": "img", "label": "Toàn cảnh buổi lễ tại Hội trường A", "caption": "Toàn cảnh Lễ kỷ niệm 60 năm thành lập Trường."}, {"type": "list", "items": ["Trao Huân chương và bằng khen cho các tập thể, cá nhân tiêu biểu", "Ra mắt Quỹ học bổng 60 năm HUMG", "Khánh thành không gian truyền thống của Nhà trường"]}, "Buổi lễ khép lại với chương trình nghệ thuật đặc sắc do sinh viên và cựu sinh viên biểu diễn, thể hiện niềm tự hào và gắn bó với mái trường."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(13, 'en', 'Lễ kỷ niệm 60 năm thành lập Trường Đại học Mỏ – Địa chất', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(14, 'vi', 'HUMG lọt Top 10 trường đại học kỹ thuật hàng đầu Việt Nam', 'Theo bảng xếp hạng năm 2025, Trường Đại học Mỏ – Địa chất được ghi nhận trong nhóm 10 cơ sở đào tạo kỹ thuật hàng đầu cả nước.', '["Kết quả xếp hạng dựa trên các tiêu chí về chất lượng đào tạo, năng lực nghiên cứu, công bố quốc tế, tỷ lệ việc làm của sinh viên sau tốt nghiệp và mức độ hội nhập quốc tế.", {"text": "Thế mạnh về nghiên cứu ứng dụng", "type": "h2"}, "HUMG được đánh giá cao ở các nhóm ngành mũi nhọn: kỹ thuật mỏ, địa chất, dầu khí, trắc địa – bản đồ, cùng năng lực chuyển giao công nghệ cho doanh nghiệp.", {"type": "list", "items": ["650+ công bố khoa học trong 5 năm gần đây", "Hàng chục đề tài cấp Nhà nước, cấp Bộ được nghiệm thu", "Mạng lưới hơn 200 doanh nghiệp đối tác"]}, "Nhà trường xác định tiếp tục đầu tư cho phòng thí nghiệm trọng điểm, chương trình đào tạo quốc tế và các nhóm nghiên cứu mạnh."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(14, 'en', 'HUMG lọt Top 10 trường đại học kỹ thuật hàng đầu Việt Nam', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(15, 'vi', 'Nghiên cứu vật liệu mới trong khai thác bền vững', 'Nhóm nghiên cứu của HUMG phát triển vật liệu gia cố mới giúp nâng cao an toàn và giảm tác động môi trường trong khai thác hầm lò.', '["Đề tài tập trung vào việc phát triển loại vật liệu gia cố có độ bền cao, thân thiện môi trường, thay thế một phần vật liệu truyền thống trong chống giữ lò.", {"text": "Kết quả thử nghiệm", "type": "h2"}, "Thử nghiệm tại hiện trường cho thấy vật liệu mới giúp giảm 20% chi phí chống giữ và tăng đáng kể hệ số an toàn của công trình ngầm.", {"text": "“Chúng tôi hướng đến các giải pháp vừa hiệu quả kinh tế, vừa giảm phát thải và rác thải trong quá trình khai thác.”", "type": "quote"}, "Kết quả nghiên cứu đã được công bố trên tạp chí quốc tế uy tín và đang được chuyển giao thử nghiệm cho một số đơn vị khai thác."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(15, 'en', 'Nghiên cứu vật liệu mới trong khai thác bền vững', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(16, 'vi', 'Sinh viên HUMG đạt giải cao tại cuộc thi IoT toàn quốc', 'Đội tuyển sinh viên Khoa Công nghệ thông tin giành giải Nhì chung cuộc với sản phẩm giám sát môi trường mỏ theo thời gian thực.', '["Sản phẩm dự thi là hệ thống cảm biến – IoT giám sát các thông số khí, bụi, nhiệt độ trong khu vực khai thác và cảnh báo sớm nguy cơ mất an toàn.", {"type": "img", "label": "Đội tuyển HUMG tại vòng chung kết", "caption": "Đội tuyển sinh viên HUMG tại vòng chung kết cuộc thi."}, "Ban giám khảo đánh giá cao tính ứng dụng thực tiễn và khả năng triển khai của giải pháp trong điều kiện mỏ hầm lò Việt Nam.", {"type": "list", "items": ["Giải Nhì chung cuộc toàn quốc", "Giải “Sản phẩm có tính ứng dụng cao”", "Được doanh nghiệp đề nghị hợp tác thử nghiệm"]}]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(16, 'en', 'Sinh viên HUMG đạt giải cao tại cuộc thi IoT toàn quốc', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(17, 'vi', 'Hội thảo quốc tế về Trắc địa và GIS 2025', 'HUMG chủ trì tổ chức thành công Hội thảo quốc tế về Trắc địa và GIS 2025 với hơn 200 đại biểu trong nước và quốc tế.', '["Trong hai ngày 13–14/05/2025, Trường Đại học Mỏ – Địa chất đã tổ chức Hội thảo quốc tế về Trắc địa và GIS với chủ đề “Ứng dụng trí tuệ nhân tạo kết hợp dữ liệu viễn thám và GIS phục vụ quy hoạch đô thị”.", {"text": "Diễn đàn học thuật uy tín", "type": "h2"}, "Hội thảo quy tụ các nhà khoa học, chuyên gia và doanh nghiệp công nghệ đến từ nhiều quốc gia, cùng trao đổi về xu hướng mới trong lĩnh vực trắc địa, bản đồ và GIS.", {"text": "“Đây là cơ hội quan trọng để kết nối nghiên cứu và ứng dụng, thúc đẩy chuyển giao công nghệ trong thời đại số.”", "type": "quote"}, "Hội thảo mở ra nhiều cơ hội hợp tác nghiên cứu và đào tạo giữa HUMG với các đối tác quốc tế."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(17, 'en', 'Hội thảo quốc tế về Trắc địa và GIS 2025', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(18, 'vi', 'HUMG ký kết hợp tác với Đại học RWTH Aachen (CHLB Đức)', 'Hai trường ký biên bản ghi nhớ hợp tác trong đào tạo, trao đổi giảng viên – sinh viên và nghiên cứu chung về khai thác bền vững.', '["Lễ ký kết diễn ra tại HUMG với sự chứng kiến của lãnh đạo hai trường và đại diện doanh nghiệp trong lĩnh vực khai khoáng.", {"type": "list", "items": ["Trao đổi sinh viên, giảng viên hằng năm", "Đồng hướng dẫn nghiên cứu sinh", "Nghiên cứu chung về khai thác bền vững và kinh tế tuần hoàn"]}, "Hợp tác mở ra cơ hội học tập và nghiên cứu ở môi trường quốc tế cho sinh viên, học viên của Nhà trường."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(18, 'en', 'HUMG ký kết hợp tác với Đại học RWTH Aachen (CHLB Đức)', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(19, 'vi', 'Thông báo tuyển sinh đại học chính quy năm 2026', 'Trường Đại học Mỏ – Địa chất thông báo tuyển sinh đại học chính quy năm 2026 với 52 chương trình đào tạo và 5 phương thức xét tuyển.', '["Năm 2026, HUMG tuyển sinh 52 chương trình đào tạo trình độ đại học, trong đó có các chương trình chất lượng cao và chương trình liên kết quốc tế.", {"text": "Phương thức xét tuyển", "type": "h2"}, {"type": "list", "items": ["Xét tuyển thẳng và ưu tiên xét tuyển", "Xét kết quả thi tốt nghiệp THPT", "Xét học bạ THPT", "Xét tuyển kết hợp", "Xét kết quả kỳ thi ĐGNL của ĐHQG Hà Nội"]}, "Thí sinh theo dõi mốc thời gian và hướng dẫn đăng ký trực tuyến tại chuyên trang Tuyển sinh của Nhà trường."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(19, 'en', 'Thông báo tuyển sinh đại học chính quy năm 2026', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(20, 'vi', 'Chương trình học bổng phát triển nguồn nhân lực năm học 2025 – 2026', 'Nhà trường phối hợp cùng doanh nghiệp triển khai chương trình học bổng dành cho sinh viên các ngành kỹ thuật mũi nhọn.', '["Chương trình dành cho sinh viên có kết quả học tập tốt, tích cực tham gia nghiên cứu và hoạt động cộng đồng, ưu tiên các ngành kỹ thuật mỏ, dầu khí, địa chất và trắc địa.", {"type": "list", "items": ["Giá trị học bổng: từ 50% đến 100% học phí năm học", "Cơ hội thực tập và tuyển dụng tại doanh nghiệp tài trợ", "Cố vấn nghề nghiệp từ chuyên gia doanh nghiệp"]}, "Hồ sơ đăng ký nộp tại Phòng Công tác chính trị & Sinh viên trước ngày hết hạn thông báo."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(20, 'en', 'Chương trình học bổng phát triển nguồn nhân lực năm học 2025 – 2026', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(21, 'vi', 'Nghiệm thu đề tài cấp Bộ về công nghệ khai thác than hầm lò', 'Đề tài nghiên cứu công nghệ khai thác than hầm lò thân thiện môi trường được Hội đồng đánh giá xuất sắc.', '["Đề tài do nhóm nghiên cứu Khoa Mỏ chủ trì, tập trung vào giải pháp giảm tổn thất tài nguyên và giảm phát thải trong khai thác than hầm lò.", {"text": "“Kết quả đề tài có thể áp dụng ngay tại nhiều mỏ than vùng Quảng Ninh.”", "type": "quote"}, "Hội đồng nghiệm thu đánh giá đề tài đạt loại xuất sắc và đề nghị tiếp tục hỗ trợ chuyển giao vào thực tiễn sản xuất."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(21, 'en', 'Nghiệm thu đề tài cấp Bộ về công nghệ khai thác than hầm lò', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07'),
	(22, 'vi', 'Ngày hội việc làm & Kết nối doanh nghiệp 2025', 'Hơn 50 doanh nghiệp tham gia tuyển dụng và giao lưu cùng sinh viên HUMG tại Ngày hội việc làm năm 2025.', '["Ngày hội mang đến hàng nghìn vị trí việc làm và thực tập cho sinh viên năm cuối, cùng nhiều hoạt động tư vấn nghề nghiệp, kỹ năng phỏng vấn và viết CV.", {"type": "list", "items": ["Hơn 50 doanh nghiệp trong và ngoài ngành", "Hàng nghìn vị trí việc làm – thực tập", "Phỏng vấn trực tiếp tại gian hàng"]}, "Nhiều sinh viên đã nhận được lời mời phỏng vấn và thư mời thực tập ngay tại sự kiện."]', NULL, NULL, NULL, 'done', '2026-10-04 09:32:38.19799+07'),
	(22, 'en', 'Ngày hội việc làm & Kết nối doanh nghiệp 2025', NULL, '[]', NULL, NULL, NULL, 'missing', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: quick_links; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.quick_links (id, icon, url, is_visible, sort_order) VALUES
	(1, 'calendar', '/lich-cong-tac', true, 0),
	(2, 'library', '/thu-vien-so', true, 1),
	(3, 'play', '/hoc-tap/e-learning', true, 2),
	(4, 'search', '/hoc-tap/tuyen-sinh', true, 3),
	(5, 'file', '/hoc-tap/bieu-mau', true, 4),
	(6, 'mail', '/webmail', true, 5),
	(7, 'grid', '/tien-ich', true, 6),
	(8, 'phone', '/lien-he', true, 7);


--
-- Data for Name: quick_link_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.quick_link_translations (quick_link_id, lang, label) VALUES
	(1, 'vi', 'Lịch công tác'),
	(2, 'vi', 'Thư viện số'),
	(3, 'vi', 'E-learning'),
	(4, 'vi', 'Tra cứu tuyển sinh'),
	(5, 'vi', 'Biểu mẫu'),
	(6, 'vi', 'Webmail'),
	(7, 'vi', 'Tiện ích khác'),
	(8, 'vi', 'Liên hệ');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.role_permissions (role_id, permission_id) VALUES
	(1, 1),
	(1, 2),
	(1, 3),
	(2, 1),
	(2, 2),
	(2, 3),
	(3, 1),
	(3, 2),
	(3, 3),
	(1, 4),
	(2, 4),
	(1, 5),
	(2, 5),
	(1, 6),
	(2, 6),
	(3, 6),
	(1, 7),
	(1, 8),
	(2, 7),
	(2, 8),
	(1, 9),
	(1, 10),
	(1, 11),
	(1, 12),
	(1, 13),
	(2, 13),
	(3, 13);


--
-- Data for Name: settings; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.settings (group_key, key, value, is_secret, updated_by, updated_at) VALUES
	('home', 'heroChips', '["Trường đại học công lập", "60 năm truyền thống", "Đa ngành – Đa lĩnh vực"]', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('general', 'siteName', '"Trường Đại học Mỏ – Địa chất"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('general', 'email', '"cskh@humg.edu.vn"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('general', 'phone', '"024.3838.0355"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('general', 'address', '"18 Phố Viên, Đức Thắng, Bắc Từ Liêm, Hà Nội"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('seo', 'metaTitle', '"Trường Đại học Mỏ – Địa chất | HUMG"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('seo', 'metaDesc', '"Cổng thông tin điện tử Trường Đại học Mỏ – Địa chất – đào tạo, nghiên cứu khoa học lĩnh vực Trái đất, Mỏ, Năng lượng."', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('seo', 'facebook', '"https://facebook.com/humg.edu.vn"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('seo', 'youtube', '"https://youtube.com/@humg"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('seo', 'analytics', '"G-XXXXXXXXXX"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('email', 'smtpHost', '"smtp.humg.edu.vn"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('email', 'smtpPort', '"587"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('email', 'fromName', '"HUMG Digital Portal"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('email', 'fromEmail', '"no-reply@humg.edu.vn"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('language', 'defaultCode', '"vi"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('language', 'enabledCodes', '["vi", "en"]', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('language', 'fallback', '"Hiển thị bản Tiếng Việt (khuyến nghị)"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('language', 'fallbackOptions', '["Hiển thị bản Tiếng Việt (khuyến nghị)", "Ẩn nội dung cho đến khi có bản dịch", "Hiển thị nội dung Tiếng Việt kèm nhãn \"Chưa có bản dịch\""]', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('backup', 'cronSchedule', '"0 3 * * *"', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('backup', 'retentionCount', '7', false, NULL, '2026-10-04 09:32:38.19799+07'),
	('backup', 'storagePath', '"/backup/cms_humg"', false, NULL, '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: site_stats; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.site_stats (id, placement, value, is_visible, sort_order) VALUES
	(1, 'hero', '60+', true, 0),
	(2, 'hero', '20.000+', true, 1),
	(3, 'hero', '52', true, 2),
	(4, 'hero', '600+', true, 3),
	(5, 'about', '60+', true, 0),
	(6, 'about', '20.000+', true, 1),
	(7, 'about', '600+', true, 2),
	(8, 'about', '12', true, 3),
	(9, 'about', '52', true, 4);


--
-- Data for Name: site_stat_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.site_stat_translations (stat_id, lang, label, sub) VALUES
	(1, 'vi', 'Năm phát triển', NULL),
	(2, 'vi', 'Sinh viên, học viên', NULL),
	(3, 'vi', 'Chương trình đào tạo', NULL),
	(4, 'vi', 'Giảng viên, cán bộ', NULL),
	(5, 'vi', 'Năm phát triển', '1966 – 2026'),
	(6, 'vi', 'Sinh viên, học viên', 'Tính đến 2025'),
	(7, 'vi', 'Giảng viên, cán bộ', 'Tính đến 2025'),
	(8, 'vi', 'Đơn vị trực thuộc', NULL),
	(9, 'vi', 'Chương trình đào tạo', NULL);


--
-- Data for Name: strengths; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.strengths (id, icon, is_visible, sort_order) VALUES
	(1, 'flask', true, 0),
	(2, 'award', true, 1),
	(3, 'graduation', true, 2),
	(4, 'briefcase', true, 3);


--
-- Data for Name: strength_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.strength_translations (strength_id, lang, title, text) VALUES
	(1, 'vi', 'Đào tạo gắn thực tiễn', 'Chương trình cập nhật, hệ thống phòng thí nghiệm và thực hành hiện đại.'),
	(2, 'vi', 'Nghiên cứu & Chuyển giao', 'Nhóm nghiên cứu mạnh, hàng trăm công bố quốc tế và sản phẩm chuyển giao.'),
	(3, 'vi', 'Học bổng & Hỗ trợ', 'Học bổng đến 100% học phí cùng quỹ đồng hành và hỗ trợ sinh viên.'),
	(4, 'vi', 'Việc làm sau tốt nghiệp', 'Mạng lưới doanh nghiệp rộng, ngày hội việc làm và kết nối tuyển dụng.');


--
-- Data for Name: videos; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.videos (id, slug, channel, duration_sec, video_url, thumbnail_id, view_count, published_at, is_visible, created_at, updated_at) VALUES
	(1, 'humg-60-nam-mot-chang-duong', 'HUMG Media', 924, NULL, NULL, 8420, '2026-05-12', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(2, 'gioi-thieu-nganh-ky-thuat-mo', 'Tư vấn tuyển sinh', 372, NULL, NULL, 3110, '2026-04-28', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(3, 'campus-tour-humg', 'HUMG Media', 527, NULL, NULL, 5230, '2026-04-15', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07'),
	(4, 'huong-dan-dang-ky-xet-tuyen', 'Tư vấn tuyển sinh', 298, NULL, NULL, 6740, '2026-05-05', true, '2026-10-04 09:32:38.19799+07', '2026-10-04 09:32:38.19799+07');


--
-- Data for Name: video_translations; Type: TABLE DATA; Schema: cms; Owner: -
--

INSERT INTO cms.video_translations (video_id, lang, title, description) VALUES
	(1, 'vi', 'HUMG – 60 năm một chặng đường', 'Phim tài liệu nhìn lại chặng đường 60 năm xây dựng và phát triển của Trường Đại học Mỏ - Địa chất.'),
	(2, 'vi', 'Giới thiệu ngành Kỹ thuật Mỏ', 'Tổng quan về ngành Kỹ thuật Mỏ: chương trình đào tạo, cơ hội nghề nghiệp và chia sẻ từ cựu sinh viên.'),
	(3, 'vi', 'Campus tour Trường Đại học Mỏ - Địa chất', 'Dạo quanh khuôn viên, giảng đường, thư viện, phòng thí nghiệm và khu ký túc xá của HUMG.'),
	(4, 'vi', 'Hướng dẫn đăng ký xét tuyển trực tuyến', 'Các bước đăng ký xét tuyển trực tuyến vào HUMG năm 2026, kèm lưu ý quan trọng cho thí sinh.');


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.activity_logs_id_seq', 8, true);


--
-- Name: album_photos_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.album_photos_id_seq', 46, true);


--
-- Name: albums_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.albums_id_seq', 4, true);


--
-- Name: audiences_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.audiences_id_seq', 6, true);


--
-- Name: backups_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.backups_id_seq', 4, true);


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.banners_id_seq', 5, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.categories_id_seq', 10, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.events_id_seq', 6, true);


--
-- Name: hero_slides_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.hero_slides_id_seq', 5, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.media_id_seq', 10, true);


--
-- Name: menu_groups_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.menu_groups_id_seq', 3, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.menu_items_id_seq', 8, true);


--
-- Name: pages_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.pages_id_seq', 13, true);


--
-- Name: partners_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.partners_id_seq', 14, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.permissions_id_seq', 13, true);


--
-- Name: podcasts_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.podcasts_id_seq', 4, true);


--
-- Name: post_attachments_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.post_attachments_id_seq', 8, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.posts_id_seq', 22, true);


--
-- Name: quick_links_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.quick_links_id_seq', 8, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.roles_id_seq', 4, true);


--
-- Name: site_stats_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.site_stats_id_seq', 9, true);


--
-- Name: strengths_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.strengths_id_seq', 4, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.tags_id_seq', 27, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.users_id_seq', 11, true);


--
-- Name: videos_id_seq; Type: SEQUENCE SET; Schema: cms; Owner: -
--

SELECT pg_catalog.setval('cms.videos_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--


COMMIT;
