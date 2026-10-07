# API Khoa học công nghệ và Tổ chức

Mọi đường dẫn nằm sau `{BASE_PATH}` (mặc định `/euni-mock-api`). Không cần token. Phản hồi bên dưới lấy từ API đang chạy trên dữ liệu seed, mảng được rút gọn còn 1–2 phần tử đầu.

Phân trang: `?pageIndex=1&pageSize=20` (tối đa 500), `?keyword=` lọc theo từ khóa. Dạng trả về: `{ items, pageIndex, pageSize, totalItems, totalPages }`. Lỗi: `{ "message": "…" }` (404 khi không có dataset).


## Khoa học công nghệ (`qlkhcn-api`, module `research`)

Cổng nghiên cứu khoa học: đề tài, công bố, chuyên gia, phòng thí nghiệm, hội thảo, đào tạo tiến sĩ, chuyển giao công nghệ.


### `GET /qlkhcn-api/api/v1/public/datasets/research`

Toàn bộ dữ liệu của phân hệ (một đối tượng gồm mọi khóa bên dưới)

```json
{
  "conferences": [
    {
      "slug": "dia-chat-khoang-san-2026",
      "name": "Hội thảo khoa học quốc tế về Địa chất và Khoáng sản 2026",
      "date": "20/05/2026",
      "time": "08:00 – 17:00",
      "place": "Hội trường A, HUMG",
      "scope": "Quốc tế",
      "organizer": "Khoa Địa chất & Phòng Hợp tác quốc tế",
      "status": "Sắp diễn ra"
    },
    "… (+5 phần tử)"
  ],
  "expertStats": [
    {
      "value": "236",
      "label": "Tổng số chuyên gia"
    },
    "… (+3 phần tử)"
  ],
  "experts": [
    {
      "id": "e1",
      "name": "PGS.TS. Trần Văn A",
      "position": "Trưởng nhóm nghiên cứu mạnh",
      "faculty": "Khoa Mỏ",
      "fields": [
        "Khai thác mỏ",
        "… (+2 phần tử)"
      ],
      "email": "tranva@humg.edu.vn",
      "phone": "024.3838.1301",
      "pubs": 62,
      "projects": 9,
      "hIndex": 14
    },
    "… (+8 phần tử)"
  ],
  "labs": [
    {
      "id": "l1",
      "name": "Phòng thí nghiệm Cơ học đá",
      "faculty": "Khoa Mỏ",
      "head": "PGS.TS. Trần Văn A",
      "desc": "Nghiên cứu tính chất cơ – lý của đá và ổn định công trình ngầm.",
      "equipment": [
        "Máy nén đa trục",
        "… (+2 phần tử)"
      ],
      "services": [
        "Thí nghiệm mẫu đá",
        "… (+1 phần tử)"
      ]
    },
    "… (+5 phần tử)"
  ],
  "phdTraining": {
    "intro": "HUMG là một trong những cơ sở hàng đầu cả nước về đào tạo trình độ tiến sĩ trong lĩnh vực khoa học Trái đất, mỏ và các ngành kỹ thuật liê…",
    "stats": [
      {
        "value": "18",
        "label": "Ngành đào tạo tiến sĩ"
      },
      "… (+3 phần tử)"
    ],
    "fields": [
      "Kỹ thuật Mỏ",
      "… (+9 phần tử)"
    ],
    "steps": [
      {
        "title": "Đăng ký & xét tuyển",
        "text": "Nộp hồ sơ theo thông báo tuyển sinh, bảo vệ đề cương trước Tiểu ban chuyên môn."
      },
      "… (+3 phần tử)"
    ],
    "docs": [
      {
        "name": "Quy chế đào tạo trình độ tiến sĩ (hiện hành)",
        "meta": "PDF · 1.5 MB"
      },
      "… (+2 phần tử)"
    ],
    "notices": [
      {
        "date": "15/05/2026",
        "title": "Thông báo tuyển sinh đào tạo trình độ tiến sĩ đợt 2 năm 2026"
      },
      "… (+2 phần tử)"
    ]
  },
  "projectLevels": [
    "Tất cả",
    "… (+5 phần tử)"
  ],
  "projects": [
    {
      "budget": "2.500.000.000 đ",
      "org": "Trường Đại học Mỏ - Địa chất",
      "objectives": [
        "Nghiên cứu cơ sở khoa học và thực tiễn của vấn đề đặt ra",
        "… (+2 phần tử)"
      ],
      "results": [
        "Báo cáo tổng kết đề tài và các báo cáo chuyên đề",
        "… (+2 phần tử)"
      ],
      "products": [
        "02 bài báo quốc tế (Scopus)",
        "… (+3 phần tử)"
      ],
      "members": [
        {
          "name": "PGS.TS. Trần Văn A",
          "role": "Chủ nhiệm đề tài"
        },
        "… (+3 phần tử)"
      ],
      "docs": [
        {
          "name": "Thuyết minh đề tài (đã phê duyệt)",
          "meta": "PDF · 1.25 MB"
        },
        "… (+2 phần tử)"
      ],
      "id": "humg-2024-01",
      "code": "HUMG.2024.01",
      "level": "Cấp Bộ",
      "field": "Kỹ thuật Mỏ & An toàn",
      "title": "Nghiên cứu công nghệ khai thác than hầm lò thân thiện môi trường vùng Quảng Ninh",
      "leader": "PGS.TS. Trần Văn A",
      "startYear": 2024,
      "endYear": 2026,
      "status": "Đang thực hiện",
      "summary": "Đề tài nghiên cứu các giải pháp công nghệ nhằm giảm tổn thất tài nguyên, giảm phát thải và nâng cao an toàn trong khai thác than hầm lò."
    },
    "… (+7 phần tử)"
  ],
  "publicationTypes": [
    "Tất cả",
    "… (+4 phần tử)"
  ],
  "publications": [
    {
      "id": "pub-01",
      "type": "Tạp chí quốc tế",
      "quartile": "Q1",
      "year": 2024,
      "citations": 18,
      "downloads": 420,
      "impactFactor": "4.5",
      "title": "Application of Machine Learning for Rockburst Prediction in Underground Coal Mines",
      "titleVi": "Ứng dụng học máy dự báo hiện tượng nứt vỡ đá trong mỏ than hầm lò",
      "authors": "Tran V. A., Nguyen V. B., Pham T. C.",
      "journal": "Engineering Geology (Elsevier)",
      "doi": "10.1016/j.enggeo.2024.107647",
      "abstract": "This study proposes a machine learning framework integrating microseismic monitoring data and geological features to predict rockburst ha…",
      "keywords": [
        "rockburst",
        "… (+4 phần tử)"
      ],
      "apa": "Tran, V. A., Nguyen, V. B., & Pham, T. C. (2024). Application of machine learning for rockburst prediction in underground coal mines. Eng…"
    },
    "… (+5 phần tử)"
  ],
  "resHub": {
    "modules": [
      {
        "icon": "flask",
        "title": "Đề tài / Dự án",
        "desc": "Đề tài các cấp: Nhà nước, Bộ, Tỉnh, Trường.",
        "to": "/nghien-cuu/de-tai"
      },
      "… (+8 phần tử)"
    ],
    "stats": [
      {
        "value": "142",
        "label": "Đề tài / dự án"
      },
      "… (+4 phần tử)"
    ],
    "quickLinks": [
      {
        "label": "CSDL khoa học",
        "to": "/thu-vien/csdl-khoa-hoc"
      },
      "… (+4 phần tử)"
    ],
    "notices": [
      {
        "date": "18/05/2026",
        "title": "Thông báo xét duyệt đề tài NCKH cấp Trường năm 2026"
      },
      "… (+2 phần tử)"
    ]
  },
  "resNav": [
    {
      "label": "Khoa học & Công nghệ",
      "to": "/nghien-cuu",
      "icon": "flask"
    },
    "… (+8 phần tử)"
  ],
  "researchFields": [
    "Địa chất & Tài nguyên khoáng sản",
    "… (+7 phần tử)"
  ],
  "researchGroups": [
    {
      "id": "g1",
      "name": "Nhóm nghiên cứu mạnh Cơ học đá & Khai thác hầm lò",
      "leader": "PGS.TS. Trần Văn A",
      "members": 12,
      "field": "Kỹ thuật Mỏ & An toàn",
      "established": 2018,
      "focus": "Cơ học đá, ổn định công trình ngầm, an toàn mỏ và cơ giới hóa khai thác."
    },
    "… (+5 phần tử)"
  ],
  "strongFields": [
    {
      "label": "Kỹ thuật Mỏ & An toàn",
      "value": 56
    },
    "… (+4 phần tử)"
  ],
  "techTransfer": {
    "intro": "Trường Đại học Mỏ - Địa chất đẩy mạnh chuyển giao kết quả nghiên cứu vào thực tiễn sản xuất thông qua các hợp đồng dịch vụ khoa học công …",
    "steps": [
      {
        "title": "Tiếp nhận nhu cầu",
        "text": "Doanh nghiệp / đơn vị gửi yêu cầu qua Phòng KHCN hoặc trực tiếp tới nhóm nghiên cứu."
      },
      "… (+3 phần tử)"
    ],
    "products": [
      {
        "name": "Quy trình khai thác than hầm lò giảm tổn thất tài nguyên",
        "field": "Kỹ thuật Mỏ",
        "partner": "Tập đoàn TKV",
        "year": 2024,
        "value": "3,2 tỷ đồng"
      },
      "… (+3 phần tử)"
    ],
    "capabilities": [
      "Tư vấn, thiết kế và giám sát công trình mỏ, công trình ngầm",
      "… (+3 phần tử)"
    ],
    "faqs": [
      {
        "q": "Doanh nghiệp muốn hợp tác chuyển giao thì liên hệ ở đâu?",
        "a": "Liên hệ Phòng Khoa học – Công nghệ (khcn@humg.edu.vn) để được kết nối với nhóm nghiên cứu phù hợp."
      },
      "… (+1 phần tử)"
    ]
  }
}
```


### `GET /qlkhcn-api/api/v1/public/research/conferences`

