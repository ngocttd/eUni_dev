-- ============================================================
-- HUMG Digital Portal — CMS database (PostgreSQL)
-- Schema: cms
-- Phạm vi: toàn bộ dữ liệu của phân hệ CMS / Editor (CMS-01 → CMS-10).
-- Dữ liệu Đào tạo / KHCN / Nhân sự lấy từ API ngoài (qlkhcn-api, qlns-api...) nên không có ở đây.
-- Script idempotent: chạy lại nhiều lần an toàn (CREATE ... IF NOT EXISTS).
-- Ngôn ngữ: Tiếng Việt (vi) là bản nguồn; bản dịch lưu ở bảng *_translations.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cms;
SET search_path TO cms, public;

-- ---------- Hàm tự cập nhật updated_at ----------
CREATE OR REPLACE FUNCTION cms.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. NGÔN NGỮ
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.languages (
  code        varchar(8)  PRIMARY KEY,
  label       varchar(64) NOT NULL,
  flag        varchar(8),
  is_source   boolean     NOT NULL DEFAULT false,
  is_enabled  boolean     NOT NULL DEFAULT true
);
-- Chỉ một ngôn ngữ nguồn
CREATE UNIQUE INDEX IF NOT EXISTS uq_languages_source ON cms.languages (is_source) WHERE is_source;

