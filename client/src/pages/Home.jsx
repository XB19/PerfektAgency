import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Trophy, Award, Star, PlayCircle, ClipboardCheck, QrCode, Smartphone, LineChart, MessagesSquare, Sparkles, ArrowUpRight,
} from 'lucide-react';
import { Reveal, Counter, Marquee, Faq, Cover } from '../components/ui';
import CourseCard from '../components/CourseCard';
import { useSite } from '../lib/context';
import { useApi, useSeo, date } from '../lib/utils';
import { SERVICES, AUDIENCES, VALUES } from '../lib/data';


const ACADEMY_FEATURES = [
  { icon: PlayCircle, t: 'Vidéo HD en streaming', d: 'Lecture fluide, vitesse réglable et reprise automatique là où vous vous êtes arrêté.' },
  { icon: ClipboardCheck, t: 'Quiz, exercices & projet', d: 'Validez chaque module et mettez vos compétences en pratique sur un projet réel.' },
  { icon: QrCode, t: 'Attestation vérifiable', d: 'Numéro unique, QR code de vérification et signature électronique PERFEKT.' },
  { icon: Smartphone, t: 'Mobile Money & carte', d: 'Payez en toute sécurité avec Flooz, Mixx by Yas, carte ou paiement international.' },
  { icon: LineChart, t: 'Progression suivie', d: 'Un tableau de bord clair : avancement, notes, historique et téléchargements.' },
  { icon: MessagesSquare, t: 'Forum & formateurs', d: 'Posez vos questions sous chaque leçon et échangez avec la communauté.' },
];

