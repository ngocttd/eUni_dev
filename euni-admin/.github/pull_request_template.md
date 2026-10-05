## Phạm vi
- Màn hình CMS (CMS-01 … CMS-10):
- API sử dụng:

## Thay đổi
-

## Vùng dùng chung đã sửa
- [ ] `src/lib/datasets/loaders.js` (loadCms / adapter)
- [ ] `src/lib/api/cmsApi.js`
- [ ] `src/shared/**`
- [ ] `src/config/cmsUi.js`
- [ ] `package.json` / `package-lock.json`

## Kiểm tra
- [ ] `npm ci` && `npm run build`
- [ ] Chạy với `euni-api-mock`: đăng nhập, thao tác ghi, kiểm tra website public đổi theo
- [ ] Kiểm tra phân quyền (Super Admin / Editor / Author / Viewer)
- [ ] Nếu cần endpoint/field mới: đã cập nhật `euni-api-mock/contract` và báo backend
- [ ] Đã merge/rebase `develop` mới nhất trước PR