-- ============================================================
-- 2. NGƯỜI DÙNG – VAI TRÒ – PHÂN QUYỀN (CMS-07)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.roles (
  id          serial       PRIMARY KEY,
  code        varchar(64)  NOT NULL UNIQUE,         -- super_admin, editor, author, viewer
  name        varchar(128) NOT NULL,                -- Super Admin, Editor...
  description text,
  is_system   boolean      NOT NULL DEFAULT false,  -- vai trò hệ thống không được xóa
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms.permissions (
  id        serial       PRIMARY KEY,
  code      varchar(96)  NOT NULL UNIQUE,           -- vd: post.publish
  module    varchar(96)  NOT NULL,                  -- hàng trong ma trận phân quyền
  name      varchar(160) NOT NULL,
  sort_order int         NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cms.role_permissions (
  role_id       int NOT NULL REFERENCES cms.roles(id) ON DELETE CASCADE,
  permission_id int NOT NULL REFERENCES cms.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS cms.users (
  id            serial       PRIMARY KEY,
  full_name     varchar(160) NOT NULL,
  email         varchar(190) NOT NULL UNIQUE,
  username      varchar(100) UNIQUE,                 -- tên đăng nhập (mặc định = phần trước @ của email)
  password_hash text,                                -- NULL nếu đăng nhập qua hệ thống SSO bên ngoài
  external_id   varchar(128),                        -- mã tài khoản ở hệ thống ngoài (qlns...) nếu có
  role_id       int          NOT NULL REFERENCES cms.roles(id),
  status        varchar(16)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  last_login_at timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_role ON cms.users (role_id);

-- ============================================================
-- 3. MEDIA THƯ VIỆN (CMS-05)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.media (
  id          serial       PRIMARY KEY,
  file_name   varchar(255) NOT NULL,
  kind        varchar(16)  NOT NULL CHECK (kind IN ('image','document','video','audio','other')),
  ext         varchar(16),
  mime_type   varchar(128),
  size_bytes  bigint       NOT NULL DEFAULT 0,
  storage_url text,                                  -- đường dẫn / URL file thực
  alt_text    varchar(255),
  caption     varchar(500),
  folder      varchar(96),                           -- Tin tức, Sự kiện, Tuyển sinh, Cơ sở vật chất, Đào tạo
  uploaded_by int          REFERENCES cms.users(id) ON DELETE SET NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_media_kind ON cms.media (kind);
CREATE INDEX IF NOT EXISTS ix_media_folder ON cms.media (folder);

-- ============================================================
-- 4. DANH MỤC (CMS-04) — dạng cây
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.categories (
  id         serial      PRIMARY KEY,
  parent_id  int         REFERENCES cms.categories(id) ON DELETE SET NULL,
  slug       varchar(190) NOT NULL UNIQUE,
  is_visible boolean     NOT NULL DEFAULT true,
  sort_order int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_categories_parent ON cms.categories (parent_id);

CREATE TABLE IF NOT EXISTS cms.category_translations (
  category_id int         NOT NULL REFERENCES cms.categories(id) ON DELETE CASCADE,
  lang        varchar(8)  NOT NULL REFERENCES cms.languages(code),
  name        varchar(190) NOT NULL,
  description text,
  PRIMARY KEY (category_id, lang)
);

-- ============================================================
-- 5. BÀI VIẾT (CMS-02, CMS-03)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.posts (
  id            serial       PRIMARY KEY,
  slug          varchar(220) NOT NULL UNIQUE,
  category_id   int          REFERENCES cms.categories(id) ON DELETE SET NULL,
  author_id     int          REFERENCES cms.users(id) ON DELETE SET NULL,
  status        varchar(16)  NOT NULL DEFAULT 'draft' CHECK (status IN ('published','draft','pending','archived')),
  show_on_home  boolean      NOT NULL DEFAULT false,
  is_featured   boolean      NOT NULL DEFAULT false,
  unit          varchar(160),                        -- đơn vị đăng (Văn phòng, Phòng KHCN...)
  source        varchar(255),                        -- nguồn tin
  author_name   varchar(160),                        -- tên tác giả hiển thị (ghi đè nếu khác tài khoản)
  attachment_id int          REFERENCES cms.media(id) ON DELETE SET NULL,
  thumbnail_id  int          REFERENCES cms.media(id) ON DELETE SET NULL,
  view_count    int          NOT NULL DEFAULT 0,
  publish_at    timestamptz,
  expire_at     timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  deleted_at    timestamptz                           -- xóa mềm
);
CREATE INDEX IF NOT EXISTS ix_posts_category ON cms.posts (category_id);
CREATE INDEX IF NOT EXISTS ix_posts_status   ON cms.posts (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_posts_publish  ON cms.posts (publish_at DESC);

CREATE TABLE IF NOT EXISTS cms.post_translations (
  post_id            int         NOT NULL REFERENCES cms.posts(id) ON DELETE CASCADE,
  lang               varchar(8)  NOT NULL REFERENCES cms.languages(code),
  title              varchar(400) NOT NULL,
  excerpt            text,
  body               jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- mảng khối nội dung: chuỗi | {type:h2|quote|img|list,...}
  seo_title          varchar(255),
  seo_description    text,
  seo_keywords       varchar(400),
  translation_status varchar(16) NOT NULL DEFAULT 'done'
                     CHECK (translation_status IN ('done','in_progress','missing')),  -- Đã dịch / Đang dịch / Chưa dịch
  updated_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, lang)
);
CREATE INDEX IF NOT EXISTS ix_post_tr_title ON cms.post_translations (lang, lower(title));

CREATE TABLE IF NOT EXISTS cms.tags (
  id   serial       PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(120) NOT NULL
);
CREATE TABLE IF NOT EXISTS cms.post_tags (
  post_id int NOT NULL REFERENCES cms.posts(id) ON DELETE CASCADE,
  tag_id  int NOT NULL REFERENCES cms.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Hình ảnh & file đính kèm của bài viết (tab "Hình ảnh & File")
CREATE TABLE IF NOT EXISTS cms.post_attachments (
  id         serial       PRIMARY KEY,
  post_id    int          NOT NULL REFERENCES cms.posts(id) ON DELETE CASCADE,
  media_id   int          REFERENCES cms.media(id) ON DELETE SET NULL,
  title      varchar(255) NOT NULL,
  meta       varchar(128),                           -- vd: "PDF · 640 KB"
  sort_order int          NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_post_att_post ON cms.post_attachments (post_id);

-- ============================================================
-- 6. SỰ KIỆN (public events + CMS "Sự kiện")
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.events (
  id          serial       PRIMARY KEY,
  slug        varchar(220) NOT NULL UNIQUE,
  starts_at   timestamptz  NOT NULL,
  ends_at     timestamptz,
  time_label  varchar(64),                           -- "08:00 – 17:00"
  status      varchar(16)  NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','finished','cancelled')),
  contact     varchar(190),
  thumbnail_id int         REFERENCES cms.media(id) ON DELETE SET NULL,
  created_by  int          REFERENCES cms.users(id) ON DELETE SET NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_events_start ON cms.events (starts_at);

CREATE TABLE IF NOT EXISTS cms.event_translations (
  event_id    int         NOT NULL REFERENCES cms.events(id) ON DELETE CASCADE,
  lang        varchar(8)  NOT NULL REFERENCES cms.languages(code),
  title       varchar(400) NOT NULL,
  place       varchar(255),
  place_full  text,
  organizer   varchar(255),
  audience    varchar(255),
  description jsonb       NOT NULL DEFAULT '[]'::jsonb,
  agenda      jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- [{time, item}]
  PRIMARY KEY (event_id, lang)
);

-- ============================================================
-- 7. TRANG TĨNH & MENU (CMS-06)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.pages (
  id         serial       PRIMARY KEY,
  parent_id  int          REFERENCES cms.pages(id) ON DELETE SET NULL,
  slug       varchar(190) NOT NULL DEFAULT '',        -- '' = trang chủ
  template   varchar(48)  NOT NULL DEFAULT 'default' CHECK (template IN ('default','list','detail','contact')),
  status     varchar(16)  NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft','hidden')),
  sort_order int          NOT NULL DEFAULT 0,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pages_parent_slug ON cms.pages (COALESCE(parent_id, 0), slug);

CREATE TABLE IF NOT EXISTS cms.page_translations (
  page_id         int         NOT NULL REFERENCES cms.pages(id) ON DELETE CASCADE,
  lang            varchar(8)  NOT NULL REFERENCES cms.languages(code),
  title           varchar(255) NOT NULL,
  body            jsonb       NOT NULL DEFAULT '[]'::jsonb,
  seo_title       varchar(255),
  seo_description text,
  translation_status varchar(16) NOT NULL DEFAULT 'done'
                  CHECK (translation_status IN ('done','in_progress','missing')),
  PRIMARY KEY (page_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.menu_groups (
  id   serial       PRIMARY KEY,
  code varchar(48)  NOT NULL UNIQUE,                 -- header, footer, utility
  name varchar(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS cms.menu_items (
  id         serial       PRIMARY KEY,
  group_id   int          NOT NULL REFERENCES cms.menu_groups(id) ON DELETE CASCADE,
  parent_id  int          REFERENCES cms.menu_items(id) ON DELETE CASCADE,
  type       varchar(16)  NOT NULL DEFAULT 'page' CHECK (type IN ('page','link','category')),
  url        varchar(500) NOT NULL,
  page_id    int          REFERENCES cms.pages(id) ON DELETE SET NULL,
  category_id int         REFERENCES cms.categories(id) ON DELETE SET NULL,
  sort_order int          NOT NULL DEFAULT 0,
  is_visible boolean      NOT NULL DEFAULT true,
  open_in_new_tab boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_menu_items_group ON cms.menu_items (group_id, sort_order);

CREATE TABLE IF NOT EXISTS cms.menu_item_translations (
  menu_item_id int         NOT NULL REFERENCES cms.menu_items(id) ON DELETE CASCADE,
  lang         varchar(8)  NOT NULL REFERENCES cms.languages(code),
  label        varchar(190) NOT NULL,
  PRIMARY KEY (menu_item_id, lang)
);

-- ============================================================
-- 8. BANNER / SLIDER
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.banners (
  id         serial       PRIMARY KEY,
  position   varchar(48)  NOT NULL CHECK (position IN ('home_slider','home_popup','sidebar_right','footer')),
  image_id   int          REFERENCES cms.media(id) ON DELETE SET NULL,
  link_url   varchar(500),
  is_visible boolean      NOT NULL DEFAULT true,
  sort_order int          NOT NULL DEFAULT 0,
  starts_on  date,
  ends_on    date,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS ix_banners_pos ON cms.banners (position, sort_order);

CREATE TABLE IF NOT EXISTS cms.banner_translations (
  banner_id int         NOT NULL REFERENCES cms.banners(id) ON DELETE CASCADE,
  lang      varchar(8)  NOT NULL REFERENCES cms.languages(code),
  title     varchar(255) NOT NULL,
  subtitle  varchar(400),
  PRIMARY KEY (banner_id, lang)
);

-- ============================================================
-- 9. CẤU HÌNH HỆ THỐNG (CMS-08)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.settings (
  group_key  varchar(48)  NOT NULL,                  -- general, seo, email, language, security, integration, cron
  key        varchar(96)  NOT NULL,
  value      jsonb        NOT NULL,
  is_secret  boolean      NOT NULL DEFAULT false,    -- ẩn giá trị khi trả về API
  updated_by int          REFERENCES cms.users(id) ON DELETE SET NULL,
  updated_at timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (group_key, key)
);

-- ============================================================
-- 10. NHẬT KÝ HOẠT ĐỘNG (CMS-09) & SAO LƯU (CMS-10)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.activity_logs (
  id          bigserial    PRIMARY KEY,
  user_id     int          REFERENCES cms.users(id) ON DELETE SET NULL,
  user_name   varchar(160),                          -- lưu kèm để giữ lịch sử khi xóa user
  action      varchar(48)  NOT NULL,                 -- login, post.create, post.update, post.delete, media.upload, user.delete, settings.update
  target_type varchar(48),
  target_id   varchar(64),
  target_label varchar(500),
  ip_address  inet,
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_activity_created ON cms.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS ix_activity_user    ON cms.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_activity_action  ON cms.activity_logs (action);

CREATE TABLE IF NOT EXISTS cms.backups (
  id         serial       PRIMARY KEY,
  file_path  varchar(500),
  size_bytes bigint       NOT NULL DEFAULT 0,
  trigger    varchar(16)  NOT NULL DEFAULT 'manual' CHECK (trigger IN ('cron','manual')),
  created_by int          REFERENCES cms.users(id) ON DELETE SET NULL,
  status     varchar(16)  NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','running')),
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_backups_created ON cms.backups (created_at DESC);

-- ============================================================
-- 11. TRIGGER updated_at
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['roles','users','media','categories','posts','events','pages','banners']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON cms.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON cms.%1$s FOR EACH ROW EXECUTE FUNCTION cms.set_updated_at()', t);
  END LOOP;
END $$;


-- ============================================================
-- 13. MEDIA CÔNG KHAI: ALBUM ẢNH – VIDEO – PODCAST
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.albums (
  id           serial       PRIMARY KEY,
  slug         varchar(220) NOT NULL UNIQUE,
  cover_id     int          REFERENCES cms.media(id) ON DELETE SET NULL,
  published_at date,
  is_visible   boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cms.album_translations (
  album_id    int         NOT NULL REFERENCES cms.albums(id) ON DELETE CASCADE,
  lang        varchar(8)  NOT NULL REFERENCES cms.languages(code),
  title       varchar(400) NOT NULL,
  description text,
  PRIMARY KEY (album_id, lang)
);
CREATE TABLE IF NOT EXISTS cms.album_photos (
  id         serial PRIMARY KEY,
  album_id   int    NOT NULL REFERENCES cms.albums(id) ON DELETE CASCADE,
  media_id   int    REFERENCES cms.media(id) ON DELETE SET NULL,
  caption    varchar(400),
  sort_order int    NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_album_photos_album ON cms.album_photos (album_id, sort_order);

CREATE TABLE IF NOT EXISTS cms.videos (
  id            serial       PRIMARY KEY,
  slug          varchar(220) NOT NULL UNIQUE,
  channel       varchar(160),
  duration_sec  int,
  video_url     text,                                 -- link YouTube / file
  thumbnail_id  int          REFERENCES cms.media(id) ON DELETE SET NULL,
  view_count    int          NOT NULL DEFAULT 0,
  published_at  date,
  is_visible    boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cms.video_translations (
  video_id    int         NOT NULL REFERENCES cms.videos(id) ON DELETE CASCADE,
  lang        varchar(8)  NOT NULL REFERENCES cms.languages(code),
  title       varchar(400) NOT NULL,
  description text,
  PRIMARY KEY (video_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.podcasts (
  id            serial       PRIMARY KEY,
  slug          varchar(220) NOT NULL UNIQUE,
  episode       varchar(32),                          -- "Tập 05"
  host          varchar(190),
  duration_sec  int,
  audio_url     text,
  cover_id      int          REFERENCES cms.media(id) ON DELETE SET NULL,
  play_count    int          NOT NULL DEFAULT 0,
  published_at  date,
  is_visible    boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cms.podcast_translations (
  podcast_id  int         NOT NULL REFERENCES cms.podcasts(id) ON DELETE CASCADE,
  lang        varchar(8)  NOT NULL REFERENCES cms.languages(code),
  title       varchar(400) NOT NULL,
  description text,
  notes       jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- ghi chú tập: mảng chuỗi
  PRIMARY KEY (podcast_id, lang)
);

-- ============================================================
-- 14. TRANG CHỦ: HERO SLIDE – LỐI TẮT – ĐỐI TƯỢNG – THẾ MẠNH – ĐỐI TÁC – CHỈ SỐ
-- ============================================================
CREATE TABLE IF NOT EXISTS cms.hero_slides (
  id          serial       PRIMARY KEY,
  code        varchar(64)  NOT NULL UNIQUE,           -- sl-60-nam...
  primary_url varchar(500),
  accent_url  varchar(500),
  image_id    int          REFERENCES cms.media(id) ON DELETE SET NULL,
  is_visible  boolean      NOT NULL DEFAULT true,
  sort_order  int          NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cms.hero_slide_translations (
  slide_id      int         NOT NULL REFERENCES cms.hero_slides(id) ON DELETE CASCADE,
  lang          varchar(8)  NOT NULL REFERENCES cms.languages(code),
  kicker        varchar(160),
  title         varchar(400) NOT NULL,                -- có thể chứa xuống dòng
  subtitle      varchar(255),                         -- "1966 – 2026"
  motto         varchar(400),
  primary_label varchar(160),
  accent_label  varchar(160),
  PRIMARY KEY (slide_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.quick_links (
  id         serial       PRIMARY KEY,
  icon       varchar(48),
  url        varchar(500) NOT NULL,
  is_visible boolean      NOT NULL DEFAULT true,
  sort_order int          NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cms.quick_link_translations (
  quick_link_id int          NOT NULL REFERENCES cms.quick_links(id) ON DELETE CASCADE,
  lang          varchar(8)   NOT NULL REFERENCES cms.languages(code),
  label         varchar(160) NOT NULL,
  PRIMARY KEY (quick_link_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.audiences (
  id         serial       PRIMARY KEY,
  code       varchar(48)  NOT NULL UNIQUE,            -- thi-sinh, sinh-vien...
  icon       varchar(48),
  color      varchar(16),
  url        varchar(500) NOT NULL,
  is_visible boolean      NOT NULL DEFAULT true,
  sort_order int          NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cms.audience_translations (
  audience_id int          NOT NULL REFERENCES cms.audiences(id) ON DELETE CASCADE,
  lang        varchar(8)   NOT NULL REFERENCES cms.languages(code),
  title       varchar(160) NOT NULL,
  description varchar(400),
  PRIMARY KEY (audience_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.strengths (
  id         serial       PRIMARY KEY,
  icon       varchar(48),
  is_visible boolean      NOT NULL DEFAULT true,
  sort_order int          NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cms.strength_translations (
  strength_id int          NOT NULL REFERENCES cms.strengths(id) ON DELETE CASCADE,
  lang        varchar(8)   NOT NULL REFERENCES cms.languages(code),
  title       varchar(255) NOT NULL,
  text        text,
  PRIMARY KEY (strength_id, lang)
);

CREATE TABLE IF NOT EXISTS cms.partners (
  id         serial       PRIMARY KEY,
  short_name varchar(48)  NOT NULL,                   -- monogram: TKV, PVN...
  color      varchar(16),
  logo_id    int          REFERENCES cms.media(id) ON DELETE SET NULL,
  website    varchar(500),
  is_visible boolean      NOT NULL DEFAULT true,
  sort_order int          NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cms.partner_translations (
  partner_id int          NOT NULL REFERENCES cms.partners(id) ON DELETE CASCADE,
  lang       varchar(8)   NOT NULL REFERENCES cms.languages(code),
  name       varchar(255) NOT NULL,
  PRIMARY KEY (partner_id, lang)
);

-- Chỉ số thống kê hiển thị công khai. placement: hero (nêm navy) | about (HUMG qua các con số)
CREATE TABLE IF NOT EXISTS cms.site_stats (
  id         serial       PRIMARY KEY,
  placement  varchar(16)  NOT NULL CHECK (placement IN ('hero','about')),
  value      varchar(48)  NOT NULL,                   -- "20.000+" (giữ nguyên dạng hiển thị)
  is_visible boolean      NOT NULL DEFAULT true,
  sort_order int          NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cms.site_stat_translations (
  stat_id int          NOT NULL REFERENCES cms.site_stats(id) ON DELETE CASCADE,
  lang    varchar(8)   NOT NULL REFERENCES cms.languages(code),
  label   varchar(255) NOT NULL,
  sub     varchar(255),
  PRIMARY KEY (stat_id, lang)
);
-- Chip dưới tiêu đề hero lưu trong cms.settings (group 'home', key 'heroChips')

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['albums','videos','podcasts']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON cms.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON cms.%1$s FOR EACH ROW EXECUTE FUNCTION cms.set_updated_at()', t);
  END LOOP;
END $$;


-- ============================================================
-- 15. NÂNG CẤP CHO DB ĐÃ TỒN TẠI (idempotent)
-- ============================================================
ALTER TABLE cms.users ADD COLUMN IF NOT EXISTS username varchar(100);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON cms.users (username);
ALTER TABLE cms.media ADD COLUMN IF NOT EXISTS caption varchar(500);
ALTER TABLE cms.posts ADD COLUMN IF NOT EXISTS source varchar(255);
ALTER TABLE cms.posts ADD COLUMN IF NOT EXISTS author_name varchar(160);
ALTER TABLE cms.posts ADD COLUMN IF NOT EXISTS attachment_id int REFERENCES cms.media(id) ON DELETE SET NULL;

-- ============================================================
-- 12. VIEW tiện ích cho API / dashboard
-- ============================================================
CREATE OR REPLACE VIEW cms.v_post_list AS
SELECT p.id, p.slug, p.status, p.show_on_home, p.is_featured, p.view_count, p.unit,
       p.publish_at, p.created_at, p.updated_at,
       p.category_id, ct.name AS category_name,
       p.author_id, u.full_name AS author_name,
       pt.title, pt.excerpt,
       COALESCE(en.translation_status, 'missing') AS en_status
FROM cms.posts p
LEFT JOIN cms.post_translations pt ON pt.post_id = p.id AND pt.lang = 'vi'
LEFT JOIN cms.post_translations en ON en.post_id = p.id AND en.lang = 'en'
LEFT JOIN cms.category_translations ct ON ct.category_id = p.category_id AND ct.lang = 'vi'
LEFT JOIN cms.users u ON u.id = p.author_id
WHERE p.deleted_at IS NULL;

CREATE OR REPLACE VIEW cms.v_dashboard_stats AS
SELECT
  (SELECT count(*) FROM cms.posts WHERE deleted_at IS NULL)                         AS posts,
  (SELECT count(*) FROM cms.posts WHERE deleted_at IS NULL AND status='published')  AS posts_published,
  (SELECT count(*) FROM cms.posts WHERE deleted_at IS NULL AND status='draft')      AS posts_draft,
  (SELECT count(*) FROM cms.posts WHERE deleted_at IS NULL AND status='pending')    AS posts_pending,
  (SELECT count(*) FROM cms.pages)                                                   AS pages,
  (SELECT count(*) FROM cms.categories)                                              AS categories,
  (SELECT count(*) FROM cms.users)                                                   AS users;
