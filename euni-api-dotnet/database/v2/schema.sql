-- ============================================================================
-- HUMG eUni CMS — schema PostgreSQL v2 (tham chiếu cho backend .NET)
-- Thiết kế: docs/design/CMS_DESIGN.md
--
-- Khác v1 (database/schema.sql):
--   · Multi-tenant: mọi bảng nghiệp vụ có tenant_id + Row-Level Security
--   · User / role KHÔNG còn ở đây (quản lý trên Identity Server); tham chiếu người dùng bằng `sub` (varchar)
--   · Workflow draft → pending_review → published → archived + publish_at / expire_at
--   · Revision (snapshot jsonb), soft delete (deleted_at/by), audit append-only (partition theo tháng)
--   · Phân quyền mức bản ghi: access_grants (tenant | category | unit | record)
--   · Announcement tách bảng: targets (audience × unit × user), receipts
--   · Tìm kiếm tiếng Việt: unaccent + pg_trgm (hàm IMMUTABLE f_unaccent, cột generated search_text)
--
-- Chạy:  psql -v ON_ERROR_STOP=1 -f database/v2/schema.sql
-- Ứng dụng kết nối bằng role cms_app (KHÔNG BYPASSRLS) và mỗi transaction: SET LOCAL app.tenant_id = '<tenant>'
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE SCHEMA IF NOT EXISTS cms;
SET search_path TO cms, public;

