-- ============================================================================
-- HUMG eUni — cms-api (.NET): lược đồ lưu trữ dữ liệu trên PostgreSQL 16
--
-- Nguyên tắc theo tài liệu "Kiến trúc code cms-api":
--   · MỘT database, MỘT CmsDb; mọi nghiệp vụ ghi (nội dung + revision + workflow history + audit [+ outbox]) cùng MỘT transaction.
--   · Cô lập tenant bằng Row-Level Security: ứng dụng kết nối bằng role cms_app (NOBYPASSRLS), mỗi transaction đặt
--       set_config('app.tenant_ids', 'humg,cntt', true)   -- tenant được ĐỌC (thường 1; nhiều khi xem hộp thư đa trang)
--       set_config('app.tenant_id',  'humg',      true)   -- tenant đang GHI (WITH CHECK)
--   · Tác vụ đồng bộ / seed / sao lưu / dựng lại dùng role riêng cms_admin (BYPASSRLS) — không dùng chung với ứng dụng.
--   · Không có bảng con "mồ côi" khỏi RLS: bản ghi con (translations, targets, receipts, attachments…) nằm TRONG tài liệu của bản ghi cha
--     và mang tenant_id của cha, nên không thể đọc/ghi chéo tenant bằng truy vấn trực tiếp vào bảng con.
--
-- Mỗi "collection" (contents, announcements, grants, revisions, audit…) là một tập tài liệu JSONB có id số theo collection.
-- Đây là giai đoạn 1 (hợp đồng API = mock). Lược đồ quan hệ đầy đủ database/v2/schema.sql là đích tiếp theo (xem README).
--
-- Chạy bằng cms_admin:  psql -v ON_ERROR_STOP=1 -f database/cms-api/schema.sql   (ứng dụng cũng tự chạy khi khởi động)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS cms_api;

-- Tenant được phép ĐỌC / tenant đang GHI trong transaction hiện tại (do ứng dụng SET LOCAL). Thiếu → không thấy dòng nào.
CREATE OR REPLACE FUNCTION cms_api.current_tenant() RETURNS text LANGUAGE sql STABLE AS
$$ SELECT coalesce(current_setting('app.tenant_id', true), '') $$;

CREATE OR REPLACE FUNCTION cms_api.read_tenants() RETURNS text[] LANGUAGE sql STABLE AS
$$ SELECT CASE WHEN coalesce(current_setting('app.tenant_ids', true), '') = ''
               THEN ARRAY[cms_api.current_tenant()]
               ELSE string_to_array(current_setting('app.tenant_ids', true), ',') END $$;

-- Dữ liệu dùng chung toàn trường (đồng bộ từ IdS / QLNS / QLĐT hoặc cấu hình hệ thống): tenant, danh bạ, cây đơn vị, ngôn ngữ, metadata.
CREATE TABLE IF NOT EXISTS cms_api.global_documents (
  collection text   NOT NULL,
  key        text   NOT NULL,
  ord        bigint GENERATED ALWAYS AS IDENTITY,
  doc        jsonb  NOT NULL,
  PRIMARY KEY (collection, key)
);
CREATE INDEX IF NOT EXISTS ix_global_docs_ord ON cms_api.global_documents (collection, ord);

-- Dữ liệu nghiệp vụ theo tenant — có RLS.
CREATE TABLE IF NOT EXISTS cms_api.tenant_documents (
  collection text        NOT NULL,
  key        text        NOT NULL,
  tenant_id  varchar(32) NOT NULL,
  ord        bigint      GENERATED ALWAYS AS IDENTITY,
  doc        jsonb       NOT NULL,
  PRIMARY KEY (collection, key),
  CHECK (doc ->> 'tenantId' IS NULL OR doc ->> 'tenantId' = tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_tenant_docs_scan   ON cms_api.tenant_documents (tenant_id, collection, ord);
CREATE INDEX IF NOT EXISTS ix_tenant_docs_status ON cms_api.tenant_documents (tenant_id, collection, (doc ->> 'status'));

-- Bộ đếm id theo collection (nằm trong transaction ghi: hủy transaction thì hoàn lại id)
CREATE TABLE IF NOT EXISTS cms_api.sequences (
  collection text   PRIMARY KEY,
  last_id    bigint NOT NULL
);

CREATE OR REPLACE FUNCTION cms_api.next_id(p_collection text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE v bigint;
BEGIN
  INSERT INTO cms_api.sequences (collection, last_id)
  VALUES (p_collection, 1 + coalesce((SELECT max(key::bigint) FROM cms_api.tenant_documents WHERE collection = p_collection AND key ~ '^[0-9]+$'), 0)
                          + coalesce((SELECT max(key::bigint) FROM cms_api.global_documents WHERE collection = p_collection AND key ~ '^[0-9]+$'), 0))
  ON CONFLICT (collection) DO UPDATE SET last_id = cms_api.sequences.last_id + 1
  RETURNING last_id INTO v;
  RETURN v;
END $$;

-- ---------------------------------------------------------------- Row-Level Security
ALTER TABLE cms_api.tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_api.tenant_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_tenant ON cms_api.tenant_documents;
CREATE POLICY p_tenant ON cms_api.tenant_documents
  USING      (tenant_id = ANY (cms_api.read_tenants()))
  WITH CHECK (tenant_id = cms_api.current_tenant());

-- ---------------------------------------------------------------- Role
-- cms_app (ứng dụng, NOBYPASSRLS) và cms_admin (đồng bộ/seed/sao lưu, BYPASSRLS) do DBA tạo — xem database/cms-api/setup-dev.sh
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cms_app') THEN
    GRANT USAGE ON SCHEMA cms_api TO cms_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON cms_api.tenant_documents TO cms_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON cms_api.global_documents TO cms_app;
    GRANT SELECT, INSERT, UPDATE ON cms_api.sequences TO cms_app;
    GRANT EXECUTE ON FUNCTION cms_api.next_id(text), cms_api.current_tenant(), cms_api.read_tenants() TO cms_app;
  END IF;
END $$;
