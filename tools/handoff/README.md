# Trang bàn giao Backend

`docs/ban-giao-be.html` được dựng từ `euni-api-mock/contract/API_CONTRACT.md` và `euni-api-mock/database/v2/schema.sql`.
Sau khi sinh lại hợp đồng (`npm run contract`), dựng lại trang:

```bash
python3 tools/handoff/extract.py . /tmp/handoff-data.json
python3 tools/handoff/build.py /tmp/handoff-data.json docs/ban-giao-be.html
```
