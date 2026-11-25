import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { PageHero, Reveal, Cover, Spinner, Empty } from '../components/ui';
import { useApi, useSeo } from '../lib/utils';
import { PROJECT_CATEGORIES } from '../lib/data';

export function BeforeAfter({ seed, before, after }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const move = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref} className="ba"
      onMouseMove={(e) => e.buttons === 1 && move(e.clientX)} onMouseDown={(e) => move(e.clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      role="slider" aria-label="Comparer avant / après" aria-valuenow={Math.round(pos)} aria-valuemin={0} aria-valuemax={100} tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5)); if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5)); }}
    >
      <Cover seed={seed} image={after} />
      <div className="ba-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}><Cover seed={seed} image={before || after} variant={3} /></div>
      <div className="ba-handle" style={{ left: `${pos}%` }} />
      <span className="ba-tag" style={{ left: 16 }}>Avant</span>
      <span className="ba-tag" style={{ right: 16 }}>Après</span>
    </div>
  );
}

export function Portfolio() {
  const [cat, setCat] = useState('Tous');
  const { data, loading } = useApi('/projects');
  useSeo({ title: 'Portfolio', description: 'Réalisations PERFEKT AGENCY : branding, logos, publicité, vidéo, community management et supports de communication.' });
  const list = (data || []).filter((p) => cat === 'Tous' || p.category === cat);
  const clients = [...new Set((data || []).map((p) => p.client).filter(Boolean))];
  return (
    <>
      <PageHero eyebrow="Portfolio" title={<>Nos réalisations parlent <em className="gold-text">pour nous</em>.</>} crumbs={[{ label: 'Portfolio' }]}>
        Une sélection de projets menés pour des entreprises, institutions et ONG.
      </PageHero>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="segmented" style={{ marginBottom: 40 }}>
            {['Tous', ...PROJECT_CATEGORIES].map((c) => <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          {loading ? <Spinner /> : list.length === 0 ? <Empty title="Aucun projet dans cette catégorie" /> : (
            <div className="masonry">
              {list.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 60}>
                  <Link to={`/portfolio/${p.slug}`} className={`pcard ${p.cover_url ? 'natural' : ''}`}>
                    <Cover seed={p.slug} image={p.cover_url} label={p.cover_url ? undefined : p.title} />
                    <div className="pinfo"><span>{p.category}{p.year ? ` · ${p.year}` : ''}</span><h3>{p.title}</h3><div className="tiny" style={{ opacity: 0.8, marginTop: 4 }}>{p.client}</div></div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="section bg-soft">
        <div className="container">
          <div>
            <span className="eyebrow">Ils nous font confiance</span>
            <div className="row" style={{ marginTop: 20, gap: 10 }}>{clients.map((c) => <span key={c} className="logo-chip" style={{ height: 52, fontSize: '1.15rem' }}><i />{c}</span>)}</div>
          </div>
        </div>
      </section>
    </>
  );
}

export function ProjectDetail() {
  const { slug } = useParams();
  const { data: p, loading, error } = useApi(`/projects/${slug}`);
  const [zoom, setZoom] = useState(null);
  useSeo({ title: p?.title, description: p?.description });
  if (loading) return <Spinner />;
  if (error) return <div className="container section"><Empty title="Projet introuvable"><Link to="/portfolio" className="link">Retour au portfolio</Link></Empty></div>;
  return (
    <>
      <PageHero eyebrow={`${p.category} · ${p.year || ''}`} title={p.title} crumbs={[{ label: 'Portfolio', to: '/portfolio' }, { label: p.title }]}>{p.description}</PageHero>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {!p.cover_url && <Reveal style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: '16/8' }}><Cover seed={p.slug} /></Reveal>}
          <div className="grid g3" style={{ margin: '56px 0' }}>
            {[['Client', p.client], ['Catégorie', p.category], ['Année', p.year]].map(([k, v]) => (
              <div key={k} className="stat"><div className="muted small" style={{ fontWeight: 700 }}>{k}</div><div className="serif" style={{ fontSize: '1.8rem', marginTop: 6 }}>{v || '—'}</div></div>
            ))}
          </div>
          {(() => {
            const images = p.gallery?.length ? p.gallery : [p.cover_url].filter(Boolean);
            return images.length > 0 && (
              <div className="masonry" style={{ columns: images.length === 1 ? 1 : undefined, maxWidth: images.length === 1 ? 760 : undefined, margin: '0 auto' }}>
                {images.map((src, i) => (
                  <Reveal key={src} delay={(i % 3) * 60}>
                    <button type="button" className="pcard natural" style={{ border: 0, padding: 0, width: '100%', cursor: 'zoom-in' }} onClick={() => setZoom(src)} aria-label="Agrandir l’image">
                      <img src={src} alt={`${p.title} — visuel ${i + 1}`} loading="lazy" />
                    </button>
                  </Reveal>
                ))}
              </div>
            );
          })()}
          {p.before_url && (
            <>
              <h2 className="h2" style={{ margin: '56px 0 28px' }}>Avant / Après</h2>
              <BeforeAfter seed={p.slug} before={p.before_url} after={p.after_url || p.cover_url} />
            </>
          )}
          {zoom && (
            <div className="modal-back" onClick={() => setZoom(null)} role="dialog" aria-label="Image agrandie" style={{ cursor: 'zoom-out' }}>
              <img src={zoom} alt="" style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 16, boxShadow: 'var(--shadow-lg)' }} />
            </div>
          )}
          <div className="row between" style={{ marginTop: 56 }}>
            <Link to="/portfolio" className="link"><ArrowLeft /> Tous les projets</Link>
            <Link to={`/devis?service=${encodeURIComponent(p.category)}`} className="btn">Un projet similaire ? <ArrowRight className="arrow" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
