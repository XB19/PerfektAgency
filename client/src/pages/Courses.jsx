import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Scale, X, Check } from 'lucide-react';
import { PageHero, Reveal, Spinner, Empty, Stars } from '../components/ui';
import CourseCard from '../components/CourseCard';
import { useApi, useSeo, fcfa, priceOf } from '../lib/utils';
import { LEVELS } from '../lib/data';

export function Courses() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [debounced, setDebounced] = useState(q);
  const [compare, setCompare] = useState([]);
  const nav = useNavigate();
  const category = params.get('categorie') || '';
  const level = params.get('niveau') || '';
  const maxPrice = params.get('prix') || '';
  const maxHours = params.get('duree') || '';
  const sort = params.get('tri') || '';

  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  const qs = new URLSearchParams({ q: debounced, category, level, maxPrice, maxHours, sort }).toString();
  const { data, loading } = useApi(`/courses?${qs}`);
  const cats = useApi('/categories');
  useSeo({ title: 'Formations PERFEKT Academy', description: 'Catalogue des formations en ligne PERFEKT Academy : graphisme, branding, montage vidéo, community management, publicité digitale et IA créative. Attestation vérifiable.' });

  const set = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };
  const toggleCompare = (id) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  const activeCount = [category, level, maxPrice, maxHours].filter(Boolean).length;

  return (
    <>
      <PageHero eyebrow="PERFEKT Academy" title={<>Apprenez auprès des <em className="gold-text">créatifs qui font</em>.</>} crumbs={[{ label: 'Formations' }]}>
        Des formations pratiques, conçues par l’équipe PERFEKT AGENCY, pour passer de la théorie aux projets réels. À votre rythme, avec attestation vérifiable.
      </PageHero>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row" style={{ marginBottom: 32, gap: 12 }}>
            <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
              <Search />
              <input className="input" placeholder="Rechercher une formation, une compétence, un logiciel…" value={q} onChange={(e) => { setQ(e.target.value); set('q', e.target.value); }} aria-label="Recherche instantanée" />
            </div>
            <select className="select" style={{ width: 220 }} value={sort} onChange={(e) => set('tri', e.target.value)} aria-label="Trier">
              <option value="">Recommandées</option><option value="popular">Les plus suivies</option><option value="rating">Mieux notées</option>
              <option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option><option value="newest">Nouveautés</option>
            </select>
          </div>
          <div className="catalog">
            <aside className="filters" aria-label="Filtres">
              <div>
                <h4>Catégories</h4>
                <div className="filter-list">
                  <button className={!category ? 'active' : ''} onClick={() => set('categorie', '')}>Toutes</button>
                  {(cats.data || []).map((c) => (
                    <button key={c.slug} className={category === c.slug ? 'active' : ''} onClick={() => set('categorie', c.slug)}>{c.name}<span>{c.courses_count}</span></button>
                  ))}
                </div>
              </div>
              <div>
                <h4>Niveau</h4>
                <div className="filter-list">
                  {['', ...LEVELS].map((l) => <button key={l} className={level === l ? 'active' : ''} onClick={() => set('niveau', l)}>{l || 'Tous niveaux'}</button>)}
                </div>
              </div>
              <div>
                <h4>Prix maximum</h4>
                <input type="range" min="10000" max="100000" step="5000" value={maxPrice || 100000} onChange={(e) => set('prix', e.target.value === '100000' ? '' : e.target.value)} aria-label="Prix maximum" />
                <div className="small muted" style={{ fontWeight: 600 }}>{maxPrice ? `Jusqu’à ${fcfa(Number(maxPrice))}` : 'Tous les prix'}</div>
              </div>
              <div>
                <h4>Durée maximum</h4>
                <input type="range" min="5" max="40" step="1" value={maxHours || 40} onChange={(e) => set('duree', e.target.value === '40' ? '' : e.target.value)} aria-label="Durée maximum" />
                <div className="small muted" style={{ fontWeight: 600 }}>{maxHours ? `${maxHours} h ou moins` : 'Toutes durées'}</div>
              </div>
              {activeCount > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}><X size={16} /> Réinitialiser</button>}
            </aside>
            <div>
              <div className="row between small muted" style={{ marginBottom: 20, fontWeight: 600 }}>
                <span>{data ? `${data.length} formation${data.length > 1 ? 's' : ''}` : ''}</span>
                <span className="row" style={{ gap: 6 }}><Scale size={15} /> Cochez jusqu’à 3 formations pour les comparer</span>
              </div>
              {loading && !data ? <Spinner /> : data?.length === 0 ? (
                <Empty icon={Search} title="Aucune formation ne correspond">Essayez d’élargir vos filtres.</Empty>
              ) : (
                <div className="grid g2" style={{ gap: 28 }}>
                  {(data || []).map((c, i) => <Reveal key={c.id} delay={(i % 2) * 60}><CourseCard c={c} compare={compare.includes(c.id)} onCompare={toggleCompare} /></Reveal>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {compare.length > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 45 }} className="toast">
          <Scale /> {compare.length} formation{compare.length > 1 ? 's' : ''} sélectionnée{compare.length > 1 ? 's' : ''}
          <button className="btn btn-gold btn-xs" disabled={compare.length < 2} onClick={() => nav(`/formations/comparer?ids=${compare.join(',')}`)}>Comparer</button>
          <button className="btn btn-xs" style={{ background: 'transparent', color: '#fff' }} onClick={() => setCompare([])} aria-label="Vider"><X size={14} /></button>
        </div>
      )}
    </>
  );
}

