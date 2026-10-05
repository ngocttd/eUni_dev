import { staffToolList } from '../config/static/portal-staff-tools.js'


const staffToolRoutes = staffToolList.map((t) => ({ path: t.path, title: t.title, hidden: true }))

export const mainNav = [
  { label: 'Trang chủ', path: '/', icon: 'home' },

  {
    label: 'Giới thiệu HUMG',
    path: '/gioi-thieu',
    icon: 'building',
    wireframe: 'PG-PUB-03 / PG-PUB-04',
    /* Menu rút gọn còn 7 mục chính. Các trang cơ cấu chi tiết (Ban Giám hiệu, Khoa/Viện,
       Phòng/Ban, Trung tâm, Đơn vị trực thuộc) và "HUMG qua các con số" truy cập từ trang
       "Cơ cấu tổ chức" / "Thành tựu & con số" và sidebar — route khai báo ở standalonePublic. */
    children: [
      { label: 'Tổng quan', path: '/gioi-thieu', wireframe: 'PG-PUB-03-01' },
      { label: 'Thông điệp Hiệu trưởng', path: '/gioi-thieu/thong-diep-hieu-truong', wireframe: 'PG-PUB-03-02' },
      { label: 'Lịch sử phát triển', path: '/gioi-thieu/lich-su', wireframe: 'PG-PUB-03-03' },
      { label: 'Sứ mạng – Tầm nhìn – Giá trị', path: '/gioi-thieu/tam-nhin-su-mang', wireframe: 'PG-PUB-03-04' },
      { label: 'Thành tựu & con số nổi bật', path: '/gioi-thieu/thanh-tuu', wireframe: 'PG-PUB-03-05' },
      { label: 'Cơ cấu tổ chức', path: '/gioi-thieu/co-cau-to-chuc', wireframe: 'PG-PUB-04-01' },
      { label: 'Đội ngũ cán bộ, giảng viên', path: '/gioi-thieu/giang-vien', wireframe: 'PG-PUB-04-04' },
    ],
  },

  {
    label: 'Học tập',
    path: '/hoc-tap',
    icon: 'graduation',
    wireframe: 'PG-EDU-01 → PG-EDU-04',
    children: [
      { label: 'Tổng quan Học tập', path: '/hoc-tap', wireframe: 'PG-EDU-01 (Hub)' },
      { label: 'Tuyển sinh', path: '/hoc-tap/tuyen-sinh', wireframe: 'PG-EDU-01' },
      { label: 'Chương trình đào tạo', path: '/hoc-tap/chuong-trinh-dao-tao', wireframe: 'PG-EDU-02 / PG-EDU-03' },
      { label: 'Chuẩn đầu ra', path: '/hoc-tap/chuan-dau-ra', wireframe: 'PG-EDU-03' },
      { label: 'Thông tin chung', path: '/hoc-tap/thong-tin-chung', wireframe: 'PG-EDU-04' },
      { label: 'Học phí & Học bổng', path: '/hoc-tap/hoc-phi-hoc-bong', wireframe: 'PG-EDU-06' },
      { label: 'Biểu mẫu', path: '/hoc-tap/bieu-mau', wireframe: 'PG-EDU-05' },
      { label: 'Lịch học – Lịch thi', path: '/hoc-tap/lich-hoc', wireframe: 'PG-EDU-07' },
      { label: 'Tra cứu kết quả học tập', path: '/hoc-tap/tra-cuu-ket-qua', wireframe: 'PG-EDU-08' },
      { label: 'Hướng dẫn học tập', path: '/hoc-tap/huong-dan', wireframe: 'PG-EDU-09' },
      { label: 'E-learning & LMS', path: '/hoc-tap/e-learning', wireframe: 'PG-EDU-10' },
      { label: 'Khảo sát & Đánh giá', path: '/hoc-tap/khao-sat', wireframe: 'PG-EDU-11' },
    ],
  },

  {
    label: 'Nghiên cứu',
    path: '/nghien-cuu',
    icon: 'flask',
    wireframe: 'PG-PUB-08 / PG-RES-01 → 05',
    children: [
      { label: 'Khoa học & Công nghệ (Tổng quan)', path: '/nghien-cuu', wireframe: 'PG-PUB-08' },
      { label: 'Đề tài / Dự án', path: '/nghien-cuu/de-tai', wireframe: 'PG-RES-01' },
      { label: 'Công bố khoa học', path: '/nghien-cuu/cong-bo', wireframe: 'PG-RES-03' },
      { label: 'Danh sách chuyên gia', path: '/nghien-cuu/chuyen-gia', wireframe: 'PG-RES-05' },
      { label: 'Nhóm nghiên cứu', path: '/nghien-cuu/nhom-nghien-cuu', wireframe: 'PG-PUB-08' },
      { label: 'Hội nghị / Hội thảo', path: '/nghien-cuu/hoi-nghi-hoi-thao', wireframe: 'PG-PUB-08' },
      { label: 'Phòng thí nghiệm', path: '/nghien-cuu/phong-thi-nghiem', wireframe: 'PG-PUB-08' },
      { label: 'Chuyển giao công nghệ', path: '/nghien-cuu/chuyen-giao-cong-nghe', wireframe: 'PG-PUB-08' },
      { label: 'Nghiên cứu sinh', path: '/nghien-cuu/nghien-cuu-sinh', wireframe: 'PG-PUB-08' },
    ],
  },

  {
    label: 'Hợp tác',
    path: '/hop-tac',
    icon: 'handshake',
    wireframe: 'PG-COO-01 → 05',
    children: [
      { label: 'Tổng quan hợp tác', path: '/hop-tac', wireframe: 'PG-COO-01' },
      { label: 'Danh sách đối tác', path: '/hop-tac/doi-tac', wireframe: 'PG-COO-02' },
      { label: 'Đối tác trong nước', path: '/hop-tac/doi-tac-trong-nuoc', wireframe: 'PG-COO-01' },
      { label: 'Đối tác quốc tế', path: '/hop-tac/doi-tac-quoc-te', wireframe: 'PG-COO-01' },
      { label: 'Chương trình / Dự án', path: '/hop-tac/chuong-trinh-du-an', wireframe: 'PG-COO-04' },
      { label: 'Chương trình trao đổi', path: '/hop-tac/trao-doi', wireframe: 'PG-COO-01' },
      { label: 'Sinh viên quốc tế', path: '/hop-tac/sinh-vien-quoc-te', wireframe: 'PG-COO-01' },
      { label: 'Giảng viên quốc tế', path: '/hop-tac/giang-vien-quoc-te', wireframe: 'PG-COO-01' },
      { label: 'Cơ hội hợp tác', path: '/hop-tac/co-hoi-hop-tac', wireframe: 'PG-COO-01' },
    ],
  },

  {
    label: 'Đời sống',
    path: '/doi-song',
    icon: 'heart',
    wireframe: 'PG-LIFE-01 → 06',
    children: [
      { label: 'Đời sống HUMG (Hub)', path: '/doi-song', wireframe: 'PG-LIFE-01' },
      { label: 'Campus & Cơ sở vật chất', path: '/doi-song/campus-co-so-vat-chat', wireframe: 'PG-LIFE-01' },
      { label: 'Hoạt động sinh viên', path: '/doi-song/hoat-dong-sinh-vien', wireframe: 'PG-LIFE-02 / PG-LIFE-05' },
      { label: 'Câu lạc bộ sinh viên', path: '/doi-song/cau-lac-bo', wireframe: 'PG-LIFE-03' },
      { label: 'Đoàn – Hội', path: '/doi-song/doan-hoi', wireframe: 'PG-LIFE-01' },
      { label: 'Thể thao – Văn hóa', path: '/doi-song/the-thao-van-hoa', wireframe: 'PG-LIFE-01' },
      { label: 'Ký túc xá', path: '/doi-song/ky-tuc-xa', wireframe: 'PG-LIFE-05' },
      { label: 'Y tế – Chăm sóc sức khỏe', path: '/doi-song/y-te', wireframe: 'PG-LIFE-05' },
      { label: 'Dịch vụ Campus', path: '/doi-song/dich-vu-campus', wireframe: 'PG-LIFE-05' },
      { label: 'Hỗ trợ sinh viên', path: '/doi-song/ho-tro-sinh-vien', wireframe: 'PG-LIFE-05' },
      { label: 'Việc làm – Khởi nghiệp', path: '/doi-song/viec-lam-khoi-nghiep', wireframe: 'PG-LIFE-06' },
    ],
  },

  {
    label: 'Thư viện',
    path: '/thu-vien',
    icon: 'library',
    wireframe: 'PG-LIB-01 (Gateway)',
    children: [
      { label: 'Tổng quan thư viện', path: '/thu-vien', wireframe: 'PG-LIB-01' },
      { label: 'Tìm tài liệu', path: '/thu-vien/tim-kiem', wireframe: 'PG-LIB-01.1' },
      { label: 'Bộ sưu tập', path: '/thu-vien/bo-suu-tap', wireframe: 'PG-LIB-01' },
      { label: 'Tài liệu của tôi', path: '/thu-vien/tai-lieu-cua-toi', wireframe: 'PG-LIB-01.4' },
      { label: 'CSDL khoa học', path: '/thu-vien/csdl-khoa-hoc', wireframe: 'PG-LIB-01' },
      { label: 'Thư viện số', path: '/thu-vien-so', wireframe: 'PG-PUB-11' },
      { label: 'Hướng dẫn sử dụng', path: '/thu-vien/huong-dan', wireframe: 'PG-LIB-01' },
    ],
  },

  {
    label: 'Sinh viên',
    path: '/sinh-vien',
    icon: 'user',
    wireframe: 'PG-STU-01 (Gateway)',
    children: [
      { label: 'Cổng Sinh viên (Tổng quan)', path: '/sinh-vien', wireframe: 'PG-STU-01' },
      { label: 'Học tập & Đào tạo', path: '/sinh-vien/hoc-tap', wireframe: 'PG-STU-01.1' },
      { label: 'Quy chế sinh viên', path: '/sinh-vien/quy-che', wireframe: 'PG-STU-01.2' },
      { label: 'Học phí & Học bổng', path: '/sinh-vien/hoc-phi-hoc-bong', wireframe: 'PG-STU-01.3' },
      { label: 'Biểu mẫu sinh viên', path: '/sinh-vien/bieu-mau', wireframe: 'PG-STU-01.4' },
      { label: 'Đời sống & Hỗ trợ sinh viên', path: '/sinh-vien/doi-song-ho-tro', wireframe: 'PG-STU-01.5' },
      { label: 'Việc làm & Khởi nghiệp', path: '/sinh-vien/viec-lam-khoi-nghiep', wireframe: 'PG-STU-01.6' },
      { label: 'Thư viện & E-learning', path: '/sinh-vien/thu-vien-elearning', wireframe: 'PG-STU-01.7' },
      { label: 'My eUni Sinh viên', path: '/sinh-vien/my-euni', wireframe: 'POR-01' },
      { label: 'Sổ tay tân sinh viên', path: '/sinh-vien/tan-sinh-vien' },
      { label: 'Hỏi – Đáp (FAQ)', path: '/sinh-vien/faq' },
    ],
  },

  {
    label: 'Giảng viên / Cán bộ',
    path: '/giang-vien',
    icon: 'users',
    wireframe: 'PG-STAFF-01 (Gateway)',
    children: [
      { label: 'Thông tin dành cho cán bộ', path: '/giang-vien', wireframe: 'PG-STAFF-01.1' },
      { label: 'Giảng dạy & Đào tạo', path: '/giang-vien/giang-day', wireframe: 'PG-STAFF-01.2' },
      { label: 'Nghiên cứu khoa học', path: '/giang-vien/nghien-cuu', wireframe: 'PG-STAFF-01.3' },
      { label: 'Quy định – Quy chế', path: '/giang-vien/quy-dinh', wireframe: 'PG-STAFF-01.4' },
      { label: 'Biểu mẫu chung', path: '/giang-vien/bieu-mau', wireframe: 'PG-STAFF-01.5' },
      { label: 'Tiện ích cán bộ', path: '/giang-vien/tien-ich', wireframe: 'PG-STAFF-01.6' },
      { label: 'Danh bạ đơn vị & Phòng họp', path: '/giang-vien/danh-ba', wireframe: 'PG-STAFF-01.6' },
      { label: 'My eUni Giảng viên', path: '/giang-vien/my-euni', wireframe: 'PG-STAFF-01.7 / POR-11' },
    ],
  },

  {
    label: 'Phụ huynh',
    path: '/phu-huynh',
    icon: 'shield',
    accent: 'parent',
    wireframe: 'PG-PAR-01',
    children: [
      { label: 'Thông tin dành cho phụ huynh', path: '/phu-huynh', wireframe: 'PG-PAR-01' },
      { label: 'Tuyển sinh', path: '/hoc-tap/tuyen-sinh' },
      { label: 'Chương trình đào tạo', path: '/hoc-tap/chuong-trinh-dao-tao' },
      { label: 'Học phí & Học bổng', path: '/hoc-tap/hoc-phi-hoc-bong' },
      { label: 'Tin tức & Sự kiện', path: '/tin-tuc' },
      { label: 'Liên hệ nhà trường', path: '/lien-he' },
      { label: 'My eUni Phụ huynh', path: '/euni/phu-huynh', wireframe: 'POR-20' },
    ],
  },

  {
    label: 'Lãnh đạo',
    path: '/euni/lanh-dao',
    icon: 'target',
    accent: 'leader',
    wireframe: 'PG-PORT-ADMIN · 12.1 → 12.8',
    children: [
      { label: 'Tổng quan điều hành', path: '/euni/lanh-dao', wireframe: '12.1' },
      { label: 'Chỉ số điều hành (BI)', path: '/euni/lanh-dao/chi-so-dieu-hanh', wireframe: '12.2' },
      { label: 'Báo cáo & Thống kê', path: '/euni/lanh-dao/bao-cao-thong-ke', wireframe: '12.3' },
      { label: 'Phê duyệt & Cảnh báo', path: '/euni/lanh-dao/phe-duyet', wireframe: '12.4' },
      { label: 'Quản lý hệ thống', path: '/euni/lanh-dao/he-thong', wireframe: '12.5' },
      { label: 'Cài đặt cổng thông tin', path: '/euni/lanh-dao/cai-dat', wireframe: '12.6' },
      { label: 'Nhật ký hệ thống', path: '/euni/lanh-dao/nhat-ky', wireframe: '12.7' },
      { label: 'Trung tâm thông báo', path: '/euni/lanh-dao/thong-bao', wireframe: '12.8' },
    ],
  },
]

