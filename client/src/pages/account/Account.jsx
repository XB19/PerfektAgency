import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, Receipt, Heart, StickyNote, Bell, UserRound, PlayCircle, Clock, Download, ExternalLink,
  QrCode, Monitor, Trash2, Camera, ClipboardCheck, ArrowRight,
} from 'lucide-react';
import { Spinner, Empty, Cover, StatusBadge } from '../../components/ui';
import CourseCard from '../../components/CourseCard';
import { useAuth, useToast } from '../../lib/context';
import { api, openPdf } from '../../lib/api';
import { useApi, useSeo, fcfa, date, dateTime, initials, minutes } from '../../lib/utils';

export function AccountLayout() {
  const { user } = useAuth();
  useSeo({ title: 'Mon espace', noindex: true });
  const links = [
    ['/compte', LayoutDashboard, 'Tableau de bord', true], ['/compte/formations', BookOpen, 'Mes formations'], ['/compte/attestations', Award, 'Attestations'],
    ['/compte/achats', Receipt, 'Historique des achats'], ['/compte/favoris', Heart, 'Favoris'], ['/compte/notes', StickyNote, 'Mes notes'],
    ['/compte/notifications', Bell, 'Notifications'], ['/compte/profil', UserRound, 'Profil & sécurité'],
  ];
  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="dash-user">
          <span className="avatar" style={{ width: 46, height: 46 }}>{user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user.name)}</span>
          <div style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: '.95rem' }}>{user.name}</strong><span className="tiny muted">Apprenant PERFEKT</span></div>
        </div>
        <nav>{links.map(([to, Icon, label, end]) => <NavLink key={to} to={to} end={end}><Icon />{label}</NavLink>)}</nav>
      </aside>
      <div className="dash-main"><Outlet /></div>
    </div>
  );
}

function CourseProgressCard({ c }) {
  return (
    <div className="card card-hover" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ aspectRatio: '16/8' }}><Cover seed={c.slug} image={c.image_url} /></div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <span className="tiny muted" style={{ fontWeight: 700 }}>{c.category}</span>
        <strong style={{ fontSize: '1.05rem', lineHeight: 1.3 }}>{c.title}</strong>
        <div className="progress"><div style={{ width: `${c.percent}%` }} /></div>
        <div className="row between small"><span className="muted">{c.done}/{c.total} leçons</span><strong>{c.percent} %</strong></div>
        <Link to={`/apprendre/${c.slug}`} className="btn btn-sm" style={{ marginTop: 'auto' }}>
          {c.completed_at ? 'Revoir la formation' : c.percent > 0 ? 'Reprendre' : 'Commencer'} <PlayCircle />
        </Link>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useApi('/me/dashboard');
  if (loading) return <Spinner />;
  const current = data.courses.find((c) => !c.completed_at && c.percent > 0) || data.courses.find((c) => !c.completed_at);
  const kpis = [
    [BookOpen, 'Formations', data.courses.length], [Award, 'Attestations', data.certificates.length],
    [Clock, 'Temps d’apprentissage', minutes(data.learning_minutes)], [ClipboardCheck, 'Quiz réussis', data.quizzes.filter((q) => q.passed).length],
  ];
  return (
    <>
      <div className="dash-title">
        <div><span className="eyebrow">Mon espace</span><h1>Bonjour {user.name.split(' ')[0]} 👋</h1></div>
        <Link to="/formations" className="btn btn-ghost btn-sm">Explorer le catalogue</Link>
      </div>
      <div className="grid g4" style={{ marginBottom: 32 }}>
        {kpis.map(([Icon, l, v]) => <div key={l} className="kpi"><div className="kl"><Icon />{l}</div><div className="kv">{v}</div></div>)}
      </div>
      {current && (
        <div className="cta-band" style={{ padding: 'clamp(28px, 4vw, 44px)', marginBottom: 40 }}>
          <span className="eyebrow" style={{ color: 'var(--gold)' }}>Reprendre où vous en étiez</span>
          <h2 className="serif" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', margin: '12px 0 18px' }}>{current.title}</h2>
          <div className="progress" style={{ maxWidth: 480, background: '#2c2c2e' }}><div style={{ width: `${current.percent}%` }} /></div>
          <p className="small" style={{ color: '#a8a59e' }}>{current.percent} % terminé · {current.done}/{current.total} leçons</p>
          <Link to={`/apprendre/${current.slug}`} className="btn btn-gold" style={{ marginTop: 8 }}>Continuer <ArrowRight className="arrow" /></Link>
        </div>
      )}
      <h2 className="h3" style={{ marginBottom: 18 }}>Mes formations</h2>
      {data.courses.length === 0 ? (
        <Empty icon={BookOpen} title="Vous n’êtes inscrit à aucune formation"><Link to="/formations" className="btn btn-sm" style={{ marginTop: 14 }}>Découvrir les formations</Link></Empty>
      ) : <div className="grid g3">{data.courses.map((c) => <CourseProgressCard key={c.id} c={c} />)}</div>}
      {data.quizzes.length > 0 && (
        <>
          <h2 className="h3" style={{ margin: '40px 0 18px' }}>Mes dernières notes</h2>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Évaluation</th><th>Date</th><th>Score</th><th>Résultat</th></tr></thead>
            <tbody>{data.quizzes.slice(0, 8).map((q, i) => (
              <tr key={i}><td>{q.title}</td><td className="muted">{dateTime(q.created_at)}</td><td><strong>{q.score} %</strong></td>
                <td><span className={`badge ${q.passed ? 'badge-ok' : 'badge-bad'}`}>{q.passed ? 'Validé' : 'À repasser'}</span></td></tr>
            ))}</tbody>
          </table></div>
        </>
      )}
    </>
  );
}

