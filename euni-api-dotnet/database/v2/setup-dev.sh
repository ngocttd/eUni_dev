#!/usr/bin/env bash
# Tạo database + role cho môi trường dev (chạy bằng quyền superuser, vd: sudo -u postgres ./setup-dev.sh).
#   cms_admin : sở hữu schema, BYPASSRLS — dùng cho migrate/seed/sao lưu (DATABASE_ADMIN_URL)
#   cms_app   : ứng dụng, NOBYPASSRLS, bị RLS theo tenant — dùng cho mọi request (DATABASE_URL)
# Biến: DB_NAME (euni_cms) · ADMIN_PASSWORD (cms_admin_dev) · APP_PASSWORD (cms_app_dev)
set -euo pipefail
DB="${DB_NAME:-euni_cms}"; ADMIN_PW="${ADMIN_PASSWORD:-cms_admin_dev}"; APP_PW="${APP_PASSWORD:-cms_app_dev}"
psql -v ON_ERROR_STOP=1 -d postgres <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='cms_admin') THEN CREATE ROLE cms_admin LOGIN BYPASSRLS PASSWORD '${ADMIN_PW}'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='cms_app')   THEN CREATE ROLE cms_app   LOGIN NOBYPASSRLS PASSWORD '${APP_PW}';   END IF;
END \$\$;
SELECT 'CREATE DATABASE ${DB} OWNER cms_admin' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='${DB}')\gexec
SQL
echo "✔ database ${DB}, role cms_admin / cms_app sẵn sàng. Ứng dụng tự áp schema khi khởi động (hoặc: psql -U cms_admin -d ${DB} -f database/v2/schema.sql -f database/v2/amendments.sql)"