-- ---------- tiện ích ----------
CREATE OR REPLACE FUNCTION cms.f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Chuẩn hóa để tìm kiếm: bỏ dấu, chữ thường, đ → d
CREATE OR REPLACE FUNCTION cms.f_search_norm(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT replace(cms.f_unaccent(lower($1)), 'đ', 'd') $$;

CREATE OR REPLACE FUNCTION cms.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Tenant hiện hành (do ứng dụng đặt bằng SET LOCAL). Thiếu → '' (không thấy dòng nào).
CREATE OR REPLACE FUNCTION cms.current_tenant() RETURNS text LANGUAGE sql STABLE AS
$$ SELECT coalesce(current_setting('app.tenant_id', true), '') $$;

DO $$ BEGIN
  CREATE TYPE cms.workflow_status AS ENUM ('draft', 'pending_review', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE cms.translation_status AS ENUM ('missing', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 1. TENANT · NGÔN NGỮ · ĐƠN VỊ · DANH BẠ (chỉ đọc, đồng bộ từ IdS / QLNS / QLĐT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms.tenants (
  id            varchar(32)  PRIMARY KEY,                 -- humg, cntt …
  name          varchar(255) NOT NULL,
  root_unit     varchar(48),                              -- đơn vị gốc của tenant trong org_units
  default_lang  varchar(8)   NOT NULL DEFAULT 'vi',
  is_active     boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cms.tenant_domains (
  host       varchar(255) PRIMARY KEY,                    -- cntt.humg.edu.vn
  tenant_id  varchar(32)  NOT NULL REFERENCES cms.tenants(id) ON DELETE CASCADE,
  is_primary boolean      NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS cms.languages (
  code       varchar(8)  PRIMARY KEY,
  label      varchar(64) NOT NULL,
  is_source  boolean     NOT NULL DEFAULT false,
  is_enabled boolean     NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_languages_source ON cms.languages (is_source) WHERE is_source;

-- Cây đơn vị (toàn trường, dùng chung mọi tenant) — bản sao của QLNS/QLĐT
CREATE TABLE IF NOT EXISTS cms.org_units (
  code        varchar(48)  PRIMARY KEY,                   -- HUMG, CNTT, BM-KHMT, DCCTKT66A
  name        varchar(255) NOT NULL,
  kind        varchar(16)  NOT NULL CHECK (kind IN ('school','faculty','department','office','center','class')),
  parent_code varchar(48)  REFERENCES cms.org_units(code),
  path        ltree        NOT NULL,                      -- HUMG.CNTT.BM_KHMT.DCCTKT66A
  is_active   boolean      NOT NULL DEFAULT true,
  synced_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_org_units_path ON cms.org_units USING gist (path);
CREATE INDEX IF NOT EXISTS ix_org_units_parent ON cms.org_units (parent_code);

-- Danh bạ người dùng (cache từ IdS) — chỉ để hiển thị / tìm người khi cấp quyền, nhắm thông báo
CREATE TABLE IF NOT EXISTS cms.user_directory (
  sub           varchar(128) PRIMARY KEY,
  display_name  varchar(255) NOT NULL,
  email         varchar(255),
  staff_code    varchar(32),
  student_code  varchar(32),
  roles         text[]       NOT NULL DEFAULT '{}',
  units         text[]       NOT NULL DEFAULT '{}',       -- đơn vị/lớp trực tiếp
  last_seen_at  timestamptz,
  synced_at     timestamptz  NOT NULL DEFAULT now(),
  search_text   text GENERATED ALWAYS AS (cms.f_search_norm(display_name || ' ' || coalesce(email,'') || ' ' || coalesce(staff_code,'') || ' ' || coalesce(student_code,''))) STORED
);
CREATE INDEX IF NOT EXISTS ix_user_dir_search ON cms.user_directory USING gin (search_text gin_trgm_ops);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_dir_email ON cms.user_directory (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_dir_staff ON cms.user_directory (staff_code) WHERE staff_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_dir_student ON cms.user_directory (student_code) WHERE student_code IS NOT NULL;

-- ============================================================================
-- 2. PHÂN QUYỀN MỨC BẢN GHI
--    Quyền hiệu lực = quyền chức năng (role trong token) AND có grant khớp phạm vi.
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms.access_grants (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id      varchar(32)  NOT NULL REFERENCES cms.tenants(id),
  principal_type varchar(8)   NOT NULL CHECK (principal_type IN ('user','unit','role')),
  principal_id   varchar(128) NOT NULL,                   -- sub | unit code | role
  resource_type  varchar(24)  NOT NULL CHECK (resource_type IN ('*','news','announcement','page','media','event','banner')),
  scope_type     varchar(12)  NOT NULL CHECK (scope_type IN ('tenant','category','unit','record')),
  scope_id       varchar(64),                             -- null | category id | unit code | record id
  permissions    text[]       NOT NULL CHECK (permissions <@ ARRAY['view','edit','review','publish','manage']::text[] AND cardinality(permissions) > 0),
  note           varchar(500),
  expires_at     timestamptz,
  created_by     varchar(128) NOT NULL,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  deleted_by     varchar(128),
  CHECK ((scope_type = 'tenant') = (scope_id IS NULL))
);
CREATE INDEX IF NOT EXISTS ix_grants_principal ON cms.access_grants (tenant_id, principal_type, principal_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_grants_scope ON cms.access_grants (tenant_id, resource_type, scope_type, scope_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. DANH MỤC · MEDIA
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms.categories (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id   varchar(32) NOT NULL REFERENCES cms.tenants(id),
  parent_id   bigint      REFERENCES cms.categories(id),
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  varchar(128)
);
CREATE TABLE IF NOT EXISTS cms.category_translations (
  category_id bigint      NOT NULL REFERENCES cms.categories(id) ON DELETE CASCADE,
  lang        varchar(8)  NOT NULL REFERENCES cms.languages(code),
  tenant_id   varchar(32) NOT NULL,
  name        varchar(190) NOT NULL,
  slug        varchar(190) NOT NULL,
  description text,
  PRIMARY KEY (category_id, lang)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_category_slug ON cms.category_translations (tenant_id, lang, slug);

CREATE TABLE IF NOT EXISTS cms.media (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       varchar(32)  NOT NULL REFERENCES cms.tenants(id),
  bucket          varchar(32)  NOT NULL CHECK (bucket IN ('cms-public','cms-private')),
  object_key      varchar(500) NOT NULL,                  -- {tenant}/yyyy/MM/{uuid}.{ext}
  file_name       varchar(255) NOT NULL,
  kind            varchar(16)  NOT NULL CHECK (kind IN ('image','document','video','audio','other')),
  mime_type       varchar(128),
  size_bytes      bigint       NOT NULL DEFAULT 0,
  sha256          char(64),
  alt_text        varchar(255),
  caption         varchar(500),
  folder          varchar(96),
  owner_unit_code varchar(48)  REFERENCES cms.org_units(code),
  variants        jsonb        NOT NULL DEFAULT '{}'::jsonb,   -- {"thumb": "key", "800": "key", "webp": "key"}
  uploaded_by     varchar(128) NOT NULL,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  deleted_by      varchar(128),
  UNIQUE (bucket, object_key)
);
CREATE INDEX IF NOT EXISTS ix_media_tenant ON cms.media (tenant_id, kind, created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- 4. CỘT CHUNG CHO NỘI DUNG CÓ WORKFLOW (news, announcements)
--    status · publish_at · expire_at · first_published_at
--    submitted_* · reviewed_* · review_note · pending_revision_id · version
--    created_* · updated_* · deleted_*
-- ============================================================================

-- ---------------------------------- NEWS ----------------------------------
CREATE TABLE IF NOT EXISTS cms.news (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id            varchar(32)  NOT NULL REFERENCES cms.tenants(id),
  category_id          bigint       REFERENCES cms.categories(id),
  owner_unit_code      varchar(48)  REFERENCES cms.org_units(code),
  status               cms.workflow_status NOT NULL DEFAULT 'draft',
  publish_at           timestamptz,
  expire_at            timestamptz,
  first_published_at   timestamptz,
  is_featured          boolean      NOT NULL DEFAULT false,
  show_on_home         boolean      NOT NULL DEFAULT false,
  featured_image_id    bigint       REFERENCES cms.media(id),
  tags                 text[]       NOT NULL DEFAULT '{}',
  source               varchar(255),
  author_sub           varchar(128) NOT NULL,
  author_display       varchar(255),                       -- tên hiển thị trên bài (có thể khác người tạo)
  view_count           bigint       NOT NULL DEFAULT 0,
  submitted_at         timestamptz,
  submitted_by         varchar(128),
  reviewed_at          timestamptz,
  reviewed_by          varchar(128),
  review_note          text,
  pending_revision_id  bigint,                             -- FK thêm sau khi tạo revisions
  version              int          NOT NULL DEFAULT 1,    -- tăng mỗi lần lưu (khớp revisions.version)
  created_at           timestamptz  NOT NULL DEFAULT now(),
  created_by           varchar(128) NOT NULL,
  updated_at           timestamptz  NOT NULL DEFAULT now(),
  updated_by           varchar(128),
  deleted_at           timestamptz,
  deleted_by           varchar(128),
  CHECK (expire_at IS NULL OR publish_at IS NULL OR expire_at > publish_at),
  CHECK (status <> 'published' OR publish_at IS NOT NULL)
);
-- truy vấn công khai: published, đến giờ, chưa hết hạn
CREATE INDEX IF NOT EXISTS ix_news_live ON cms.news (tenant_id, publish_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_news_admin ON cms.news (tenant_id, status, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_news_category ON cms.news (tenant_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_news_unit ON cms.news (tenant_id, owner_unit_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_news_trash ON cms.news (tenant_id, deleted_at DESC) WHERE deleted_at IS NOT NULL;
-- job hẹn giờ: bài đến hạn đăng / hết hạn
CREATE INDEX IF NOT EXISTS ix_news_schedule ON cms.news (publish_at) WHERE status = 'published' AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS cms.news_translations (
  news_id            bigint       NOT NULL REFERENCES cms.news(id) ON DELETE CASCADE,
  lang               varchar(8)   NOT NULL REFERENCES cms.languages(code),
  tenant_id          varchar(32)  NOT NULL,
  slug               varchar(220) NOT NULL,
  title              varchar(500) NOT NULL,
  excerpt            text,
  body_html          text,                                   -- đã làm sạch (sanitize) khi lưu
  body_text          text,                                   -- bỏ thẻ HTML, dùng cho tìm kiếm
  meta_title         varchar(255),
  meta_description   text,
  meta_keywords      varchar(500),
  translation_status cms.translation_status NOT NULL DEFAULT 'done',
  search_text        text GENERATED ALWAYS AS (cms.f_search_norm(title || ' ' || coalesce(excerpt,'') || ' ' || coalesce(body_text,''))) STORED,
  PRIMARY KEY (news_id, lang)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_news_slug ON cms.news_translations (tenant_id, lang, slug);
CREATE INDEX IF NOT EXISTS ix_news_tr_search ON cms.news_translations USING gin (search_text gin_trgm_ops);

CREATE TABLE IF NOT EXISTS cms.news_attachments (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  news_id    bigint       NOT NULL REFERENCES cms.news(id) ON DELETE CASCADE,
  media_id   bigint       REFERENCES cms.media(id),
  title      varchar(255) NOT NULL,
  meta       varchar(128),
  sort_order int          NOT NULL DEFAULT 0
);

-- ------------------------------ ANNOUNCEMENTS ------------------------------
CREATE TABLE IF NOT EXISTS cms.announcements (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id            varchar(32)  NOT NULL REFERENCES cms.tenants(id),
  owner_unit_code      varchar(48)  NOT NULL REFERENCES cms.org_units(code),
  category             varchar(48)  NOT NULL DEFAULT 'general',   -- general | academic | tuition | exam | event | admin
  priority             smallint     NOT NULL DEFAULT 0 CHECK (priority IN (0, 1, 2)),   -- 0 normal · 1 high · 2 urgent
  status               cms.workflow_status NOT NULL DEFAULT 'draft',
  publish_at           timestamptz,
  expire_at            timestamptz,
  first_published_at   timestamptz,
  pinned_until         timestamptz,
  require_ack          boolean      NOT NULL DEFAULT false,
  channels             text[]       NOT NULL DEFAULT '{portal}' CHECK (channels <@ ARRAY['portal','email','push']::text[]),
  recall_reason        text,                                -- thu hồi = archived + lý do
  author_sub           varchar(128) NOT NULL,
  submitted_at         timestamptz,
  submitted_by         varchar(128),
  reviewed_at          timestamptz,
  reviewed_by          varchar(128),
  review_note          text,
  pending_revision_id  bigint,
  version              int          NOT NULL DEFAULT 1,
  recipient_count      int,                                 -- chốt khi fan-out (email/push)
  created_at           timestamptz  NOT NULL DEFAULT now(),
  created_by           varchar(128) NOT NULL,
  updated_at           timestamptz  NOT NULL DEFAULT now(),
  updated_by           varchar(128),
  deleted_at           timestamptz,
  deleted_by           varchar(128),
  CHECK (expire_at IS NULL OR publish_at IS NULL OR expire_at > publish_at),
  CHECK (status <> 'published' OR publish_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ix_ann_live ON cms.announcements (tenant_id, publish_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_ann_admin ON cms.announcements (tenant_id, status, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_ann_unit ON cms.announcements (tenant_id, owner_unit_code) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS cms.announcement_translations (
  announcement_id    bigint       NOT NULL REFERENCES cms.announcements(id) ON DELETE CASCADE,
  lang               varchar(8)   NOT NULL REFERENCES cms.languages(code),
  title              varchar(500) NOT NULL,
  body_html          text,
  body_text          text,
  translation_status cms.translation_status NOT NULL DEFAULT 'done',
  search_text        text GENERATED ALWAYS AS (cms.f_search_norm(title || ' ' || coalesce(body_text,''))) STORED,
  PRIMARY KEY (announcement_id, lang)
);
CREATE INDEX IF NOT EXISTS ix_ann_tr_search ON cms.announcement_translations USING gin (search_text gin_trgm_ops);

-- Mỗi dòng = AND các trường khác null; các dòng OR với nhau; dòng is_exclude bị trừ ra.
-- Dòng rỗng (cả 3 null) = mọi người dùng của tenant.
CREATE TABLE IF NOT EXISTS cms.announcement_targets (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  announcement_id bigint       NOT NULL REFERENCES cms.announcements(id) ON DELETE CASCADE,
  audience        varchar(16)  CHECK (audience IN ('student','staff','parent','leader')),
  unit_code       varchar(48)  REFERENCES cms.org_units(code),   -- gồm cả đơn vị con (khớp theo membership đã mở rộng lên cha)
  user_sub        varchar(128),
  is_exclude      boolean      NOT NULL DEFAULT false,
  label           varchar(255)                                   -- nhãn hiển thị: "SV lớp DCCTKT66A", "GV0123 – Nguyễn Văn A"
);
CREATE INDEX IF NOT EXISTS ix_ann_targets ON cms.announcement_targets (announcement_id);
CREATE INDEX IF NOT EXISTS ix_ann_targets_user ON cms.announcement_targets (user_sub) WHERE user_sub IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_ann_targets_unit ON cms.announcement_targets (unit_code) WHERE unit_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS cms.announcement_receipts (
  announcement_id bigint       NOT NULL REFERENCES cms.announcements(id) ON DELETE CASCADE,
  user_sub        varchar(128) NOT NULL,
  delivered_at    timestamptz,                       -- fan-out email/push
  read_at         timestamptz,
  acked_at        timestamptz,
  PRIMARY KEY (announcement_id, user_sub)
);
CREATE INDEX IF NOT EXISTS ix_ann_receipts_user ON cms.announcement_receipts (user_sub, read_at);

CREATE TABLE IF NOT EXISTS cms.announcement_attachments (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  announcement_id bigint       NOT NULL REFERENCES cms.announcements(id) ON DELETE CASCADE,
  media_id        bigint       NOT NULL REFERENCES cms.media(id),       -- media.bucket = 'cms-private'
  sort_order      int          NOT NULL DEFAULT 0
);

-- ============================================================================
-- 5. REVISION · WORKFLOW HISTORY · AUDIT · CHIA SẺ · OUTBOX
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms.revisions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id   varchar(32)  NOT NULL,
  entity_type varchar(24)  NOT NULL,                     -- news | announcement | page | banner …
  entity_id   bigint       NOT NULL,
  version     int          NOT NULL,
  state       varchar(12)  NOT NULL DEFAULT 'current' CHECK (state IN ('current','superseded','proposed','rejected')),
  snapshot    jsonb        NOT NULL,                     -- bản ghi + translations + targets + attachments
  reason      varchar(255),                              -- "Lưu", "Khôi phục từ v3", "Đề xuất sửa"…
  created_by  varchar(128) NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version)
);
CREATE INDEX IF NOT EXISTS ix_revisions_entity ON cms.revisions (tenant_id, entity_type, entity_id, version DESC);

DO $$ BEGIN
  ALTER TABLE cms.news ADD CONSTRAINT fk_news_pending_rev FOREIGN KEY (pending_revision_id) REFERENCES cms.revisions(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE cms.announcements ADD CONSTRAINT fk_ann_pending_rev FOREIGN KEY (pending_revision_id) REFERENCES cms.revisions(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS cms.workflow_history (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id   varchar(32)  NOT NULL,
  entity_type varchar(24)  NOT NULL,
  entity_id   bigint       NOT NULL,
  action      varchar(24)  NOT NULL,                     -- submit | approve | reject | publish | unpublish | archive | approve-revision | reject-revision
  from_status cms.workflow_status,
  to_status   cms.workflow_status,
  note        text,
  actor_sub   varchar(128) NOT NULL,
  actor_name  varchar(255),
  at          timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_wf_entity ON cms.workflow_history (tenant_id, entity_type, entity_id, at DESC);

-- Audit: chỉ ghi thêm, partition theo tháng (tạo partition mới bằng job hằng tháng / pg_partman)
CREATE TABLE IF NOT EXISTS cms.audit_logs (
  id               bigint GENERATED ALWAYS AS IDENTITY,
  tenant_id        varchar(32)  NOT NULL,
  at               timestamptz  NOT NULL DEFAULT now(),
  actor_sub        varchar(128),
  actor_name       varchar(255),
  action           varchar(48)  NOT NULL,                -- news.update, grant.create, settings.update …
  entity_type      varchar(24),
  entity_id        varchar(64),
  entity_label     varchar(500),
  revision_version int,
  changes          jsonb,                                -- {"title": ["cũ", "mới"], …}
  ip               inet,
  user_agent       varchar(500),
  correlation_id   varchar(64),
  PRIMARY KEY (id, at)
) PARTITION BY RANGE (at);
CREATE TABLE IF NOT EXISTS cms.audit_logs_default PARTITION OF cms.audit_logs DEFAULT;
CREATE TABLE IF NOT EXISTS cms.audit_logs_2026_10 PARTITION OF cms.audit_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE INDEX IF NOT EXISTS ix_audit_entity ON cms.audit_logs (tenant_id, entity_type, entity_id, at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_actor ON cms.audit_logs (tenant_id, actor_sub, at DESC);

CREATE TABLE IF NOT EXISTS cms.content_shares (
  tenant_id         varchar(32)  NOT NULL,               -- tenant nguồn
  entity_type       varchar(24)  NOT NULL,
  entity_id         bigint       NOT NULL,
  target_tenant_id  varchar(32)  NOT NULL REFERENCES cms.tenants(id),
  status            varchar(12)  NOT NULL DEFAULT 'offered' CHECK (status IN ('offered','accepted','declined')),
  offered_by        varchar(128) NOT NULL,
  decided_by        varchar(128),
  decided_at        timestamptz,
  PRIMARY KEY (entity_type, entity_id, target_tenant_id)
);

-- Outbox: sự kiện ghi cùng transaction, OutboxRelay đẩy sang Redis/job (xóa cache, gửi thông báo)
CREATE TABLE IF NOT EXISTS cms.outbox (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    varchar(32)  NOT NULL,
  type         varchar(64)  NOT NULL,                    -- NewsPublished, AnnouncementPublished, CacheInvalidate…
  payload      jsonb        NOT NULL,
  available_at timestamptz  NOT NULL DEFAULT now(),      -- hẹn giờ: = publish_at
  processed_at timestamptz,
  attempts     int          NOT NULL DEFAULT 0,
  last_error   text
);
CREATE INDEX IF NOT EXISTS ix_outbox_pending ON cms.outbox (available_at) WHERE processed_at IS NULL;

-- ============================================================================
-- 6. NỘI DUNG KHÁC (không workflow): sự kiện, trang, menu, banner, media công khai, khối trang chủ, cấu hình
--    Cùng quy ước: tenant_id + soft delete + *_translations
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id varchar(32) NOT NULL REFERENCES cms.tenants(id),
  slug varchar(220) NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz,
  status varchar(16) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','finished','cancelled')),
  contact varchar(190), thumbnail_id bigint REFERENCES cms.media(id), owner_unit_code varchar(48) REFERENCES cms.org_units(code),
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by varchar(128), updated_at timestamptz NOT NULL DEFAULT now(), updated_by varchar(128),
  deleted_at timestamptz, deleted_by varchar(128)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_events_slug ON cms.events (tenant_id, slug) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS cms.event_translations (
  event_id bigint NOT NULL REFERENCES cms.events(id) ON DELETE CASCADE, lang varchar(8) NOT NULL REFERENCES cms.languages(code),
  title varchar(400) NOT NULL, place varchar(255), place_full text, organizer varchar(255), audience varchar(255),
  description jsonb NOT NULL DEFAULT '[]', agenda jsonb NOT NULL DEFAULT '[]', PRIMARY KEY (event_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.pages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id varchar(32) NOT NULL REFERENCES cms.tenants(id),
  parent_id bigint REFERENCES cms.pages(id), template varchar(48) NOT NULL DEFAULT 'default',
  status cms.workflow_status NOT NULL DEFAULT 'published', sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, deleted_by varchar(128)
);
CREATE TABLE IF NOT EXISTS cms.page_translations (
  page_id bigint NOT NULL REFERENCES cms.pages(id) ON DELETE CASCADE, lang varchar(8) NOT NULL REFERENCES cms.languages(code),
  tenant_id varchar(32) NOT NULL, slug varchar(190) NOT NULL, title varchar(255) NOT NULL, body_html text,
  seo_title varchar(255), seo_description text, translation_status cms.translation_status NOT NULL DEFAULT 'done',
  PRIMARY KEY (page_id, lang)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_page_slug ON cms.page_translations (tenant_id, lang, slug);

CREATE TABLE IF NOT EXISTS cms.menu_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id varchar(32) NOT NULL REFERENCES cms.tenants(id),
  group_code varchar(32) NOT NULL CHECK (group_code IN ('header','footer','utility')), parent_id bigint REFERENCES cms.menu_items(id),
  type varchar(16) NOT NULL DEFAULT 'page' CHECK (type IN ('page','link','category')), url varchar(500) NOT NULL,
  sort_order int NOT NULL DEFAULT 0, is_visible boolean NOT NULL DEFAULT true, open_in_new_tab boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by varchar(128)
);
CREATE TABLE IF NOT EXISTS cms.menu_item_translations (
  menu_item_id bigint NOT NULL REFERENCES cms.menu_items(id) ON DELETE CASCADE, lang varchar(8) NOT NULL REFERENCES cms.languages(code),
  label varchar(190) NOT NULL, PRIMARY KEY (menu_item_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.banners (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id varchar(32) NOT NULL REFERENCES cms.tenants(id),
  position varchar(32) NOT NULL CHECK (position IN ('home_slider','home_popup','sidebar_right','footer')),
  image_id bigint REFERENCES cms.media(id), link_url varchar(500), is_visible boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0,
  starts_on date, ends_on date, deleted_at timestamptz, deleted_by varchar(128),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);
CREATE TABLE IF NOT EXISTS cms.banner_translations (
  banner_id bigint NOT NULL REFERENCES cms.banners(id) ON DELETE CASCADE, lang varchar(8) NOT NULL REFERENCES cms.languages(code),
  title varchar(255) NOT NULL, subtitle varchar(400), PRIMARY KEY (banner_id, lang)
);

-- album / video / podcast / khối trang chủ: một bảng "home_blocks" + "media_items" thay cho 9 bảng riêng của v1
CREATE TABLE IF NOT EXISTS cms.media_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id varchar(32) NOT NULL REFERENCES cms.tenants(id),
  kind varchar(8) NOT NULL CHECK (kind IN ('album','video','podcast')), slug varchar(220) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',                     -- album: photos[]; video: channel, duration, url; podcast: episode, host, notes[]
  view_count bigint NOT NULL DEFAULT 0, published_on date, is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, deleted_by varchar(128)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_items_slug ON cms.media_items (tenant_id, kind, slug) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS cms.media_item_translations (
  media_item_id bigint NOT NULL REFERENCES cms.media_items(id) ON DELETE CASCADE, lang varchar(8) NOT NULL REFERENCES cms.languages(code),
  title varchar(400) NOT NULL, description text, PRIMARY KEY (media_item_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.home_blocks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id varchar(32) NOT NULL REFERENCES cms.tenants(id),
  kind varchar(16) NOT NULL CHECK (kind IN ('hero_slide','quick_link','audience','strength','partner','stat_hero','stat_about')),
  data jsonb NOT NULL DEFAULT '{}',                     -- trường không cần dịch (icon, color, url, value…)
  is_visible boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0, deleted_at timestamptz, deleted_by varchar(128)
);
CREATE TABLE IF NOT EXISTS cms.home_block_translations (
  block_id bigint NOT NULL REFERENCES cms.home_blocks(id) ON DELETE CASCADE, lang varchar(8) NOT NULL REFERENCES cms.languages(code),
  data jsonb NOT NULL DEFAULT '{}',                     -- trường cần dịch (title, label, text…)
  PRIMARY KEY (block_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.settings (
  tenant_id varchar(32) NOT NULL REFERENCES cms.tenants(id), group_key varchar(48) NOT NULL,
  value jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now(), updated_by varchar(128),
  PRIMARY KEY (tenant_id, group_key)
);

-- ============================================================================
-- 7. TRIGGER updated_at
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories','news','announcements','events','pages','settings'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON cms.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON cms.%1$s FOR EACH ROW EXECUTE FUNCTION cms.set_updated_at()', t);
  END LOOP;
END $$;

-- ============================================================================
-- 8. ROW-LEVEL SECURITY THEO TENANT
--    Bảng con có tenant_id riêng (news_translations…) dùng policy tenant_id; bảng con còn lại (targets, receipts, attachments, *_translations…)
--    dùng policy theo bảng cha — RLS KHÔNG tự kế thừa qua JOIN nên không được bỏ sót (xem khối "BẢNG CON" bên dưới).
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['access_grants','categories','category_translations','media','news','news_translations',
                           'announcements','revisions','workflow_history','audit_logs','outbox','events','pages',
                           'page_translations','menu_items','banners','media_items','home_blocks','settings'] LOOP
    EXECUTE format('ALTER TABLE cms.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE cms.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS p_tenant ON cms.%I', t);
    EXECUTE format('CREATE POLICY p_tenant ON cms.%I USING (tenant_id = cms.current_tenant()) WITH CHECK (tenant_id = cms.current_tenant())', t);
  END LOOP;
END $$;
-- BẢNG CON KHÔNG CÓ tenant_id: RLS KHÔNG tự kế thừa từ bảng cha qua JOIN. Vì cms_app được cấp quyền đọc/ghi trực tiếp các bảng này,
-- mỗi bảng con phải có policy riêng: chỉ thấy/ghi dòng mà bản ghi cha thuộc tenant hiện hành (truy vấn con trên bảng cha tự áp RLS của bảng cha).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
      ('news_attachments',            'news_id',         'news'),
      ('announcement_translations',   'announcement_id', 'announcements'),
      ('announcement_targets',        'announcement_id', 'announcements'),
      ('announcement_receipts',       'announcement_id', 'announcements'),
      ('announcement_attachments',    'announcement_id', 'announcements'),
      ('event_translations',          'event_id',        'events'),
      ('menu_item_translations',      'menu_item_id',    'menu_items'),
      ('banner_translations',         'banner_id',       'banners'),
      ('media_item_translations',     'media_item_id',   'media_items'),
      ('home_block_translations',     'block_id',        'home_blocks')) AS v(child, fk, parent) LOOP
    EXECUTE format('ALTER TABLE cms.%I ENABLE ROW LEVEL SECURITY', r.child);
    EXECUTE format('ALTER TABLE cms.%I FORCE ROW LEVEL SECURITY', r.child);
    EXECUTE format('DROP POLICY IF EXISTS p_tenant ON cms.%I', r.child);
    EXECUTE format('CREATE POLICY p_tenant ON cms.%I USING (EXISTS (SELECT 1 FROM cms.%I p WHERE p.id = %I)) WITH CHECK (EXISTS (SELECT 1 FROM cms.%I p WHERE p.id = %I))',
                   r.child, r.parent, r.fk, r.parent, r.fk);
  END LOOP;
END $$;
-- content_shares: tenant nguồn hoặc tenant đích đều thấy
ALTER TABLE cms.content_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms.content_shares FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_tenant ON cms.content_shares;
CREATE POLICY p_tenant ON cms.content_shares USING (cms.current_tenant() IN (tenant_id, target_tenant_id));

-- Role ứng dụng: không BYPASSRLS, audit chỉ INSERT/SELECT
DO $$ BEGIN
  CREATE ROLE cms_app NOLOGIN NOBYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA cms TO cms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cms TO cms_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA cms TO cms_app;
REVOKE UPDATE, DELETE ON cms.audit_logs FROM cms_app;
REVOKE INSERT, UPDATE, DELETE ON cms.org_units, cms.tenants, cms.tenant_domains, cms.languages FROM cms_app;  -- chỉ job đồng bộ (role khác) được ghi

-- ============================================================================
-- 9. VIEW / HÀM TRUY VẤN MẪU
-- ============================================================================
-- Tin công khai (đã đến giờ đăng, chưa hết hạn) — website đọc qua view này
CREATE OR REPLACE VIEW cms.v_news_live WITH (security_invoker = true) AS
SELECT n.*, t.lang, t.slug, t.title, t.excerpt, t.body_html, t.meta_title, t.meta_description
FROM cms.news n JOIN cms.news_translations t ON t.news_id = n.id
WHERE n.status = 'published' AND n.deleted_at IS NULL AND n.publish_at <= now()
  AND (n.expire_at IS NULL OR n.expire_at > now())
  AND (t.lang = 'vi' OR t.translation_status = 'done');

-- Đơn vị của user mở rộng lên mọi đơn vị cha: units_with_ancestors('{DCCTKT66A}') → {DCCTKT66A, BM-KHMT, CNTT, HUMG}
CREATE OR REPLACE FUNCTION cms.units_with_ancestors(p_units text[]) RETURNS text[] LANGUAGE sql STABLE AS $$
  SELECT coalesce(array_agg(DISTINCT a.code), '{}')
  FROM cms.org_units u JOIN cms.org_units a ON u.path <@ a.path
  WHERE u.code = ANY(p_units)
$$;

-- Hộp thư thông báo của một user (audiences từ role, units đã mở rộng)
CREATE OR REPLACE FUNCTION cms.inbox(p_sub text, p_audiences text[], p_units text[])
RETURNS SETOF cms.announcements LANGUAGE sql STABLE AS $$
  SELECT a.* FROM cms.announcements a
  WHERE a.status = 'published' AND a.deleted_at IS NULL AND a.publish_at <= now()
    AND (a.expire_at IS NULL OR a.expire_at > now())
    AND EXISTS (SELECT 1 FROM cms.announcement_targets t WHERE t.announcement_id = a.id AND NOT t.is_exclude
                AND (t.audience  IS NULL OR t.audience  = ANY(p_audiences))
                AND (t.unit_code IS NULL OR t.unit_code = ANY(p_units))
                AND (t.user_sub  IS NULL OR t.user_sub  = p_sub))
    AND NOT EXISTS (SELECT 1 FROM cms.announcement_targets t WHERE t.announcement_id = a.id AND t.is_exclude
                AND (t.audience  IS NULL OR t.audience  = ANY(p_audiences))
                AND (t.unit_code IS NULL OR t.unit_code = ANY(p_units))
                AND (t.user_sub  IS NULL OR t.user_sub  = p_sub))
  ORDER BY (a.pinned_until > now()) DESC NULLS LAST, a.priority DESC, a.publish_at DESC
$$;

-- Bản ghi tin tức user được phép thực hiện `p_perm` (view/edit/review/publish) — dùng làm điều kiện lọc danh sách
--   p_principals: {'user:<sub>', 'unit:CNTT', 'unit:HUMG', 'role:cms.editor'}
CREATE OR REPLACE FUNCTION cms.news_allowed(p_news cms.news, p_principals text[], p_perm text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM cms.access_grants g
    WHERE g.tenant_id = p_news.tenant_id AND g.deleted_at IS NULL AND (g.expires_at IS NULL OR g.expires_at > now())
      AND g.resource_type IN ('*','news')
      AND (g.principal_type || ':' || g.principal_id) = ANY(p_principals)
      AND (p_perm = ANY(g.permissions) OR 'manage' = ANY(g.permissions)
           OR (p_perm = 'view' AND g.permissions && ARRAY['edit','review','publish']))
      AND (   g.scope_type = 'tenant'
           OR (g.scope_type = 'category' AND g.scope_id = p_news.category_id::text)
           OR (g.scope_type = 'record'   AND g.scope_id = p_news.id::text)
           OR (g.scope_type = 'unit' AND EXISTS (
                 SELECT 1 FROM cms.org_units owner JOIN cms.org_units s ON s.code = g.scope_id
                 WHERE owner.code = p_news.owner_unit_code AND owner.path <@ s.path)))
  )
$$;

-- View tạo SAU khối GRANT ở trên nên phải cấp quyền riêng (nếu không cms_app gặp 'permission denied for view')
GRANT SELECT ON cms.v_news_live TO cms_app;

-- Dữ liệu gốc
INSERT INTO cms.languages (code, label, is_source) VALUES ('vi', 'Tiếng Việt', true), ('en', 'English', false)
ON CONFLICT (code) DO NOTHING;
