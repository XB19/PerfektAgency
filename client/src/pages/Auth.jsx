import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Award, PlayCircle, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/ui';
import { useAuth } from '../lib/context';
import { api } from '../lib/api';
import { useSeo } from '../lib/utils';

function Side() {
  return (
    <div className="auth-side">
      <Logo light />
      <div>
        <span className="eyebrow" style={{ color: 'var(--gold)' }}>PERFEKT Academy</span>
        <h2 className="h2" style={{ margin: '16px 0 28px', maxWidth: 460 }}>Votre talent mérite une formation d’exception.</h2>
        <ul className="check-list" style={{ color: '#c9c6bf' }}>
          <li><PlayCircle />Cours vidéo HD et progression sauvegardée</li>
          <li><Award />Attestations vérifiables par QR code</li>
          <li><ShieldCheck />Espace personnel sécurisé</li>
        </ul>
      </div>
      <img src="/img/logo-mark.png" alt="" style={{ position: 'absolute', right: 48, bottom: 48, width: 120, opacity: .9 }} />
      <span className="tiny" style={{ color: '#8b8882' }}>© PERFEKT AGENCY</span>
    </div>
  );
}

function PasswordInput({ id = 'password', value, onChange, autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input id={id} className="input" type={show ? 'text' : 'password'} required minLength={8} value={value} onChange={onChange} autoComplete={autoComplete} style={{ paddingRight: 48 }} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Masquer' : 'Afficher'} style={{ position: 'absolute', right: 6, top: 6, width: 38, height: 38, border: 0, background: 'none', color: 'var(--muted)' }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [v, setV] = useState({ email: '', password: '' });
  const [state, setState] = useState({});
  useSeo({ title: 'Connexion', noindex: true });
  const submit = async (e) => {
    e.preventDefault(); setState({ loading: true });
    try {
      const u = await login(v.email, v.password);
      nav(params.get('next') || (u.role === 'student' ? '/compte' : '/admin'), { replace: true });
    } catch (err) { setState({ error: err.message }); }
  };
  return (
    <div className="auth-wrap">
      <Side />
      <div className="auth-form">
        <form onSubmit={submit}>
          <div><h1 className="serif" style={{ fontSize: '2.6rem' }}>Bon retour parmi nous</h1><p className="muted">Connectez-vous à votre espace PERFEKT Academy.</p></div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" required autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></div>
          <div className="field">
            <div className="row between"><label htmlFor="password">Mot de passe</label><Link to="/mot-de-passe-oublie" className="small gold" style={{ fontWeight: 700 }}>Mot de passe oublié ?</Link></div>
            <PasswordInput value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
          </div>
          {state.error && <div className="alert alert-error">{state.error}</div>}
          <button className="btn btn-block" disabled={state.loading}>{state.loading ? 'Connexion…' : 'Se connecter'} <ArrowRight className="arrow" /></button>
          <p className="center small muted">Pas encore de compte ? <Link to={`/inscription${params.get('next') ? `?next=${params.get('next')}` : ''}`} className="gold" style={{ fontWeight: 700 }}>Créer un compte</Link></p>
        </form>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [v, setV] = useState({ name: '', email: '', phone: '', password: '' });
  const [accept, setAccept] = useState(false);
  const [state, setState] = useState({});
  useSeo({ title: 'Créer un compte', noindex: true });
  const b = (k) => ({ id: k, value: v[k], onChange: (e) => setV({ ...v, [k]: e.target.value }) });
  const submit = async (e) => {
    e.preventDefault(); setState({ loading: true });
    try { await register(v); nav(params.get('next') || '/compte', { replace: true }); }
    catch (err) { setState({ error: err.message }); }
  };
  return (
    <div className="auth-wrap">
      <Side />
      <div className="auth-form">
        <form onSubmit={submit}>
          <div><h1 className="serif" style={{ fontSize: '2.6rem' }}>Créer votre compte</h1><p className="muted">Rejoignez PERFEKT Academy en moins d’une minute.</p></div>
          <div className="field"><label htmlFor="name">Nom complet</label><input className="input" required autoComplete="name" {...b('name')} /></div>
          <div className="field"><label htmlFor="email">Email</label><input className="input" type="email" required autoComplete="email" {...b('email')} /></div>
          <div className="field"><label htmlFor="phone">Téléphone (optionnel)</label><input className="input" autoComplete="tel" placeholder="+228" {...b('phone')} /></div>
          <div className="field"><label htmlFor="password">Mot de passe (8 caractères min.)</label><PasswordInput autoComplete="new-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></div>
          <label className="check small"><input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} required /> J’accepte les <Link to="/cgv" className="gold">CGV</Link> et la <Link to="/confidentialite" className="gold">politique de confidentialité</Link></label>
          {state.error && <div className="alert alert-error">{state.error}</div>}
          <button className="btn btn-block" disabled={state.loading}>{state.loading ? 'Création…' : 'Créer mon compte'} <ArrowRight className="arrow" /></button>
          <p className="center small muted">Déjà inscrit ? <Link to="/connexion" className="gold" style={{ fontWeight: 700 }}>Se connecter</Link></p>
        </form>
      </div>
    </div>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({});
  useSeo({ title: 'Mot de passe oublié', noindex: true });
  const submit = async (e) => {
    e.preventDefault(); setState({ loading: true });
    try { const r = await api('/auth/forgot', { method: 'POST', body: { email } }); setState({ ok: true, dev: r.devResetUrl }); }
    catch (err) { setState({ error: err.message }); }
  };
  return (
    <div className="auth-wrap">
      <Side />
      <div className="auth-form">
        <form onSubmit={submit}>
          <div><h1 className="serif" style={{ fontSize: '2.6rem' }}>Mot de passe oublié</h1><p className="muted">Saisissez votre email : nous vous envoyons un lien de réinitialisation valable 1 heure.</p></div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {state.error && <div className="alert alert-error">{state.error}</div>}
          {state.ok && (
            <div className="alert alert-ok">
              Si un compte existe pour cet email, un lien vient d’être envoyé.
              {state.dev && <><br /><span className="tiny">(Développement) <a href={state.dev} style={{ textDecoration: 'underline' }}>Ouvrir le lien de réinitialisation</a></span></>}
            </div>
          )}
          <button className="btn btn-block" disabled={state.loading}>Envoyer le lien</button>
          <p className="center small"><Link to="/connexion" className="gold" style={{ fontWeight: 700 }}>← Retour à la connexion</Link></p>
        </form>
      </div>
    </div>
  );
}

export function Reset() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [state, setState] = useState({});
  useSeo({ title: 'Nouveau mot de passe', noindex: true });
  const submit = async (e) => {
    e.preventDefault(); setState({ loading: true });
    try { await api('/auth/reset', { method: 'POST', body: { token: params.get('token'), password } }); setState({ ok: true }); setTimeout(() => nav('/connexion'), 1800); }
    catch (err) { setState({ error: err.message }); }
  };
  return (
    <div className="auth-wrap">
      <Side />
      <div className="auth-form">
        <form onSubmit={submit}>
          <div><h1 className="serif" style={{ fontSize: '2.6rem' }}>Nouveau mot de passe</h1><p className="muted">Choisissez un mot de passe d’au moins 8 caractères.</p></div>
          <div className="field"><label htmlFor="password">Nouveau mot de passe</label><PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {state.error && <div className="alert alert-error">{state.error}</div>}
          {state.ok && <div className="alert alert-ok">Mot de passe mis à jour. Redirection…</div>}
          <button className="btn btn-block" disabled={state.loading}>Enregistrer</button>
        </form>
      </div>
    </div>
  );
}
