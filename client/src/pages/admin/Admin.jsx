import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Receipt, Ticket, Award, Star, MessageSquare, PenLine, FileQuestion, Mail, Newspaper, FolderKanban,
  Tags, Settings, Activity, Send, Wallet, GraduationCap, TrendingUp, Inbox, ExternalLink, Download,
} from 'lucide-react';
import Resource from './Resource';
import { Spinner, StatusBadge, Modal } from '../../components/ui';
import { api, openPdf } from '../../lib/api';
import { useAuth, useSite, useToast } from '../../lib/context';
import { useApi, useSeo, fcfa, date, dateTime } from '../../lib/utils';
import { BLOG_CATEGORIES, PROJECT_CATEGORIES } from '../../lib/data';

export function AdminLayout() {
  const { user } = useAuth();
  useSeo({ title: 'Administration', noindex: true });
  const groups = [
    ['Pilotage', [['/admin', LayoutDashboard, 'Tableau de bord', true]]],
    ['Academy', [['/admin/formations', BookOpen, 'Formations'], ['/admin/categories', Tags, 'Catégories'], ['/admin/exercices', PenLine, 'Exercices & projets'],
      ['/admin/attestations', Award, 'Attestations'], ['/admin/avis', Star, 'Avis'], ['/admin/commentaires', MessageSquare, 'Commentaires & forum']]],
    ['Ventes', [['/admin/paiements', Receipt, 'Paiements'], ['/admin/coupons', Ticket, 'Coupons']]],
    ['Agence', [['/admin/devis', FileQuestion, 'Demandes de devis'], ['/admin/messages', Inbox, 'Messages'], ['/admin/portfolio', FolderKanban, 'Portfolio'], ['/admin/blog', Newspaper, 'Blog'], ['/admin/newsletter', Mail, 'Newsletter']]],
    ...(user.role === 'admin' ? [['Système', [['/admin/utilisateurs', Users, 'Utilisateurs'], ['/admin/contenu', Settings, 'Contenu du site'], ['/admin/journal', Activity, 'Journal d’activité']]]] : []),
  ];
  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="dash-user"><img src="/img/logo-mark.png" alt="" style={{ height: 34 }} /><div><strong style={{ display: 'block' }}>Administration</strong><span className="tiny muted">{user.name}</span></div></div>
        <nav>
          {groups.map(([g, links]) => (
            <div key={g} style={{ display: 'contents' }}>
              <h5>{g}</h5>
              {links.map(([to, Icon, label, end]) => <NavLink key={to} to={to} end={end}><Icon />{label}</NavLink>)}
            </div>
          ))}
        </nav>
      </aside>
      <div className="dash-main"><Outlet /></div>
    </div>
  );
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const METHOD = { card: 'Carte', flooz: 'Flooz', mixx: 'Mixx by Yas', international: 'International' };

