-- Kiểm thử cô lập tenant (RLS) của lược đồ cms_api bằng role ứng dụng cms_app.
--   sudo -u postgres psql -d euni_cms -v ON_ERROR_STOP=1 -f database/cms-api/schema.sql -f database/cms-api/test.sql   (cần superuser để SET ROLE cms_app)
-- (chạy trong một transaction rồi ROLLBACK; sai thì RAISE EXCEPTION)
BEGIN;
INSERT INTO cms_api.tenant_documents (collection, key, tenant_id, doc) VALUES ('t_rls', '1', 'humg', '{"tenantId":"humg"}'), ('t_rls', '2', 'cntt', '{"tenantId":"cntt"}');
SET LOCAL ROLE cms_app;
-- không có ngữ cảnh tenant → không thấy gì
DO $$ BEGIN IF (SELECT count(*) FROM cms_api.tenant_documents WHERE collection = 't_rls') <> 0 THEN RAISE EXCEPTION 'thiếu ngữ cảnh tenant mà vẫn thấy dữ liệu'; END IF; END $$;
SELECT set_config('app.tenant_ids', 'humg', true), set_config('app.tenant_id', 'humg', true);
DO $$ BEGIN IF (SELECT count(*) FROM cms_api.tenant_documents WHERE collection = 't_rls') <> 1 THEN RAISE EXCEPTION 'humg phải thấy đúng 1 dòng'; END IF; END $$;
-- ghi sang tenant khác bị chặn
DO $$ BEGIN
  INSERT INTO cms_api.tenant_documents (collection, key, tenant_id, doc) VALUES ('t_rls', '3', 'cntt', '{}');
  RAISE EXCEPTION 'RLS không chặn ghi sang tenant khác';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
-- đọc đa trang có chủ đích
SELECT set_config('app.tenant_ids', 'humg,cntt', true);
DO $$ BEGIN IF (SELECT count(*) FROM cms_api.tenant_documents WHERE collection = 't_rls') <> 2 THEN RAISE EXCEPTION 'đọc đa trang phải thấy 2 dòng'; END IF; END $$;
-- cms_app không phải BYPASSRLS
DO $$ BEGIN IF (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN RAISE EXCEPTION 'cms_app không được BYPASSRLS'; END IF; END $$;
\echo 'cms_api RLS: tất cả kiểm tra đạt'
ROLLBACK;
