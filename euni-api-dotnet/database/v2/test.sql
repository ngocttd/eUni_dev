-- Kiểm thử nhanh schema v2 (chạy trên DB vừa tạo bằng schema.sql, trong một transaction rồi ROLLBACK)
--   psql -v ON_ERROR_STOP=1 -f database/v2/schema.sql -f database/v2/test.sql
-- Mỗi kiểm tra sai sẽ RAISE EXCEPTION → psql dừng với lỗi.
BEGIN;
SET search_path TO cms, public;

INSERT INTO tenants (id, name, root_unit) VALUES ('humg', 'Trường ĐH Mỏ - Địa chất', 'HUMG'), ('cntt', 'Khoa CNTT', 'CNTT');
INSERT INTO org_units (code, name, kind, parent_code, path) VALUES
  ('HUMG', 'Trường ĐH Mỏ - Địa chất', 'school', NULL, 'HUMG'),
  ('CNTT', 'Khoa Công nghệ thông tin', 'faculty', 'HUMG', 'HUMG.CNTT'),
  ('BM-KHMT', 'Bộ môn Khoa học máy tính', 'department', 'CNTT', 'HUMG.CNTT.BM_KHMT'),
  ('DCCTKT66A', 'Lớp DCCTKT66A', 'class', 'BM-KHMT', 'HUMG.CNTT.BM_KHMT.DCCTKT66A'),
  ('P-TT', 'Phòng Truyền thông', 'office', 'HUMG', 'HUMG.P_TT');

-- ghi dữ liệu với vai trò ứng dụng + tenant humg
SET LOCAL ROLE cms_app;
SET LOCAL app.tenant_id = 'humg';

INSERT INTO news (tenant_id, owner_unit_code, status, publish_at, author_sub, created_by)
VALUES ('humg', 'BM-KHMT', 'published', now() - interval '1 hour', 'u-author', 'u-author'),
       ('humg', 'P-TT', 'published', now() + interval '1 day', 'u-author', 'u-author');   -- hẹn giờ
INSERT INTO news_translations (news_id, lang, tenant_id, slug, title, excerpt, body_text)
SELECT id, 'vi', 'humg', 'bai-' || id, CASE WHEN owner_unit_code = 'BM-KHMT' THEN 'Hội thảo Trắc địa và GIS' ELSE 'Thông tin tuyển sinh' END, 'Tóm tắt', 'Nội dung đào tạo'
FROM news;

-- RLS: ghi sai tenant bị chặn
DO $$ BEGIN
  INSERT INTO cms.news (tenant_id, status, author_sub, created_by) VALUES ('cntt', 'draft', 'x', 'x');
  RAISE EXCEPTION 'RLS không chặn ghi sang tenant khác';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

-- 1) chỉ bài đã đến giờ mới lên website
DO $$ BEGIN
  IF (SELECT count(*) FROM cms.v_news_live) <> 1 THEN RAISE EXCEPTION 'v_news_live phải có đúng 1 bài'; END IF;
END $$;

-- 2) tìm kiếm không dấu
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM cms.news_translations WHERE search_text LIKE '%' || cms.f_search_norm('hoi thao trac dia') || '%') THEN
    RAISE EXCEPTION 'tìm kiếm không dấu thất bại';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cms.news_translations WHERE search_text LIKE '%' || cms.f_search_norm('ĐÀO TẠO') || '%') THEN
    RAISE EXCEPTION 'tìm kiếm có dấu / chữ hoa thất bại';
  END IF;
END $$;

-- 3) ACL: grant review trên unit CNTT áp dụng cho bài của BM-KHMT (đơn vị con), không áp cho P-TT
INSERT INTO access_grants (tenant_id, principal_type, principal_id, resource_type, scope_type, scope_id, permissions, created_by)
VALUES ('humg', 'user', 'u-truongkhoa', 'news', 'unit', 'CNTT', '{review}', 'admin');
DO $$ DECLARE ok int; BEGIN
  SELECT count(*) INTO ok FROM cms.news n WHERE cms.news_allowed(n, ARRAY['user:u-truongkhoa'], 'review');
  IF ok <> 1 THEN RAISE EXCEPTION 'grant theo đơn vị phải khớp đúng 1 bài, được %', ok; END IF;
  SELECT count(*) INTO ok FROM cms.news n WHERE cms.news_allowed(n, ARRAY['user:u-truongkhoa'], 'view');
  IF ok <> 1 THEN RAISE EXCEPTION 'review phải bao hàm view'; END IF;
  SELECT count(*) INTO ok FROM cms.news n WHERE cms.news_allowed(n, ARRAY['user:u-truongkhoa'], 'publish');
  IF ok <> 0 THEN RAISE EXCEPTION 'review không được bao hàm publish'; END IF;
END $$;

