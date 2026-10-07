-- Chạy một lần khi container PostgreSQL khởi tạo (docker-compose). Mật khẩu dev — đổi khi triển khai.
CREATE ROLE cms_admin LOGIN BYPASSRLS PASSWORD 'cms_admin_dev';
CREATE ROLE cms_app   LOGIN NOBYPASSRLS PASSWORD 'cms_app_dev';
CREATE DATABASE euni_cms OWNER cms_admin;
