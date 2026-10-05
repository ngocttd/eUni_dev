'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useEffect, useState, useCallback } from 'react'
import { Link } from '../../../lib/router.jsx'
import Icon from '../../../shared/lib/Icon.jsx'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'

import './home.css'

/* Tiêu đề khối dùng chung: chip icon + tên + link "Xem tất cả" */
function SectionHead({ icon, title, to, more = 'Xem tất cả' }) {
  const { t } = useLanguage()
  return (
    <div className="humg-section-head">
      <h2>
        <span className="humg-section-head__ic"><Icon name={icon} size={18} /></span>
        {t(title)}
      </h2>
      {to && (
        <Link to={to} className="humg-link-more">
          {t(more)} <Icon name="arrow-right" size={14} />
        </Link>
      )}
    </div>
  )
}

/* ======================= HERO ======================= */
function Hero() {
  const { heroSlides, heroChips } = useModuleData('home');
  const { t } = useLanguage()
  const [i, setI] = useState(0)
  const go = useCallback((n) => setI((n + heroSlides.length) % heroSlides.length), [])

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % heroSlides.length), 6500)
    return () => clearInterval(t)
  }, [])

  const s = heroSlides[i]

  return (
    <section className="hero" aria-label="Giới thiệu nổi bật">
      <div className="hero__bg" aria-hidden="true">
        <img
          className="hero__photo"
          src="/brand/hero-campus.jpg"
          alt=""
          onError={(e) => { e.currentTarget.closest('.hero__bg').style.display = 'none' }}
        />
        <span className="hero__fade" />
      </div>

      <div className="home-wide hero__inner">
        <div className="hero__content" key={s.id}>
          <span className="hero__kicker">{t(s.kicker)}</span>
          <h1>
            {t(s.title).split('\n').map((line, k) => (
              <span key={k}>{line}</span>
            ))}
          </h1>
          <p className="hero__years">{t(s.years)}</p>
          <p className="hero__motto">{t(s.motto)}</p>
          <div className="hero__chips">
            {heroChips.map((c) => (
              <span key={c}>{t(c)}</span>
            ))}
          </div>
          <div className="hero__cta">
            <Link to={s.primary.to} className="humg-btn humg-btn--primary">
              {t(s.primary.label)} <Icon name="arrow-right" size={16} />
            </Link>
            <Link to={s.accent.to} className="humg-btn humg-btn--accent">
              {t(s.accent.label)} <Icon name="arrow-right" size={16} />
            </Link>
          </div>
          <div className="hero__dots">
            {heroSlides.map((sl, k) => (
              <button
                key={sl.id}
                className={k === i ? 'is-active' : ''}
                onClick={() => go(k)}
                aria-label={`Chuyển tới slide ${k + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============ THANH TRUY CẬP NHANH (nổi, đè lên đáy banner) ============ */
function QuickBar() {
  const { quickLinks } = useModuleData('home');
  const { t } = useLanguage()
  return (
    <div className="quickbar-wrap">
      <div className="home-wide">
        <nav className="quickbar" aria-label="Truy cập nhanh">
          {quickLinks.map((l) => (
            <Link key={l.label} to={l.to} className="quickbar__item">
              <span className="quickbar__ic"><Icon name={l.icon} size={22} /></span>
              <span className="quickbar__label">{t(l.label)}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

/* ============ DÀNH CHO BẠN (6 thẻ đối tượng, 1 hàng) ============ */
function Audiences() {
  const { audiences } = useModuleData('home');
  const { t } = useLanguage()
  return (
    <section className="aud">
      <div className="home-wide">
        <div className="aud__head">
          <h2>{t('Dành cho bạn')}</h2>
        </div>
        <div className="aud__grid">
          {audiences.map((a) => (
            <Link key={a.id} to={a.to} className="aud__card" style={{ '--c': a.color }}>
              <span className="aud__top">
                <span className="aud__ic"><Icon name={a.icon} size={19} /></span>
                <span className="aud__title">{t(a.title)}</span>
              </span>
              <span className="aud__desc">{t(a.desc)}</span>
              <span className="humg-ph aud__photo" data-ratio="16-9"><span>{t(a.title)}</span></span>
              <span className="aud__arrow"><Icon name="arrow-right" size={15} /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ======================= THẾ MẠNH CỦA HUMG ======================= */
function Strengths() {
  const { strengths } = useModuleData('home');
  const { t } = useLanguage()
  return (
    <section className="strengths">
      <div className="home-wide">
        <div className="strengths__head">
          <span className="humg-eyebrow" style={{ color: 'var(--humg-accent)' }}>{t('Vì sao chọn HUMG')}</span>
          <h2>{t('Nền tảng vững chắc cho tương lai của bạn')}</h2>
        </div>
        <div className="strengths__grid">
          {strengths.map((s) => (
            <div className="strengths__item" key={s.title}>
              <span className="strengths__ic"><Icon name={s.icon} size={24} /></span>
              <h3>{t(s.title)}</h3>
              <p>{t(s.text)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ======================= TIN TỨC · SỰ KIỆN · MEDIA ======================= */
function FeaturedNews() {
  const { featuredNews, newsList } = useModuleData('home');
  const { t } = useLanguage()
  return (
    <div className="humg-card panel panel--news">
      <div className="panel__head">
        <h2><span className="panel__head-ic"><Icon name="newspaper" size={16} /></span>{t('Tin tức nổi bật')}</h2>
        <Link to="/tin-tuc" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>
      </div>
      <div className="panel__body">
        <article className="feat">
          <Link to={`/tin-tuc/${featuredNews.slug}`} className="humg-ph feat__img" data-ratio="4-3">
            <span>Ảnh tin nổi bật</span>
          </Link>
          <div className="feat__body">
            <span className="humg-tag">{featuredNews.tag}</span>
            <p className="feat__date"><Icon name="calendar" size={12} /> {featuredNews.date}</p>
            <h3><Link to={`/tin-tuc/${featuredNews.slug}`}>{featuredNews.title}</Link></h3>
            <p className="feat__excerpt">{featuredNews.excerpt}</p>
            <Link to={`/tin-tuc/${featuredNews.slug}`} className="humg-link-more">
              {t('Xem chi tiết')} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </article>

        <ul className="minlist">
          {newsList.map((n) => (
            <li key={n.id}>
              <Link to={`/tin-tuc/${n.slug}`} className="humg-ph minlist__thumb" data-ratio="16-9">
                <span>16:9</span>
              </Link>
              <div>
                <span className="humg-tag">{n.tag}</span>
                <h4><Link to={`/tin-tuc/${n.slug}`}>{n.title}</Link></h4>
                <p className="minlist__date"><Icon name="calendar" size={12} /> {n.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Events() {
  const { upcomingEvents } = useModuleData('home');
  const { t } = useLanguage()
  return (
    <div className="humg-card panel panel--events">
      <div className="panel__head">
        <h2><span className="panel__head-ic"><Icon name="calendar" size={16} /></span>{t('Sự kiện sắp diễn ra')}</h2>
        <Link to="/su-kien" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>
      </div>
      <div className="panel__body">
        <ul className="events">
          {upcomingEvents.map((e) => (
            <li key={e.id}>
              <Link to={`/su-kien/${e.slug}`} className="events__date">
                <strong>{e.day}</strong>
                <span>{e.month}</span>
              </Link>
              <div className="events__info">
                <h4><Link to={`/su-kien/${e.slug}`}>{e.title}</Link></h4>
                <p><Icon name="map-pin" size={13} /> {e.place}</p>
              </div>
              <span className="events__time"><Icon name="clock" size={13} /> {e.time}</span>
            </li>
          ))}
        </ul>
        <Link to="/tin-tuc" className="humg-btn humg-btn--ghost humg-btn--block">
          <Icon name="calendar" size={16} /> {t('Lịch công tác tháng')}
        </Link>
      </div>
    </div>
  )
}

function MediaHumg() {
  const { mediaTabs } = useModuleData('home');
  const { t } = useLanguage()
  const [tab, setTab] = useState(mediaTabs[0].key)
  const active = mediaTabs.find((mt) => mt.key === tab)
  return (
    <div className="humg-card panel panel--media">
      <div className="panel__head">
        <h2><span className="panel__head-ic"><Icon name="image" size={16} /></span>{t('Media HUMG')}</h2>
        <Link to="/media" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>
      </div>
      <div className="panel__body">
        <div className="media__tabs" role="tablist">
          {mediaTabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={t.key === tab}
              className={t.key === tab ? 'is-active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="humg-ph media__hero" data-ratio="16-9">
          <span>{active.items[0].label}</span>
        </div>
        <ul className="media__recent">
          {active.items.map((it, k) => (
            <li key={k}>
              <span className="media__recent-ic">
                <Icon name={active.key === 'video' ? 'play' : active.key === 'podcast' ? 'headphones' : 'image'} size={14} />
              </span>
              {it.label}
            </li>
          ))}
        </ul>
        <Link to="/media" className="humg-btn humg-btn--ghost humg-btn--block">
          <Icon name="image" size={16} /> {t('Thư viện media')}
        </Link>
      </div>
    </div>
  )
}

function ContentBlocks() {
  return (
    <section className="humg-section humg-section--alt">
      <div className="home-wide">
        <div className="contentblocks">
          <FeaturedNews />
          <Events />
          <MediaHumg />
        </div>
      </div>
    </section>
  )
}

/* ======================= ĐỐI TÁC ======================= */
function Partners() {
  const { partners } = useModuleData('home');
  const loop = [...partners, ...partners]
  return (
    <section className="humg-section humg-section--tint humg-section--tight">
      <div className="home-wide">
        <SectionHead icon="handshake" title="Đối tác của HUMG" to="/hop-tac/doi-tac" />
        <div className="partners">
          <div className="partners__track">
            {loop.map((p, k) => (
              <Link key={p.short + k} to="/hop-tac/doi-tac" className="partners__logo" title={p.name}>
                <span className="partners__mono" style={{ '--pc': p.color }}>{p.short}</span>
                <span className="partners__name">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ======================= PAGE ======================= */
export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickBar />
      <Audiences />
      <Strengths />
      <ContentBlocks />
      <Partners />
    </>
  )
}
