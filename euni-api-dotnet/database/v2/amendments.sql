-- ============================================================================
-- Bổ sung cho schema v2 (v2.1) — áp SAU database/v2/schema.sql. Idempotent.
-- Lý do: API hiện tại (hợp đồng của mock) dùng một số trường/giá trị mà v2 chưa có chỗ chứa. Mỗi mục ghi rõ nguyên nhân.
--   · extra jsonb: các trường dài đuôi của bản ghi (không cần truy vấn/ràng buộc) — ghi/đọc lossless, không phải thêm cột cho từng trường UI
--   · FK DEFERRABLE INITIALLY DEFERRED: một transaction ghi nhiều bảng (news ↔ revisions ↔ pending_revision_id…) không phụ thuộc thứ tự câu lệnh
-- ============================================================================
SET search_path TO cms, public;

-- ---- cột extra cho mọi bảng cha được API ghi
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['tenants','languages','user_directory','access_grants','categories','media','news','announcements','events','pages','menu_items',
                           'banners','media_items','home_blocks','revisions','workflow_history','outbox'] LOOP
    EXECUTE format('ALTER TABLE cms.%I ADD COLUMN IF NOT EXISTS extra jsonb NOT NULL DEFAULT ''{}''::jsonb', t);
  END LOOP;
END $$;

-- ---- danh mục / người dùng
ALTER TABLE cms.languages ADD COLUMN IF NOT EXISTS flag varchar(16);
ALTER TABLE cms.tenants ADD COLUMN IF NOT EXISTS created_by varchar(128);
ALTER TABLE cms.tenants ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE cms.tenants ADD COLUMN IF NOT EXISTS updated_by varchar(128);
-- Danh bạ phục vụ đăng nhập mock (IdS thật quản lý các trường này): id nội bộ, username, tenant mà người dùng thuộc về, trạng thái
ALTER TABLE cms.user_directory ADD COLUMN IF NOT EXISTS legacy_id bigint;
ALTER TABLE cms.user_directory ADD COLUMN IF NOT EXISTS username varchar(128);
ALTER TABLE cms.user_directory ADD COLUMN IF NOT EXISTS tenants text[] NOT NULL DEFAULT '{humg}';
ALTER TABLE cms.user_directory ADD COLUMN IF NOT EXISTS status smallint NOT NULL DEFAULT 1;
ALTER TABLE cms.user_directory ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- ---- tin tức: tệp đính kèm có thể chỉ là liên kết (chưa gắn media)
ALTER TABLE cms.news_attachments ADD COLUMN IF NOT EXISTS url varchar(500);
ALTER TABLE cms.news_attachments ADD COLUMN IF NOT EXISTS extra jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ---- thông báo
ALTER TABLE cms.announcements ADD COLUMN IF NOT EXISTS author_display varchar(255);
ALTER TABLE cms.announcement_targets DROP CONSTRAINT IF EXISTS announcement_targets_audience_check;
ALTER TABLE cms.announcement_targets ADD CONSTRAINT announcement_targets_audience_check
  CHECK (audience IN ('student','lecturer','staff','manager','parent','applicant','alumni'));          -- realm role trên SSO
ALTER TABLE cms.announcement_attachments ALTER COLUMN media_id DROP NOT NULL;
ALTER TABLE cms.announcement_attachments ADD COLUMN IF NOT EXISTS title varchar(255);
ALTER TABLE cms.announcement_attachments ADD COLUMN IF NOT EXISTS meta varchar(128);
ALTER TABLE cms.announcement_attachments ADD COLUMN IF NOT EXISTS extra jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE cms.announcement_receipts ADD COLUMN IF NOT EXISTS id bigint GENERATED ALWAYS AS IDENTITY;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ann_receipts_id ON cms.announcement_receipts (id);

-- ---- revision: lý do từ chối bản sửa đổi
ALTER TABLE cms.revisions ADD COLUMN IF NOT EXISTS review_note text;

-- ---- trang: trang hệ thống có route riêng (path); slug không duy nhất giữa các trang hệ thống
ALTER TABLE cms.pages ADD COLUMN IF NOT EXISTS path varchar(255);
DROP INDEX IF EXISTS cms.uq_page_slug;
CREATE INDEX IF NOT EXISTS ix_page_slug ON cms.page_translations (tenant_id, lang, slug);

-- ---- menu: tiêu đề cột (heading) không có URL, có icon; trạng thái bản dịch nhãn
ALTER TABLE cms.menu_items DROP CONSTRAINT IF EXISTS menu_items_type_check;
ALTER TABLE cms.menu_items ADD CONSTRAINT menu_items_type_check CHECK (type IN ('page','link','category','heading'));
ALTER TABLE cms.menu_items ALTER COLUMN url DROP NOT NULL;
ALTER TABLE cms.menu_items ADD COLUMN IF NOT EXISTS icon varchar(48);
ALTER TABLE cms.menu_item_translations ADD COLUMN IF NOT EXISTS translation_status cms.translation_status NOT NULL DEFAULT 'done';

