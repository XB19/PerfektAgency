import { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ArrowRight, ShieldCheck, ShieldX, Search, CheckCircle2 } from 'lucide-react';
import { PageHero, Reveal, Spinner } from '../components/ui';
import { WhatsApp, Facebook, Instagram, Linkedin, Tiktok, Youtube } from '../components/BrandIcons';
import { useSite } from '../lib/context';
import { api } from '../lib/api';
import { useApi, useSeo, date } from '../lib/utils';
import { SERVICES } from '../lib/data';

function useForm(initial) {
  const [v, setV] = useState(initial);
  const bind = (k) => ({ value: v[k] ?? '', onChange: (e) => setV({ ...v, [k]: e.target.value }), name: k, id: k });
  return [v, bind, setV];
}

export function Contact() {
  const { contact: c = {}, socials: s = {} } = useSite();
  const [v, bind, setV] = useForm({ name: '', email: '', phone: '', subject: '', message: '' });
  const [state, setState] = useState({});
  useSeo({ title: 'Contact', description: 'Contactez PERFEKT AGENCY à Lomé : téléphone, WhatsApp, email, formulaire et réseaux sociaux.' });
  const submit = async (e) => {
    e.preventDefault(); setState({ loading: true });
    try { await api('/contact', { method: 'POST', body: v }); setState({ ok: true }); setV({ name: '', email: '', phone: '', subject: '', message: '' }); }
    catch (err) { setState({ error: err.message }); }
  };
  const items = [
    { icon: MapPin, k: 'Adresse', v: c.address },
    { icon: Phone, k: 'Téléphone / WhatsApp', v: c.phone, href: `tel:${(c.phone || '').replace(/\s/g, '')}` },
    ...(c.phone2 ? [{ icon: Phone, k: 'Autre numéro', v: c.phone2, href: `tel:${c.phone2.replace(/\s/g, '')}` }] : []),
    { icon: Mail, k: 'Email', v: c.email, href: `mailto:${c.email}` },
    { icon: Clock, k: 'Horaires', v: c.hours },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Parlons de votre <em className="gold-text">prochain projet</em>.</>} crumbs={[{ label: 'Contact' }]}>
        Une question, un projet, une formation ? Écrivez-nous — nous répondons sous 24 h ouvrées.
      </PageHero>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid g2" style={{ gap: 'clamp(32px, 5vw, 72px)', alignItems: 'start' }}>
          <Reveal>
            <div className="grid g2" style={{ gap: 16 }}>
              {items.map((it) => (
                <div key={it.k} className="card card-soft" style={{ padding: 24 }}>
                  <it.icon className="gold" size={22} />
                  <div className="muted tiny" style={{ fontWeight: 700, marginTop: 14, letterSpacing: '.1em', textTransform: 'uppercase' }}>{it.k}</div>
                  {it.href ? <a href={it.href} style={{ fontWeight: 700 }}>{it.v}</a> : <div style={{ fontWeight: 700 }}>{it.v}</div>}
                </div>
              ))}
            </div>
            {c.whatsapp && (
              <a className="btn btn-block" style={{ marginTop: 16, background: '#25d366', color: '#fff' }} href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer">
                <WhatsApp /> Écrire sur WhatsApp
              </a>
            )}
            <div className="socials" style={{ marginTop: 20 }}>
              {[[s.facebook, Facebook, 'Facebook'], [s.instagram, Instagram, 'Instagram'], [s.linkedin, Linkedin, 'LinkedIn'], [s.tiktok, Tiktok, 'TikTok'], [s.youtube, Youtube, 'YouTube']]
                .filter(([u]) => u).map(([u, I, l]) => <a key={l} href={u} target="_blank" rel="noreferrer" aria-label={l} className="icon-btn"><I /></a>)}
            </div>
            <div style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--line)', aspectRatio: '4/3' }}>
              <iframe
                title="Carte Google — PERFEKT AGENCY" width="100%" height="100%" style={{ border: 0, filter: 'grayscale(.4)' }} loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(c.map_query || 'Lomé, Togo')}&output=embed`}
              />
            </div>
          </Reveal>
          <Reveal delay={100} className="card" style={{ padding: 'clamp(28px, 4vw, 44px)' }}>
            <h2 className="serif" style={{ fontSize: '2.2rem', marginBottom: 8 }}>Envoyez-nous un message</h2>
            <p className="muted" style={{ marginTop: 0 }}>Tous les champs marqués * sont obligatoires.</p>
            <form onSubmit={submit} className="form-grid" style={{ marginTop: 24 }}>
              <div className="field"><label htmlFor="name">Nom complet *</label><input className="input" required {...bind('name')} /></div>
              <div className="field"><label htmlFor="email">Email *</label><input className="input" type="email" required {...bind('email')} /></div>
              <div className="field"><label htmlFor="phone">Téléphone</label><input className="input" {...bind('phone')} /></div>
              <div className="field"><label htmlFor="subject">Sujet</label><input className="input" {...bind('subject')} /></div>
              <div className="field full"><label htmlFor="message">Message *</label><textarea className="textarea" required {...bind('message')} /></div>
              {state.error && <div className="alert alert-error full">{state.error}</div>}
              {state.ok && <div className="alert alert-ok full">Merci ! Votre message a bien été envoyé.</div>}
              <button className="btn full" disabled={state.loading}>{state.loading ? 'Envoi…' : 'Envoyer le message'} <ArrowRight className="arrow" /></button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function Quote() {
  const [params] = useSearchParams();
  const [v, bind] = useForm({ name: '', email: '', phone: '', company: '', service: params.get('service') || '', budget: '', message: '' });
  const [state, setState] = useState({});
  useSeo({ title: 'Demander un devis', description: 'Demandez un devis gratuit à PERFEKT AGENCY : branding, logo, vidéo, community management, publicité digitale.' });
  const submit = async (e) => {
    e.preventDefault(); setState({ loading: true });
    try { await api('/quotes', { method: 'POST', body: v }); setState({ ok: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (err) { setState({ error: err.message }); }
  };
  if (state.ok) return (
    <section className="section"><div className="container center" style={{ maxWidth: 640 }}>
      <CheckCircle2 size={56} className="gold" style={{ margin: '0 auto 24px' }} />
      <h1 className="h2">Demande envoyée !</h1>
      <p className="lead">Merci pour votre confiance. Un membre de l’équipe PERFEKT vous recontacte sous 24 à 48 h ouvrées avec une proposition détaillée.</p>
      <div className="hero-ctas" style={{ justifyContent: 'center', marginTop: 28 }}><Link to="/portfolio" className="btn">Voir nos réalisations</Link><Link to="/" className="btn btn-ghost">Accueil</Link></div>
    </div></section>
  );
  return (
    <>
      <PageHero eyebrow="Devis gratuit" title={<>Recevez une proposition <em className="gold-text">sur mesure</em>.</>} crumbs={[{ label: 'Devis' }]}>
        Décrivez votre besoin en quelques lignes. Réponse sous 48 h, sans engagement.
      </PageHero>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <form onSubmit={submit} className="card form-grid" style={{ padding: 'clamp(28px, 4vw, 48px)' }}>
            <div className="field"><label htmlFor="name">Nom complet *</label><input className="input" required {...bind('name')} /></div>
            <div className="field"><label htmlFor="email">Email *</label><input className="input" type="email" required {...bind('email')} /></div>
            <div className="field"><label htmlFor="phone">Téléphone / WhatsApp</label><input className="input" {...bind('phone')} /></div>
            <div className="field"><label htmlFor="company">Entreprise / organisation</label><input className="input" {...bind('company')} /></div>
            <div className="field"><label htmlFor="service">Service souhaité</label>
              <select className="select" {...bind('service')}>
                <option value="">Choisir…</option>
                {[...new Set([v.service, ...SERVICES.map((s) => s.title)].filter(Boolean))].map((s) => <option key={s}>{s}</option>)}
                <option>Formation sur mesure pour mon équipe</option>
              </select>
            </div>
            <div className="field"><label htmlFor="budget">Budget estimé</label>
              <select className="select" {...bind('budget')}>
                <option value="">Choisir…</option>
                <option>Moins de 250 000 FCFA</option><option>250 000 – 750 000 FCFA</option><option>750 000 – 2 000 000 FCFA</option><option>Plus de 2 000 000 FCFA</option><option>À définir ensemble</option>
              </select>
            </div>
            <div className="field full"><label htmlFor="message">Votre projet</label><textarea className="textarea" placeholder="Objectifs, délais, supports attendus…" {...bind('message')} /></div>
            {state.error && <div className="alert alert-error full">{state.error}</div>}
            <button className="btn btn-gold full" disabled={state.loading}>{state.loading ? 'Envoi…' : 'Envoyer ma demande de devis'} <ArrowRight className="arrow" /></button>
          </form>
        </div>
      </section>
    </>
  );
}

export function Verify() {
  const { number } = useParams();
  const nav = useNavigate();
  const [input, setInput] = useState(number || '');
  const { data, loading, error } = useApi(number ? `/certificates/verify/${encodeURIComponent(number)}` : null);
  useSeo({ title: 'Vérifier une attestation', description: 'Vérifiez l’authenticité d’une attestation PERFEKT Academy grâce à son numéro unique ou son QR code.' });
  return (
    <section className="section">
      <div className="container center" style={{ maxWidth: 720 }}>
        <span className="eyebrow">PERFEKT Academy</span>
        <h1 className="h2" style={{ margin: '16px 0' }}>Vérification d’attestation</h1>
        <p className="lead">Saisissez le numéro figurant sur l’attestation ou scannez son QR code.</p>
        <form className="row" style={{ justifyContent: 'center', margin: '28px 0 40px' }} onSubmit={(e) => { e.preventDefault(); if (input.trim()) nav(`/verifier/${input.trim().toUpperCase()}`); }}>
          <div className="search-box" style={{ flex: 1, maxWidth: 420 }}><Search /><input className="input" placeholder="PA-2026-001-XXXXXX" value={input} onChange={(e) => setInput(e.target.value)} /></div>
          <button className="btn">Vérifier</button>
        </form>
        {number && loading && <Spinner />}
        {number && error && (
          <div className="card" style={{ borderColor: 'var(--danger)' }}><ShieldX size={44} color="var(--danger)" style={{ margin: '0 auto 12px' }} /><h3>Attestation introuvable</h3><p className="muted">{error.message}</p></div>
        )}
        {data && (
          <div className="card" style={{ textAlign: 'left', borderColor: data.valid ? 'var(--success)' : 'var(--danger)', padding: 36 }}>
            <div className="row" style={{ gap: 14, marginBottom: 20 }}>
              {data.valid ? <ShieldCheck size={44} color="var(--success)" /> : <ShieldX size={44} color="var(--danger)" />}
              <div><h3>{data.valid ? 'Attestation authentique' : 'Attestation révoquée'}</h3><span className="muted small">N° {data.number}</span></div>
            </div>
            <div className="grid g2" style={{ gap: 18 }}>
              {[['Titulaire', data.name], ['Formation', data.course], ['Score final', `${data.score} %`], ['Délivrée le', date(data.issued_at)]].map(([k, v]) => (
                <div key={k}><div className="tiny muted" style={{ fontWeight: 700 }}>{k}</div><strong>{v}</strong></div>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: 20, marginBottom: 0, wordBreak: 'break-all' }}>Signature électronique : {data.signature}</p>
          </div>
        )}
      </div>
    </section>
  );
}

const LEGAL = {
  'mentions-legales': ['Mentions légales', 'PERFEKT AGENCY — Lomé, Togo. Directeur de la publication : la Direction de PERFEKT AGENCY. Hébergement : à compléter lors du déploiement. Contenus, marques et logos sont la propriété exclusive de PERFEKT AGENCY ; toute reproduction sans autorisation est interdite.'],
  confidentialite: ['Politique de confidentialité', 'Nous collectons uniquement les données nécessaires à la gestion de votre compte, de vos formations, de vos paiements et de vos demandes. Elles ne sont jamais revendues. Vous pouvez demander l’accès, la rectification ou la suppression de vos données en nous écrivant. Les mots de passe sont chiffrés et les paiements traités par des prestataires sécurisés.'],
  cgv: ['Conditions générales de vente', 'L’achat d’une formation donne un accès personnel et non cessible à son contenu. Le partage de compte est interdit et limité techniquement en nombre d’appareils. Les attestations sont délivrées après réussite de l’examen final. Les prestations d’agence font l’objet d’un devis préalable accepté.'],
};
export function Legal({ page }) {
  const [title, body] = LEGAL[page];
  useSeo({ title });
  return (
    <>
      <PageHero eyebrow="Informations" title={title} crumbs={[{ label: title }]} />
      <section className="section" style={{ paddingTop: 0 }}><div className="container prose"><p>{body}</p><p className="muted small">Document à faire valider par un conseil juridique avant mise en ligne.</p></div></section>
    </>
  );
}

export function NotFound() {
  useSeo({ title: 'Page introuvable', noindex: true });
  return (
    <section className="section"><div className="container center">
      <div className="display gold-text">404</div>
      <h1 className="h2" style={{ margin: '12px 0' }}>Cette page n’existe pas.</h1>
      <p className="lead">Le lien est peut-être erroné ou la page a été déplacée.</p>
      <Link to="/" className="btn" style={{ marginTop: 24 }}>Retour à l’accueil</Link>
    </div></section>
  );
}
