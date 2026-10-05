/* Cấu hình tĩnh của giao diện (menu/nav, danh sách lựa chọn) — sinh từ data.js cũ, thuộc về FE, không lấy từ API. */

export const libraryNav = [
  {
    "label": "Tổng quan thư viện",
    "to": "/thu-vien",
    "icon": "library"
  },
  {
    "label": "Tìm tài liệu",
    "to": "/thu-vien/tim-kiem",
    "icon": "search"
  },
  {
    "label": "Bộ sưu tập",
    "to": "/thu-vien/bo-suu-tap",
    "icon": "layers"
  },
  {
    "label": "Tài liệu của tôi",
    "to": "/thu-vien/tai-lieu-cua-toi",
    "icon": "file"
  },
  {
    "label": "CSDL khoa học",
    "to": "/thu-vien/csdl-khoa-hoc",
    "icon": "grid"
  },
  {
    "label": "Thư viện số",
    "to": "/thu-vien-so",
    "icon": "book"
  },
  {
    "label": "Hướng dẫn sử dụng",
    "to": "/thu-vien/huong-dan",
    "icon": "headphones"
  }
]

export const libraryGuide = {
  "intro": "Hướng dẫn nhanh giúp bạn đăng ký thẻ, tra cứu, mượn – trả và khai thác tài nguyên số của Thư viện HUMG.",
  "steps": [
    {
      "title": "Đăng ký / kích hoạt thẻ thư viện",
      "text": "Sinh viên dùng mã số sinh viên; cán bộ dùng tài khoản HUMG. Kích hoạt tại quầy thủ thư hoặc trên Cổng My eUni."
    },
    {
      "title": "Tra cứu tài liệu (OPAC)",
      "text": "Dùng ô \"Tìm tài liệu\" theo nhan đề, tác giả, chủ đề; lọc theo loại tài liệu, năm, ngôn ngữ, khoa/viện."
    },
    {
      "title": "Mượn hoặc đặt mượn",
      "text": "Xem tình trạng bản in trong trang chi tiết; nếu hết bản, chọn \"Đặt mượn\" để được giữ chỗ khi tài liệu về."
    },
    {
      "title": "Đọc online & tải toàn văn",
      "text": "Với tài liệu số, đăng nhập tài khoản thư viện và chọn \"Đọc online\" hoặc tải bản PDF (nếu được phép)."
    },
    {
      "title": "Gia hạn & trả tài liệu",
      "text": "Gia hạn trong mục \"Tài liệu của tôi\" trước hạn trả; trả tài liệu tại quầy hoặc hộp trả sách ngoài giờ."
    }
  ],
  "faqs": [
    {
      "q": "Tôi quên mang thẻ, có mượn được tài liệu không?",
      "a": "Bạn có thể xuất trình thẻ sinh viên điện tử trên My eUni hoặc giấy tờ tùy thân kèm mã số để thủ thư đối chiếu."
    },
    {
      "q": "Vì sao không đọc được toàn văn CSDL quốc tế khi ở nhà?",
      "a": "Các CSDL có phí giới hạn theo dải IP của Trường. Hãy kết nối VPN HUMG hoặc dùng tài khoản truy cập từ xa do Thư viện cấp."
    },
    {
      "q": "Làm sao trích dẫn tài liệu đúng chuẩn?",
      "a": "Trang chi tiết mỗi tài liệu có nút \"Trích dẫn\" xuất sẵn theo APA, IEEE và có thể tải tệp .ris cho Zotero/EndNote."
    },
    {
      "q": "Mất tài liệu đã mượn thì xử lý thế nào?",
      "a": "Báo ngay cho Thư viện. Bạn được mua đền tài liệu cùng nội dung hoặc bồi thường theo giá trị và quy định hiện hành."
    }
  ],
  "rules": [
    "Giữ trật tự, không mang đồ ăn – thức uống có màu vào phòng đọc.",
    "Mỗi lần mượn tối đa 05 tài liệu với sinh viên, 10 tài liệu với cán bộ.",
    "Bảo quản tài liệu, không viết vẽ, gấp trang hoặc tự ý mang tài liệu ra khỏi thư viện khi chưa làm thủ tục.",
    "Tôn trọng bản quyền: chỉ sao chép trong giới hạn cho phép phục vụ học tập, nghiên cứu."
  ],
  "downloads": [
    {
      "name": "Nội quy Thư viện HUMG",
      "meta": "PDF · 0.4 MB"
    },
    {
      "name": "Hướng dẫn tra cứu OPAC và CSDL",
      "meta": "PDF · 1.1 MB"
    },
    {
      "name": "Hướng dẫn truy cập từ xa (VPN)",
      "meta": "PDF · 0.6 MB"
    },
    {
      "name": "Mẫu đề nghị bổ sung tài liệu",
      "meta": "DOCX · 40 KB"
    }
  ],
  "hours": [
    [
      "Thứ 2 – Thứ 6",
      "07:30 – 21:00"
    ],
    [
      "Thứ 7",
      "07:30 – 11:30"
    ],
    [
      "Khu tự học",
      "Mở 24/7 (quét thẻ)"
    ],
    [
      "Chủ nhật & ngày lễ",
      "Nghỉ"
    ]
  ],
  "contact": {
    "phone": "024.3838.3840",
    "email": "thuvien@humg.edu.vn"
  }
}