export function Compare() {
  const [params] = useSearchParams();
  const ids = params.get('ids') || '';
  const all = useApi('/courses');
  const [sel, setSel] = useState(ids.split(',').map(Number).filter(Boolean));
  useSeo({ title: 'Comparer les formations' });
  const list = useMemo(() => (all.data || []).filter((c) => sel.includes(c.id)), [all.data, sel]);
  const rows = [
    ['Catégorie', (c) => c.category], ['Niveau', (c) => c.level], ['Durée', (c) => `${Number(c.duration_hours)} h`], ['Leçons', (c) => c.lessons_count],
    ['Note', (c) => <Stars value={c.rating} count={c.reviews_count} />], ['Apprenants', (c) => c.students_count],
    ['Prix', (c) => <strong>{fcfa(priceOf(c))}</strong>],
    ['Compétences', (c) => <ul className="check-list small">{(c.skills || []).map((s) => <li key={s}><Check />{s}</li>)}</ul>],
    ['Prérequis', (c) => <span className="small muted">{(c.prerequisites || []).join(' · ')}</span>],
  ];
  return (
    <>
      <PageHero eyebrow="Comparateur" title="Comparer les formations" crumbs={[{ label: 'Formations', to: '/formations' }, { label: 'Comparer' }]}>
        Sélectionnez jusqu’à 3 formations pour trouver celle qui vous correspond.
      </PageHero>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row" style={{ marginBottom: 28 }}>
            {(all.data || []).map((c) => (
              <button key={c.id} className={`pill ${sel.includes(c.id) ? 'pill-dark' : ''}`} style={{ cursor: 'pointer' }}
                onClick={() => setSel((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : s.length >= 3 ? s : [...s, c.id]))}>{c.title}</button>
            ))}
          </div>
          {list.length === 0 ? <Empty icon={Scale} title="Sélectionnez des formations à comparer" /> : (
            <div className="table-wrap">
              <table className="table compare-table">
                <thead><tr><th />{list.map((c) => <th key={c.id} style={{ textTransform: 'none', letterSpacing: 0, fontSize: '1rem', color: 'var(--ink)' }}>{c.title}</th>)}</tr></thead>
                <tbody>
                  {rows.map(([k, f]) => <tr key={k}><td style={{ fontWeight: 700 }}>{k}</td>{list.map((c) => <td key={c.id}>{f(c)}</td>)}</tr>)}
                  <tr><td />{list.map((c) => <td key={c.id}><Link to={`/formations/${c.slug}`} className="btn btn-sm">Voir la formation</Link></td>)}</tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
