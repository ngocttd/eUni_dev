/* Cấu hình tĩnh của giao diện (menu/nav, danh sách lựa chọn) — sinh từ data.js cũ, thuộc về FE, không lấy từ API. */

export const studentNavGroups = [
  {
    "title": "Cổng sinh viên",
    "items": [
      {
        "label": "Tổng quan",
        "to": "/sinh-vien",
        "icon": "home"
      },
      {
        "label": "Học tập & Đào tạo",
        "to": "/sinh-vien/hoc-tap",
        "icon": "book"
      },
      {
        "label": "Quy chế sinh viên",
        "to": "/sinh-vien/quy-che",
        "icon": "shield"
      },
      {
        "label": "Học phí & Học bổng",
        "to": "/sinh-vien/hoc-phi-hoc-bong",
        "icon": "award"
      },
      {
        "label": "Biểu mẫu sinh viên",
        "to": "/sinh-vien/bieu-mau",
        "icon": "file"
      },
      {
        "label": "Đời sống & Hỗ trợ sinh viên",
        "to": "/sinh-vien/doi-song-ho-tro",
        "icon": "heart"
      },
      {
        "label": "Việc làm & Khởi nghiệp",
        "to": "/sinh-vien/viec-lam-khoi-nghiep",
        "icon": "rocket"
      },
      {
        "label": "Thư viện & E-learning",
        "to": "/sinh-vien/thu-vien-elearning",
        "icon": "library"
      },
      {
        "label": "My eUni Sinh viên",
        "to": "/sinh-vien/my-euni",
        "icon": "external"
      }
    ]
  },
  {
    "title": "Hỗ trợ nhanh",
    "items": [
      {
        "label": "Sổ tay tân sinh viên",
        "to": "/sinh-vien/tan-sinh-vien",
        "icon": "book"
      },
      {
        "label": "Hỏi – Đáp (FAQ)",
        "to": "/sinh-vien/faq",
        "icon": "mail"
      }
    ]
  }
]

export const studentQuickLinks = [
  {
    "label": "Lịch học – Lịch thi",
    "to": "/hoc-tap/lich-hoc"
  },
  {
    "label": "Tra cứu điểm",
    "to": "/hoc-tap/tra-cuu-ket-qua"
  },
  {
    "label": "Thanh toán học phí",
    "to": "/sinh-vien/hoc-phi-hoc-bong"
  },
  {
    "label": "Yêu cầu hỗ trợ",
    "to": "/sinh-vien/doi-song-ho-tro"
  },
  {
    "label": "Sổ tay tân sinh viên",
    "to": "/sinh-vien/tan-sinh-vien"
  },
  {
    "label": "Hỏi – Đáp (FAQ)",
    "to": "/sinh-vien/faq"
  }
]