Danh sách `conferences`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "slug": "dia-chat-khoang-san-2026",
      "name": "Hội thảo khoa học quốc tế về Địa chất và Khoáng sản 2026",
      "date": "20/05/2026",
      "time": "08:00 – 17:00",
      "place": "Hội trường A, HUMG",
      "scope": "Quốc tế",
      "organizer": "Khoa Địa chất & Phòng Hợp tác quốc tế",
      "status": "Sắp diễn ra"
    },
    {
      "slug": "ky-thuat-mo-toan-quoc-xxvi",
      "name": "Hội nghị Khoa học Kỹ thuật Mỏ toàn quốc lần thứ XXVI",
      "date": "15/08/2026",
      "time": "08:00 – 17:30",
      "place": "TP. Hạ Long, Quảng Ninh",
      "scope": "Trong nước",
      "organizer": "Hội KHKT Mỏ Việt Nam & HUMG",
      "status": "Sắp diễn ra"
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 6,
  "totalPages": 3
}
```


### `GET /qlkhcn-api/api/v1/public/research/expert-stats`

Danh sách `expertStats`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "value": "236",
      "label": "Tổng số chuyên gia"
    },
    {
      "value": "12",
      "label": "Giáo sư"
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 4,
  "totalPages": 2
}
```


### `GET /qlkhcn-api/api/v1/public/research/experts`

Danh sách `experts`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "id": "e1",
      "name": "PGS.TS. Trần Văn A",
      "position": "Trưởng nhóm nghiên cứu mạnh",
      "faculty": "Khoa Mỏ",
      "fields": [
        "Khai thác mỏ",
        "An toàn mỏ",
        "… (+1 phần tử)"
      ],
      "email": "tranva@humg.edu.vn",
      "phone": "024.3838.1301",
      "pubs": 62,
      "projects": 9,
      "hIndex": 14
    },
    {
      "id": "e2",
      "name": "TS. Nguyễn Thị B",
      "position": "Trưởng bộ môn",
      "faculty": "Khoa KH&KT Địa chất",
      "fields": [
        "Địa hóa",
        "Khoáng sản kim loại hiếm",
        "… (+1 phần tử)"
      ],
      "email": "nguyenthib@humg.edu.vn",
      "phone": "024.3838.1402",
      "pubs": 45,
      "projects": 7,
      "hIndex": 11
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 9,
  "totalPages": 5
}
```


### `GET /qlkhcn-api/api/v1/public/research/labs`

Danh sách `labs`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "id": "l1",
      "name": "Phòng thí nghiệm Cơ học đá",
      "faculty": "Khoa Mỏ",
      "head": "PGS.TS. Trần Văn A",
      "desc": "Nghiên cứu tính chất cơ – lý của đá và ổn định công trình ngầm.",
      "equipment": [
        "Máy nén đa trục",
        "Thiết bị đo biến dạng",
        "… (+1 phần tử)"
      ],
      "services": [
        "Thí nghiệm mẫu đá",
        "Tư vấn ổn định hầm lò"
      ]
    },
    {
      "id": "l2",
      "name": "Phòng thí nghiệm Địa hóa – Khoáng vật",
      "faculty": "Khoa KH&KT Địa chất",
      "head": "TS. Nguyễn Thị B",
      "desc": "Phân tích thành phần địa hóa, khoáng vật và tuổi đồng vị.",
      "equipment": [
        "ICP-MS",
        "XRD",
        "… (+1 phần tử)"
      ],
      "services": [
        "Phân tích mẫu địa hóa",
        "Định danh khoáng vật"
      ]
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 6,
  "totalPages": 3
}
```


### `GET /qlkhcn-api/api/v1/public/research/phd-training`

Đối tượng `phdTraining`

```json
{
  "intro": "HUMG là một trong những cơ sở hàng đầu cả nước về đào tạo trình độ tiến sĩ trong lĩnh vực khoa học Trái đất, mỏ và các ngành kỹ thuật liê…",
  "stats": [
    {
      "value": "18",
      "label": "Ngành đào tạo tiến sĩ"
    },
    {
      "value": "240+",
      "label": "NCS đang đào tạo"
    },
    "… (+2 phần tử)"
  ],
  "fields": [
    "Kỹ thuật Mỏ",
    "Khai thác mỏ",
    "… (+8 phần tử)"
  ],
  "steps": [
    {
      "title": "Đăng ký & xét tuyển",
      "text": "Nộp hồ sơ theo thông báo tuyển sinh, bảo vệ đề cương trước Tiểu ban chuyên môn."
    },
    {
      "title": "Xây dựng kế hoạch học tập",
      "text": "Hoàn thành các học phần bổ sung, học phần tiến sĩ và chuyên đề."
    },
    "… (+2 phần tử)"
  ],
  "docs": [
    {
      "name": "Quy chế đào tạo trình độ tiến sĩ (hiện hành)",
      "meta": "PDF · 1.5 MB"
    },
    {
      "name": "Danh mục ngành đào tạo tiến sĩ",
      "meta": "PDF · 620 KB"
    },
    "… (+1 phần tử)"
  ],
  "notices": [
    {
      "date": "15/05/2026",
      "title": "Thông báo tuyển sinh đào tạo trình độ tiến sĩ đợt 2 năm 2026"
    },
    {
      "date": "30/05/2026",
      "title": "Lịch bảo vệ luận án tiến sĩ cấp Trường tháng 6/2026"
    },
    "… (+1 phần tử)"
  ]
}
```


### `GET /qlkhcn-api/api/v1/public/research/project-levels`

Danh sách `projectLevels`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 0,
  "totalPages": 1
}
```


### `GET /qlkhcn-api/api/v1/public/research/projects`

Danh sách `projects`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "budget": "2.500.000.000 đ",
      "org": "Trường Đại học Mỏ - Địa chất",
      "objectives": [
        "Nghiên cứu cơ sở khoa học và thực tiễn của vấn đề đặt ra",
        "Xây dựng giải pháp / mô hình / công nghệ phù hợp điều kiện Việt Nam",
        "… (+1 phần tử)"
      ],
      "results": [
        "Báo cáo tổng kết đề tài và các báo cáo chuyên đề",
        "Bài báo khoa học công bố trên tạp chí trong nước và quốc tế",
        "… (+1 phần tử)"
      ],
      "products": [
        "02 bài báo quốc tế (Scopus)",
        "01 bài báo trong nước",
        "… (+2 phần tử)"
      ],
      "members": [
        {
          "name": "PGS.TS. Trần Văn A",
          "role": "Chủ nhiệm đề tài"
        },
        {
          "name": "TS. Nguyễn Thị B",
          "role": "Thư ký khoa học"
        },
        "… (+2 phần tử)"
      ],
      "docs": [
        {
          "name": "Thuyết minh đề tài (đã phê duyệt)",
          "meta": "PDF · 1.25 MB"
        },
        {
          "name": "Báo cáo tổng kết đề tài",
          "meta": "PDF · 2.10 MB"
        },
        "… (+1 phần tử)"
      ],
      "id": "humg-2024-01",
      "code": "HUMG.2024.01",
      "level": "Cấp Bộ",
      "field": "Kỹ thuật Mỏ & An toàn",
      "title": "Nghiên cứu công nghệ khai thác than hầm lò thân thiện môi trường vùng Quảng Ninh",
      "leader": "PGS.TS. Trần Văn A",
      "startYear": 2024,
      "endYear": 2026,
      "status": "Đang thực hiện",
      "summary": "Đề tài nghiên cứu các giải pháp công nghệ nhằm giảm tổn thất tài nguyên, giảm phát thải và nâng cao an toàn trong khai thác than hầm lò."
    },
    {
      "budget": "4.200.000.000 đ",
      "org": "Trường Đại học Mỏ - Địa chất",
      "objectives": [
        "Nghiên cứu cơ sở khoa học và thực tiễn của vấn đề đặt ra",
        "Xây dựng giải pháp / mô hình / công nghệ phù hợp điều kiện Việt Nam",
        "… (+1 phần tử)"
      ],
      "results": [
        "Báo cáo tổng kết đề tài và các báo cáo chuyên đề",
        "Bài báo khoa học công bố trên tạp chí trong nước và quốc tế",
        "… (+1 phần tử)"
      ],
      "products": [
        "02 bài báo quốc tế (Scopus)",
        "01 bài báo trong nước",
        "… (+2 phần tử)"
      ],
      "members": [
        {
          "name": "PGS.TS. Trần Văn A",
          "role": "Chủ nhiệm đề tài"
        },
        {
          "name": "TS. Nguyễn Thị B",
          "role": "Thư ký khoa học"
        },
        "… (+2 phần tử)"
      ],
      "docs": [
        {
          "name": "Thuyết minh đề tài (đã phê duyệt)",
          "meta": "PDF · 1.25 MB"
        },
        {
          "name": "Báo cáo tổng kết đề tài",
          "meta": "PDF · 2.10 MB"
        },
        "… (+1 phần tử)"
      ],
      "id": "humg-2023-12",
      "code": "HUMG.2023.12",
      "level": "Cấp Nhà nước",
      "field": "Trắc địa – Bản đồ, GIS & Viễn thám",
      "title": "Ứng dụng trí tuệ nhân tạo và dữ liệu viễn thám trong giám sát biến động sử dụng đất",
      "leader": "TS. Hoàng Văn E",
      "startYear": 2023,
      "endYear": 2026,
      "status": "Đang thực hiện",
      "summary": "Xây dựng mô hình học sâu kết hợp ảnh vệ tinh đa thời gian để phát hiện, phân loại và dự báo biến động sử dụng đất quy mô vùng."
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 8,
  "totalPages": 4
}
```


### `GET /qlkhcn-api/api/v1/public/research/publication-types`