const HEADER_MENU_PATHS = ['/gioi-thieu', '/hoc-tap', '/nghien-cuu', '/hop-tac', '/doi-song']

const HEADER_LINK_PATHS = ['/thu-vien', '/sinh-vien', '/giang-vien']

export const headerNav = [
  ...HEADER_MENU_PATHS.map((p) => ({ ...mainNav.find((m) => m.path === p), mode: 'menu' })),
  ...HEADER_LINK_PATHS.map((p) => ({ ...mainNav.find((m) => m.path === p), mode: 'link' })),
]

export const quickAccessLinks = [
  { label: 'Thư viện', path: '/thu-vien', icon: 'library' },
  { label: 'Webmail', path: '/hoc-tap/e-learning', icon: 'mail' },
  { label: 'E-learning', path: '/hoc-tap/e-learning', icon: 'play' },
  { label: 'Dịch vụ công', path: '/lien-he', icon: 'file' },
  { label: 'Liên hệ', path: '/lien-he', icon: 'phone' },
]

const standalonePublic = [
  { path: '/lich-cong-tac', title: 'Lịch công tác', wireframe: 'PG-HOME' },
  { path: '/tien-ich', title: 'Tiện ích & Dịch vụ', wireframe: 'PG-HOME' },
  { path: '/webmail', title: 'Webmail HUMG', wireframe: 'PG-HOME' },
  { path: '/tin-tuc', title: 'Tin tức & Sự kiện', wireframe: 'PG-PUB-06 / PG-HOME-02' },
  { path: '/tin-tuc/:slug', title: 'Chi tiết tin tức', wireframe: 'PG-PUB-07' },
  { path: '/su-kien', title: 'Sự kiện nổi bật', wireframe: 'PG-HOME-03' },
  { path: '/su-kien/:slug', title: 'Chi tiết sự kiện', wireframe: 'PG-HOME-03' },
  { path: '/media', title: 'Media HUMG', wireframe: 'PG-HOME-04' },
  { path: '/media/anh/:slug', title: 'Chi tiết album ảnh', wireframe: 'PG-HOME-04' },
  { path: '/media/video/:slug', title: 'Chi tiết video', wireframe: 'PG-HOME-04' },
  { path: '/media/podcast/:slug', title: 'Chi tiết podcast', wireframe: 'PG-HOME-04' },
  { path: '/tim-kiem', title: 'Kết quả tìm kiếm toàn cục', wireframe: 'PG-PUB-02' },
  { path: '/gioi-thieu-nhanh', title: 'Giới thiệu nhanh', wireframe: 'PG-HOME-05' },
  /* Khối "Giới thiệu HUMG" — trang phụ đã rút khỏi menu chính, vẫn giữ route */
  { path: '/gioi-thieu/con-so', title: 'HUMG qua các con số', wireframe: 'PG-PUB-03-06' },
  { path: '/gioi-thieu/ban-giam-hieu', title: 'Ban Giám hiệu', wireframe: 'PG-PUB-04-02' },
  { path: '/gioi-thieu/khoa', title: 'Khoa / Viện', wireframe: 'PG-PUB-04-04' },
  { path: '/gioi-thieu/phong-ban', title: 'Phòng / Ban', wireframe: 'PG-PUB-04-05' },
  { path: '/gioi-thieu/trung-tam-vien', title: 'Trung tâm / Viện', wireframe: 'PG-PUB-04-06' },
  { path: '/gioi-thieu/don-vi-truc-thuoc', title: 'Đơn vị trực thuộc', wireframe: 'PG-PUB-04-07' },
  { path: '/cuu-sinh-vien', title: 'Cộng đồng Cựu sinh viên', wireframe: 'PG-HOME' },
  { path: '/lien-he', title: 'Liên hệ', wireframe: 'PG-PUB-12 / PG-HOME-06' },
  { path: '/so-lieu-noi-bat', title: 'Số liệu nổi bật', wireframe: 'PG-PUB-10' },
  { path: '/thu-vien-so', title: 'Thư viện số', wireframe: 'PG-PUB-11' },
  { path: '/sitemap', title: 'Sơ đồ trang', wireframe: 'sitemap_new' },
]