-- 4) hộp thư thông báo
INSERT INTO announcements (tenant_id, owner_unit_code, status, publish_at, author_sub, created_by)
VALUES ('humg', 'CNTT', 'published', now() - interval '1 hour', 'u-gv', 'u-gv'),      -- a1: SV Khoa CNTT
       ('humg', 'HUMG', 'published', now() - interval '1 hour', 'u-gv', 'u-gv'),      -- a2: toàn bộ GV
       ('humg', 'HUMG', 'published', now() - interval '1 hour', 'u-gv', 'u-gv'),      -- a3: mọi người trừ lớp DCCTKT66A
       ('humg', 'HUMG', 'published', now() - interval '1 hour', 'u-gv', 'u-gv');      -- a4: cá nhân u-sv
INSERT INTO announcement_targets (announcement_id, audience, unit_code, user_sub, is_exclude)
SELECT id, v.audience, v.unit_code, v.user_sub, v.is_exclude
FROM (SELECT id, row_number() OVER (ORDER BY id) rn FROM announcements) a
JOIN (VALUES (1, 'student', 'CNTT', NULL, false), (2, 'staff', NULL, NULL, false),
             (3, NULL, NULL, NULL, false), (3, NULL, 'DCCTKT66A', NULL, true),
             (4, NULL, NULL, 'u-sv', false)) v(rn, audience, unit_code, user_sub, is_exclude) ON v.rn = a.rn;

RESET ROLE;  -- units_with_ancestors đọc org_units (bảng toàn cục)
DO $$ DECLARE n int; units text[]; BEGIN
  units := cms.units_with_ancestors('{DCCTKT66A}');
  IF NOT units @> ARRAY['DCCTKT66A','BM-KHMT','CNTT','HUMG'] THEN RAISE EXCEPTION 'mở rộng đơn vị cha sai: %', units; END IF;
  PERFORM set_config('app.tenant_id', 'humg', true);
  -- SV lớp DCCTKT66A: thấy a1 (SV khoa CNTT) + a4 (cá nhân); không thấy a2 (GV), a3 (bị loại trừ)
  SELECT count(*) INTO n FROM cms.inbox('u-sv', '{student}', units);
  IF n <> 2 THEN RAISE EXCEPTION 'hộp thư SV phải có 2 thông báo, được %', n; END IF;
  -- GV không thuộc lớp: thấy a2 + a3
  SELECT count(*) INTO n FROM cms.inbox('u-gv2', '{staff}', cms.units_with_ancestors('{BM-KHMT}'));
  IF n <> 2 THEN RAISE EXCEPTION 'hộp thư GV phải có 2 thông báo, được %', n; END IF;
END $$;

-- 5) tenant khác không thấy dữ liệu của humg
SET LOCAL ROLE cms_app;
SET LOCAL app.tenant_id = 'cntt';
DO $$ BEGIN
  IF (SELECT count(*) FROM cms.news) <> 0 OR (SELECT count(*) FROM cms.announcements) <> 0 THEN RAISE EXCEPTION 'RLS lộ dữ liệu sang tenant cntt'; END IF;
END $$;

-- 5b) RLS cho BẢNG CON: truy vấn TRỰC TIẾP vào bảng con (không JOIN bảng cha) cũng không được lộ dữ liệu tenant khác
SET LOCAL app.tenant_id = 'cntt';
DO $$ DECLARE n int; t text; BEGIN
  FOREACH t IN ARRAY ARRAY['announcement_targets','announcement_translations','announcement_receipts','announcement_attachments','news_attachments',
                           'event_translations','menu_item_translations','banner_translations','media_item_translations','home_block_translations'] LOOP
    EXECUTE format('SELECT count(*) FROM cms.%I', t) INTO n;
    IF n <> 0 THEN RAISE EXCEPTION 'RLS lộ dòng của bảng con % sang tenant cntt (%)', t, n; END IF;
  END LOOP;
  -- ghi dòng con trỏ vào bản ghi cha của tenant khác phải bị chặn
  BEGIN
    INSERT INTO cms.announcement_targets (announcement_id, audience) SELECT 1, 'student';
    RAISE EXCEPTION 'RLS không chặn ghi vào bảng con của tenant khác';
  EXCEPTION WHEN insufficient_privilege OR foreign_key_violation THEN NULL; END;
END $$;
-- tenant humg thấy đủ dòng con của mình
SET LOCAL app.tenant_id = 'humg';
DO $$ BEGIN
  IF (SELECT count(*) FROM cms.announcement_targets) = 0 THEN RAISE EXCEPTION 'humg phải thấy announcement_targets của mình'; END IF;
END $$;

-- 6) audit chỉ ghi thêm
SET LOCAL app.tenant_id = 'humg';
INSERT INTO audit_logs (tenant_id, actor_sub, action, entity_type, entity_id, changes) VALUES ('humg', 'u-author', 'news.update', 'news', '1', '{"title": ["a", "b"]}');
DO $$ BEGIN
  UPDATE cms.audit_logs SET action = 'x';
  RAISE EXCEPTION 'audit_logs không được phép UPDATE';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

\echo 'v2 schema: tất cả kiểm tra đạt'
ROLLBACK;