Danh sách `publicationTypes`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 0,
  "totalPages": 1
}
```


### `GET /qlkhcn-api/api/v1/public/research/publications`

Danh sách `publications`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "id": "pub-01",
      "type": "Tạp chí quốc tế",
      "quartile": "Q1",
      "year": 2024,
      "citations": 18,
      "downloads": 420,
      "impactFactor": "4.5",
      "title": "Application of Machine Learning for Rockburst Prediction in Underground Coal Mines",
      "titleVi": "Ứng dụng học máy dự báo hiện tượng nứt vỡ đá trong mỏ than hầm lò",
      "authors": "Tran V. A., Nguyen V. B., Pham T. C.",
      "journal": "Engineering Geology (Elsevier)",
      "doi": "10.1016/j.enggeo.2024.107647",
      "abstract": "This study proposes a machine learning framework integrating microseismic monitoring data and geological features to predict rockburst ha…",
      "keywords": [
        "rockburst",
        "machine learning",
        "… (+3 phần tử)"
      ],
      "apa": "Tran, V. A., Nguyen, V. B., & Pham, T. C. (2024). Application of machine learning for rockburst prediction in underground coal mines. Eng…"
    },
    {
      "id": "pub-02",
      "type": "Tạp chí quốc tế",
      "quartile": "Q1",
      "year": 2023,
      "citations": 34,
      "downloads": 610,
      "impactFactor": "5.1",
      "title": "Multi-temporal Satellite Data and Deep Learning for Land-Use Change Detection",
      "titleVi": "Dữ liệu vệ tinh đa thời gian và học sâu trong phát hiện biến động sử dụng đất",
      "authors": "Hoang V. E., Le V. C., Vu T. F.",
      "journal": "Remote Sensing (MDPI)",
      "doi": "10.3390/rs15112841",
      "abstract": "A deep learning approach based on transformer architectures is developed for accurate land-use change detection using multi-temporal Sent…",
      "keywords": [
        "remote sensing",
        "deep learning",
        "… (+3 phần tử)"
      ],
      "apa": "Hoang, V. E., Le, V. C., & Vu, T. F. (2023). Multi-temporal satellite data and deep learning for land-use change detection. Remote Sensin…"
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 6,
  "totalPages": 3
}
```


### `GET /qlkhcn-api/api/v1/public/research/res-hub`

Đối tượng `resHub`

```json
{
  "modules": [
    {
      "icon": "flask",
      "title": "Đề tài / Dự án",
      "desc": "Đề tài các cấp: Nhà nước, Bộ, Tỉnh, Trường.",
      "to": "/nghien-cuu/de-tai"
    },
    {
      "icon": "newspaper",
      "title": "Công bố khoa học",
      "desc": "Bài báo ISI/Scopus, tạp chí trong nước.",
      "to": "/nghien-cuu/cong-bo"
    },
    "… (+7 phần tử)"
  ],
  "stats": [
    {
      "value": "142",
      "label": "Đề tài / dự án"
    },
    {
      "value": "650+",
      "label": "Công bố quốc tế"
    },
    "… (+3 phần tử)"
  ],
  "quickLinks": [
    {
      "label": "CSDL khoa học",
      "to": "/thu-vien/csdl-khoa-hoc"
    },
    {
      "label": "Danh sách chuyên gia",
      "to": "/nghien-cuu/chuyen-gia"
    },
    "… (+3 phần tử)"
  ],
  "notices": [
    {
      "date": "18/05/2026",
      "title": "Thông báo xét duyệt đề tài NCKH cấp Trường năm 2026"
    },
    {
      "date": "12/05/2026",
      "title": "Danh mục tạp chí được tính điểm công trình năm 2026"
    },
    "… (+1 phần tử)"
  ]
}
```


### `GET /qlkhcn-api/api/v1/public/research/res-nav`

Danh sách `resNav`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "label": "Khoa học & Công nghệ",
      "to": "/nghien-cuu",
      "icon": "flask"
    },
    {
      "label": "Đề tài / Dự án",
      "to": "/nghien-cuu/de-tai",
      "icon": "file"
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 9,
  "totalPages": 5
}
```


### `GET /qlkhcn-api/api/v1/public/research/research-fields`

Danh sách `researchFields`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 0,
  "totalPages": 1
}
```


### `GET /qlkhcn-api/api/v1/public/research/research-groups`

Danh sách `researchGroups`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "id": "g1",
      "name": "Nhóm nghiên cứu mạnh Cơ học đá & Khai thác hầm lò",
      "leader": "PGS.TS. Trần Văn A",
      "members": 12,
      "field": "Kỹ thuật Mỏ & An toàn",
      "established": 2018,
      "focus": "Cơ học đá, ổn định công trình ngầm, an toàn mỏ và cơ giới hóa khai thác."
    },
    {
      "id": "g2",
      "name": "Nhóm AI & Viễn thám cho Khoa học Trái đất",
      "leader": "PGS.TS. Hoàng Văn E",
      "members": 10,
      "field": "Trắc địa – Bản đồ, GIS & Viễn thám",
      "established": 2020,
      "focus": "Học sâu, xử lý ảnh vệ tinh, giám sát tài nguyên – môi trường và tai biến địa chất."
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 6,
  "totalPages": 3
}
```


### `GET /qlkhcn-api/api/v1/public/research/strong-fields`

Danh sách `strongFields`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "label": "Kỹ thuật Mỏ & An toàn",
      "value": 56
    },
    {
      "label": "Địa chất & Khoáng sản",
      "value": 42
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 5,
  "totalPages": 3
}
```


### `GET /qlkhcn-api/api/v1/public/research/tech-transfer`

Đối tượng `techTransfer`

```json
{
  "intro": "Trường Đại học Mỏ - Địa chất đẩy mạnh chuyển giao kết quả nghiên cứu vào thực tiễn sản xuất thông qua các hợp đồng dịch vụ khoa học công …",
  "steps": [
    {
      "title": "Tiếp nhận nhu cầu",
      "text": "Doanh nghiệp / đơn vị gửi yêu cầu qua Phòng KHCN hoặc trực tiếp tới nhóm nghiên cứu."
    },
    {
      "title": "Khảo sát & đề xuất giải pháp",
      "text": "Nhóm chuyên gia khảo sát hiện trạng, xây dựng phương án và dự toán."
    },
    "… (+2 phần tử)"
  ],
  "products": [
    {
      "name": "Quy trình khai thác than hầm lò giảm tổn thất tài nguyên",
      "field": "Kỹ thuật Mỏ",
      "partner": "Tập đoàn TKV",
      "year": 2024,
      "value": "3,2 tỷ đồng"
    },
    {
      "name": "Hệ thống giám sát an toàn hầm lò bằng IoT",
      "field": "Tự động hóa",
      "partner": "Công ty than Vàng Danh",
      "year": 2025,
      "value": "1,8 tỷ đồng"
    },
    "… (+2 phần tử)"
  ],
  "capabilities": [
    "Tư vấn, thiết kế và giám sát công trình mỏ, công trình ngầm",
    "Khảo sát địa chất, địa vật lý, địa kỹ thuật và trắc địa công trình",
    "… (+2 phần tử)"
  ],
  "faqs": [
    {
      "q": "Doanh nghiệp muốn hợp tác chuyển giao thì liên hệ ở đâu?",
      "a": "Liên hệ Phòng Khoa học – Công nghệ (khcn@humg.edu.vn) để được kết nối với nhóm nghiên cứu phù hợp."
    },
    {
      "q": "HUMG có hỗ trợ đăng ký sở hữu trí tuệ không?",
      "a": "Có. Nhà trường hỗ trợ thủ tục đăng ký sáng chế, giải pháp hữu ích và bảo hộ kết quả nghiên cứu."
    }
  ]
}
```


### `GET /qlkhcn-api/api/v1/public/research-topic-categories`

Lĩnh vực nghiên cứu (theo Swagger gateway demo). Có phân trang và ?keyword

```json
{
  "items": [
    {
      "id": 1,
      "code": "LV01",
      "name": "Địa chất & Tài nguyên khoáng sản"
    },
    {
      "id": 2,
      "code": "LV02",
      "name": "Kỹ thuật Mỏ & An toàn"
    },
    "… (+1 phần tử)"
  ],
  "pageIndex": 1,
  "pageSize": 3,
  "totalItems": 8,
  "totalPages": 3
}
```


## Tổ chức (`qlns-api`, module `about`)

Giới thiệu trường và cơ cấu tổ chức: ban giám hiệu, sơ đồ tổ chức, khoa, phòng ban, trung tâm, lịch sử, tầm nhìn.


### `GET /qlns-api/api/v1/public/datasets/about`

Toàn bộ dữ liệu của phân hệ (một đối tượng gồm mọi khóa bên dưới)

