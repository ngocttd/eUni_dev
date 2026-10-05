/**
 * Hàm tra cứu dựng lại từ dữ liệu của từng module (trước đây nằm cuối mỗi data.js).
 * Chỉ là phép lọc/tìm trên dữ liệu đã tải — không gọi API.
 */
export const makeHelpers = {
  about: ({ units, facultyDepartments }) => {
    const getUnit = (kind, id) => units[kind]?.list.find((u) => u.id === id)
    const getDepartment = (khoaId, deptId) => (facultyDepartments[khoaId] || []).find((d) => d.id === deptId)
    const getLecturer = (khoaId, deptId, lecId) => (getDepartment(khoaId, deptId)?.lecturers || []).find((l) => l.id === lecId)
    return { getUnit, getDepartment, getLecturer }
  },

  content: ({ articles, events, albums, videos, podcasts, newsCategories, searchPages }) => ({
    getArticle: (slug) => articles.find((a) => a.slug === slug),
    getEvent: (slug) => events.find((e) => e.slug === slug),
    getAlbum: (slug) => albums.find((a) => a.slug === slug),
    getVideo: (slug) => videos.find((v) => v.slug === slug),
    getPodcast: (slug) => podcasts.find((p) => p.slug === slug),
    relatedArticles: (slug, n = 4) => articles.filter((a) => a.slug !== slug).slice(0, n),
    otherEvents: (slug, n = 4) => events.filter((e) => e.slug !== slug).slice(0, n),
    categoryCounts: () => {
      const map = { 'Tất cả': articles.length }
      newsCategories.forEach((c) => { map[c] = articles.filter((a) => a.category === c).length })
      return map
    },
    searchAll: (q = '') => {
      const term = q.trim().toLowerCase()
      const match = (s) => !term || String(s ?? '').toLowerCase().includes(term)
      const out = []
      articles.forEach((a) => {
        if (match(a.title) || match(a.excerpt)) out.push({ type: 'Bài viết', title: a.title, excerpt: a.excerpt, meta: `${a.date} · ${a.category}`, to: `/tin-tuc/${a.slug}` })
      })
      events.forEach((e) => {
        if (match(e.title)) out.push({ type: 'Sự kiện', title: e.title, excerpt: `${e.time} · ${e.place}`, meta: `${e.date} · ${e.organizer}`, to: `/su-kien/${e.slug}` })
      })
      videos.forEach((v) => {
        if (match(v.title) || match(v.desc)) out.push({ type: 'Media', title: v.title, excerpt: v.desc, meta: `Video · ${v.duration}`, to: `/media/video/${v.slug}` })
      })
      podcasts.forEach((p) => {
        if (match(p.title) || match(p.desc)) out.push({ type: 'Media', title: p.title, excerpt: p.desc, meta: `Podcast · ${p.episode}`, to: `/media/podcast/${p.slug}` })
      })
      albums.forEach((a) => {
        if (match(a.title)) out.push({ type: 'Media', title: a.title, excerpt: `Album ảnh · ${a.count} ảnh`, meta: a.date, to: `/media/anh/${a.slug}` })
      })
      searchPages.forEach((p) => {
        if (match(p.title) || match(p.excerpt)) out.push({ ...p, meta: p.type })
      })
      return out
    },
  }),

  cooperation: ({ partners, coopPrograms }) => ({
    getPartner: (id) => partners.find((p) => p.id === id),
    getCoopProgram: (id) => coopPrograms.find((p) => p.id === id),
  }),

  education: ({ programs }) => ({ getProgram: (id) => programs.find((p) => p.id === id) }),

  library: ({ items }) => ({ getItem: (id) => items.find((it) => it.id === id) }),

  life: ({ activities, clubs, jobs }) => ({
    getActivity: (slug) => activities.find((a) => a.slug === slug),
    getClub: (id) => clubs.find((c) => c.id === id),
    getJob: (id) => jobs.listings.find((j) => j.id === id),
  }),

  research: ({ projects, publications, experts, researchGroups, conferences, labs }) => ({
    getProject: (id) => projects.find((p) => p.id === id),
    getPublication: (id) => publications.find((p) => p.id === id),
    getExpert: (id) => experts.find((e) => e.id === id),
    getGroup: (id) => researchGroups.find((g) => g.id === id),
    getConference: (slug) => conferences.find((c) => c.slug === slug),
    getLab: (id) => labs.find((l) => l.id === id),
  }),
}

/**
 * Chọn bản dịch theo ngôn ngữ đang dùng. Thiếu bản dịch → giữ nguyên tiếng Việt (nguồn).
 * Chỉ các bản dịch ĐÃ HOÀN TẤT mới được API công khai nên không cần kiểm tra lại ở đây.
 */
const pick = (item, lang) => {
  const tr = lang !== 'vi' ? item.en : null // hiện chỉ có tiếng Anh
  if (!tr) return item
  return { ...item, title: tr.title || item.title, excerpt: tr.excerpt ?? item.excerpt, ...(tr.body?.length ? { body: tr.body } : {}) }
}
export const localizers = {
  content: (data, lang) => ({ ...data, articles: data.articles.map((a) => pick(a, lang)) }),
  home: (data, lang) => ({
    ...data,
    featuredNews: data.featuredNews && pick(data.featuredNews, lang),
    newsList: data.newsList.map((n) => pick(n, lang)),
  }),
}