const detailPublic = [
  { path: '/gioi-thieu/khoa/:id', title: 'Chi tiết Khoa', wireframe: 'PG-PUB-04-04' },
  { path: '/gioi-thieu/khoa/:khoaId/bo-mon/:bmId', title: 'Chi tiết Bộ môn', wireframe: 'PG-PUB-04-04' },
  { path: '/gioi-thieu/khoa/:khoaId/bo-mon/:bmId/giang-vien/:gvId', title: 'Hồ sơ giảng viên', wireframe: 'PG-PUB-04-04' },
  { path: '/gioi-thieu/phong-ban/:id', title: 'Chi tiết Phòng / Ban', wireframe: 'PG-PUB-04-05' },
  { path: '/gioi-thieu/trung-tam-vien/:id', title: 'Chi tiết Trung tâm / Viện', wireframe: 'PG-PUB-04-06' },
  { path: '/gioi-thieu/don-vi-truc-thuoc/:id', title: 'Chi tiết Đơn vị trực thuộc', wireframe: 'PG-PUB-04-07' },
  { path: '/hoc-tap/chuong-trinh-dao-tao/:id', title: 'Chi tiết chương trình đào tạo', wireframe: 'PG-EDU-04' },
  { path: '/hoc-tap/tuyen-sinh/thong-tin', title: 'Thông tin tuyển sinh', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/phuong-thuc', title: 'Phương thức xét tuyển', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/ho-so', title: 'Hồ sơ & Giấy tờ', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/thoi-gian', title: 'Thời gian tuyển sinh', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/huong-dan', title: 'Hướng dẫn đăng ký', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/diem-chuan', title: 'Tra cứu điểm chuẩn', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/quy-che', title: 'Quy chế tuyển sinh', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/video-nganh', title: 'Video giới thiệu ngành', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/tu-van', title: 'Tư vấn tuyển sinh', wireframe: 'PG-EDU-01.1' },
  { path: '/hoc-tap/tuyen-sinh/hoi-dap', title: 'Câu hỏi thường gặp tuyển sinh', wireframe: 'PG-EDU-01.1' },
  { path: '/nghien-cuu/de-tai/:id', title: 'Chi tiết đề tài', wireframe: 'PG-RES-02' },
  { path: '/nghien-cuu/cong-bo/:id', title: 'Chi tiết công bố', wireframe: 'PG-RES-04' },
  { path: '/nghien-cuu/chuyen-gia/:id', title: 'Hồ sơ chuyên gia', wireframe: 'PG-RES-05' },
  { path: '/nghien-cuu/nhom-nghien-cuu/:id', title: 'Chi tiết nhóm nghiên cứu', wireframe: 'PG-PUB-08' },
  { path: '/nghien-cuu/hoi-nghi-hoi-thao/:slug', title: 'Chi tiết hội nghị / hội thảo', wireframe: 'PG-PUB-08' },
  { path: '/nghien-cuu/phong-thi-nghiem/:id', title: 'Chi tiết phòng thí nghiệm', wireframe: 'PG-PUB-08' },
  { path: '/hop-tac/doi-tac/:id', title: 'Chi tiết đối tác', wireframe: 'PG-COO-03' },
  { path: '/hop-tac/chuong-trinh-du-an/:id', title: 'Chi tiết chương trình / dự án', wireframe: 'PG-COO-05' },
  { path: '/doi-song/cau-lac-bo/:id', title: 'Chi tiết CLB', wireframe: 'PG-LIFE-04' },
  { path: '/doi-song/hoat-dong-sinh-vien/:slug', title: 'Chi tiết hoạt động sinh viên', wireframe: 'PG-LIFE-02' },
  { path: '/doi-song/viec-lam-khoi-nghiep/:id', title: 'Chi tiết tin tuyển dụng', wireframe: 'PG-LIFE-06' },
  { path: '/thu-vien/tai-lieu/:id', title: 'Chi tiết tài liệu', wireframe: 'PG-LIB-01.2 / 01.3' },
]