```json
{
  "aboutNav": [
    {
      "label": "Tổng quan",
      "to": "/gioi-thieu",
      "icon": "home"
    },
    "… (+6 phần tử)"
  ],
  "achievements": [
    {
      "key": "daotao",
      "label": "Đào tạo",
      "items": [
        {
          "title": "Top 10 trường đại học kỹ thuật hàng đầu Việt Nam",
          "meta": "Bảng xếp hạng VNUR",
          "year": "2024"
        },
        "… (+2 phần tử)"
      ]
    },
    "… (+3 phần tử)"
  ],
  "board": {
    "rector": {
      "name": "PGS.TS. Trần Xuân Trường",
      "role": "Hiệu trưởng",
      "email": "hieutruong@humg.edu.vn",
      "phone": "024.3838.3006",
      "bio": "Phụ trách chung, chiến lược phát triển, công tác tổ chức cán bộ, tài chính và đối ngoại của Nhà trường."
    },
    "vices": [
      {
        "name": "PGS.TS. Nguyễn Văn X",
        "role": "Phó Hiệu trưởng",
        "email": "pht.daotao@humg.edu.vn",
        "phone": "024.3838.3010",
        "bio": "Phụ trách đào tạo đại học, sau đại học, khảo thí và đảm bảo chất lượng giáo dục."
      },
      "… (+2 phần tử)"
    ]
  },
  "facultyDepartments": {
    "mo": [
      {
        "id": "khai-thac-ham-lo",
        "name": "Bộ môn Khai thác hầm lò",
        "head": "PGS.TS. Trần Văn Anh",
        "desc": "Đào tạo và nghiên cứu công nghệ khai thác khoáng sản bằng phương pháp hầm lò, cơ giới hóa và an toàn mỏ.",
        "research": [
          "Cơ giới hóa khấu than",
          "… (+2 phần tử)"
        ],
        "size": 15,
        "lecturers": [
          {
            "id": "tran-van-anh",
            "name": "PGS.TS. Trần Văn Anh",
            "position": "Trưởng bộ môn",
            "fields": [
              "Cơ giới hóa khấu than",
              "… (+1 phần tử)"
            ],
            "pubs": 52,
            "email": "tran-van-anh@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+3 phần tử)"
        ]
      },
      "… (+2 phần tử)"
    ],
    "dia-chat": [
      {
        "id": "dia-chat-cong-trinh",
        "name": "Bộ môn Địa chất công trình – Địa kỹ thuật",
        "head": "TS. Nguyễn Thị Bình",
        "desc": "Nghiên cứu tính chất cơ lý của đất đá, ổn định nền móng, hố đào và các bài toán địa kỹ thuật.",
        "research": [
          "Ổn định mái dốc",
          "… (+2 phần tử)"
        ],
        "size": 14,
        "lecturers": [
          {
            "id": "nguyen-thi-binh-dcct",
            "name": "TS. Nguyễn Thị Bình",
            "position": "Trưởng bộ môn",
            "fields": [
              "Ổn định mái dốc",
              "… (+1 phần tử)"
            ],
            "pubs": 29,
            "email": "nguyen-thi-binh-dcct@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+3 phần tử)"
        ]
      },
      "… (+1 phần tử)"
    ],
    "dau-khi": [
      {
        "id": "khoan-khai-thac",
        "name": "Bộ môn Khoan – Khai thác dầu khí",
        "head": "TS. Phạm Văn Cường",
        "desc": "Nghiên cứu công nghệ khoan, hoàn thiện giếng và nâng cao hệ số thu hồi dầu.",
        "research": [
          "Thủy lực khoan",
          "… (+2 phần tử)"
        ],
        "size": 13,
        "lecturers": [
          {
            "id": "pham-van-cuong-kkt",
            "name": "TS. Phạm Văn Cường",
            "position": "Trưởng bộ môn",
            "fields": [
              "Thủy lực khoan",
              "… (+1 phần tử)"
            ],
            "pubs": 31,
            "email": "pham-van-cuong-kkt@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+1 phần tử)"
    ],
    "trac-dia": [
      {
        "id": "trac-dia-cao-cap",
        "name": "Bộ môn Trắc địa cao cấp – Địa không gian",
        "head": "PGS.TS. Phạm Văn Định",
        "desc": "Nghiên cứu trắc địa cao cấp, GNSS, trọng lực và hệ quy chiếu, quan trắc chuyển dịch biến dạng.",
        "research": [
          "GNSS – định vị chính xác",
          "… (+2 phần tử)"
        ],
        "size": 16,
        "lecturers": [
          {
            "id": "pham-van-dinh-tdcc",
            "name": "PGS.TS. Phạm Văn Định",
            "position": "Trưởng bộ môn",
            "fields": [
              "GNSS – định vị chính xác",
              "… (+1 phần tử)"
            ],
            "pubs": 58,
            "email": "pham-van-dinh-tdcc@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+3 phần tử)"
        ]
      },
      "… (+2 phần tử)"
    ],
    "cntt": [
      {
        "id": "khoa-hoc-may-tinh",
        "name": "Bộ môn Khoa học máy tính",
        "head": "TS. Lê Văn Chính",
        "desc": "Đào tạo nền tảng khoa học máy tính, trí tuệ nhân tạo và học máy ứng dụng.",
        "research": [
          "Học máy – học sâu",
          "… (+2 phần tử)"
        ],
        "size": 18,
        "lecturers": [
          {
            "id": "le-van-chinh-khmt",
            "name": "TS. Lê Văn Chính",
            "position": "Trưởng bộ môn",
            "fields": [
              "Học máy – học sâu",
              "… (+1 phần tử)"
            ],
            "pubs": 38,
            "email": "le-van-chinh-khmt@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+3 phần tử)"
        ]
      },
      "… (+2 phần tử)"
    ],
    "co-dien": [
      {
        "id": "tu-dong-hoa",
        "name": "Bộ môn Tự động hóa",
        "head": "PGS.TS. Vũ Văn Phong",
        "desc": "Nghiên cứu điều khiển tự động, hệ thống nhúng, IoT và tự động hóa dây chuyền công nghiệp mỏ.",
        "research": [
          "Điều khiển hiện đại",
          "… (+2 phần tử)"
        ],
        "size": 15,
        "lecturers": [
          {
            "id": "vu-van-phong-tdh",
            "name": "PGS.TS. Vũ Văn Phong",
            "position": "Trưởng bộ môn",
            "fields": [
              "Điều khiển hiện đại",
              "… (+1 phần tử)"
            ],
            "pubs": 41,
            "email": "vu-van-phong-tdh@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+2 phần tử)"
    ],
    "kt-qtkd": [
      {
        "id": "quan-tri-kinh-doanh",
        "name": "Bộ môn Quản trị kinh doanh",
        "head": "TS. Đỗ Văn Giàu",
        "desc": "Đào tạo và nghiên cứu quản trị doanh nghiệp, quản trị dự án và khởi nghiệp trong lĩnh vực tài nguyên.",
        "research": [
          "Quản trị chiến lược",
          "… (+2 phần tử)"
        ],
        "size": 16,
        "lecturers": [
          {
            "id": "do-van-giau-qtkd",
            "name": "TS. Đỗ Văn Giàu",
            "position": "Trưởng bộ môn",
            "fields": [
              "Quản trị chiến lược",
              "… (+1 phần tử)"
            ],
            "pubs": 26,
            "email": "do-van-giau-qtkd@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+1 phần tử)"
    ],
    "moi-truong": [
      {
        "id": "ky-thuat-moi-truong",
        "name": "Bộ môn Kỹ thuật môi trường",
        "head": "PGS.TS. Ngô Thị Hồng",
        "desc": "Nghiên cứu công nghệ xử lý nước, khí, chất thải rắn và phục hồi môi trường sau khai thác.",
        "research": [
          "Xử lý nước thải mỏ",
          "… (+2 phần tử)"
        ],
        "size": 12,
        "lecturers": [
          {
            "id": "ngo-thi-hong-ktmt",
            "name": "PGS.TS. Ngô Thị Hồng",
            "position": "Trưởng bộ môn",
            "fields": [
              "Xử lý nước thải mỏ",
              "… (+1 phần tử)"
            ],
            "pubs": 36,
            "email": "ngo-thi-hong-ktmt@humg.edu.vn",
            "phone": "024.3838.3800"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+1 phần tử)"
    ]
  },
  "history": [
    {
      "year": "1966",
      "title": "Thành lập Trường",
      "text": "Trường Đại học Mỏ - Địa chất được thành lập theo Quyết định của Hội đồng Chính phủ, trên cơ sở Khoa Mỏ - Địa chất của Trường Đại học Bách…"
    },
    "… (+4 phần tử)"
  ],
  "numbers": {
    "big": [
      {
        "value": "60+",
        "label": "Năm phát triển"
      },
      "… (+4 phần tử)"
    ],
    "enrollment": [
      {
        "year": "2019",
        "value": 12800
      },
      "… (+5 phần tử)"
    ],
    "publications": [
      {
        "year": "2019",
        "value": 420
      },
      "… (+5 phần tử)"
    ],
    "faculty": [
      {
        "label": "Giáo sư, Phó Giáo sư",
        "value": 10
      },
      "… (+3 phần tử)"
    ]
  },
  "orgChart": {
    "board": "Ban Giám hiệu",
    "support": "Đảng ủy lãnh đạo toàn diện; Công đoàn, Đoàn Thanh niên và Hội Sinh viên phối hợp thực hiện nhiệm vụ.",
    "branches": [
      "Khối Khoa / Viện đào tạo",
      "… (+3 phần tử)"
    ],
    "motto": "Minh bạch · Hiệu quả · Hợp tác · Phát triển"
  },
  "overview": {
    "intro": [
      "Trường Đại học Mỏ - Địa chất là trường đại học công lập trực thuộc Bộ Giáo dục và Đào tạo, có bề dày truyền thống trong đào tạo và nghiên…",
      "… (+1 phần tử)"
    ],
    "stats": [
      {
        "value": "1966",
        "label": "Năm thành lập"
      },
      "… (+4 phần tử)"
    ],
    "more": [
      {
        "value": "12",
        "label": "Khoa chuyên môn"
      },
      "… (+3 phần tử)"
    ],
    "values": [
      "Đổi mới sáng tạo",
      "… (+4 phần tử)"
    ]
  },
  "rectorMessage": {
    "name": "PGS.TS. Trần Xuân Trường",
    "role": "Hiệu trưởng Trường Đại học Mỏ - Địa chất",
    "paragraphs": [
      "Với truyền thống 60 năm xây dựng và phát triển, Trường Đại học Mỏ - Địa chất không ngừng đổi mới, sáng tạo trong đào tạo, nghiên cứu khoa…",
      "… (+2 phần tử)"
    ],
    "sign": "Trân trọng,",
    "values": [
      "Đổi mới – Sáng tạo",
      "… (+4 phần tử)"
    ]
  },
  "units": {
    "khoa": {
      "label": "Khoa / Viện đào tạo",
      "singular": "Khoa",
      "intro": "Các khoa và viện đào tạo trực thuộc Trường Đại học Mỏ - Địa chất, đảm nhiệm công tác giảng dạy và nghiên cứu theo lĩnh vực chuyên môn.",
      "list": [
        {
          "id": "mo",
          "name": "Khoa Mỏ",
          "head": "PGS.TS. Nguyễn Văn A",
          "founded": 1966,
          "staff": 62,
          "students": 2300,
          "majors": [
            "Kỹ thuật Mỏ",
            "… (+2 phần tử)"
          ],
          "desc": "Đào tạo và nghiên cứu về khai thác mỏ, tuyển khoáng, an toàn và cơ điện mỏ.",
          "phone": "024.3838.3860",
          "email": "khoamo@humg.edu.vn",
          "board": [
            {
              "name": "PGS.TS. Nguyễn Văn A",
              "role": "Trưởng khoa",
              "email": "nguyenvana@humg.edu.vn"
            },
            "… (+3 phần tử)"
          ]
        },
        "… (+7 phần tử)"
      ]
    },
    "phong-ban": {
      "label": "Phòng / Ban chức năng",
      "singular": "Phòng / Ban",
      "intro": "Các phòng, ban chức năng tham mưu, giúp việc cho Ban Giám hiệu trong quản lý và điều hành Nhà trường.",
      "list": [
        {
          "id": "dao-tao",
          "name": "Phòng Đào tạo",
          "head": "TS. Nguyễn Văn B",
          "phone": "024.3838.3827",
          "email": "daotao@humg.edu.vn",
          "functions": [
            "Quản lý đào tạo đại học",
            "… (+2 phần tử)"
          ],
          "desc": "Tham mưu và tổ chức thực hiện công tác đào tạo bậc đại học.",
          "staff": [
            {
              "name": "TS. Nguyễn Văn B",
              "role": "Trưởng phòng",
              "email": "nguyenvanb@humg.edu.vn"
            },
            "… (+4 phần tử)"
          ]
        },
        "… (+7 phần tử)"
      ]
    },
    "trung-tam-vien": {
      "label": "Trung tâm / Viện nghiên cứu",
      "singular": "Trung tâm / Viện",
      "intro": "Các trung tâm, viện nghiên cứu và đơn vị dịch vụ khoa học công nghệ của Trường.",
      "list": [
        {
          "id": "vien-khcn-mo",
          "name": "Viện Khoa học Công nghệ Mỏ - Địa chất",
          "head": "PGS.TS. Nguyễn A",
          "phone": "024.3838.3840",
          "email": "vienkhcn@humg.edu.vn",
          "functions": [
            "Nghiên cứu ứng dụng",
            "… (+2 phần tử)"
          ],
          "desc": "Nghiên cứu và chuyển giao công nghệ trong lĩnh vực mỏ - địa chất.",
          "staff": [
            {
              "name": "PGS.TS. Nguyễn A",
              "role": "Viện trưởng",
              "email": "nguyena-vien@humg.edu.vn"
            },
            "… (+4 phần tử)"
          ]
        },
        "… (+4 phần tử)"
      ]
    },
    "don-vi-truc-thuoc": {
      "label": "Đơn vị trực thuộc",
      "singular": "Đơn vị",
      "intro": "Các đơn vị sự nghiệp, dịch vụ trực thuộc Trường Đại học Mỏ - Địa chất.",
      "list": [
        {
          "id": "ky-tuc-xa",
          "name": "Ban Quản lý Ký túc xá",
          "head": "ThS. Nguyễn F",
          "phone": "024.3838.3850",
          "email": "ktx@humg.edu.vn",
          "functions": [
            "Quản lý chỗ ở sinh viên",
            "… (+2 phần tử)"
          ],
          "desc": "Quản lý và phục vụ chỗ ở cho sinh viên nội trú.",
          "staff": [
            {
              "name": "ThS. Nguyễn F",
              "role": "Trưởng ban",
              "email": "nguyenf-ktx@humg.edu.vn"
            },
            "… (+3 phần tử)"
          ]
        },
        "… (+3 phần tử)"
      ]
    }
  },
  "vision": {
    "mission": "Đào tạo nguồn nhân lực chất lượng cao, nghiên cứu khoa học và chuyển giao công nghệ trong lĩnh vực mỏ, địa chất, dầu khí, trắc địa - bản …",
    "visionText": "Đến năm 2035 trở thành đại học nghiên cứu đa ngành, có uy tín trong khu vực và quốc tế, dẫn đầu Việt Nam về đào tạo và nghiên cứu trong l…",
    "core": "Tri thức – Bản lĩnh – Sáng tạo – Hội nhập",
    "principles": [
      {
        "icon": "award",
        "title": "Chất lượng hàng đầu",
        "desc": "Lấy chất lượng đào tạo và nghiên cứu làm nền tảng phát triển."
      },
      "… (+5 phần tử)"
    ]
  }
}
```


