import { useEffect, useRef, useState, useId } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Star, Plus, Inbox, X } from 'lucide-react';
import { useAuth } from '../lib/context';

/* ---------- Visuels génératifs (aucune image cassée, rendu premium cohérent) ---------- */
const PALETTES = [
  { bg: '#0b0b0c', a: '#c9a227', b: '#f4e3a6', t: '#f5f3ee' },
  { bg: '#f4efe3', a: '#a6831b', b: '#0b0b0c', t: '#0b0b0c' },
  { bg: '#1a1712', a: '#d9b54a', b: '#8a6a10', t: '#f5f3ee' },
  { bg: '#ece9e2', a: '#0b0b0c', b: '#c9a227', t: '#0b0b0c' },
  { bg: '#121214', a: '#f4e3a6', b: '#c9a227', t: '#f5f3ee' },
  { bg: '#faf7ef', a: '#c9a227', b: '#2a2a2c', t: '#0b0b0c' },
];
const hash = (s = '') => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); };

export function Cover({ seed = 'perfekt', label, sub, variant, className, image }) {
  const id = useId().replace(/:/g, '');
  if (image) return <img src={image} alt={label || ''} loading="lazy" className={className} />;
  const h = hash(seed);
  const p = PALETTES[(variant ?? h) % PALETTES.length];
  const pattern = (h >> 3) % 4;
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className={`cover-svg ${className || ''}`} role="img" aria-label={label || 'Visuel PERFEKT'}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.a} /><stop offset=".5" stopColor={p.b} stopOpacity=".9" /><stop offset="1" stopColor={p.a} />
        </linearGradient>
        <radialGradient id={`r${id}`} cx=".8" cy=".1" r=".9">
          <stop offset="0" stopColor={p.a} stopOpacity=".35" /><stop offset="1" stopColor={p.bg} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill={p.bg} />
      <rect width="400" height="260" fill={`url(#r${id})`} />
      {pattern === 0 && [0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={300 + (h % 40)} cy={70} r={40 + i * 34} fill="none" stroke={`url(#g${id})`} strokeWidth={i === 2 ? 2.4 : .8} opacity={1 - i * .14} />
      ))}
      {pattern === 1 && (
        <g fill={`url(#g${id})`}>
          <path d="M250 20 C 250 120, 200 160, 150 175 C 205 180, 260 220, 300 250 C 270 210, 240 190, 210 178 C 280 150, 300 90, 250 20 Z" opacity=".95" />
          <path d="M300 50 C 305 130, 270 170, 235 182 C 270 190, 300 215, 330 235 C 310 205, 290 192, 270 185 C 320 150, 330 100, 300 50 Z" opacity=".7" />
        </g>
      )}
      {pattern === 2 && Array.from({ length: 14 }).map((_, i) => (
        <line key={i} x1={160 + i * 22} y1="0" x2={60 + i * 22} y2="260" stroke={`url(#g${id})`} strokeWidth={i % 4 === 0 ? 2 : .7} opacity={.25 + (i % 5) * .15} />
      ))}
      {pattern === 3 && (
        <g>
          <rect x="230" y="40" width="130" height="130" rx="65" fill="none" stroke={`url(#g${id})`} strokeWidth="1.5" />
          <rect x="260" y="70" width="130" height="130" rx="18" fill={`url(#g${id})`} opacity=".85" transform="rotate(12 325 135)" />
          <circle cx="250" cy="190" r="8" fill={p.a} />
        </g>
      )}
      {label && (
        <g>
          <text x="28" y="210" fill={p.t} fontFamily="Cormorant Garamond, serif" fontSize="30" fontWeight="600">{label.length > 22 ? label.slice(0, 21) + '…' : label}</text>
          {sub && <text x="29" y="236" fill={p.a} fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" letterSpacing="3">{sub.toUpperCase()}</text>}
        </g>
      )}
    </svg>
  );
}

/* ---------- Animations ---------- */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, style, ...rest }) {
  const ref = useRef(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ ...style, transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>;
}

export function Counter({ value, suffix = '', duration = 1800 }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / duration);
        setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{new Intl.NumberFormat('fr-FR').format(n)}{suffix}</span>;
}

export function Marquee({ items, reverse, speed = 40 }) {
  return (
    <div className={`marquee ${reverse ? 'reverse' : ''}`}>
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        {[...items, ...items].map((it, i) => <div key={i} className="logo-chip" aria-hidden={i >= items.length}><i />{it}</div>)}
      </div>
    </div>
  );
}

export function Faq({ items = [] }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {items.map((f, i) => (
        <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {f.q}<span className="pm"><Plus size={16} /></span>
          </button>
          <div className="ans"><div><p>{f.a}</p></div></div>
        </div>
      ))}
    </div>
  );
}

export function Stars({ value = 0, count, size }) {
  return (
    <span className="stars" aria-label={`Note ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} style={size ? { width: size, height: size } : null} fill={i <= Math.round(value) ? 'currentColor' : 'none'} />)}
      {count != null && <span>{value ? value.toFixed(1) : '—'} ({count})</span>}
    </span>
  );
}

export function Logo({ light }) {
  return (
    <Link to="/" className="brand" aria-label="PERFEKT AGENCY — accueil">
      <img src="/img/logo-mark.png" alt="" width="28" height="40" />
      <span className="brand-text" style={light ? { color: '#f5f3ee' } : null}>
        <strong>PERFEKT</strong><span>AGENCY</span>
      </span>
    </Link>
  );
}

export const Spinner = () => <div className="spinner" role="status" aria-label="Chargement" />;

export function Empty({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="empty">
      <Icon />
      <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: 6 }}>{title}</strong>
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, large }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${large ? 'modal-lg' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between" style={{ marginBottom: 22 }}>
          <h3 className="serif" style={{ fontSize: '1.7rem' }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHero({ eyebrow, title, children, crumbs = [] }) {
  return (
    <section className="page-hero">
      <div className="hero-glow" />
      <div className="container">
        {crumbs.length > 0 && (
          <nav className="breadcrumbs" aria-label="Fil d’Ariane">
            <Link to="/">Accueil</Link>
            {crumbs.map((c, i) => <span key={i}>/ {c.to ? <Link to={c.to}>{c.label}</Link> : c.label}</span>)}
          </nav>
        )}
        <Reveal>
          {eyebrow && <div className="eyebrow" style={{ marginTop: 28 }}>{eyebrow}</div>}
          <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.6rem)' }}>{title}</h1>
          {children && <div className="lead">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

export function Protected({ children, role }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to={`/connexion?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (role && !role.includes(user.role)) return <Navigate to="/compte" replace />;
  return children;
}

export function StatusBadge({ status }) {
  const map = {
    paid: ['badge-ok', 'Payée'], pending: ['badge-wait', 'En attente'], failed: ['badge-bad', 'Échouée'], refunded: ['badge-neutral', 'Remboursée'],
    nouveau: ['badge-wait', 'Nouveau'], 'en cours': ['badge-neutral', 'En cours'], traité: ['badge-ok', 'Traité'], refusé: ['badge-bad', 'Refusé'],
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
