# Quy trình Git

Mỗi repo (`euni-public`, `euni-admin`, `euni-api-mock`) độc lập, dùng cùng mô hình:

```text
feature/* ──PR──> develop ──PR──> main ──> Deploy
fix/*     ──PR──> develop
hotfix/*  ────────────────> main + đồng bộ lại develop
```

- `main`: ổn định/deploy; không code trực tiếp. `develop`: nhánh tích hợp. Chỉ hai nhánh này tồn tại lâu dài.
- `feature/*`, `fix/*`, `refactor/*`, `docs/*`: tạo từ `develop`, xóa sau khi merge.
- CI mỗi repo chạy `npm ci` + build khi push/PR vào `develop`/`main` (`.github/workflows/ci.yml`).

## Khởi tạo & đẩy lên git

```bash
node scripts/git-init.mjs                       # git init -b main trong 3 repo (chưa commit)
cd euni-public
git add . && git commit -m "chore: khởi tạo euni-public (Next.js)"
git remote add origin <url-repo-public>
git push -u origin main
git checkout -b develop && git push -u origin develop
# lặp lại cho euni-admin (và euni-api-mock nếu muốn đẩy riêng)
```

`.env`, `.env.local`, `node_modules`, `.next` đã nằm trong `.gitignore`.

## Tên nhánh gợi ý

| Repo | Ví dụ |
|---|---|
| euni-public | `feature/public-home`, `feature/public-about`, `feature/public-education`, `feature/portal-student`, `feature/portal-staff`, `feature/api-loaders`, `feature/shared-ui` |
| euni-admin | `feature/cms-posts`, `feature/cms-media`, `feature/cms-users`, `feature/cms-settings`, `feature/cms-write-actions` |
| euni-api-mock | `feature/contract-<endpoint>` |

Quy tắc đặt tên: nhánh `kebab-case`; component React `PascalCase`; hàm/biến `camelCase`; hằng `UPPER_SNAKE_CASE`.

## Khi đổi hợp đồng API

1. Sửa `euni-api-mock` (cms.js / datasets.js / store.js) và `npm run contract`.
2. Báo backend phần thay đổi (`contract/API_CONTRACT.md` có diff).
3. Cập nhật `src/lib/datasets/loaders.js` ở repo FE liên quan.
