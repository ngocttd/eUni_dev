/**
 * Làm sạch HTML bài viết do CMS soạn (WYSIWYG) trước khi hiển thị công khai.
 * Chỉ giữ thẻ/thuộc tính an toàn; loại script, style nội tuyến, sự kiện on*, javascript: URL…
 * Chỉ import động (loaders phía server; hộp thư thông báo của portal) để không đưa thư viện này vào bundle chung.
 */
import sanitizeHtml from 'sanitize-html'

const OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'blockquote', 'code', 'pre',
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['colspan', 'rowspan', 'colwidth'],
    td: ['colspan', 'rowspan', 'colwidth'],
    col: ['style'],
    '*': [],
  },
  allowedStyles: { col: { width: [/^\d+(px|%)$/] } },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tag, attribs) => ({ tagName: 'a', attribs: { ...attribs, rel: 'noopener noreferrer', ...(attribs.href && /^https?:/i.test(attribs.href) ? { target: '_blank' } : {}) } }),
  },
}

export const cleanHtml = (html) => sanitizeHtml(String(html ?? ''), OPTIONS)