### `GET /qlns-api/api/v1/public/about/about-nav`

Danh sách `aboutNav`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "label": "Tổng quan",
      "to": "/gioi-thieu",
      "icon": "home"
    },
    {
      "label": "Thông điệp Hiệu trưởng",
      "to": "/gioi-thieu/thong-diep-hieu-truong",
      "icon": "mail"
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 7,
  "totalPages": 4
}
```


### `GET /qlns-api/api/v1/public/about/achievements`

Danh sách `achievements`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "key": "daotao",
      "label": "Đào tạo",
      "items": [
        {
          "title": "Top 10 trường đại học kỹ thuật hàng đầu Việt Nam",
          "meta": "Bảng xếp hạng VNUR",
          "year": "2024"
        },
        {
          "title": "Kiểm định chất lượng cơ sở giáo dục chu kỳ 2 – đạt chuẩn",
          "meta": "Bộ GD&ĐT",
          "year": "2023"
        },
        "… (+1 phần tử)"
      ]
    },
    {
      "key": "nghiencuu",
      "label": "Nghiên cứu",
      "items": [
        {
          "title": "650+ công bố khoa học quốc tế (ISI/Scopus)",
          "meta": "Toàn trường",
          "year": "2020 – 2025"
        },
        {
          "title": "Trung tâm nghiên cứu trọng điểm quốc gia lĩnh vực Mỏ - Địa chất",
          "meta": "Được công nhận",
          "year": "2021"
        },
        "… (+1 phần tử)"
      ]
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 4,
  "totalPages": 2
}
```


### `GET /qlns-api/api/v1/public/about/board`

Đối tượng `board`

```json
{
  "rector": {
    "name": "PGS.TS. Trần Xuân Trường",
    "role": "Hiệu trưởng",
    "email": "hieutruong@humg.edu.vn",
    "phone": "024.3838.3006",
    "bio": "Phụ trách chung, chiến lược phát triển, công tác tổ chức cán bộ, tài chính và đối ngoại của Nhà trường."
  },
  "vices": [
    {
      "name": "PGS.TS. Nguyễn Văn X",
      "role": "Phó Hiệu trưởng",
      "email": "pht.daotao@humg.edu.vn",
      "phone": "024.3838.3010",
      "bio": "Phụ trách đào tạo đại học, sau đại học, khảo thí và đảm bảo chất lượng giáo dục."
    },
    {
      "name": "PGS.TS. Trần Thị B",
      "role": "Phó Hiệu trưởng",
      "email": "pht.khcn@humg.edu.vn",
      "phone": "024.3838.3012",
      "bio": "Phụ trách khoa học công nghệ, hợp tác quốc tế và tạp chí khoa học."
    },
    "… (+1 phần tử)"
  ]
}
```


### `GET /qlns-api/api/v1/public/about/faculty-departments`

Đối tượng `facultyDepartments`