export function MyCourses() {
  const { data, loading } = useApi('/me/dashboard');
  const [f, setF] = useState('all');
  if (loading) return <Spinner />;
  const list = data.courses.filter((c) => (f === 'all' ? true : f === 'done' ? c.completed_at : !c.completed_at));
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Historique des formations</span><h1>Mes formations</h1></div>
        <div className="segmented">{[['all', 'Toutes'], ['progress', 'En cours'], ['done', 'Terminées']].map(([k, l]) => <button key={k} className={f === k ? 'active' : ''} onClick={() => setF(k)}>{l}</button>)}</div>
      </div>
      {list.length === 0 ? <Empty icon={BookOpen} title="Aucune formation ici" /> : <div className="grid g3">{list.map((c) => <CourseProgressCard key={c.id} c={c} />)}</div>}
    </>
  );
}

export function Certificates() {
  const { data, loading } = useApi('/me/dashboard');
  const toast = useToast();
  if (loading) return <Spinner />;
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Certificats</span><h1>Mes attestations</h1></div></div>
      {data.certificates.length === 0 ? (
        <Empty icon={Award} title="Aucune attestation pour le moment">Terminez une formation et réussissez l’examen final pour obtenir votre attestation.</Empty>
      ) : (
        <div className="grid g2">
          {data.certificates.map((c) => (
            <div key={c.number} className="card">
              <div className="cert-prev" style={{ marginBottom: 20 }}>
                <img src="/img/logo-mark.png" alt="" style={{ width: 34, marginBottom: 10 }} />
                <div style={{ fontSize: '.6rem', letterSpacing: '.3em', color: '#a6831b', fontWeight: 800 }}>ATTESTATION DE RÉUSSITE</div>
                <div className="serif" style={{ fontSize: '1.4rem', margin: '6px 0' }}>{c.title}</div>
                <div style={{ fontSize: '.7rem', color: '#666' }}>Score {c.score} % · {date(c.issued_at)}</div>
                <QrCode size={26} style={{ position: 'absolute', right: '7%', bottom: '10%', color: '#111' }} />
              </div>
              <div className="row between">
                <div><strong className="small">N° {c.number}</strong><div className="tiny muted">Délivrée le {date(c.issued_at)}</div></div>
                <div className="row">
                  <Link to={`/verifier/${c.number}`} className="icon-btn" aria-label="Vérifier"><ExternalLink /></Link>
                  <button className="btn btn-sm" onClick={() => openPdf(`/me/certificates/${c.number}/pdf`, `attestation-${c.number}.pdf`).catch((e) => toast(e.message, 'error'))}><Download /> PDF</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function Orders() {
  const { data, loading } = useApi('/me/orders');
  const toast = useToast();
  if (loading) return <Spinner />;
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Paiements</span><h1>Historique des achats</h1></div></div>
      {data.length === 0 ? <Empty icon={Receipt} title="Aucun achat pour le moment" /> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Référence</th><th>Formation</th><th>Date</th><th>Moyen</th><th>Montant</th><th>Statut</th><th /></tr></thead>
          <tbody>{data.map((o) => (
            <tr key={o.id}>
              <td><strong>{o.reference}</strong></td><td><Link to={`/formations/${o.slug}`}>{o.title}</Link></td><td className="muted">{date(o.created_at)}</td>
              <td style={{ textTransform: 'capitalize' }}>{o.method}</td><td><strong>{fcfa(o.amount)}</strong></td><td><StatusBadge status={o.status} /></td>
              <td><button className="btn btn-ghost btn-xs" onClick={() => openPdf(`/me/orders/${o.reference}/invoice`).catch((e) => toast(e.message, 'error'))}><Receipt size={14} /> {o.status === 'paid' ? 'Facture' : 'Pro forma'}</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}

export function Favorites() {
  const { favorites } = useAuth();
  const { data, loading } = useApi(favorites.length ? `/courses?ids=${favorites.join(',')}` : null, [favorites.length]);
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Ma sélection</span><h1>Favoris</h1></div></div>
      {!favorites.length ? <Empty icon={Heart} title="Aucun favori">Cliquez sur ♡ sur une formation pour l’ajouter ici.</Empty>
        : loading ? <Spinner /> : <div className="grid g3">{(data || []).map((c) => <CourseCard key={c.id} c={c} />)}</div>}
    </>
  );
}

export function Notes() {
  const { data, loading } = useApi('/me/notes');
  if (loading) return <Spinner />;
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Carnet</span><h1>Mes notes</h1></div></div>
      {data.length === 0 ? <Empty icon={StickyNote} title="Aucune note">Prenez des notes directement sous chaque leçon pendant vos cours.</Empty> : (
        <div className="grid g2">{data.map((n) => (
          <Link key={n.lesson_id} to={`/apprendre/${n.slug}?lecon=${n.lesson_id}`} className="card card-hover">
            <span className="tiny muted" style={{ fontWeight: 700 }}>{n.course}</span>
            <h3 style={{ fontSize: '1.05rem', margin: '6px 0 10px' }}>{n.lesson}</h3>
            <p className="muted small" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{n.content.slice(0, 260)}{n.content.length > 260 && '…'}</p>
            <div className="tiny muted" style={{ marginTop: 12 }}>Modifiée le {dateTime(n.updated_at)}</div>
          </Link>
        ))}</div>
      )}
    </>
  );
}

export function Notifications() {
  const { data, loading, reload } = useApi('/me/notifications');
  if (loading) return <Spinner />;
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Alertes</span><h1>Notifications</h1></div>
        {data.some((n) => !n.is_read) && <button className="btn btn-ghost btn-sm" onClick={() => api('/me/notifications/read', { method: 'POST' }).then(reload)}>Tout marquer comme lu</button>}
      </div>
      {data.length === 0 ? <Empty icon={Bell} title="Aucune notification" /> : (
        <div className="card" style={{ padding: 0 }}>
          {data.map((n, i) => (
            <div key={n.id} style={{ padding: '18px 22px', borderTop: i ? '1px solid var(--line)' : 0, display: 'flex', gap: 14, background: n.is_read ? 'transparent' : 'var(--gold-soft)' }}>
              <Bell size={18} className="gold" style={{ marginTop: 3, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong>{n.title}</strong>{n.body && <div className="muted small">{n.body}</div>}
                <div className="tiny muted" style={{ marginTop: 4 }}>{dateTime(n.created_at)}</div>
              </div>
              {n.link && <Link to={n.link} className="link small">Voir</Link>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Redimensionne l'image côté navigateur (photo de profil légère)
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      resolve(c.toDataURL('image/jpeg', .85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [v, setV] = useState({ name: user.name, phone: user.phone || '', country: user.country || '', city: user.city || '', bio: user.bio || '' });
  const [pwd, setPwd] = useState({ current: '', next: '' });
  const sessions = useApi('/auth/sessions');
  const b = (k) => ({ id: k, value: v[k], onChange: (e) => setV({ ...v, [k]: e.target.value }) });

  const save = async (e) => {
    e.preventDefault();
    try { const r = await api('/auth/me', { method: 'PUT', body: v }); setUser(r.user); toast('Profil mis à jour'); } catch (err) { toast(err.message, 'error'); }
  };
  const avatar = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const data = await resizeImage(f); const r = await api('/auth/me', { method: 'PUT', body: { ...v, avatar_url: data } }); setUser(r.user); toast('Photo mise à jour'); }
    catch (err) { toast(err.message || 'Image invalide', 'error'); }
  };
  const changePwd = async (e) => {
    e.preventDefault();
    try { await api('/auth/password', { method: 'PUT', body: pwd }); setPwd({ current: '', next: '' }); toast('Mot de passe modifié'); sessions.reload(); }
    catch (err) { toast(err.message, 'error'); }
  };

  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Compte</span><h1>Profil & sécurité</h1></div></div>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={save}>
          <h3>Informations personnelles</h3>
          <div className="row" style={{ gap: 18, margin: '18px 0 24px' }}>
            <span className="avatar" style={{ width: 76, height: 76, fontSize: '1.3rem' }}>{user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user.name)}</span>
            <label className="btn btn-ghost btn-sm"><Camera /> Changer la photo<input type="file" accept="image/*" hidden onChange={avatar} /></label>
          </div>
          <div className="form-grid">
            <div className="field full"><label htmlFor="name">Nom complet</label><input className="input" required {...b('name')} /></div>
            <div className="field full"><label>Email</label><input className="input" value={user.email} disabled /></div>
            <div className="field"><label htmlFor="phone">Téléphone</label><input className="input" {...b('phone')} /></div>
            <div className="field"><label htmlFor="country">Pays</label><input className="input" {...b('country')} /></div>
            <div className="field"><label htmlFor="city">Ville</label><input className="input" {...b('city')} /></div>
            <div className="field full"><label htmlFor="bio">Bio</label><textarea className="textarea" style={{ minHeight: 90 }} {...b('bio')} /></div>
          </div>
          <button className="btn" style={{ marginTop: 18 }}>Enregistrer</button>
        </form>
        <div className="grid" style={{ gap: 24 }}>
          <form className="card" onSubmit={changePwd}>
            <h3>Mot de passe</h3>
            <div className="grid" style={{ gap: 14, marginTop: 16 }}>
              <div className="field"><label htmlFor="cur">Mot de passe actuel</label><input id="cur" type="password" className="input" required value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} autoComplete="current-password" /></div>
              <div className="field"><label htmlFor="nxt">Nouveau mot de passe</label><input id="nxt" type="password" minLength={8} className="input" required value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} autoComplete="new-password" /></div>
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 18 }}>Modifier le mot de passe</button>
          </form>
          <div className="card">
            <h3>Appareils connectés</h3>
            <p className="muted small">Pour protéger votre compte, le nombre d’appareils connectés simultanément est limité. Les plus anciens sont déconnectés automatiquement.</p>
            {(sessions.data || []).map((s) => (
              <div key={s.id} className="row" style={{ padding: '12px 0', borderTop: '1px solid var(--line)', flexWrap: 'nowrap' }}>
                <Monitor size={20} className="muted" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small" style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.device}</div>
                  <div className="tiny muted">{s.ip} · actif {dateTime(s.last_seen)}</div>
                </div>
                {s.current ? <span className="badge badge-ok">Cet appareil</span> : (
                  <button className="icon-btn" aria-label="Déconnecter" onClick={() => api(`/auth/sessions/${s.id}`, { method: 'DELETE' }).then(sessions.reload)}><Trash2 /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