export default function Home() {
  const site = useSite();
  const [aud, setAud] = useState('all');
  const courses = useApi('/courses?featured=1');
  const posts = useApi('/posts?limit=3');
  const projects = useApi('/projects');
  useSeo({ description: 'PERFEKT AGENCY : branding, graphisme, vidéo, community management et PERFEKT Academy, l’académie en ligne des créatifs africains. Basée à Lomé, Togo.' });

  const services = useMemo(() => (aud === 'all' ? SERVICES.filter((x) => ['graphisme', 'branding', 'ux-ui-design', 'montage-video', 'community-management', 'design-interieur-3d'].includes(x.slug)) : SERVICES.filter((s) => s.aud.includes(aud)).slice(0, 6)), [aud]);
  const hero = site.hero || {};
  const results = site.results || [];
  const trainers = (site.team || []).filter((m) => m.photo);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <Reveal>
            <span className="pill pill-gold"><Sparkles size={14} /> Agence créative & académie digitale · Lomé, Togo</span>
            <h1 className="display">
              {hero.title ? hero.title.split('.').filter(Boolean).map((part, i) => (
                <span key={i} style={{ display: 'block' }}>{i === 1 ? <em className="gold-text">{part.trim()}.</em> : `${part.trim()}.`}</span>
              )) : <>Nous créons des marques qui inspirent. <em className="gold-text">Nous formons ceux qui les créent.</em></>}
            </h1>
            <p className="lead">{hero.subtitle}</p>
            <div className="hero-ctas">
              <Link to="/devis" className="btn">Demander un devis <ArrowRight className="arrow" /></Link>
              <Link to="/formations" className="btn btn-ghost">Découvrir l’Academy</Link>
            </div>
            <div className="hero-trust">
              {trainers.length > 0 && (
                <div className="faces">
                  {trainers.map((m) => <span key={m.name} style={{ background: `center / cover url(${m.photo})` }} title={m.name} />)}
                </div>
              )}
              <span><strong style={{ color: 'var(--ink)' }}>{(site.partners || []).length}+ marques</strong> nous font confiance · formations animées par nos experts</span>
            </div>
          </Reveal>
          <Reveal delay={150} className="hero-visual">
            <div className="hv-main">
                            <div className="hv-logo"><img src="/img/logo-emblem.png" alt="Emblème PERFEKT AGENCY" width="260" height="260" /></div>
            </div>
            <div className="achv a1">
              <span className="ai"><Trophy /></span>
              <span><small>Formation Pro</small><strong>Graphisme · 32 h · 16 séances</strong></span>
            </div>
            <div className="achv a2">
              <span className="ai"><Award /></span>
              <span><small>Certifiante</small><strong>Attestation vérifiable</strong></span>
            </div>
            <div className="achv a3 hide-sm">
              <span className="ai"><Star /></span>
              <span><small>Offert</small><strong>Accompagnement personnalisé</strong></span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- LOGOS ---------- */}
      <section className="section-sm" style={{ paddingTop: 20 }}>
        <div className="container">
          <p className="center muted small" style={{ marginBottom: 26, fontWeight: 600 }}>Entreprises, institutions et ONG qui nous font confiance</p>
        </div>
        <Marquee items={site.partners || ['Horizon', 'Atlas', 'Lumière', 'Espoir', 'Kafé Lomé', 'Bella']} />
        <div style={{ height: 14 }} />
        <Marquee items={[...(site.partners || [])].reverse()} reverse speed={46} />
      </section>

      {/* ---------- AGENCE ---------- */}
      <section className="section">
        <div className="container grid g2" style={{ gap: 'clamp(40px, 6vw, 96px)', alignItems: 'start' }}>
          <Reveal>
            <span className="eyebrow">L’agence</span>
            <h2 className="h2" style={{ marginTop: 14 }}>Le luxe discret d’une communication <em>parfaitement</em> maîtrisée.</h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="lead" style={{ marginTop: 0 }}>
              PERFEKT AGENCY accompagne entreprises, institutions, ONG, entrepreneurs et particuliers dans la conception de leur identité visuelle,
              leur communication digitale et le développement de leurs compétences.
            </p>
            <div className="grid g2" style={{ marginTop: 36, gap: 28 }}>
              {VALUES.map((v) => (
                <div key={v.t}>
                  <strong style={{ display: 'block', marginBottom: 6 }}><span className="gold">◆</span> {v.t}</strong>
                  <span className="muted small">{v.d}</span>
                </div>
              ))}
            </div>
            <Link to="/a-propos" className="link" style={{ marginTop: 32 }}>Découvrir notre histoire <ArrowRight /></Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- SERVICES (sélecteur de public) ---------- */}
      <section className="section bg-soft">
        <div className="container">
          <div className="section-head">
            <Reveal>
              <span className="eyebrow">Services</span>
              <h2 className="h2">Choisissez votre profil.<br />On s’occupe du reste.</h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="segmented" role="tablist" aria-label="Filtrer par public">
                {AUDIENCES.map((a) => <button key={a.id} role="tab" aria-selected={aud === a.id} className={aud === a.id ? 'active' : ''} onClick={() => setAud(a.id)}>{a.label}</button>)}
              </div>
            </Reveal>
          </div>
          <div className="grid g3">
            {services.map((s, i) => (
              <Reveal key={s.slug + aud} delay={i * 60}>
                <div className="scard">
                  <span className="icon-tile"><s.icon /></span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <ul>{s.aud.slice(0, 3).map((a) => <li key={a} className="pill">{AUDIENCES.find((x) => x.id === a)?.label}</li>)}</ul>
                  <Link to={`/devis?service=${encodeURIComponent(s.title)}`} className="link">Demander un devis <ArrowRight /></Link>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="center" style={{ marginTop: 44 }}><Link to="/services" className="btn btn-ghost">Voir les {SERVICES.length} services <ArrowRight className="arrow" /></Link></div>
        </div>
      </section>

      {/* ---------- RÉSULTATS / RÉALISATIONS ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <Reveal>
              <span className="eyebrow">Réalisations</span>
              <h2 className="h2">Des marques qui nous font confiance.</h2>
              <p className="lead">Quelques projets récents réalisés par nos équipes.</p>
            </Reveal>
            <Link to="/portfolio" className="link">Voir tout le portfolio <ArrowRight /></Link>
          </div>
          <Reveal>
            <table className="rtable">
              <thead><tr><th>Client</th><th>Ce que nous avons fait</th><th style={{ textAlign: 'right' }}>Livrable</th></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.client}>
                    <td>{r.client}</td>
                    <td className="muted">{r.work}</td>
                    <td className="metric">{r.metric}<div className="tiny muted" style={{ fontFamily: 'var(--font)', fontWeight: 600, marginTop: 6 }}>{r.label}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <div className="grid g3" style={{ marginTop: 56 }}>
            {(projects.data || []).filter((p) => p.featured).slice(0, 3).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <Link to={`/portfolio/${p.slug}`} className="pcard">
                  <Cover seed={p.slug} image={p.cover_url} />
                  <div className="pinfo"><span>{p.category}</span><h3>{p.title}</h3></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- STATISTIQUES ---------- */}
      <section className="section bg-ink">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>En chiffres</span>
              <h2 className="h2">Une référence africaine de la créativité.</h2>
            </div>
          </Reveal>
          <div className="grid g4" style={{ gap: 32 }}>
            {(site.stats || []).map((s, i) => (
              <Reveal key={s.label} delay={i * 80} className="stat">
                <div className="stat-value gold-text"><Counter value={Number(s.value)} suffix={s.suffix} /></div>
                <div className="stat-label">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FORMATIONS ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <Reveal>
              <span className="eyebrow">PERFEKT Academy</span>
              <h2 className="h2">Des formations qui transforment les talents en professionnels.</h2>
              <p className="lead">Graphisme, community management, montage vidéo et bureautique — formations certifiantes, en ligne et en présentiel.</p>
            </Reveal>
            <Link to="/formations" className="btn">Explorer le catalogue <ArrowRight className="arrow" /></Link>
          </div>
          <div className="grid g3">
            {(courses.data || []).slice(0, 3).map((c, i) => <Reveal key={c.id} delay={i * 80}><CourseCard c={c} /></Reveal>)}
            {courses.loading && [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 420 }} />)}
          </div>
          <div className="grid g3" style={{ marginTop: 'clamp(56px, 7vw, 96px)', gap: 0, borderTop: '1px solid var(--line)' }}>
            {ACADEMY_FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={(i % 3) * 80} style={{ padding: '36px 28px 36px 0', borderBottom: '1px solid var(--line)' }}>
                <f.icon size={26} className="gold" />
                <h3 className="h3" style={{ margin: '18px 0 8px' }}>{f.t}</h3>
                <p className="muted small" style={{ margin: 0 }}>{f.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TÉMOIGNAGES (ou formateurs si aucun témoignage) ---------- */}
      {(site.testimonials || []).length > 0 ? (
      <section className="section bg-soft">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Témoignages</span>
              <h2 className="h2">La parole à ceux qui nous ont fait confiance.</h2>
            </div>
          </Reveal>
          <div className="grid g2">
            {(site.testimonials || []).map((t, i) => (
              <Reveal key={t.name} delay={(i % 2) * 100}>
                <figure className="tcard" style={{ margin: 0 }}>
                  <div className="quote-mark">“</div>
                  <blockquote>{t.quote}</blockquote>
                  <figcaption className="who">
                    <span className="avatar" style={{ width: 46, height: 46 }}>{t.name.split(' ').map((x) => x[0]).join('')}</span>
                    <span><strong>{t.name}</strong><span>{t.role}</span></span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : trainers.length > 0 && (
      <section className="section bg-soft">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Nos formateurs</span>
              <h2 className="h2">Des experts qui pratiquent ce qu’ils enseignent.</h2>
            </div>
            <Link to="/a-propos" className="link">Découvrir l’équipe <ArrowRight /></Link>
          </Reveal>
          <div className="grid g3">
            {trainers.map((m, i) => (
              <Reveal key={m.name} delay={i * 80}>
                <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/4.6', marginBottom: 18 }}>
                  <img src={m.photo} alt={m.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                </div>
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>{m.name}</strong>
                <span className="muted small">{m.role}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ---------- ACTUALITÉS ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <Reveal>
              <span className="eyebrow">Journal</span>
              <h2 className="h2">Dernières actualités.</h2>
            </Reveal>
            <Link to="/blog" className="link">Tous les articles <ArrowRight /></Link>
          </div>
          <div className="grid g3">
            {(posts.data || []).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <Link to={`/blog/${p.slug}`} className="post-card">
                  <div className="cover"><Cover seed={p.slug} image={p.cover_url} label={p.category} /></div>
                  <div>
                    <div className="row tiny muted" style={{ fontWeight: 700, gap: 10 }}><span className="pill pill-gold">{p.category}</span>{date(p.created_at)} · {p.read_minutes} min</div>
                    <h3 style={{ marginTop: 14 }}>{p.title}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section bg-soft">
        <div className="container grid g2" style={{ gap: 'clamp(40px, 6vw, 96px)', alignItems: 'start' }}>
          <Reveal>
            <span className="eyebrow">FAQ</span>
            <h2 className="h2" style={{ marginTop: 14 }}>Questions fréquentes.</h2>
            <p className="lead" style={{ marginTop: 18 }}>Vous ne trouvez pas votre réponse ? Notre équipe vous répond rapidement.</p>
            <Link to="/contact" className="link" style={{ marginTop: 24 }}>Nous contacter <ArrowUpRight /></Link>
          </Reveal>
          <Reveal delay={100}><Faq items={site.home_faq || []} /></Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <img className="mark" src="/img/logo-mark.png" alt="" aria-hidden="true" />
            <span className="eyebrow" style={{ color: 'var(--gold)' }}>Passons à l’action</span>
            <h2 className="h2" style={{ marginTop: 16, maxWidth: 760 }}>Votre marque mérite une image parfaite.</h2>
            <p className="lead" style={{ marginTop: 18 }}>Parlez-nous de votre projet ou commencez dès aujourd’hui une formation PERFEKT Academy.</p>
            <div className="hero-ctas" style={{ marginTop: 34 }}>
              <Link to="/devis" className="btn btn-gold">Demander un devis <ArrowRight className="arrow" /></Link>
              <Link to="/formations" className="btn btn-ghost">Voir les formations</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