```json
{
  "mo": [
    {
      "id": "khai-thac-ham-lo",
      "name": "Bộ môn Khai thác hầm lò",
      "head": "PGS.TS. Trần Văn Anh",
      "desc": "Đào tạo và nghiên cứu công nghệ khai thác khoáng sản bằng phương pháp hầm lò, cơ giới hóa và an toàn mỏ.",
      "research": [
        "Cơ giới hóa khấu than",
        "Ổn định công trình ngầm",
        "… (+1 phần tử)"
      ],
      "size": 15,
      "lecturers": [
        {
          "id": "tran-van-anh",
          "name": "PGS.TS. Trần Văn Anh",
          "position": "Trưởng bộ môn",
          "fields": [
            "Cơ giới hóa khấu than",
            "Ổn định công trình ngầm"
          ],
          "pubs": 52,
          "email": "tran-van-anh@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-quang-huy-hl",
          "name": "TS. Nguyễn Quang Huy",
          "position": "Phó Trưởng bộ môn",
          "fields": [
            "Thông gió mỏ",
            "An toàn mỏ hầm lò"
          ],
          "pubs": 24,
          "email": "nguyen-quang-huy-hl@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+2 phần tử)"
      ]
    },
    {
      "id": "khai-thac-lo-thien",
      "name": "Bộ môn Khai thác lộ thiên",
      "head": "TS. Phạm Văn Dũng",
      "desc": "Nghiên cứu công nghệ và tối ưu hóa khai thác mỏ lộ thiên, vận tải mỏ và hoàn thổ.",
      "research": [
        "Tối ưu biên giới mỏ",
        "Nổ mìn và khoan",
        "… (+1 phần tử)"
      ],
      "size": 12,
      "lecturers": [
        {
          "id": "pham-van-dung-lt",
          "name": "TS. Phạm Văn Dũng",
          "position": "Trưởng bộ môn",
          "fields": [
            "Tối ưu biên giới mỏ",
            "Kế hoạch hóa khai thác"
          ],
          "pubs": 33,
          "email": "pham-van-dung-lt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "hoang-minh-tuan-lt",
          "name": "PGS.TS. Hoàng Minh Tuấn",
          "position": "Giảng viên cao cấp",
          "fields": [
            "Nổ mìn và khoan",
            "Rung chấn nổ mìn"
          ],
          "pubs": 41,
          "email": "hoang-minh-tuan-lt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    },
    "… (+1 phần tử)"
  ],
  "dia-chat": [
    {
      "id": "dia-chat-cong-trinh",
      "name": "Bộ môn Địa chất công trình – Địa kỹ thuật",
      "head": "TS. Nguyễn Thị Bình",
      "desc": "Nghiên cứu tính chất cơ lý của đất đá, ổn định nền móng, hố đào và các bài toán địa kỹ thuật.",
      "research": [
        "Ổn định mái dốc",
        "Nền móng công trình",
        "… (+1 phần tử)"
      ],
      "size": 14,
      "lecturers": [
        {
          "id": "nguyen-thi-binh-dcct",
          "name": "TS. Nguyễn Thị Bình",
          "position": "Trưởng bộ môn",
          "fields": [
            "Ổn định mái dốc",
            "Nền móng công trình"
          ],
          "pubs": 29,
          "email": "nguyen-thi-binh-dcct@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "tran-quoc-viet-dcct",
          "name": "PGS.TS. Trần Quốc Việt",
          "position": "Giảng viên cao cấp",
          "fields": [
            "Địa kỹ thuật môi trường",
            "Cơ học đất không bão hòa"
          ],
          "pubs": 44,
          "email": "tran-quoc-viet-dcct@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+2 phần tử)"
      ]
    },
    {
      "id": "khoang-san-dia-hoa",
      "name": "Bộ môn Khoáng sản – Địa hóa",
      "head": "PGS.TS. Hoàng Văn Long",
      "desc": "Đào tạo và nghiên cứu về tìm kiếm, thăm dò khoáng sản, địa hóa và đánh giá tài nguyên.",
      "research": [
        "Địa hóa thăm dò",
        "Khoáng sản kim loại hiếm",
        "… (+1 phần tử)"
      ],
      "size": 12,
      "lecturers": [
        {
          "id": "hoang-van-long-ksdh",
          "name": "PGS.TS. Hoàng Văn Long",
          "position": "Trưởng bộ môn",
          "fields": [
            "Địa hóa thăm dò",
            "Khoáng sản kim loại hiếm"
          ],
          "pubs": 45,
          "email": "hoang-van-long-ksdh@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-thi-nga-ksdh",
          "name": "TS. Nguyễn Thị Nga",
          "position": "Phó Trưởng bộ môn",
          "fields": [
            "Thạch luận",
            "Mô hình hóa mỏ khoáng"
          ],
          "pubs": 21,
          "email": "nguyen-thi-nga-ksdh@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    }
  ],
  "dau-khi": [
    {
      "id": "khoan-khai-thac",
      "name": "Bộ môn Khoan – Khai thác dầu khí",
      "head": "TS. Phạm Văn Cường",
      "desc": "Nghiên cứu công nghệ khoan, hoàn thiện giếng và nâng cao hệ số thu hồi dầu.",
      "research": [
        "Thủy lực khoan",
        "Nâng cao thu hồi dầu (EOR)",
        "… (+1 phần tử)"
      ],
      "size": 13,
      "lecturers": [
        {
          "id": "pham-van-cuong-kkt",
          "name": "TS. Phạm Văn Cường",
          "position": "Trưởng bộ môn",
          "fields": [
            "Thủy lực khoan",
            "Hoàn thiện giếng"
          ],
          "pubs": 31,
          "email": "pham-van-cuong-kkt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "le-anh-tuan-kkt",
          "name": "PGS.TS. Lê Anh Tuấn",
          "position": "Giảng viên cao cấp",
          "fields": [
            "Nâng cao thu hồi dầu (EOR)",
            "Mô phỏng mỏ"
          ],
          "pubs": 49,
          "email": "le-anh-tuan-kkt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    },
    {
      "id": "dia-vat-ly",
      "name": "Bộ môn Địa vật lý",
      "head": "PGS.TS. Lê Văn Phú",
      "desc": "Đào tạo và nghiên cứu các phương pháp địa vật lý thăm dò và địa vật lý giếng khoan.",
      "research": [
        "Địa chấn thăm dò",
        "Địa vật lý giếng khoan",
        "… (+1 phần tử)"
      ],
      "size": 11,
      "lecturers": [
        {
          "id": "le-van-phu-dvl",
          "name": "PGS.TS. Lê Văn Phú",
          "position": "Trưởng bộ môn",
          "fields": [
            "Địa chấn thăm dò",
            "Xử lý – minh giải tài liệu"
          ],
          "pubs": 46,
          "email": "le-van-phu-dvl@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-hai-son-dvl",
          "name": "TS. Nguyễn Hải Sơn",
          "position": "Giảng viên chính",
          "fields": [
            "Địa vật lý giếng khoan",
            "Nghịch đảo địa chấn"
          ],
          "pubs": 19,
          "email": "nguyen-hai-son-dvl@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    }
  ],
  "trac-dia": [
    {
      "id": "trac-dia-cao-cap",
      "name": "Bộ môn Trắc địa cao cấp – Địa không gian",
      "head": "PGS.TS. Phạm Văn Định",
      "desc": "Nghiên cứu trắc địa cao cấp, GNSS, trọng lực và hệ quy chiếu, quan trắc chuyển dịch biến dạng.",
      "research": [
        "GNSS – định vị chính xác",
        "Quan trắc lún – biến dạng",
        "… (+1 phần tử)"
      ],
      "size": 16,
      "lecturers": [
        {
          "id": "pham-van-dinh-tdcc",
          "name": "PGS.TS. Phạm Văn Định",
          "position": "Trưởng bộ môn",
          "fields": [
            "GNSS – định vị chính xác",
            "Hệ quy chiếu quốc gia"
          ],
          "pubs": 58,
          "email": "pham-van-dinh-tdcc@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-thi-uyen-tdcc",
          "name": "TS. Nguyễn Thị Uyên",
          "position": "Phó Trưởng bộ môn",
          "fields": [
            "Quan trắc lún – biến dạng",
            "Trắc địa công trình"
          ],
          "pubs": 26,
          "email": "nguyen-thi-uyen-tdcc@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+2 phần tử)"
      ]
    },
    {
      "id": "ban-do-vien-tham-gis",
      "name": "Bộ môn Bản đồ – Viễn thám – GIS",
      "head": "PGS.TS. Hoàng Văn Em",
      "desc": "Đào tạo và nghiên cứu thành lập bản đồ, xử lý ảnh viễn thám và phân tích không gian GIS.",
      "research": [
        "Viễn thám và học sâu",
        "WebGIS",
        "… (+1 phần tử)"
      ],
      "size": 14,
      "lecturers": [
        {
          "id": "hoang-van-em-btvg",
          "name": "PGS.TS. Hoàng Văn Em",
          "position": "Trưởng bộ môn",
          "fields": [
            "Viễn thám và học sâu",
            "Giám sát biến động lớp phủ"
          ],
          "pubs": 71,
          "email": "hoang-van-em-btvg@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "tran-minh-quan-btvg",
          "name": "TS. Trần Minh Quân",
          "position": "Phó Trưởng bộ môn",
          "fields": [
            "WebGIS",
            "Phân tích không gian"
          ],
          "pubs": 28,
          "email": "tran-minh-quan-btvg@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+2 phần tử)"
      ]
    },
    "… (+1 phần tử)"
  ],
  "cntt": [
    {
      "id": "khoa-hoc-may-tinh",
      "name": "Bộ môn Khoa học máy tính",
      "head": "TS. Lê Văn Chính",
      "desc": "Đào tạo nền tảng khoa học máy tính, trí tuệ nhân tạo và học máy ứng dụng.",
      "research": [
        "Học máy – học sâu",
        "Thị giác máy tính",
        "… (+1 phần tử)"
      ],
      "size": 18,
      "lecturers": [
        {
          "id": "le-van-chinh-khmt",
          "name": "TS. Lê Văn Chính",
          "position": "Trưởng bộ môn",
          "fields": [
            "Học máy – học sâu",
            "Tối ưu hóa"
          ],
          "pubs": 38,
          "email": "le-van-chinh-khmt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-hoang-anh-khmt",
          "name": "PGS.TS. Nguyễn Hoàng Anh",
          "position": "Giảng viên cao cấp",
          "fields": [
            "Thị giác máy tính",
            "Xử lý ngôn ngữ tự nhiên"
          ],
          "pubs": 55,
          "email": "nguyen-hoang-anh-khmt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+2 phần tử)"
      ]
    },
    {
      "id": "he-thong-thong-tin",
      "name": "Bộ môn Hệ thống thông tin",
      "head": "TS. Vũ Văn Zũng",
      "desc": "Nghiên cứu phân tích – thiết kế hệ thống, cơ sở dữ liệu và hệ thống thông tin doanh nghiệp.",
      "research": [
        "Dữ liệu lớn",
        "Hệ khuyến nghị",
        "… (+1 phần tử)"
      ],
      "size": 14,
      "lecturers": [
        {
          "id": "vu-van-zung-httt",
          "name": "TS. Vũ Văn Zũng",
          "position": "Trưởng bộ môn",
          "fields": [
            "Dữ liệu lớn",
            "Kho dữ liệu – BI"
          ],
          "pubs": 34,
          "email": "vu-van-zung-httt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-thanh-tung-httt",
          "name": "TS. Nguyễn Thanh Tùng",
          "position": "Phó Trưởng bộ môn",
          "fields": [
            "Hệ khuyến nghị",
            "Khai phá dữ liệu"
          ],
          "pubs": 20,
          "email": "nguyen-thanh-tung-httt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    },
    "… (+1 phần tử)"
  ],
  "co-dien": [
    {
      "id": "tu-dong-hoa",
      "name": "Bộ môn Tự động hóa",
      "head": "PGS.TS. Vũ Văn Phong",
      "desc": "Nghiên cứu điều khiển tự động, hệ thống nhúng, IoT và tự động hóa dây chuyền công nghiệp mỏ.",
      "research": [
        "Điều khiển hiện đại",
        "IoT công nghiệp",
        "… (+1 phần tử)"
      ],
      "size": 15,
      "lecturers": [
        {
          "id": "vu-van-phong-tdh",
          "name": "PGS.TS. Vũ Văn Phong",
          "position": "Trưởng bộ môn",
          "fields": [
            "Điều khiển hiện đại",
            "SCADA – DCS"
          ],
          "pubs": 41,
          "email": "vu-van-phong-tdh@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-duc-thinh-tdh",
          "name": "TS. Nguyễn Đức Thịnh",
          "position": "Phó Trưởng bộ môn",
          "fields": [
            "IoT công nghiệp",
            "Hệ thống nhúng"
          ],
          "pubs": 23,
          "email": "nguyen-duc-thinh-tdh@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    },
    {
      "id": "ky-thuat-dien",
      "name": "Bộ môn Kỹ thuật điện",
      "head": "TS. Lê Văn Phúc",
      "desc": "Đào tạo và nghiên cứu hệ thống điện, truyền động điện và cung cấp điện cho mỏ và công nghiệp.",
      "research": [
        "Cung cấp điện mỏ",
        "Truyền động điện",
        "… (+1 phần tử)"
      ],
      "size": 12,
      "lecturers": [
        {
          "id": "le-van-phuc-ktd",
          "name": "TS. Lê Văn Phúc",
          "position": "Trưởng bộ môn",
          "fields": [
            "Cung cấp điện mỏ",
            "Chất lượng điện năng"
          ],
          "pubs": 30,
          "email": "le-van-phuc-ktd@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "pham-quang-dat-ktd",
          "name": "PGS.TS. Phạm Quang Đạt",
          "position": "Giảng viên cao cấp",
          "fields": [
            "Truyền động điện",
            "Điện tử công suất"
          ],
          "pubs": 47,
          "email": "pham-quang-dat-ktd@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    },
    "… (+1 phần tử)"
  ],
  "kt-qtkd": [
    {
      "id": "quan-tri-kinh-doanh",
      "name": "Bộ môn Quản trị kinh doanh",
      "head": "TS. Đỗ Văn Giàu",
      "desc": "Đào tạo và nghiên cứu quản trị doanh nghiệp, quản trị dự án và khởi nghiệp trong lĩnh vực tài nguyên.",
      "research": [
        "Quản trị chiến lược",
        "Quản trị dự án khai khoáng",
        "… (+1 phần tử)"
      ],
      "size": 16,
      "lecturers": [
        {
          "id": "do-van-giau-qtkd",
          "name": "TS. Đỗ Văn Giàu",
          "position": "Trưởng bộ môn",
          "fields": [
            "Quản trị chiến lược",
            "Khởi nghiệp đổi mới sáng tạo"
          ],
          "pubs": 26,
          "email": "do-van-giau-qtkd@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-thi-thu-hien-qtkd",
          "name": "PGS.TS. Nguyễn Thị Thu Hiền",
          "position": "Giảng viên cao cấp",
          "fields": [
            "Quản trị dự án khai khoáng",
            "Quản trị vận hành"
          ],
          "pubs": 38,
          "email": "nguyen-thi-thu-hien-qtkd@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    },
    {
      "id": "ke-toan",
      "name": "Bộ môn Kế toán",
      "head": "TS. Lê Thị Lam",
      "desc": "Đào tạo và nghiên cứu kế toán tài chính, kế toán quản trị và kiểm toán.",
      "research": [
        "Kế toán quản trị chi phí",
        "Phân tích tài chính",
        "… (+1 phần tử)"
      ],
      "size": 12,
      "lecturers": [
        {
          "id": "le-thi-lam-kt",
          "name": "TS. Lê Thị Lam",
          "position": "Trưởng bộ môn",
          "fields": [
            "Kế toán quản trị chi phí",
            "Phân tích tài chính"
          ],
          "pubs": 24,
          "email": "le-thi-lam-kt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "pham-van-quyet-kt",
          "name": "TS. Phạm Văn Quyết",
          "position": "Phó Trưởng bộ môn",
          "fields": [
            "Kiểm toán nội bộ",
            "Kế toán tài chính"
          ],
          "pubs": 19,
          "email": "pham-van-quyet-kt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    }
  ],
  "moi-truong": [
    {
      "id": "ky-thuat-moi-truong",
      "name": "Bộ môn Kỹ thuật môi trường",
      "head": "PGS.TS. Ngô Thị Hồng",
      "desc": "Nghiên cứu công nghệ xử lý nước, khí, chất thải rắn và phục hồi môi trường sau khai thác.",
      "research": [
        "Xử lý nước thải mỏ",
        "Hoàn nguyên môi trường mỏ",
        "… (+1 phần tử)"
      ],
      "size": 12,
      "lecturers": [
        {
          "id": "ngo-thi-hong-ktmt",
          "name": "PGS.TS. Ngô Thị Hồng",
          "position": "Trưởng bộ môn",
          "fields": [
            "Xử lý nước thải mỏ",
            "Hoàn nguyên môi trường mỏ"
          ],
          "pubs": 36,
          "email": "ngo-thi-hong-ktmt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "tran-van-phuong-ktmt",
          "name": "TS. Trần Văn Phương",
          "position": "Giảng viên chính",
          "fields": [
            "Xử lý khí thải",
            "Kinh tế tuần hoàn"
          ],
          "pubs": 18,
          "email": "tran-van-phuong-ktmt@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    },
    {
      "id": "quan-ly-tai-nguyen",
      "name": "Bộ môn Quản lý tài nguyên & Môi trường",
      "head": "TS. Trần Văn Phát",
      "desc": "Đào tạo và nghiên cứu quản lý tổng hợp tài nguyên, chính sách và phát triển bền vững.",
      "research": [
        "Quản lý tổng hợp lưu vực",
        "Chính sách tài nguyên",
        "… (+1 phần tử)"
      ],
      "size": 10,
      "lecturers": [
        {
          "id": "tran-van-phat-qltn",
          "name": "TS. Trần Văn Phát",
          "position": "Trưởng bộ môn",
          "fields": [
            "Quản lý tổng hợp lưu vực",
            "Chính sách tài nguyên"
          ],
          "pubs": 22,
          "email": "tran-van-phat-qltn@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        {
          "id": "nguyen-thi-hoa-qltn",
          "name": "PGS.TS. Nguyễn Thị Hoa",
          "position": "Giảng viên cao cấp",
          "fields": [
            "Biến đổi khí hậu",
            "Đánh giá tác động môi trường"
          ],
          "pubs": 33,
          "email": "nguyen-thi-hoa-qltn@humg.edu.vn",
          "phone": "024.3838.3800"
        },
        "… (+1 phần tử)"
      ]
    }
  ]
}
```


