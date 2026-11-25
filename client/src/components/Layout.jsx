import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown, Menu, X, Sun, Moon, LayoutDashboard, LogOut, BookOpen, Award, Bell, Settings, MessageCircle, ArrowRight, Shield,
  Search, MapPin, Phone, Mail, ArrowUp,
} from 'lucide-react';
import { Logo } from './ui';
import { useAuth, useSite, useTheme, useToast } from '../lib/context';
import { SERVICES, POLES } from '../lib/data';
import { api } from '../lib/api';
import { initials } from '../lib/utils';
import { Facebook, Instagram, Linkedin, Youtube, Tiktok, WhatsApp, Messenger } from './BrandIcons';

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const nav = useNavigate();
  useEffect(() => { api('/me/notifications').then(setNotifs).catch(() => {}); }, [user]);
  useEffect(() => {
    const h = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const unread = notifs.filter((n) => !n.is_read).length;
  return (
    <div className="dropdown" ref={ref}>
      <button className="icon-btn" style={{ width: 'auto', padding: '0 4px', gap: 8, position: 'relative' }} onClick={() => setOpen(!open)} aria-label="Mon compte">
        <span className="avatar">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user.name)}</span>
        {unread > 0 && <span className="dot" />}
      </button>
      {open && (
        <div className="dropdown-menu" onClick={() => setOpen(false)}>
          <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
            <strong style={{ display: 'block' }}>{user.name}</strong>
            <span className="tiny muted">{user.email}</span>
          </div>
          {user.role !== 'student' && <Link to="/admin"><Shield />Administration</Link>}
          <Link to="/compte"><LayoutDashboard />Tableau de bord</Link>
          <Link to="/compte/formations"><BookOpen />Mes formations</Link>
          <Link to="/compte/attestations"><Award />Attestations</Link>
          <Link to="/compte/notifications"><Bell />Notifications {unread > 0 && <span className="badge badge-wait" style={{ marginLeft: 'auto' }}>{unread}</span>}</Link>
          <Link to="/compte/profil"><Settings />Profil</Link>
          <button onClick={async () => { await logout(); nav('/'); }}><LogOut />Déconnexion</button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  useEffect(() => setMobile(false), [loc.pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  return (
    <>
      <a href="#main" className="sr-only">Aller au contenu</a>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <Logo />
          <nav className="nav" aria-label="Navigation principale">
            <NavLink to="/a-propos">Agence</NavLink>
            <div className="nav-drop">
              <button aria-haspopup="true">Services <ChevronDown /></button>
              <div className="mega">
                {POLES.map((p) => {
                  const Icon = SERVICES.find((s) => s.pole === p.id).icon;
                  return (
                    <Link key={p.id} to={`/services#${p.id}`}>
                      <span className="mi"><Icon /></span>
                      <span><strong>{p.name}</strong><span>{p.desc}</span></span>
                    </Link>
                  );
                })}
                <Link to="/devis" style={{ gridColumn: '1 / -1', background: 'var(--bg-soft)', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>Besoin d’un projet sur mesure ?</strong><span>Recevez un devis personnalisé sous 48 h.</span></span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <NavLink to="/portfolio">Réalisations</NavLink>
            <NavLink to="/formations">Academy</NavLink>
            <NavLink to="/blog">Blog</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="header-actions">
            <Link to="/formations" className="icon-btn hide-md" aria-label="Rechercher une formation"><Search /></Link>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Changer de thème">{theme === 'dark' ? <Sun /> : <Moon />}</button>
            {user ? <UserMenu /> : <Link to="/connexion" className="btn btn-ghost btn-sm hide-md">Connexion</Link>}
            <Link to="/devis" className="btn btn-sm hide-md">Demander un devis</Link>
            <button className="icon-btn burger" onClick={() => setMobile(!mobile)} aria-label="Menu" aria-expanded={mobile}>{mobile ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>
      {mobile && (
        <div className="mobile-menu">
          <Link to="/">Accueil</Link>
          <Link to="/a-propos">Agence</Link>
          <Link to="/services">Services</Link>
          <Link to="/portfolio">Réalisations</Link>
          <Link to="/formations">PERFEKT Academy</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contact">Contact</Link>
          <div className="grid" style={{ marginTop: 28 }}>
            <Link to="/devis" className="btn btn-gold btn-block" style={{ fontFamily: 'var(--font)', fontSize: '1rem', border: 0 }}>Demander un devis</Link>
            {!user && <Link to="/connexion" className="btn btn-ghost btn-block" style={{ fontFamily: 'var(--font)', fontSize: '1rem' }}>Connexion</Link>}
            {user && <Link to="/compte" className="btn btn-ghost btn-block" style={{ fontFamily: 'var(--font)', fontSize: '1rem' }}>Mon espace</Link>}
          </div>
        </div>
      )}
    </>
  );
}

export function Footer() {
  const site = useSite();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const c = site.contact || {};
  const s = site.socials || {};
  const subscribe = async (e) => {
    e.preventDefault();
    try { await api('/newsletter', { method: 'POST', body: { email } }); setEmail(''); toast('Merci ! Vous êtes inscrit à la newsletter.'); }
    catch (err) { toast(err.message, 'error'); }
  };
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Logo light />
            <p style={{ margin: '22px 0 0', maxWidth: 340, lineHeight: 1.7 }}>
              Agence de créativité, de communication visuelle et de transformation digitale basée au Togo — et académie en ligne pour les talents créatifs d’Afrique.
            </p>
            <form className="newsletter" onSubmit={subscribe}>
              <input type="email" required placeholder="Votre email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email pour la newsletter" />
              <button className="btn btn-gold btn-sm" style={{ height: 46 }}>S’inscrire</button>
            </form>
          </div>
          <div>
            <h4>Services</h4>
            <ul>{POLES.map((p) => <li key={p.id}><Link to={`/services#${p.id}`}>{p.name}</Link></li>)}<li><Link to="/devis">Demander un devis</Link></li></ul>
          </div>
          <div>
            <h4>Academy</h4>
            <ul>
              <li><Link to="/formations">Catalogue</Link></li>
              <li><Link to="/formations/comparer">Comparer</Link></li>
              <li><Link to="/compte">Espace apprenant</Link></li>
              <li><Link to="/verifier">Vérifier une attestation</Link></li>
            </ul>
          </div>
          <div>
            <h4>Agence</h4>
            <ul>
              <li><Link to="/a-propos">À propos</Link></li>
              <li><Link to="/portfolio">Réalisations</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              {c.address && <li className="row" style={{ gap: 8 }}><MapPin size={15} />{c.address}</li>}
              {c.phone && <li><a href={`tel:${c.phone.replace(/\s/g, '')}`} className="row" style={{ gap: 8 }}><Phone size={15} />{c.phone}</a></li>}
              {c.email && <li><a href={`mailto:${c.email}`} className="row" style={{ gap: 8 }}><Mail size={15} />{c.email}</a></li>}
            </ul>
            <div className="socials" style={{ marginTop: 22 }}>
              {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a>}
              {s.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>}
              {s.linkedin && <a href={s.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a>}
              {s.tiktok && <a href={s.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"><Tiktok /></a>}
              {s.youtube && <a href={s.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube /></a>}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} PERFEKT AGENCY · Lomé, Togo. Tous droits réservés.</span>
          <span className="row" style={{ gap: 20 }}>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <Link to="/cgv">CGV</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FloatingChat() {
  const { contact = {} } = useSite();
  const [open, setOpen] = useState(false);
  if (!contact.whatsapp) return null;
  return (
    <div className="float-chat">
      {open && (
        <>
          <a className="fc-ms" href={contact.messenger || '#'} target="_blank" rel="noreferrer" aria-label="Discuter sur Messenger"><Messenger /></a>
          <a className="fc-wa" href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent('Bonjour PERFEKT AGENCY, je souhaite avoir des informations.')}`} target="_blank" rel="noreferrer" aria-label="Discuter sur WhatsApp"><WhatsApp /></a>
        </>
      )}
      <button className="fc-toggle" onClick={() => setOpen(!open)} aria-label="Nous écrire" aria-expanded={open}>{open ? <X /> : <MessageCircle />}</button>
    </div>
  );
}

// Bouton « retour en haut » : visible après défilement, avec anneau de progression de lecture
function ScrollTop({ raised }) {
  const [state, setState] = useState({ show: false, progress: 0 });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setState({ show: window.scrollY > 500, progress: max > 0 ? Math.min(1, window.scrollY / max) : 0 });
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  const C = 2 * Math.PI * 22;
  return (
    <button
      type="button"
      className={`scroll-top ${state.show ? 'visible' : ''} ${raised ? 'raised' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
      aria-label="Revenir en haut de la page"
      title="Revenir en haut"
      tabIndex={state.show ? 0 : -1}
    >
      <svg className="ring" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" />
        <circle cx="24" cy="24" r="22" className="bar" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - state.progress) }} />
      </svg>
      <ArrowUp />
    </button>
  );
}

export default function Layout({ bare }) {
  const { contact = {} } = useSite();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <>
      <Header />
      <main id="main"><Outlet /></main>
      {!bare && <Footer />}
      {!bare && <FloatingChat />}
      <ScrollTop raised={!bare && !!contact.whatsapp} />
    </>
  );
}
