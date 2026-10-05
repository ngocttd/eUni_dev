export function normalizePagedResponse(payload, fallback = []) {
  if (Array.isArray(payload)) {
    return { items: payload, page: 1, pageSize: payload.length, total: payload.length, totalPages: 1 }
  }
  const items = payload?.items ?? payload?.data ?? fallback
  const page = Number(payload?.page ?? payload?.meta?.page ?? 1)
  const pageSize = Number(payload?.pageSize ?? payload?.meta?.pageSize ?? items.length ?? 0)
  const total = Number(payload?.total ?? payload?.meta?.total ?? items.length ?? 0)
  const totalPages = Number(payload?.totalPages ?? payload?.meta?.totalPages ?? (pageSize ? Math.ceil(total / pageSize) : 1))
  return { items, page, pageSize, total, totalPages }
}
