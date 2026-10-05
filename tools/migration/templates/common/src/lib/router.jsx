'use client'
/**
 * Lớp tương thích react-router-dom → Next.js App Router.
 * Giữ nguyên API mà code giao diện đang dùng (Link, NavLink, useNavigate, useLocation,
 * useParams, useSearchParams, Navigate) để việc chuyển Next.js không phải sửa từng trang.
 */
import { useEffect, useMemo, useCallback } from 'react'
import NextLink from 'next/link'
import { externalUrl } from '../config/apps.js'
import { useRouter, usePathname, useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation'

const toHref = (to) => (typeof to === 'string' ? to : `${to?.pathname || ''}${to?.search || ''}${to?.hash || ''}`)

export function Link({ to, href, replace, state, reloadDocument, children, ...rest }) {
  const target = toHref(to ?? href ?? '/')
  const ext = externalUrl(target)
  if (ext) return <a href={ext} {...rest}>{children}</a>
  return <NextLink href={target} replace={replace} {...rest}>{children}</NextLink>
}

export function NavLink({ to, end, className, style, children, ...rest }) {
  const pathname = usePathname() || '/'
  const href = toHref(to)
  const ext = externalUrl(href)
  const target = href.split(/[?#]/)[0] || '/'
  const isActive = !ext && (end ? pathname === target : pathname === target || pathname.startsWith(target.endsWith('/') ? target : `${target}/`))
  const cls = typeof className === 'function' ? className({ isActive, isPending: false }) : [className, isActive ? 'active' : ''].filter(Boolean).join(' ')
  const st = typeof style === 'function' ? style({ isActive }) : style
  const content = typeof children === 'function' ? children({ isActive, isPending: false }) : children
  if (ext) return <a href={ext} className={cls || undefined} style={st} {...rest}>{content}</a>
  return <NextLink href={href} className={cls || undefined} style={st} aria-current={isActive ? 'page' : undefined} {...rest}>{content}</NextLink>
}

export function useNavigate() {
  const router = useRouter()
  return useCallback((to, options = {}) => {
    if (typeof to === 'number') return to < 0 ? router.back() : router.forward()
    const href = toHref(to)
    const ext = externalUrl(href)
    if (ext) return options.replace ? window.location.replace(ext) : window.location.assign(ext)
    return options.replace ? router.replace(href) : router.push(href)
  }, [router])
}

export function useLocation() {
  const pathname = usePathname() || '/'
  const sp = useNextSearchParams()
  const search = sp && sp.toString() ? `?${sp.toString()}` : ''
  return useMemo(() => ({ pathname, search, hash: typeof window !== 'undefined' ? window.location.hash : '', state: null, key: pathname + search }), [pathname, search])
}

export function useParams() {
  const p = useNextParams() || {}
  const out = {}
  for (const [k, v] of Object.entries(p)) out[k] = Array.isArray(v) ? v.map(decodeURIComponent) : decodeURIComponent(v)
  /* /gioi-thieu/khoa/[khoaId] dùng chung thư mục động với /khoa/[khoaId]/bo-mon/... — trang chi tiết khoa đọc `id` */
  if (out.khoaId && out.id === undefined) out.id = out.khoaId
  return out
}

export function useSearchParams() {
  const sp = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const params = useMemo(() => new URLSearchParams(sp ? sp.toString() : ''), [sp])
  const setParams = useCallback((next, options = {}) => {
    const value = typeof next === 'function' ? next(new URLSearchParams(params.toString())) : next
    const qs = new URLSearchParams(value instanceof URLSearchParams ? value : value || {}).toString()
    const url = `${pathname}${qs ? `?${qs}` : ''}`
    options.replace === false ? router.push(url) : router.replace(url, { scroll: false })
  }, [params, router, pathname])
  return [params, setParams]
}

export function Navigate({ to, replace }) {
  const router = useRouter()
  useEffect(() => {
    const href = toHref(to)
    const ext = externalUrl(href)
    if (ext) { replace ? window.location.replace(ext) : window.location.assign(ext); return }
    replace ? router.replace(href) : router.push(href)
  }, [to, replace, router])
  return null
}