### `GET /qlns-api/api/v1/public/about/history`

Danh sách `history`, có phân trang (?pageIndex, ?pageSize, ?keyword)

```json
{
  "items": [
    {
      "year": "1966",
      "title": "Thành lập Trường",
      "text": "Trường Đại học Mỏ - Địa chất được thành lập theo Quyết định của Hội đồng Chính phủ, trên cơ sở Khoa Mỏ - Địa chất của Trường Đại học Bách…"
    },
    {
      "year": "1975 – 1990",
      "title": "Xây dựng và trưởng thành",
      "text": "Mở rộng quy mô đào tạo, xây dựng cơ sở vật chất và đội ngũ giảng viên, khẳng định vị thế trong đào tạo ngành mỏ - địa chất."
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 5,
  "totalPages": 3
}
```


### `GET /qlns-api/api/v1/public/about/numbers`

Đối tượng `numbers`

```json
{
  "big": [
    {
      "value": "60+",
      "label": "Năm phát triển"
    },
    {
      "value": "20.000+",
      "label": "Sinh viên, học viên"
    },
    "… (+3 phần tử)"
  ],
  "enrollment": [
    {
      "year": "2019",
      "value": 12800
    },
    {
      "year": "2020",
      "value": 13500
    },
    "… (+4 phần tử)"
  ],
  "publications": [
    {
      "year": "2019",
      "value": 420
    },
    {
      "year": "2020",
      "value": 460
    },
    "… (+4 phần tử)"
  ],
  "faculty": [
    {
      "label": "Giáo sư, Phó Giáo sư",
      "value": 10
    },
    {
      "label": "Tiến sĩ",
      "value": 40
    },
    "… (+2 phần tử)"
  ]
}
```


### `GET /qlns-api/api/v1/public/about/org-chart`

Đối tượng `orgChart`

```json
{
  "board": "Ban Giám hiệu",
  "support": "Đảng ủy lãnh đạo toàn diện; Công đoàn, Đoàn Thanh niên và Hội Sinh viên phối hợp thực hiện nhiệm vụ.",
  "branches": [
    "Khối Khoa / Viện đào tạo",
    "Khối Phòng / Ban chức năng",
    "… (+2 phần tử)"
  ],
  "motto": "Minh bạch · Hiệu quả · Hợp tác · Phát triển"
}
```


### `GET /qlns-api/api/v1/public/about/overview`

Đối tượng `overview`

```json
{
  "intro": [
    "Trường Đại học Mỏ - Địa chất là trường đại học công lập trực thuộc Bộ Giáo dục và Đào tạo, có bề dày truyền thống trong đào tạo và nghiên…",
    "Trải qua 60 năm xây dựng và phát triển, Nhà trường đã đào tạo hàng chục nghìn kỹ sư, cử nhân, thạc sĩ và tiến sĩ, đóng góp quan trọng cho…"
  ],
  "stats": [
    {
      "value": "1966",
      "label": "Năm thành lập"
    },
    {
      "value": "60+",
      "label": "Năm phát triển"
    },
    "… (+3 phần tử)"
  ],
  "more": [
    {
      "value": "12",
      "label": "Khoa chuyên môn"
    },
    {
      "value": "4",
      "label": "Viện nghiên cứu"
    },
    "… (+2 phần tử)"
  ],
  "values": [
    "Đổi mới sáng tạo",
    "Chất lượng hàng đầu",
    "… (+3 phần tử)"
  ]
}
```


### `GET /qlns-api/api/v1/public/about/rector-message`

Đối tượng `rectorMessage`

```json
{
  "name": "PGS.TS. Trần Xuân Trường",
  "role": "Hiệu trưởng Trường Đại học Mỏ - Địa chất",
  "paragraphs": [
    "Với truyền thống 60 năm xây dựng và phát triển, Trường Đại học Mỏ - Địa chất không ngừng đổi mới, sáng tạo trong đào tạo, nghiên cứu khoa…",
    "Chúng tôi cam kết xây dựng môi trường học thuật năng động, sáng tạo, hiện đại và nhân văn, nơi mỗi sinh viên được khuyến khích phát huy t…",
    "… (+1 phần tử)"
  ],
  "sign": "Trân trọng,",
  "values": [
    "Đổi mới – Sáng tạo",
    "Chất lượng hàng đầu",
    "… (+3 phần tử)"
  ]
}
```


### `GET /qlns-api/api/v1/public/about/units`

Đối tượng `units`

