import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CreditCard, Smartphone, Globe, Lock, CheckCircle2, Ticket, ArrowRight, Receipt, ShieldCheck, Loader2 } from 'lucide-react';
import { Spinner, Empty, Cover, Modal } from '../components/ui';
import { api, openPdf } from '../lib/api';
import { useAuth, useToast } from '../lib/context';
import { useApi, useSeo, fcfa, priceOf } from '../lib/utils';

const METHODS = [
  { id: 'flooz', label: 'Flooz', sub: 'Moov Money Togo', icon: Smartphone, color: '#0057a8' },
  { id: 'mixx', label: 'Mixx by Yas', sub: 'Mobile Money', icon: Smartphone, color: '#f2b705' },
  { id: 'card', label: 'Carte bancaire', sub: 'Visa · Mastercard', icon: CreditCard, color: '#0b0b0c' },
  { id: 'international', label: 'International', sub: 'Paiement depuis l’étranger', icon: Globe, color: '#2f7d55' },
];

export default function Checkout() {
  const { slug } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data: c, loading, error } = useApi(`/courses/${slug}`);
  const [method, setMethod] = useState('flooz');
  const [phone, setPhone] = useState(user?.phone || '');
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(null);
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  useSeo({ title: 'Paiement sécurisé', noindex: true });

  if (loading) return <Spinner />;
  if (error) return <div className="container section"><Empty title="Formation introuvable" /></div>;
  if (c.enrolled && !done) return (
    <div className="container section"><Empty icon={CheckCircle2} title="Vous êtes déjà inscrit à cette formation"><Link to={`/apprendre/${c.slug}`} className="btn" style={{ marginTop: 16 }}>Accéder au cours</Link></Empty></div>
  );

  const base = priceOf(c);
  const total = applied ? applied.amount : base;
  const mobile = method === 'flooz' || method === 'mixx';

  const applyCoupon = async () => {
    try { const r = await api('/payments/coupon', { method: 'POST', body: { code: coupon, courseId: c.id } }); setApplied(r); toast(`Code ${r.code} appliqué : -${r.percent} %`); }
    catch (e) { setApplied(null); toast(e.message, 'error'); }
  };
  const pay = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await api('/payments/checkout', { method: 'POST', body: { courseId: c.id, method, phone, coupon: applied?.code } });
      if (r.status === 'paid') setDone(r); else setOrder(r);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const confirm = async (cancel) => {
    setBusy(true);
    try {
      const r = await api(`/payments/${order.reference}/confirm`, { method: 'POST', body: { cancel } });
      if (r.status === 'paid') { setDone(order); setOrder(null); } else { setOrder(null); setErr('Paiement annulé. Vous pouvez réessayer.'); }
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };

  if (done) return (
    <section className="section"><div className="container center" style={{ maxWidth: 640 }}>
      <CheckCircle2 size={64} className="gold" style={{ margin: '0 auto 24px' }} />
      <span className="eyebrow">Paiement confirmé</span>
      <h1 className="h2" style={{ margin: '14px 0' }}>Bienvenue dans « {c.title} » !</h1>
      <p className="lead">Votre accès est activé. Un reçu vous a été envoyé par email et votre facture est disponible dans votre espace.</p>
      <div className="hero-ctas" style={{ justifyContent: 'center', marginTop: 28 }}>
        <Link to={`/apprendre/${c.slug}`} className="btn btn-gold">Commencer la formation <ArrowRight className="arrow" /></Link>
        <button className="btn btn-ghost" onClick={() => openPdf(`/me/orders/${done.reference}/invoice`).catch((e) => toast(e.message, 'error'))}><Receipt /> Facture / reçu</button>
      </div>
      <p className="tiny muted" style={{ marginTop: 20 }}>Référence : {done.reference}</p>
    </div></section>
  );

  return (
    <section className="section-sm">
      <div className="container" style={{ maxWidth: 1080 }}>
        <span className="eyebrow">Paiement sécurisé</span>
        <h1 className="h2" style={{ margin: '12px 0 36px' }}>Finaliser votre inscription</h1>
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 32, alignItems: 'start' }} id="checkout-grid">
          <form onSubmit={pay} className="card" style={{ padding: 'clamp(24px, 4vw, 40px)' }}>
            <h3 style={{ marginBottom: 18 }}>1. Moyen de paiement</h3>
            <div className="grid g2" style={{ gap: 12 }}>
              {METHODS.map((m) => (
                <label key={m.id} className={`quiz-opt ${method === m.id ? 'sel' : ''}`} style={{ alignItems: 'center' }}>
                  <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: m.color, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><m.icon size={18} /></span>
                  <span><strong style={{ display: 'block', fontSize: '.95rem' }}>{m.label}</strong><span className="tiny muted">{m.sub}</span></span>
                </label>
              ))}
            </div>
            {mobile && (
              <div className="field" style={{ marginTop: 22 }}>
                <label htmlFor="phone">Numéro {method === 'flooz' ? 'Flooz' : 'Mixx by Yas'} *</label>
                <input id="phone" className="input" required placeholder="+228 90 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <span className="tiny muted">Vous recevrez une demande de confirmation sur ce numéro.</span>
              </div>
            )}
            {!mobile && <div className="alert alert-info" style={{ marginTop: 22 }}>Vous serez redirigé vers la page de paiement sécurisée de notre prestataire (3-D Secure).</div>}

            <h3 style={{ margin: '32px 0 14px' }}>2. Code promo</h3>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <div className="search-box" style={{ flex: 1 }}><Ticket /><input className="input" placeholder="BIENVENUE10" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} /></div>
              <button type="button" className="btn btn-ghost" onClick={applyCoupon} disabled={!coupon}>Appliquer</button>
            </div>
            {err && <div className="alert alert-error" style={{ marginTop: 20 }}>{err}</div>}
            <button className="btn btn-gold btn-block" style={{ marginTop: 28, height: 56 }} disabled={busy}>
              <Lock /> Payer {fcfa(total)}
            </button>
            <p className="tiny muted center" style={{ marginTop: 14, marginBottom: 0 }}><ShieldCheck size={13} style={{ display: 'inline', verticalAlign: -2 }} /> Transactions chiffrées · Validation automatique · Facture immédiate</p>
          </form>

          <aside className="card card-soft" style={{ position: 'sticky', top: 'calc(var(--header-h) + 20px)' }}>
            <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9', marginBottom: 18 }}><Cover seed={c.slug} image={c.image_url} /></div>
            <strong style={{ fontSize: '1.1rem' }}>{c.title}</strong>
            <p className="muted small">{c.level} · {Number(c.duration_hours)} h · Attestation incluse</p>
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 18, paddingTop: 18, display: 'grid', gap: 10 }} className="small">
              <div className="row between"><span className="muted">Prix</span><span>{fcfa(c.price)}</span></div>
              {base < c.price && <div className="row between"><span className="muted">Promotion</span><span>-{fcfa(c.price - base)}</span></div>}
              {applied && <div className="row between"><span className="muted">Code {applied.code}</span><span>-{fcfa(base - applied.amount)}</span></div>}
              <div className="row between" style={{ fontSize: '1.2rem', fontWeight: 800, paddingTop: 10, borderTop: '1px solid var(--line)' }}><span>Total</span><span>{fcfa(total)}</span></div>
            </div>
          </aside>
        </div>
      </div>

      <Modal open={!!order} onClose={() => !busy && setOrder(null)} title="Confirmez votre paiement">
        {order && (
          <div className="center">
            <Loader2 size={42} className="gold" style={{ margin: '0 auto 18px', animation: 'spin 1.2s linear infinite' }} />
            <p className="lead" style={{ margin: '0 auto 10px' }}>{order.instructions}</p>
            <p className="tiny muted">Référence : {order.reference}</p>
            <div className="alert alert-info small" style={{ margin: '20px 0', textAlign: 'left' }}>
              Mode démonstration : aucun débit réel. En production, la validation est reçue automatiquement depuis le prestataire de paiement.
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-gold" disabled={busy} onClick={() => confirm(false)}>J’ai validé le paiement</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => confirm(true)}>Annuler</button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
