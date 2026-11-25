import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Search, ArrowRight } from 'lucide-react';
import { PageHero, Reveal, Cover, Spinner, Empty } from '../components/ui';
import { useApi, useSeo, date } from '../lib/utils';
import { BLOG_CATEGORIES } from '../lib/data';

export function Blog() {
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const { data, loading } = useApi(`/posts?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}`);
  useSeo({ title: 'Blog', description: 'Articles, actualités, tutoriels, conseils et SEO par les experts de PERFEKT AGENCY.' });
  const [first, ...rest] = data || [];
  return (
    <>
      <PageHero eyebrow="Journal" title={<>Idées, conseils & <em className="gold-text">inspirations</em>.</>} crumbs={[{ label: 'Blog' }]}>
        Articles, actualités, tutoriels et conseils pour faire grandir votre marque et vos compétences.
      </PageHero>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row between" style={{ marginBottom: 44 }}>
            <div className="segmented">
              {['', ...BLOG_CATEGORIES].map((c) => <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c || 'Tous'}</button>)}
            </div>
            <div className="search-box" style={{ width: 300, maxWidth: '100%' }}><Search /><input className="input" placeholder="Rechercher un article" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          </div>
          {loading && !data ? <Spinner /> : !first ? <Empty title="Aucun article trouvé" /> : (
            <>
              <Reveal>
                <Link to={`/blog/${first.slug}`} className="post-card grid g2" style={{ alignItems: 'center', gap: 48, marginBottom: 72 }}>
                  <div className="cover"><Cover seed={first.slug} image={first.cover_url} label={first.category} /></div>
                  <div>
                    <div className="row tiny muted" style={{ fontWeight: 700 }}><span className="pill pill-gold">{first.category}</span>{date(first.created_at)} · {first.read_minutes} min de lecture</div>
                    <h3 className="serif" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', margin: '18px 0 14px', lineHeight: 1.1 }}>{first.title}</h3>
                    <p className="lead">{first.excerpt}</p>
                    <span className="link" style={{ marginTop: 12 }}>Lire l’article <ArrowRight /></span>
                  </div>
                </Link>
              </Reveal>
              <div className="grid g3" style={{ rowGap: 56 }}>
                {rest.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 70}>
                    <Link to={`/blog/${p.slug}`} className="post-card">
                      <div className="cover"><Cover seed={p.slug} image={p.cover_url} label={p.category} /></div>
                      <div>
                        <div className="row tiny muted" style={{ fontWeight: 700 }}><span className="pill pill-gold">{p.category}</span>{date(p.created_at)}</div>
                        <h3 style={{ marginTop: 14 }}>{p.title}</h3>
                        <p className="muted small" style={{ marginBottom: 0 }}>{p.excerpt}</p>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

// Rendu Markdown minimal et sûr (titres, listes, paragraphes, gras)
export function Markdown({ text = '' }) {
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
  const out = [];
  let para = [], list = [];
  const flush = () => {
    if (para.length) { out.push(<p key={out.length}>{inline(para.join(' '))}</p>); para = []; }
    if (list.length) { out.push(<ul key={out.length}>{list.map((l, j) => <li key={j}>{inline(l)}</li>)}</ul>); list = []; }
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith('## ')) { flush(); out.push(<h2 key={out.length}>{line.slice(3)}</h2>); }
    else if (/^!\[[^\]]*\]\([^)]+\)$/.test(line)) {
      flush();
      const [, alt, src] = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (/^(\/|https:\/\/)/.test(src)) out.push(<img key={out.length} src={src} alt={alt} loading="lazy" />);
    }
    else if (line.startsWith('- ')) { if (para.length) flush(); list.push(line.slice(2)); }
    else { if (list.length) flush(); para.push(line); }
  }
  flush();
  return out;
}

export function Post() {
  const { slug } = useParams();
  const { data: p, loading, error } = useApi(`/posts/${slug}`);
  useSeo({
    title: p?.seo_title || p?.title, description: p?.seo_description || p?.excerpt,
    jsonLd: p && { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, datePublished: p.created_at, author: { '@type': 'Organization', name: p.author || 'PERFEKT AGENCY' }, description: p.excerpt },
  });
  if (loading) return <Spinner />;
  if (error) return <div className="container section"><Empty title="Article introuvable"><Link to="/blog" className="link">Retour au blog</Link></Empty></div>;
  return (
    <article>
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 900 }}>
          <nav className="breadcrumbs"><Link to="/">Accueil</Link> / <Link to="/blog">Blog</Link> / <span>{p.category}</span></nav>
          <div className="row tiny muted" style={{ fontWeight: 700, marginTop: 28 }}><span className="pill pill-gold">{p.category}</span>{date(p.created_at)} · {p.read_minutes} min · {p.author}</div>
          <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', margin: '20px 0' }}>{p.title}</h1>
          <p className="lead">{p.excerpt}</p>
        </div>
      </section>
      {!p.cover_url && (
        <div className="container" style={{ maxWidth: 1100 }}>
          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: '16/7' }}><Cover seed={p.slug} /></div>
        </div>
      )}
      {p.cover_url && (
        <div className="container" style={{ maxWidth: 760 }}>
          <img src={p.cover_url} alt={p.title} style={{ width: '100%', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }} />
        </div>
      )}
      <section className="section-sm">
        <div className="container prose" style={{ maxWidth: 760 }}>
          <Markdown text={p.content} />
          <Link to="/blog" className="link" style={{ marginTop: 32 }}><ArrowLeft /> Tous les articles</Link>
        </div>
      </section>
      {p.related?.length > 0 && (
        <section className="section bg-soft">
          <div className="container">
            <h2 className="h2" style={{ marginBottom: 36 }}>À lire aussi</h2>
            <div className="grid g3">
              {p.related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="post-card">
                  <div className="cover"><Cover seed={r.slug} image={r.cover_url} label={r.category} /></div>
                  <h3>{r.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
