import { Link, useNavigate } from 'react-router-dom';
import { Heart, Clock, BarChart3, PlayCircle } from 'lucide-react';
import { Cover, Stars } from './ui';
import { fcfa, priceOf } from '../lib/utils';
import { useAuth, useToast } from '../lib/context';

export default function CourseCard({ c, compare, onCompare }) {
  const { user, favorites, toggleFavorite } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const fav = favorites.includes(c.id);
  const promo = c.promo_price != null && c.promo_price < c.price;

  const onFav = async (e) => {
    e.preventDefault();
    if (!user) return nav('/connexion?next=/formations');
    const on = await toggleFavorite(c.id);
    toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
  };

  return (
    <Link to={`/formations/${c.slug}`} className="ccard">
      <div className="cover">
        <Cover seed={c.slug} image={c.image_url} sub={c.category} />
        {c.category && <span className="pill">{c.category}</span>}
        <button className={`fav ${fav ? 'on' : ''}`} onClick={onFav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}><Heart /></button>
      </div>
      <div className="body">
        <div className="meta">
          <span><BarChart3 />{c.level}</span>
          <span><Clock />{Number(c.duration_hours)} h</span>
          {c.lessons_count != null && <span><PlayCircle />{c.lessons_count} leçons</span>}
        </div>
        <h3>{c.title}</h3>
        <p>{c.subtitle}</p>
        <div style={{ marginTop: 12 }}>
          {c.reviews_count > 0 ? <Stars value={c.rating} count={c.reviews_count} /> : <span className="pill pill-gold">Nouveau{c.sessions ? ` · ${c.sessions} séance${c.sessions > 1 ? 's' : ''}` : ''}</span>}
        </div>
        <div className="foot">
          <div className="price">{fcfa(priceOf(c))}{promo && <s>{fcfa(c.price)}</s>}</div>
          {onCompare ? (
            <label className="check tiny" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={!!compare} onChange={(e) => { e.stopPropagation(); onCompare(c.id); }} onClick={(e) => e.stopPropagation()} /> Comparer
            </label>
          ) : promo ? <span className="pill pill-gold">Promo</span> : null}
        </div>
      </div>
    </Link>
  );
}
