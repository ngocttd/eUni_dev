## Phạm vi
- Module (about / admissions / content / … / portal-student / …):
- Route liên quan:

## Thay đổi
-

## Vùng dùng chung đã sửa
- [ ] `src/lib/datasets/loaders.js` (endpoint / adapter)
- [ ] `src/lib/api/**`, `src/lib/router.jsx`
- [ ] `src/shared/**`
- [ ] `src/routes/sitemap.js`
- [ ] `src/i18n/**`
- [ ] `package.json` / `package-lock.json`

## Kiểm tra
- [ ] `npm ci` && `npm run build`
- [ ] Chạy với `euni-api-mock` (hoặc gateway thật) và mở các route chính
- [ ] Responsive, chuyển Việt/Anh
- [ ] Nếu đổi shape dữ liệu: đã cập nhật `euni-api-mock/contract` và báo backend
- [ ] Đã merge/rebase `develop` mới nhất trước PR
