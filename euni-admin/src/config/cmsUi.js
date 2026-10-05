/* Hằng số giao diện CMS (tab, danh sách lựa chọn, giá trị mặc định form). Dữ liệu nghiệp vụ lấy từ cms-api (lib/datasets/loaders.js). */

export const cmsBackupInfo = [
  "Sao lưu tự động hằng ngày lúc 03:00 AM.",
  "Hệ thống lưu trữ 7 bản sao lưu gần nhất.",
  "Vị trí lưu trữ: /backup/cms_humg"
]

export const cmsBannerPositions = [
  "Tất cả vị trí",
  "Trang chủ – Slider",
  "Trang chủ – Popup",
  "Cột phải",
  "Chân trang"
]

export const cmsContentShortcuts = {
  "su-kien": {
    "title": "Sự kiện",
    "category": "Sự kiện"
  },
  "tuyen-sinh": {
    "title": "Tuyển sinh",
    "category": "Tuyển sinh"
  },
  "nghien-cuu": {
    "title": "Nghiên cứu",
    "category": "Nghiên cứu"
  },
  "hoc-tap": {
    "title": "Học tập",
    "category": "Học tập"
  }
}

export const cmsEditorDefaultContentVi = "Nhập nội dung bài viết ở đây… (trình soạn thảo WYSIWYG)\n\nHội thảo quốc tế về Trắc địa và GIS 2025 quy tụ các chuyên gia đầu ngành trong nước và quốc tế…"

export const cmsEditorDefaults = {
  "title": "Hội thảo quốc tế về Trắc địa và GIS 2025",
  "category": "Sự kiện",
  "slug": "hoi-thao-trac-dia-gis-2025",
  "excerpt": "Hội thảo là diễn đàn học thuật uy tín nhằm chia sẻ các xu hướng, công nghệ mới nhất trong lĩnh vực Trắc địa, Bản đồ và Hệ thống thông tin địa lý (GIS).",
  "status": "Đã xuất bản",
  "showHome": true,
  "featured": true,
  "publishAt": "2025-05-30T09:30",
  "expireAt": "2025-05-30T22:59",
  "categories": [
    "Tin tức",
    "Thông báo",
    "Sự kiện",
    "Nghiên cứu",
    "Học tập",
    "Tuyển sinh"
  ],
  "seoTitle": "Hội thảo quốc tế về Trắc địa và GIS 2025 – HUMG",
  "seoDesc": "Thông tin chương trình, diễn giả và đăng ký tham dự Hội thảo quốc tế Trắc địa – GIS 2025 tại Trường Đại học Mỏ – Địa chất.",
  "seoKeywords": "trắc địa, GIS, hội thảo quốc tế, HUMG"
}

export const cmsEditorDefaultsEn = {
  "title": "International Conference on Geodesy and GIS 2025",
  "slug": "international-conference-geodesy-gis-2025",
  "excerpt": "The conference is a prestigious academic forum to share the latest trends and technologies in Geodesy, Cartography and Geographic Information Systems (GIS).",
  "content": "Enter the post content here… (WYSIWYG editor)\n\nThe International Conference on Geodesy and GIS 2025 brings together leading experts from Vietnam and abroad…",
  "seoTitle": "International Conference on Geodesy and GIS 2025 – HUMG",
  "seoDesc": "Program, speakers and registration for the International Conference on Geodesy – GIS 2025 at Hanoi University of Mining and Geology.",
  "seoKeywords": "geodesy, GIS, international conference, HUMG"
}

export const cmsEditorTabs = [
  "Thông tin chung",
  "Nội dung",
  "SEO",
  "Hình ảnh & File",
  "Khác"
]

export const cmsI18nStatuses = [
  "Đã dịch",
  "Đang dịch",
  "Chưa dịch"
]

export const cmsLanguageSettings = {
  "defaultCode": "vi",
  "enabledCodes": [
    "vi",
    "en"
  ],
  "fallback": "Hiển thị bản Tiếng Việt (khuyến nghị)",
  "fallbackOptions": [
    "Hiển thị bản Tiếng Việt (khuyến nghị)",
    "Ẩn nội dung cho đến khi có bản dịch",
    "Hiển thị nội dung Tiếng Việt kèm nhãn \"Chưa có bản dịch\""
  ],
  "urlNote": "Lựa chọn ngôn ngữ được ghi nhớ theo trình duyệt của người dùng (localStorage), áp dụng đồng thời cho cả website công khai và My eUni Portal."
}

export const cmsLogActions = [
  "Tất cả hành động",
  "Đăng nhập",
  "Đăng bài viết",
  "Cập nhật bài viết",
  "Xóa bài viết",
  "Tải lên file",
  "Xóa người dùng",
  "Đổi cấu hình"
]

export const cmsMediaCategories = [
  "Tất cả danh mục",
  "Tin tức",
  "Sự kiện",
  "Tuyển sinh",
  "Cơ sở vật chất",
  "Đào tạo"
]

export const cmsMediaTabs = [
  "Tất cả",
  "Hình ảnh",
  "Tài liệu",
  "Video",
  "Âm thanh",
  "Khác"
]

export const cmsMenuGroups = [
  "Menu chính (Header)",
  "Menu chân trang (Footer)",
  "Menu tiện ích"
]

export const cmsPageDefaults = {
  "title": "Đơn vị",
  "slug": "don-vi",
  "parent": "-- Trang cha --",
  "parents": [
    "-- Trang cha --",
    "Trang chủ",
    "Giới thiệu",
    "Đào tạo",
    "Nghiên cứu"
  ],
  "templates": [
    "Mặc định",
    "Trang danh sách",
    "Trang chi tiết",
    "Trang liên hệ"
  ],
  "order": 3
}

export const cmsPostStatuses = [
  "Tất cả trạng thái",
  "Đã xuất bản",
  "Bản nháp",
  "Chờ duyệt"
]

export const cmsSettingsSections = [
  "Thông tin chung",
  "Ngôn ngữ",
  "SEO & Mạng xã hội",
  "Email hệ thống",
  "Bảo mật",
  "Sao lưu dữ liệu",
  "Tích hợp dịch vụ",
  "Lịch trình (Cron)",
  "Nhật ký hệ thống"
]

export const cmsUserRoles = [
  "Tất cả vai trò",
  "Super Admin",
  "Editor",
  "Author",
  "Viewer"
]

export const cmsUserStatuses = [
  "Tất cả trạng thái",
  "Hoạt động",
  "Không hoạt động"
]