function collectFromNav() {
  const seen = new Set(['/'])
  const out = []
  for (const sec of mainNav) {
    const list = sec.children || [{ label: sec.label, path: sec.path, wireframe: sec.wireframe }]
    for (const c of list) {
      if (!c.path || c.path.startsWith('/euni') || c.path.startsWith('/cms')) continue
      if (seen.has(c.path)) continue
      seen.add(c.path)
      out.push({ path: c.path, title: c.label, wireframe: c.wireframe || sec.wireframe })
    }
  }
  return out
}

export const publicRoutes = [...collectFromNav(), ...standalonePublic, ...detailPublic]

export const authRoutes = [
  { path: '/dang-nhap', title: 'Đăng nhập chung (SSO)', wireframe: 'AUTH-01' },
  { path: '/dang-nhap-phu-huynh', title: 'Đăng nhập phụ huynh', wireframe: 'AUTH-02' },
  { path: '/doi-mat-khau', title: 'Đổi mật khẩu', wireframe: 'AUTH-03' },
  { path: '/quen-mat-khau', title: 'Quên mật khẩu', wireframe: 'AUTH-04' },
]

export const portals = [
  {
    key: 'sinh-vien',
    base: '/euni/sinh-vien',
    role: 'Sinh viên',
    user: 'Nguyễn Văn A',
    meta: 'MSSV: 21SC01234 · Khoa Trắc địa – Bản đồ',
    wireframe: 'PG-PORT · POR-01 → POR-10',
    notifTo: '/euni/sinh-vien/thong-bao',
    notifications: [
      { title: 'Lịch thi học kỳ 2 (2024 – 2025) đã công bố', time: '10/05/2025 09:30', unread: true },
      { title: 'Thông báo đóng học phí HK2 trước 31/05/2025', time: '05/05/2025 14:20', unread: true },
      { title: 'Học bổng khuyến khích học tập HK2', time: '03/05/2025 11:15', unread: false },
    ],
    items: [
      { path: '', title: 'Tổng quan', icon: 'grid', wireframe: 'PG-PORT 10.1' },
      { path: 'lich-hoc', title: 'Thời khóa biểu', icon: 'calendar', wireframe: 'PG-PORT 10.2' },
      { path: 'ket-qua-hoc-tap', title: 'Kết quả học tập', icon: 'award', wireframe: 'PG-PORT 10.3' },
      { path: 'hoc-phi', title: 'Tài chính', icon: 'file', wireframe: 'PG-PORT 10.4' },
      { path: 'thong-tin-ca-nhan', title: 'Hồ sơ cá nhân', icon: 'user', wireframe: 'PG-PORT 10.5' },
      { path: 'thong-bao', title: 'Thông báo', icon: 'bell', wireframe: 'PG-PORT 10.6' },
      { path: 'ho-tro', title: 'Ticket hỗ trợ', icon: 'headphones', wireframe: 'PG-PORT 10.7' },
      { path: 'goc-hoc-tap', title: 'Góc học tập', icon: 'book', wireframe: 'POR-02' },
      { path: 'dang-ky-mon-hoc', title: 'Đăng ký học phần', icon: 'compass', wireframe: 'POR-02.1' },
      { path: 'dang-ky-do-an', title: 'Đăng ký đồ án tốt nghiệp', icon: 'graduation', wireframe: 'POR-02.2' },
      { path: 'dang-ky-thuc-tap', title: 'Đăng ký thực tập', icon: 'briefcase', wireframe: 'POR-02.3' },
      { path: 'tien-do-hoc-tap', title: 'Tiến độ học tập', icon: 'target', wireframe: 'POR-07' },
      { path: 'bieu-mau', title: 'Biểu mẫu', icon: 'file', wireframe: 'POR-06' },
      { path: 'dich-vu-noi-bo', title: 'Dịch vụ nội bộ', icon: 'layers', wireframe: 'POR-09' },
      { path: 'thu-vien-elearning', title: 'Thư viện & E-learning', icon: 'library', wireframe: 'POR-10' },
      { path: 'cai-dat', title: 'Cài đặt', icon: 'lock', wireframe: 'PG-PORT' },
    ],
  },
  {
    key: 'giang-vien',
    base: '/euni/giang-vien',
    role: 'Giảng viên',
    user: 'TS. Nguyễn Văn A',
    meta: 'Khoa Trắc địa – Bản đồ · Giảng viên',
    wireframe: 'PG-PORT-STAFF · POR-11 → POR-19',
    notifTo: '/euni/giang-vien/thong-bao',
    notifications: [
      { title: 'Thông báo họp Khoa tháng 5/2025 lúc 08:00 ngày 16/05', time: '15/05/2025 08:00', unread: true },
      { title: 'Lịch thi học kỳ 2 – kiểm tra ca coi thi được phân công', time: '14/05/2025 16:20', unread: true },
      { title: 'Hướng dẫn nộp minh chứng NCKH trước 30/05/2025', time: '15/05/2025 09:10', unread: false },
    ],
    items: [
      { path: '', title: 'Tổng quan', icon: 'grid', wireframe: 'PG-PORT-STAFF 11.1' },
      { path: 'lich-giang-day', title: 'Lịch giảng dạy', icon: 'calendar', wireframe: 'PG-PORT-STAFF 11.2' },
      { path: 'quan-ly-lop-hoc', title: 'Quản lý lớp học', icon: 'users', wireframe: 'PG-PORT-STAFF 11.3' },
      { path: 'ket-qua-hoc-tap', title: 'Kết quả học tập', icon: 'award', wireframe: 'PG-PORT-STAFF 11.4' },
      { path: 'nghien-cuu', title: 'Nghiên cứu khoa học', icon: 'flask', wireframe: 'PG-PORT-STAFF 11.5' },
      { path: 'cong-tac', title: 'Công tác – Hành chính', icon: 'building', wireframe: 'PG-PORT-STAFF 11.6' },
      { path: 'tai-chinh', title: 'Tài chính', icon: 'file', wireframe: 'PG-PORT-STAFF' },
      { path: 'ho-so', title: 'Hồ sơ cá nhân', icon: 'user', wireframe: 'PG-PORT-STAFF' },
      { path: 'thong-bao', title: 'Thông báo', icon: 'bell', wireframe: 'PG-PORT-STAFF' },
      { path: 'ho-tro', title: 'Ticket hỗ trợ', icon: 'headphones', wireframe: 'PG-PORT-STAFF' },
      { path: 'sinh-vien', title: 'Sinh viên', icon: 'user', wireframe: 'POR-17' },
      { path: 'quan-ly-hoc-phan', title: 'Quản lý học phần', icon: 'book', wireframe: 'POR-13' },
      { path: 'de-cuong-tai-lieu', title: 'Đề cương & Tài liệu học phần', icon: 'file', wireframe: 'POR-14' },
      { path: 'csdl-khoa-hoc', title: 'CSDL khoa học', icon: 'flask', wireframe: 'POR-15' },
      { path: 'hoc-lieu-so', title: 'Học liệu số', icon: 'layers', wireframe: 'POR-16' },
      { path: 'huong-dan-do-an', title: 'Hướng dẫn đồ án / luận văn', icon: 'graduation', wireframe: 'POR-18.1' },
      { path: 'thuc-tap-doanh-nghiep', title: 'Thực tập doanh nghiệp', icon: 'briefcase', wireframe: 'POR-18.2' },
      { path: 'tien-ich-elearning', title: 'Tiện ích & E-learning', icon: 'grid', wireframe: 'POR-19' },
      { path: 'cai-dat', title: 'Cài đặt', icon: 'lock', wireframe: 'PG-PORT-STAFF' },
      ...staffToolRoutes,
    ],
  },
  {
    key: 'phu-huynh',
    base: '/euni/phu-huynh',
    role: 'Phụ huynh',
    user: 'Trần Thị Lan',
    meta: 'Phụ huynh của Trần Minh Anh',
    wireframe: 'PG-PORT-PARENT · POR-20 → POR-26',
    notifTo: '/euni/phu-huynh/thong-bao',
    notifications: [
      { title: 'Thông báo học phí học kỳ 3 (2024 – 2025)', time: '16/05/2025 09:30', unread: true },
      { title: 'Con bạn vắng buổi học Trắc địa công trình ngày 07/05', time: '08/05/2025 07:50', unread: true },
      { title: 'Kết quả học tập học kỳ 1 (2024 – 2025) đã có', time: '10/05/2025 10:15', unread: false },
    ],
    items: [
      { path: '', title: 'Tổng quan', icon: 'grid', wireframe: 'PG-PORT-PARENT 13.1' },
      { path: 'thong-tin-hoc-sinh', title: 'Thông tin sinh viên', icon: 'user', wireframe: 'POR-21' },
      { path: 'ket-qua-hoc-tap', title: 'Kết quả học tập', icon: 'award', wireframe: 'PG-PORT-PARENT 13.2' },
      { path: 'diem-danh', title: 'Điểm danh', icon: 'check', wireframe: 'PG-PORT-PARENT 13.4' },
      { path: 'hoc-phi-thanh-toan', title: 'Học phí & Thanh toán', icon: 'file', wireframe: 'PG-PORT-PARENT 13.3' },
      { path: 'thong-bao', title: 'Thông báo', icon: 'bell', wireframe: 'PG-PORT-PARENT 13.5' },
      { path: 'lich-hoc', title: 'Lịch học', icon: 'calendar', wireframe: 'POR-24' },
      { path: 'dang-ky-dich-vu', title: 'Đăng ký dịch vụ', icon: 'layers', wireframe: 'PG-PORT-PARENT' },
      { path: 'lien-he-nha-truong', title: 'Liên hệ nhà trường', icon: 'phone', wireframe: 'PG-PORT-PARENT 13.6' },
      { path: 'cai-dat', title: 'Cài đặt', icon: 'lock', wireframe: 'PG-PORT-PARENT' },
    ],
  },
  {
    key: 'lanh-dao',
    base: '/euni/lanh-dao',
    role: 'Lãnh đạo',
    user: 'PGS.TS. Trần Xuân Trường',
    meta: 'Hiệu trưởng',
    wireframe: 'PG-PORT-ADMIN · 12.1 → 12.8',
    notifTo: '/euni/lanh-dao/thong-bao',
    notifications: [
      { title: 'Còn 7 yêu cầu chờ phê duyệt', time: 'Hôm nay 09:30', unread: true },
      { title: 'Hạn nộp báo cáo NCKH cấp trường: 25/05/2025', time: '15/05/2025', unread: true },
      { title: 'Sao lưu cơ sở dữ liệu hoàn tất', time: '14/05/2025 14:50', unread: false },
    ],
    items: [
      { path: '', title: 'Tổng quan', icon: 'grid', wireframe: '12.1' },
      { path: 'chi-so-dieu-hanh', title: 'Chỉ số điều hành', icon: 'award', wireframe: '12.2' },
      { path: 'dao-tao', title: 'Đào tạo', icon: 'book', wireframe: 'Chuyên đề' },
      { path: 'nghien-cuu-khoa-hoc', title: 'Nghiên cứu khoa học', icon: 'flask', wireframe: 'Chuyên đề' },
      { path: 'sinh-vien', title: 'Sinh viên', icon: 'user', wireframe: 'Chuyên đề' },
      { path: 'tai-chinh', title: 'Tài chính', icon: 'file', wireframe: 'Chuyên đề' },
      { path: 'nhan-su', title: 'Nhân sự', icon: 'users', wireframe: 'Chuyên đề' },
      { path: 'co-so-vat-chat', title: 'Cơ sở vật chất', icon: 'building', wireframe: 'Chuyên đề' },
      { path: 'bao-cao-thong-ke', title: 'Báo cáo & Thống kê', icon: 'grid', wireframe: '12.3' },
      { path: 'canh-bao', title: 'Cảnh báo', icon: 'bell', wireframe: '12.4' },
      { path: 'phe-duyet', title: 'Phê duyệt', icon: 'check', wireframe: '12.4' },
      { path: 'he-thong', title: 'Hệ thống', icon: 'lock', wireframe: '12.5' },
      { path: 'cai-dat', title: 'Cài đặt', icon: 'compass', wireframe: '12.6' },
      { path: 'nhat-ky', title: 'Nhật ký hệ thống', icon: 'clock', wireframe: '12.7', hidden: true },
      { path: 'thong-bao', title: 'Trung tâm thông báo', icon: 'bell', wireframe: '12.8', hidden: true },
    ],
  },
]

export const footerColumns = [
  {
    title: 'Liên kết nhanh',
    links: [
      { label: 'Giới thiệu HUMG', path: '/gioi-thieu' },
      { label: 'Tuyển sinh', path: '/hoc-tap/tuyen-sinh' },
      { label: 'Đào tạo', path: '/hoc-tap/chuong-trinh-dao-tao' },
      { label: 'Khoa học – Công nghệ', path: '/nghien-cuu' },
      { label: 'Hợp tác quốc tế', path: '/hop-tac' },
      { label: 'Đời sống', path: '/doi-song' },
      { label: 'Tin tức', path: '/tin-tuc' },
    ],
  },
  {
    title: 'Chính sách & Quy định',
    links: [
      { label: 'Chính sách bảo mật', path: '/lien-he' },
      { label: 'Quy chế học vụ', path: '/hoc-tap/thong-tin-chung' },
      { label: 'Điều khoản sử dụng', path: '/lien-he' },
      { label: 'Thông tin truy cập chính phủ', path: '/lien-he' },
      { label: 'Sơ đồ trang', path: '/sitemap' },
    ],
  },
]
