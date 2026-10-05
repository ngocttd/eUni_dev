'use client'

/** Hiển thị khi API không phản hồi / trả lỗi trong lúc dựng trang. */
export default function GlobalError({ error, reset }) {
  return (
    <div role="alert" style={{ maxWidth: 640, margin: '12vh auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Không tải được dữ liệu</h1>
      <p style={{ opacity: 0.75, marginBottom: 20 }}>Hệ thống chưa kết nối được tới API. Vui lòng thử lại sau ít phút.</p>
      {process.env.NODE_ENV !== 'production' && <pre style={{ textAlign: 'left', fontSize: 12, whiteSpace: 'pre-wrap', opacity: 0.7 }}>{error?.message}</pre>}
      <button type="button" className="humg-btn humg-btn--primary" onClick={() => reset()}>Thử lại</button>
    </div>
  )
}
