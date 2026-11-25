import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Clock, BarChart3, PlayCircle, FileText, ClipboardCheck, Award, Heart, Check, ChevronDown, Lock, Users, Globe, Smartphone, Infinity as InfinityIcon, Eye, PenLine,
} from 'lucide-react';
import { Spinner, Empty, Stars, Faq, Cover } from '../components/ui';
import { useAuth, useToast } from '../lib/context';
import { api } from '../lib/api';
import { useApi, useSeo, fcfa, priceOf, date, minutes } from '../lib/utils';

const TYPE_ICON = { video: PlayCircle, pdf: FileText, text: FileText, exercise: PenLine };

function Curriculum({ modules, finalQuiz }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="curriculum">
      {modules.map((m, i) => (
        <div key={m.id} className={`cur-module ${open === i ? 'open' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>Module {i + 1} · {m.title}</span>
            <span className="row small muted" style={{ fontWeight: 600 }}>{m.lessons.length} leçons <ChevronDown /></span>
          </button>
          {open === i && (
            <div>
              {m.lessons.map((l) => {
                const Icon = TYPE_ICON[l.type] || PlayCircle;
                return (
                  <div key={l.id} className="cur-lesson">
                    <Icon /><span className="grow">{l.title}</span>
                    {l.is_preview ? <span className="pill pill-gold">Aperçu</span> : <Lock size={14} className="muted" />}
                    <span className="small muted">{minutes(l.duration_min)}</span>
                  </div>
                );
              })}
              {m.quiz && <div className="cur-lesson"><ClipboardCheck /><span className="grow">{m.quiz.title}</span><span className="small muted">Quiz</span></div>}
            </div>
          )}
        </div>
      ))}
      {finalQuiz && (
        <div className="cur-module"><div className="cur-lesson" style={{ background: 'var(--gold-soft)', borderTop: 0 }}>
          <Award className="gold" /><span className="grow" style={{ fontWeight: 700 }}>{finalQuiz.title}</span><span className="small">→ Attestation</span>
        </div></div>
      )}
    </div>
  );
}

function ReviewForm({ courseId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    try { await api(`/courses/${courseId}/reviews`, { method: 'POST', body: { rating, comment } }); toast('Merci pour votre avis !'); setComment(''); onDone(); }
    catch (err) { toast(err.message, 'error'); }
  };
  return (
    <form onSubmit={submit} className="card card-soft" style={{ marginBottom: 28 }}>
      <strong>Votre avis sur cette formation</strong>
      <div className="row" style={{ margin: '12px 0' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} style={{ background: 'none', border: 0, padding: 2, color: 'var(--gold)' }} aria-label={`${n} étoiles`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill={n <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
          </button>
        ))}
      </div>
      <textarea className="textarea" style={{ minHeight: 90 }} placeholder="Partagez votre expérience…" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-sm" style={{ marginTop: 12 }}>Publier mon avis</button>
    </form>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { data: c, loading, error, reload } = useApi(`/courses/${slug}`);
  const { user, toggleFavorite, favorites } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [tab, setTab] = useState('presentation');
  useSeo({
    title: c?.title, description: c?.subtitle,
    jsonLd: c && {
      '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: c.subtitle,
      provider: { '@type': 'Organization', name: 'PERFEKT Academy', sameAs: window.location.origin },
      offers: { '@type': 'Offer', price: priceOf(c), priceCurrency: 'XOF', category: 'Paid' },
      ...(c.reviews_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating, reviewCount: c.reviews_count } } : {}),
    },
  });
  if (loading) return <Spinner />;
  if (error) return <div className="container section"><Empty title="Formation introuvable"><Link to="/formations" className="link">Retour au catalogue</Link></Empty></div>;

  const promo = c.promo_price != null && c.promo_price < c.price;
  const fav = favorites.includes(c.id);
  const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
  const totalMin = c.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.duration_min, 0), 0);
  const buy = () => (user ? nav(`/paiement/${c.slug}`) : nav(`/connexion?next=/paiement/${c.slug}`));

  return (
    <>
      <section className="cd-hero">
        <div className="hero-glow" />
        <div className="container cd-layout">
          <div>
            <nav className="breadcrumbs" style={{ color: '#a8a59e' }}><Link to="/">Accueil</Link> / <Link to="/formations">Formations</Link> / <span>{c.category}</span></nav>
            <div className="row" style={{ marginTop: 28 }}><span className="pill pill-gold">{c.category}</span>{c.featured && <span className="pill" style={{ background: 'transparent', color: '#f5f3ee', borderColor: '#3a3a3c' }}>Populaire</span>}</div>
            <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 4.6vw, 3.8rem)', margin: '20px 0 18px' }}>{c.title}</h1>
            <p className="lead">{c.subtitle}</p>
            <div className="row" style={{ gap: 22, marginTop: 26, fontSize: '.92rem', fontWeight: 600 }}>
              <Stars value={c.rating} count={c.reviews_count} />
              <span className="row" style={{ gap: 6 }}><Users size={16} />{c.students_count} apprenants</span>
              <span className="row" style={{ gap: 6 }}><BarChart3 size={16} />{c.level}</span>
              <span className="row" style={{ gap: 6 }}><Clock size={16} />{Number(c.duration_hours)} h{c.sessions ? ` · ${c.sessions} séance${c.sessions > 1 ? 's' : ''} pratique${c.sessions > 1 ? 's' : ''}` : ''}</span>
            </div>
            <p className="muted small" style={{ marginTop: 20 }}>Par <strong style={{ color: '#f5f3ee' }}>{c.instructor_name}</strong> · Mise à jour {date(c.created_at, { month: 'long', year: 'numeric' })} · Français</p>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container cd-layout">
          <div style={{ minWidth: 0 }}>
            <div className="tabs" role="tablist">
              {[['presentation', 'Présentation'], ['programme', 'Programme'], ['prerequis', 'Prérequis'], ['avis', `Avis (${c.reviews_count})`], ['faq', 'FAQ']].map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>

            {tab === 'presentation' && (
              <div className="stack" style={{ display: 'grid', gap: 40 }}>
                <div className="prose" style={{ maxWidth: 'none' }}>{c.description?.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                <div className="card card-soft">
                  <h2 className="serif" style={{ fontSize: '1.9rem', marginBottom: 20 }}>Objectifs de la formation</h2>
                  <ul className="check-list grid g2" style={{ gap: 14 }}>{c.objectives.map((o) => <li key={o}><Check />{o}</li>)}</ul>
                </div>
                <div>
                  <h2 className="serif" style={{ fontSize: '1.9rem', marginBottom: 18 }}>Compétences acquises</h2>
                  <div className="row">{c.skills.map((s) => <span key={s} className="pill">{s}</span>)}</div>
                </div>
                {c.final_project && (
                  <div className="card" style={{ borderColor: 'var(--gold)' }}>
                    <h3 className="row" style={{ gap: 10 }}><Award className="gold" /> Projet final & attestation</h3>
                    <p className="muted" style={{ marginBottom: 0 }}>{c.final_project} Réussissez l’examen final (score minimum {c.pass_score} %) pour recevoir automatiquement votre attestation PERFEKT avec QR code de vérification.</p>
                  </div>
                )}
              </div>
            )}
            {tab === 'programme' && (
              <>
                <p className="muted" style={{ marginTop: 0 }}>{c.modules.length} modules · {lessonCount} leçons · {minutes(totalMin)} de contenu · quiz, exercices et examen final</p>
                <Curriculum modules={c.modules} finalQuiz={c.final_quiz} />
              </>
            )}
            {tab === 'prerequis' && <ul className="check-list">{c.prerequisites.map((p) => <li key={p}><Check />{p}</li>)}</ul>}
            {tab === 'avis' && (
              <>
                {c.enrolled && <ReviewForm courseId={c.id} onDone={reload} />}
                <div className="row" style={{ gap: 24, marginBottom: 32 }}>
                  <div className="stat-value" style={{ fontSize: '4rem' }}>{c.rating ? c.rating.toFixed(1) : '—'}</div>
                  <div><Stars value={c.rating} size={20} /><div className="muted small">{c.reviews_count} avis vérifiés</div></div>
                </div>
                {c.reviews.length === 0 ? <Empty title="Pas encore d’avis" /> : c.reviews.map((r) => (
                  <div key={r.id} style={{ padding: '22px 0', borderTop: '1px solid var(--line)' }}>
                    <div className="row between"><strong>{r.name}</strong><span className="tiny muted">{date(r.created_at)}</span></div>
                    <Stars value={r.rating} />
                    {r.comment && <p className="muted" style={{ margin: '8px 0 0' }}>{r.comment}</p>}
                  </div>
                ))}
              </>
            )}
            {tab === 'faq' && <Faq items={c.faq} />}
          </div>

          <aside className="buy-card">
            <div className={`video-prev ${c.preview_video_url ? "" : "poster"}`}>
              {c.preview_video_url ? (
                <video src={c.preview_video_url} controls controlsList="nodownload" preload="metadata" playsInline onContextMenu={(e) => e.preventDefault()} />
              ) : <Cover seed={c.slug} image={c.image_url} label={c.title} />}
            </div>
            <div className="bc-body">
              <div className="row" style={{ alignItems: 'baseline' }}>
                <span className="big-price">{fcfa(priceOf(c))}</span>
                {promo && <><s className="muted">{fcfa(c.price)}</s><span className="pill pill-gold">-{Math.round(100 - (c.promo_price / c.price) * 100)} %</span></>}
              </div>
              {c.enrolled ? (
                <Link to={`/apprendre/${c.slug}`} className="btn btn-gold btn-block" style={{ marginTop: 18 }}>Accéder à la formation</Link>
              ) : (
                <button className="btn btn-gold btn-block" style={{ marginTop: 18 }} onClick={buy}>Acheter la formation</button>
              )}
              <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={async () => {
                if (!user) return nav(`/connexion?next=/formations/${c.slug}`);
                toast((await toggleFavorite(c.id)) ? 'Ajouté aux favoris' : 'Retiré des favoris');
              }}><Heart fill={fav ? 'var(--gold)' : 'none'} color={fav ? 'var(--gold)' : 'currentColor'} /> {fav ? 'Dans vos favoris' : 'Ajouter aux favoris'}</button>
              <p className="tiny muted center" style={{ margin: '14px 0 20px' }}>Paiement sécurisé · Carte, Flooz, Mixx by Yas</p>
              <strong className="small">Cette formation comprend :</strong>
              <ul className="check-list small" style={{ marginTop: 14 }}>
                <li><PlayCircle />{lessonCount} leçons vidéo HD en streaming</li>
                <li><ClipboardCheck />Quiz, exercices et projet final</li>
                <li><FileText />Supports PDF{c.downloads_allowed ? ' téléchargeables' : ''}</li>
                <li><Award />Formation certifiante · attestation avec QR code</li>
                <li><Users />Accompagnement personnalisé et conseils offerts</li>
                <li><Smartphone />Accès mobile, tablette et ordinateur</li>
                <li><InfinityIcon />Accès illimité</li>
                <li><Globe />Forum & questions au formateur</li>
              </ul>
              <Link to={`/formations/comparer?ids=${c.id}`} className="link small" style={{ marginTop: 18 }}><Eye /> Comparer avec d’autres formations</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