export function AdminDashboard() {
  const { data, loading } = useApi('/admin/stats');
  if (loading) return <Spinner />;
  const k = data.kpis;
  const maxRev = Math.max(1, ...data.monthly.map((m) => m.revenue));
  const maxTop = Math.max(1, ...data.top.map((t) => t.students));
  const kpis = [
    [Wallet, 'Chiffre d’affaires', fcfa(k.revenue)], [TrendingUp, 'Ce mois-ci', fcfa(k.revenue_month)], [GraduationCap, 'Étudiants', k.students],
    [BookOpen, 'Inscriptions', k.enrollments], [Award, 'Attestations', k.certificates], [Receipt, 'Ventes', k.sales],
    [FileQuestion, 'Devis à traiter', k.new_quotes], [Inbox, 'Messages non lus', k.unread_messages],
  ];
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Vue d’ensemble</span><h1>Tableau de bord</h1></div><Link to="/" className="btn btn-ghost btn-sm"><ExternalLink /> Voir le site</Link></div>
      <div className="grid g4" style={{ marginBottom: 24 }}>
        {kpis.map(([Icon, l, v]) => <div key={l} className="kpi"><div className="kl"><Icon />{l}</div><div className="kv" style={{ fontSize: String(v).length > 12 ? '1.4rem' : undefined }}>{v}</div></div>)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 24 }} id="admin-charts">
        <div className="card">
          <div className="row between"><h3>Revenus sur 12 mois</h3><span className="small muted">Inscriptions : {data.monthly.reduce((n, m) => n + m.enrollments, 0)}</span></div>
          <div className="bars" style={{ marginTop: 20 }}>
            {data.monthly.map((m) => (
              <div key={m.month} className="bar">
                <div style={{ height: `${(m.revenue / maxRev) * 100}%` }} data-v={fcfa(m.revenue)} />
                <span>{MONTHS[Number(m.month.slice(5)) - 1]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Moyens de paiement</h3>
          <div className="grid" style={{ gap: 14, marginTop: 18 }}>
            {data.methods.length === 0 && <p className="muted small">Aucune vente.</p>}
            {data.methods.map((m) => (
              <div key={m.method} className="hbar">
                <div className="row between small"><strong>{METHOD[m.method] || m.method}</strong><span className="muted">{m.n} · {fcfa(m.total)}</span></div>
                <div className="track"><div style={{ width: `${(m.total / Math.max(1, k.revenue)) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="grid g2" style={{ marginTop: 26, gap: 12 }}>
            <div><div className="tiny muted" style={{ fontWeight: 700 }}>Taux de complétion</div><strong style={{ fontSize: '1.5rem' }}>{k.completion_rate} %</strong></div>
            <div><div className="tiny muted" style={{ fontWeight: 700 }}>Abonnés newsletter</div><strong style={{ fontSize: '1.5rem' }}>{k.subscribers}</strong></div>
          </div>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Formations les plus suivies</h3>
          <div className="grid" style={{ gap: 14, marginTop: 18 }}>
            {data.top.map((t) => (
              <div key={t.title} className="hbar">
                <div className="row between small"><strong>{t.title}</strong><span className="muted">{t.students} · {fcfa(t.revenue)}</span></div>
                <div className="track"><div style={{ width: `${(t.students / maxTop) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="row between"><h3>Dernières commandes</h3><Link to="/admin/paiements" className="link small">Tout voir</Link></div>
          <div style={{ marginTop: 10 }}>
            {data.recentOrders.map((o) => (
              <div key={o.reference} className="row between small" style={{ padding: '10px 0', borderTop: '1px solid var(--line)', flexWrap: 'nowrap' }}>
                <div style={{ minWidth: 0 }}><strong>{o.name}</strong><div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.title}</div></div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}><strong>{fcfa(o.amount)}</strong><div><StatusBadge status={o.status} /></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between"><h3>Activité récente</h3><Link to="/admin/journal" className="link small">Journal complet</Link></div>
        <div className="grid g2" style={{ marginTop: 10, columnGap: 32, rowGap: 0 }}>
          {data.activity.map((a, i) => (
            <div key={i} className="row between small" style={{ padding: '9px 0', borderTop: '1px solid var(--line)' }}>
              <span><strong>{a.name || 'Visiteur'}</strong> · <span className="muted">{a.action}</span></span><span className="tiny muted">{dateTime(a.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const yesNo = (v) => <span className={`badge ${v ? 'badge-ok' : 'badge-neutral'}`}>{v ? 'Oui' : 'Non'}</span>;

export const CFG = {
  users: {
    res: 'users', title: 'Utilisateurs & étudiants', eyebrow: 'Système',
    columns: [
      { k: 'name', label: 'Nom', render: (r) => <><strong>{r.name}</strong><div className="tiny muted">{r.email}</div></> },
      { k: 'role', label: 'Rôle', render: (r) => <span className={`badge ${r.role === 'admin' ? 'badge-wait' : 'badge-neutral'}`}>{r.role}</span> },
      { k: 'phone', label: 'Téléphone' }, { k: 'courses', label: 'Formations' },
      { k: 'is_active', label: 'Actif', render: (r, { quick }) => <button className="btn btn-ghost btn-xs" onClick={() => quick(r, { is_active: !r.is_active })}>{r.is_active ? 'Actif' : 'Désactivé'}</button> },
      { k: 'created_at', label: 'Inscrit le', render: (r) => date(r.created_at) },
    ],
    fields: [
      { k: 'name', label: 'Nom complet', required: true }, { k: 'email', label: 'Email', type: 'email', required: true },
      { k: 'role', label: 'Rôle', type: 'select', options: [{ value: 'student', label: 'Étudiant' }, { value: 'instructor', label: 'Formateur' }, { value: 'admin', label: 'Administrateur' }], required: true },
      { k: 'phone', label: 'Téléphone' }, { k: 'country', label: 'Pays' }, { k: 'city', label: 'Ville' },
      { k: 'password', label: 'Mot de passe (laisser vide pour ne pas changer)', type: 'password', full: true },
      { k: 'is_active', label: 'Compte actif', type: 'bool' },
    ],
    defaults: { role: 'student', is_active: true },
  },
  categories: {
    res: 'categories', title: 'Catégories de formations', eyebrow: 'Academy',
    columns: [{ k: 'name', label: 'Nom' }, { k: 'slug', label: 'Slug' }, { k: 'description', label: 'Description' }],
    fields: [{ k: 'name', label: 'Nom', required: true }, { k: 'slug', label: 'Slug (URL)' }, { k: 'description', label: 'Description', type: 'textarea', full: true }],
  },
  orders: {
    res: 'orders', title: 'Paiements', eyebrow: 'Ventes', canCreate: false, canDelete: false,
    columns: [
      { k: 'reference', label: 'Référence', render: (r) => <strong>{r.reference}</strong> }, { k: 'user_name', label: 'Client' }, { k: 'course', label: 'Formation' },
      { k: 'method', label: 'Moyen', render: (r) => METHOD[r.method] || r.method }, { k: 'amount', label: 'Montant', render: (r) => <strong>{fcfa(r.amount)}</strong> },
      { k: 'coupon_code', label: 'Coupon' }, { k: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> }, { k: 'created_at', label: 'Date', render: (r) => dateTime(r.created_at) },
    ],
    fields: [{ k: 'status', label: 'Statut', type: 'select', options: [{ value: 'pending', label: 'En attente' }, { value: 'paid', label: 'Payée' }, { value: 'failed', label: 'Échouée' }, { value: 'refunded', label: 'Remboursée' }], full: true }],
    actions: (r) => <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Facture" onClick={() => openPdf(`/me/orders/${r.reference}/invoice`)}><Download size={15} /></button>,
  },
  coupons: {
    res: 'coupons', title: 'Coupons de réduction', eyebrow: 'Ventes',
    columns: [
      { k: 'code', label: 'Code', render: (r) => <strong>{r.code}</strong> }, { k: 'percent', label: 'Remise', render: (r) => `${r.percent} %` },
      { k: 'used', label: 'Utilisations', render: (r) => `${r.used}${r.max_uses ? ` / ${r.max_uses}` : ''}` }, { k: 'expires_at', label: 'Expire', render: (r) => (r.expires_at ? date(r.expires_at) : '—') },
      { k: 'active', label: 'Actif', render: (r) => yesNo(r.active) },
    ],
    fields: [
      { k: 'code', label: 'Code', required: true }, { k: 'percent', label: 'Remise (%)', type: 'number', required: true },
      { k: 'max_uses', label: 'Utilisations max.', type: 'number' }, { k: 'expires_at', label: 'Date d’expiration', type: 'date' }, { k: 'active', label: 'Actif', type: 'bool' },
    ],
    defaults: { active: true, percent: 10 },
  },
  certificates: {
    res: 'certificates', title: 'Attestations délivrées', eyebrow: 'Academy', canDelete: false,
    columns: [
      { k: 'number', label: 'Numéro', render: (r) => <Link to={`/verifier/${r.number}`} className="gold" style={{ fontWeight: 700 }}>{r.number}</Link> },
      { k: 'user_name', label: 'Titulaire' }, { k: 'course', label: 'Formation' }, { k: 'score', label: 'Score', render: (r) => `${r.score} %` },
      { k: 'issued_at', label: 'Délivrée', render: (r) => date(r.issued_at) },
      { k: 'revoked', label: 'Statut', render: (r, { quick }) => <button className={`badge ${r.revoked ? 'badge-bad' : 'badge-ok'}`} style={{ border: 0 }} onClick={() => window.confirm(r.revoked ? 'Réactiver ?' : 'Révoquer cette attestation ?') && quick(r, { revoked: !r.revoked })}>{r.revoked ? 'Révoquée' : 'Valide'}</button> },
    ],
    actions: (r) => <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="PDF" onClick={() => openPdf(`/me/certificates/${r.number}/pdf`)}><Download size={15} /></button>,
  },
  reviews: {
    res: 'reviews', title: 'Avis clients', eyebrow: 'Academy',
    columns: [{ k: 'user_name', label: 'Auteur' }, { k: 'course', label: 'Formation' }, { k: 'rating', label: 'Note', render: (r) => '★'.repeat(r.rating) },
      { k: 'comment', label: 'Commentaire' }, { k: 'approved', label: 'Publié', render: (r, { quick }) => <button className="btn btn-ghost btn-xs" onClick={() => quick(r, { approved: !r.approved })}>{r.approved ? 'Publié' : 'Masqué'}</button> }],
  },
  comments: {
    res: 'comments', title: 'Commentaires & forum', eyebrow: 'Academy',
    columns: [{ k: 'user_name', label: 'Auteur' }, { k: 'lesson', label: 'Leçon' }, { k: 'content', label: 'Message', render: (r) => <span>{r.is_question && <span className="badge badge-wait">Question</span>} {r.content}</span> },
      { k: 'created_at', label: 'Date', render: (r) => dateTime(r.created_at) },
      { k: 'approved', label: 'Visible', render: (r, { quick }) => <button className="btn btn-ghost btn-xs" onClick={() => quick(r, { approved: !r.approved })}>{r.approved ? 'Visible' : 'Masqué'}</button> }],
  },
  submissions: {
    res: 'submissions', title: 'Exercices & projets rendus', eyebrow: 'Academy', canDelete: false,
    columns: [{ k: 'user_name', label: 'Apprenant' }, { k: 'lesson', label: 'Leçon' }, { k: 'content', label: 'Travail', render: (r) => <span className="small" style={{ whiteSpace: 'pre-wrap' }}>{r.content.slice(0, 220)}</span> },
      { k: 'grade', label: 'Note', render: (r) => (r.grade != null ? <strong>{r.grade}/20</strong> : <span className="badge badge-wait">À corriger</span>) }, { k: 'created_at', label: 'Rendu', render: (r) => dateTime(r.created_at) }],
    fields: [{ k: 'grade', label: 'Note /20', type: 'number', required: true }, { k: 'feedback', label: 'Commentaire du formateur', type: 'textarea', full: true }],
  },
  quotes: {
    res: 'quotes', title: 'Demandes de devis', eyebrow: 'Agence',
    columns: [
      { k: 'name', label: 'Contact', render: (r) => <><strong>{r.name}</strong><div className="tiny muted">{r.email} {r.phone && `· ${r.phone}`}</div></> },
      { k: 'company', label: 'Organisation' }, { k: 'service', label: 'Service' }, { k: 'budget', label: 'Budget' },
      { k: 'message', label: 'Message', render: (r) => <span className="small">{r.message?.slice(0, 160)}</span> },
      { k: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> }, { k: 'created_at', label: 'Reçu', render: (r) => date(r.created_at) },
    ],
    fields: [{ k: 'status', label: 'Statut', type: 'select', options: ['nouveau', 'en cours', 'traité', 'refusé'], full: true }],
    actions: (r) => <a className="icon-btn" style={{ width: 34, height: 34 }} href={`mailto:${r.email}?subject=Votre demande de devis — PERFEKT AGENCY`} aria-label="Répondre"><Mail size={15} /></a>,
  },
  messages: {
    res: 'messages', title: 'Messages de contact', eyebrow: 'Agence', canCreate: false,
    columns: [
      { k: 'name', label: 'Contact', render: (r) => <><strong>{r.name}</strong><div className="tiny muted">{r.email}</div></> }, { k: 'subject', label: 'Sujet' },
      { k: 'message', label: 'Message', render: (r) => <span className="small">{r.message.slice(0, 200)}</span> }, { k: 'created_at', label: 'Reçu', render: (r) => dateTime(r.created_at) },
      { k: 'is_read', label: 'Lu', render: (r, { quick }) => <button className={`badge ${r.is_read ? 'badge-neutral' : 'badge-wait'}`} style={{ border: 0 }} onClick={() => quick(r, { is_read: !r.is_read })}>{r.is_read ? 'Lu' : 'Non lu'}</button> },
    ],
    actions: (r) => <a className="icon-btn" style={{ width: 34, height: 34 }} href={`mailto:${r.email}?subject=Re: ${r.subject || 'Votre message'}`} aria-label="Répondre"><Mail size={15} /></a>,
  },
  posts: {
    res: 'posts', title: 'Blog', eyebrow: 'Agence', large: true,
    columns: [{ k: 'title', label: 'Titre', render: (r) => <Link to={`/blog/${r.slug}`} style={{ fontWeight: 700 }}>{r.title}</Link> }, { k: 'category', label: 'Catégorie' },
      { k: 'published', label: 'Publié', render: (r) => yesNo(r.published) }, { k: 'created_at', label: 'Date', render: (r) => date(r.created_at) }],
    fields: [
      { k: 'title', label: 'Titre', required: true, full: true }, { k: 'slug', label: 'Slug (URL propre)', help: 'Généré automatiquement si vide' },
      { k: 'category', label: 'Catégorie', type: 'select', options: BLOG_CATEGORIES }, { k: 'excerpt', label: 'Résumé', type: 'textarea', rows: 2, full: true },
      { k: 'content', label: 'Contenu (Markdown simple : ## Titre, - liste, **gras**)', type: 'textarea', rows: 12, full: true },
      { k: 'cover_url', label: 'Image de couverture', type: 'upload', accept: 'image/*', full: true }, { k: 'author', label: 'Auteur' }, { k: 'read_minutes', label: 'Temps de lecture (min)', type: 'number' },
      { k: 'seo_title', label: 'Titre SEO', full: true }, { k: 'seo_description', label: 'Meta description SEO', type: 'textarea', rows: 2, full: true }, { k: 'published', label: 'Publié', type: 'bool' },
    ],
    defaults: { published: true, category: 'Articles', author: 'Équipe PERFEKT', read_minutes: 4 },
  },
  projects: {
    res: 'projects', title: 'Portfolio', eyebrow: 'Agence', large: true,
    columns: [{ k: 'title', label: 'Projet', render: (r) => <Link to={`/portfolio/${r.slug}`} style={{ fontWeight: 700 }}>{r.title}</Link> }, { k: 'category', label: 'Catégorie' },
      { k: 'client', label: 'Client' }, { k: 'year', label: 'Année' }, { k: 'featured', label: 'À la une', render: (r) => yesNo(r.featured) }],
    fields: [
      { k: 'title', label: 'Titre', required: true, full: true }, { k: 'category', label: 'Catégorie', type: 'select', options: PROJECT_CATEGORIES, required: true },
      { k: 'client', label: 'Client' }, { k: 'year', label: 'Année', type: 'number' }, { k: 'slug', label: 'Slug (URL)' },
      { k: 'description', label: 'Description', type: 'textarea', full: true },
      { k: 'cover_url', label: 'Image principale', type: 'upload', accept: 'image/*', full: true },
      { k: 'gallery', label: 'Galerie (une URL d’image par ligne — téléversez via le champ ci-dessus puis copiez l’adresse)', type: 'textarea', rows: 5, full: true },
      { k: 'before_url', label: 'Image « avant » (optionnel)', type: 'upload', accept: 'image/*', full: true }, { k: 'after_url', label: 'Image « après » (optionnel)', type: 'upload', accept: 'image/*', full: true },
      { k: 'featured', label: 'Mettre à la une', type: 'bool' },
    ],
  },
  newsletter: {
    res: 'newsletter', title: 'Newsletter', eyebrow: 'Agence',
    columns: [{ k: 'email', label: 'Email' }, { k: 'created_at', label: 'Inscrit le', render: (r) => date(r.created_at) }],
    fields: [{ k: 'email', label: 'Email', type: 'email', required: true, full: true }],
    headerActions: () => <NewsletterSend />,
  },
  activity: {
    res: 'activity', title: 'Journal d’activité', eyebrow: 'Sécurité', canDelete: false, canCreate: false,
    columns: [{ k: 'created_at', label: 'Date', render: (r) => dateTime(r.created_at) }, { k: 'user_name', label: 'Utilisateur', render: (r) => r.user_name || '—' },
      { k: 'action', label: 'Action', render: (r) => <code className="small">{r.action}</code> }, { k: 'ip', label: 'IP' },
      { k: 'meta', label: 'Détails', render: (r) => <span className="tiny muted">{JSON.stringify(r.meta)}</span> }],
  },
};

function NewsletterSend() {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ subject: '', body: '' });
  const toast = useToast();
  const send = async (e) => {
    e.preventDefault();
    try { const r = await api('/admin/newsletter/send', { method: 'POST', body: v }); toast(`Newsletter envoyée à ${r.sent} abonnés`); setOpen(false); setV({ subject: '', body: '' }); }
    catch (err) { toast(err.message, 'error'); }
  };
  return (
    <>
      <button className="btn btn-gold btn-sm" onClick={() => setOpen(true)}><Send /> Envoyer une newsletter</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle newsletter">
        <form onSubmit={send} className="grid" style={{ gap: 14 }}>
          <div className="field"><label htmlFor="ns">Objet</label><input id="ns" className="input" required value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} /></div>
          <div className="field"><label htmlFor="nb">Contenu</label><textarea id="nb" className="textarea" rows={8} required value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} /></div>
          <button className="btn"><Send /> Envoyer à tous les abonnés</button>
        </form>
      </Modal>
    </>
  );
}

export const AdminResource = ({ name }) => <Resource key={name} cfg={CFG[name]} />;

/* ---------------- Contenu du site ---------------- */
const SECTIONS = [
  { key: 'hero', label: 'Accueil — Hero', fields: [{ k: 'title', label: 'Titre (2 phrases séparées par un point)', type: 'textarea', rows: 2 }, { k: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 3 }] },
  { key: 'contact', label: 'Coordonnées', fields: [
    { k: 'phone', label: 'Téléphone' }, { k: 'phone2', label: 'Second téléphone' }, { k: 'whatsapp', label: 'WhatsApp (format international, chiffres uniquement)' }, { k: 'email', label: 'Email' },
    { k: 'address', label: 'Adresse' }, { k: 'hours', label: 'Horaires' }, { k: 'map_query', label: 'Adresse pour la carte Google' }, { k: 'messenger', label: 'Lien Messenger (m.me/…)' }] },
  { key: 'socials', label: 'Réseaux sociaux', fields: ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'].map((k) => ({ k, label: k[0].toUpperCase() + k.slice(1) })) },
];
const LISTS = [
  ['stats', 'Statistiques (accueil)', '[{"value":250,"suffix":"+","label":"Projets livrés"}]'],
  ['results', 'Résultats clients (tableau accueil)', '[{"client":"…","work":"…","metric":"+50 %","label":"…"}]'],
  ['testimonials', 'Témoignages', '[{"name":"…","role":"…","quote":"…"}]'],
  ['team', 'Équipe', '[{"name":"…","role":"…","photo":"/uploads/…"}]'],
  ['partners', 'Partenaires / clients (bandeau)', '["Nom 1","Nom 2"]'],
  ['home_faq', 'FAQ accueil', '[{"q":"Question ?","a":"Réponse."}]'],
];

export function SiteContent() {
  const site = useSite();
  const toast = useToast();
  const [drafts, setDrafts] = useState({});
  const save = async (key, value) => {
    try { await api(`/admin/settings/${key}`, { method: 'PUT', body: { value } }); toast('Contenu mis à jour'); site.reload(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Système</span><h1>Contenu du site</h1></div></div>
      <div className="grid" style={{ gap: 24 }}>
        {SECTIONS.map((s) => {
          const val = drafts[s.key] ?? site[s.key] ?? {};
          return (
            <form key={s.key} className="card" onSubmit={(e) => { e.preventDefault(); save(s.key, val); }}>
              <h3 style={{ marginBottom: 18 }}>{s.label}</h3>
              <div className="form-grid">
                {s.fields.map((f) => (
                  <div key={f.k} className={`field ${f.type === 'textarea' ? 'full' : ''}`}>
                    <label>{f.label}</label>
                    {f.type === 'textarea'
                      ? <textarea className="textarea" rows={f.rows} value={val[f.k] || ''} onChange={(e) => setDrafts({ ...drafts, [s.key]: { ...val, [f.k]: e.target.value } })} />
                      : <input className="input" value={val[f.k] || ''} onChange={(e) => setDrafts({ ...drafts, [s.key]: { ...val, [f.k]: e.target.value } })} />}
                  </div>
                ))}
              </div>
              <button className="btn btn-sm" style={{ marginTop: 16 }}>Enregistrer</button>
            </form>
          );
        })}
        {LISTS.map(([key, label, example]) => {
          const text = drafts[key] ?? JSON.stringify(site[key] ?? [], null, 2);
          return (
            <form key={key} className="card" onSubmit={(e) => {
              e.preventDefault();
              try { save(key, JSON.parse(text)); } catch { toast('Format JSON invalide', 'error'); }
            }}>
              <h3>{label}</h3>
              <p className="tiny muted">Format : <code>{example}</code></p>
              <textarea className="textarea" rows={8} style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.82rem' }} value={text} onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })} />
              <button className="btn btn-sm" style={{ marginTop: 12 }}>Enregistrer</button>
            </form>
          );
        })}
      </div>
    </>
  );
}