-- ---- banner: CMS cho phép "hết hạn ngay" bằng cách đặt ngày kết thúc trong quá khứ (hợp đồng + sync-test); CHECK ends_on >= starts_on của v2 làm API trả 422
ALTER TABLE cms.banners DROP CONSTRAINT IF EXISTS banners_check;

-- ---- sao lưu (dữ liệu hệ thống, bản chụp bao trùm mọi tenant → không RLS) và metadata dùng chung
CREATE TABLE IF NOT EXISTS cms.backups (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       varchar(32),
  file_path       varchar(500) NOT NULL,
  size_bytes      bigint       NOT NULL DEFAULT 0,
  trigger         varchar(16)  NOT NULL DEFAULT 'manual',
  created_by_name varchar(255),
  status          varchar(16)  NOT NULL DEFAULT 'success',
  created_at      timestamptz  NOT NULL DEFAULT now(),
  extra           jsonb        NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS cms.backup_snapshots (
  backup_id bigint PRIMARY KEY REFERENCES cms.backups(id) ON DELETE CASCADE,
  data      text   NOT NULL
);
CREATE TABLE IF NOT EXISTS cms.app_meta (          -- i18nCoverage, trend, searchPages, menuGroups, defaultSettings, schemaVersion
  key   varchar(64) PRIMARY KEY,
  value jsonb       NOT NULL
);

-- ---- partition audit theo tháng: tạo sẵn tháng hiện tại và tháng sau (job hằng tháng gọi lại hàm này)
CREATE OR REPLACE FUNCTION cms.ensure_audit_partition(p_month date) RETURNS void LANGUAGE plpgsql AS $$
DECLARE s date := date_trunc('month', p_month)::date; e date := (date_trunc('month', p_month) + interval '1 month')::date; n text := 'audit_logs_' || to_char(p_month, 'YYYY_MM');
BEGIN
  IF to_regclass('cms.' || n) IS NULL THEN
    EXECUTE format('CREATE TABLE cms.%I PARTITION OF cms.audit_logs FOR VALUES FROM (%L) TO (%L)', n, s, e);
  END IF;
END $$;
SELECT cms.ensure_audit_partition(current_date), cms.ensure_audit_partition((current_date + interval '1 month')::date);

-- ---- FK hoãn kiểm tra tới lúc commit
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conrelid::regclass AS tbl, conname FROM pg_constraint WHERE contype = 'f' AND connamespace = 'cms'::regnamespace AND NOT condeferrable LOOP
    EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED', r.tbl, r.conname);
  END LOOP;
END $$;

-- ---- RLS: ĐỌC nhiều tenant có chủ đích, GHI chỉ một tenant
-- v2 gốc: tenant_id = current_tenant() cho cả đọc lẫn ghi. API cần vài use case đọc xuyên trang (hộp thư đa trang X-Tenant:*, ngữ cảnh người dùng
-- liệt kê các trang được quản trị, danh sách trang đơn vị) nên ứng dụng đặt thêm app.tenant_ids (danh sách được ĐỌC); ghi vẫn chỉ vào app.tenant_id.
CREATE OR REPLACE FUNCTION cms.read_tenants() RETURNS text[] LANGUAGE sql STABLE AS
$$ SELECT CASE WHEN coalesce(current_setting('app.tenant_ids', true), '') = '' THEN ARRAY[cms.current_tenant()]
               ELSE string_to_array(current_setting('app.tenant_ids', true), ',') END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['access_grants','categories','category_translations','media','news','news_translations','announcements','revisions','workflow_history',
                           'audit_logs','outbox','events','pages','page_translations','menu_items','banners','media_items','home_blocks','settings'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS p_tenant ON cms.%I', t);
    EXECUTE format('CREATE POLICY p_tenant ON cms.%I USING (tenant_id = ANY (cms.read_tenants())) WITH CHECK (tenant_id = cms.current_tenant())', t);
  END LOOP;
END $$;

-- ---- quyền: CMS có API quản lý trang đơn vị (chỉ cms.admin, kiểm tra ở use case) nên role ứng dụng được ghi tenants/tenant_domains
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cms TO cms_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA cms TO cms_app;
REVOKE UPDATE, DELETE ON cms.audit_logs FROM cms_app;
REVOKE INSERT, UPDATE, DELETE ON cms.org_units, cms.languages FROM cms_app;     -- chỉ job đồng bộ (cms_admin) được ghi