```json
{
  "khoa": {
    "label": "Khoa / Viện đào tạo",
    "singular": "Khoa",
    "intro": "Các khoa và viện đào tạo trực thuộc Trường Đại học Mỏ - Địa chất, đảm nhiệm công tác giảng dạy và nghiên cứu theo lĩnh vực chuyên môn.",
    "list": [
      {
        "id": "mo",
        "name": "Khoa Mỏ",
        "head": "PGS.TS. Nguyễn Văn A",
        "founded": 1966,
        "staff": 62,
        "students": 2300,
        "majors": [
          "Kỹ thuật Mỏ",
          "Kỹ thuật Tuyển khoáng",
          "… (+1 phần tử)"
        ],
        "desc": "Đào tạo và nghiên cứu về khai thác mỏ, tuyển khoáng, an toàn và cơ điện mỏ.",
        "phone": "024.3838.3860",
        "email": "khoamo@humg.edu.vn",
        "board": [
          {
            "name": "PGS.TS. Nguyễn Văn A",
            "role": "Trưởng khoa",
            "email": "nguyenvana@humg.edu.vn"
          },
          {
            "name": "PGS.TS. Đặng Vũ Chí",
            "role": "Phó Trưởng khoa phụ trách đào tạo",
            "email": "dangvuchi@humg.edu.vn"
          },
          "… (+2 phần tử)"
        ]
      },
      {
        "id": "dia-chat",
        "name": "Khoa Khoa học & Kỹ thuật Địa chất",
        "head": "PGS.TS. Trần Thị B",
        "founded": 1966,
        "staff": 55,
        "students": 1800,
        "majors": [
          "Kỹ thuật Địa chất",
          "Địa chất học",
          "… (+1 phần tử)"
        ],
        "desc": "Đào tạo về địa chất, địa chất công trình, địa kỹ thuật và tài nguyên khoáng sản.",
        "phone": "024.3838.3861",
        "email": "khoadiachat@humg.edu.vn",
        "board": [
          {
            "name": "PGS.TS. Trần Thị B",
            "role": "Trưởng khoa",
            "email": "tranthib@humg.edu.vn"
          },
          {
            "name": "PGS.TS. Ngô Xuân Thành",
            "role": "Phó Trưởng khoa",
            "email": "ngoxuanthanh@humg.edu.vn"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+6 phần tử)"
    ]
  },
  "phong-ban": {
    "label": "Phòng / Ban chức năng",
    "singular": "Phòng / Ban",
    "intro": "Các phòng, ban chức năng tham mưu, giúp việc cho Ban Giám hiệu trong quản lý và điều hành Nhà trường.",
    "list": [
      {
        "id": "dao-tao",
        "name": "Phòng Đào tạo",
        "head": "TS. Nguyễn Văn B",
        "phone": "024.3838.3827",
        "email": "daotao@humg.edu.vn",
        "functions": [
          "Quản lý đào tạo đại học",
          "Xây dựng kế hoạch giảng dạy",
          "… (+1 phần tử)"
        ],
        "desc": "Tham mưu và tổ chức thực hiện công tác đào tạo bậc đại học.",
        "staff": [
          {
            "name": "TS. Nguyễn Văn B",
            "role": "Trưởng phòng",
            "email": "nguyenvanb@humg.edu.vn"
          },
          {
            "name": "ThS. Lê Thị Hồng Nhung",
            "role": "Phó Trưởng phòng",
            "email": "lethihongnhung@humg.edu.vn"
          },
          "… (+3 phần tử)"
        ]
      },
      {
        "id": "sau-dai-hoc",
        "name": "Phòng Đào tạo Sau đại học",
        "head": "PGS.TS. Trần C",
        "phone": "024.3838.3828",
        "email": "saudaihoc@humg.edu.vn",
        "functions": [
          "Tuyển sinh và quản lý học viên cao học, NCS",
          "Tổ chức bảo vệ luận văn, luận án"
        ],
        "desc": "Quản lý đào tạo trình độ thạc sĩ và tiến sĩ.",
        "staff": [
          {
            "name": "PGS.TS. Trần C",
            "role": "Trưởng phòng",
            "email": "tranc@humg.edu.vn"
          },
          {
            "name": "TS. Nguyễn Thị Thanh Huyền",
            "role": "Phó Trưởng phòng",
            "email": "nguyenthithanhhuyen-sdh@humg.edu.vn"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+6 phần tử)"
    ]
  },
  "trung-tam-vien": {
    "label": "Trung tâm / Viện nghiên cứu",
    "singular": "Trung tâm / Viện",
    "intro": "Các trung tâm, viện nghiên cứu và đơn vị dịch vụ khoa học công nghệ của Trường.",
    "list": [
      {
        "id": "vien-khcn-mo",
        "name": "Viện Khoa học Công nghệ Mỏ - Địa chất",
        "head": "PGS.TS. Nguyễn A",
        "phone": "024.3838.3840",
        "email": "vienkhcn@humg.edu.vn",
        "functions": [
          "Nghiên cứu ứng dụng",
          "Chuyển giao công nghệ",
          "… (+1 phần tử)"
        ],
        "desc": "Nghiên cứu và chuyển giao công nghệ trong lĩnh vực mỏ - địa chất.",
        "staff": [
          {
            "name": "PGS.TS. Nguyễn A",
            "role": "Viện trưởng",
            "email": "nguyena-vien@humg.edu.vn"
          },
          {
            "name": "TS. Trần Mạnh Cường",
            "role": "Phó Viện trưởng",
            "email": "tranmanhcuong-vien@humg.edu.vn"
          },
          "… (+3 phần tử)"
        ]
      },
      {
        "id": "tt-ngoai-ngu-tin-hoc",
        "name": "Trung tâm Ngoại ngữ – Tin học",
        "head": "ThS. Trần B",
        "phone": "024.3838.3841",
        "email": "nnth@humg.edu.vn",
        "functions": [
          "Đào tạo và thi chứng chỉ ngoại ngữ, tin học",
          "Bồi dưỡng kỹ năng số"
        ],
        "desc": "Đào tạo và tổ chức thi chứng chỉ ngoại ngữ, tin học.",
        "staff": [
          {
            "name": "ThS. Trần B",
            "role": "Giám đốc",
            "email": "tranb-nnth@humg.edu.vn"
          },
          {
            "name": "ThS. Nguyễn Thị Thu Hà",
            "role": "Phó Giám đốc",
            "email": "nguyenthithuha-nnth@humg.edu.vn"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+3 phần tử)"
    ]
  },
  "don-vi-truc-thuoc": {
    "label": "Đơn vị trực thuộc",
    "singular": "Đơn vị",
    "intro": "Các đơn vị sự nghiệp, dịch vụ trực thuộc Trường Đại học Mỏ - Địa chất.",
    "list": [
      {
        "id": "ky-tuc-xa",
        "name": "Ban Quản lý Ký túc xá",
        "head": "ThS. Nguyễn F",
        "phone": "024.3838.3850",
        "email": "ktx@humg.edu.vn",
        "functions": [
          "Quản lý chỗ ở sinh viên",
          "An ninh, trật tự",
          "… (+1 phần tử)"
        ],
        "desc": "Quản lý và phục vụ chỗ ở cho sinh viên nội trú.",
        "staff": [
          {
            "name": "ThS. Nguyễn F",
            "role": "Trưởng ban",
            "email": "nguyenf-ktx@humg.edu.vn"
          },
          {
            "name": "CN. Trần Văn Hùng",
            "role": "Phó Trưởng ban",
            "email": "tranvanhung-ktx@humg.edu.vn"
          },
          "… (+2 phần tử)"
        ]
      },
      {
        "id": "tram-y-te",
        "name": "Trạm Y tế",
        "head": "BS. Trần G",
        "phone": "024.3838.3851",
        "email": "yte@humg.edu.vn",
        "functions": [
          "Chăm sóc sức khỏe ban đầu",
          "Khám sức khỏe định kỳ",
          "… (+1 phần tử)"
        ],
        "desc": "Chăm sóc sức khỏe cho cán bộ và sinh viên.",
        "staff": [
          {
            "name": "BS. Trần G",
            "role": "Trưởng trạm",
            "email": "trang-yte@humg.edu.vn"
          },
          {
            "name": "BS. Nguyễn Thị Hoài Thu",
            "role": "Bác sĩ điều trị",
            "email": "nguyenthihoaithu-yte@humg.edu.vn"
          },
          "… (+2 phần tử)"
        ]
      },
      "… (+2 phần tử)"
    ]
  }
}
```


### `GET /qlns-api/api/v1/public/about/vision`

Đối tượng `vision`

```json
{
  "mission": "Đào tạo nguồn nhân lực chất lượng cao, nghiên cứu khoa học và chuyển giao công nghệ trong lĩnh vực mỏ, địa chất, dầu khí, trắc địa - bản …",
  "visionText": "Đến năm 2035 trở thành đại học nghiên cứu đa ngành, có uy tín trong khu vực và quốc tế, dẫn đầu Việt Nam về đào tạo và nghiên cứu trong l…",
  "core": "Tri thức – Bản lĩnh – Sáng tạo – Hội nhập",
  "principles": [
    {
      "icon": "award",
      "title": "Chất lượng hàng đầu",
      "desc": "Lấy chất lượng đào tạo và nghiên cứu làm nền tảng phát triển."
    },
    {
      "icon": "rocket",
      "title": "Đổi mới sáng tạo",
      "desc": "Khuyến khích tư duy mới, giải pháp mới và tinh thần khởi nghiệp."
    },
    "… (+4 phần tử)"
  ]
}
```


### `GET /qlns-api/api/v1/public/employees`

Danh sách cán bộ giảng viên (gom từ các bộ môn). Có phân trang và ?keyword

```json
{
  "items": [
    {
      "id": "tran-van-anh",
      "fullName": "PGS.TS. Trần Văn Anh",
      "position": "Trưởng bộ môn",
      "email": "tran-van-anh@humg.edu.vn",
      "department": "Bộ môn Khai thác hầm lò",
      "publications": 52,
      "isCurrent": true
    },
    {
      "id": "nguyen-quang-huy-hl",
      "fullName": "TS. Nguyễn Quang Huy",
      "position": "Phó Trưởng bộ môn",
      "email": "nguyen-quang-huy-hl@humg.edu.vn",
      "department": "Bộ môn Khai thác hầm lò",
      "publications": 24,
      "isCurrent": true
    }
  ],
  "pageIndex": 1,
  "pageSize": 2,
  "totalItems": 65,
  "totalPages": 33
}
```
