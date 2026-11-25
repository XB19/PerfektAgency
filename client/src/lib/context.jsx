import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/* ---------------- Auth ---------------- */
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const loadFavs = useCallback(() => api('/me/favorites').then(setFavorites).catch(() => {}), []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setToken(null); setUser(null); });
    if (!getToken()) { setReady(true); return; }
    api('/auth/me').then((d) => { setUser(d.user); loadFavs(); }).catch(() => setToken(null)).finally(() => setReady(true));
  }, [loadFavs]);

  const login = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(d.token); setUser(d.user); loadFavs();
    return d.user;
  }, [loadFavs]);

  const register = useCallback(async (payload) => {
    const d = await api('/auth/register', { method: 'POST', body: payload });
    setToken(d.token); setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* déjà déconnecté */ }
    setToken(null); setUser(null); setFavorites([]);
  }, []);

  const toggleFavorite = useCallback(async (courseId) => {
    const on = favorites.includes(courseId);
    setFavorites((f) => (on ? f.filter((x) => x !== courseId) : [...f, courseId]));
    await api(`/me/favorites/${courseId}`, { method: on ? 'DELETE' : 'POST' });
    return !on;
  }, [favorites]);

  const value = useMemo(() => ({ user, setUser, ready, login, register, logout, favorites, toggleFavorite }), [user, ready, login, register, logout, favorites, toggleFavorite]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

/* ---------------- Contenu du site (settings) ---------------- */
const SiteCtx = createContext({});
export function SiteProvider({ children }) {
  const [site, setSite] = useState({});
  const reload = useCallback(() => api('/settings').then(setSite).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);
  return <SiteCtx.Provider value={{ ...site, reload }}>{children}</SiteCtx.Provider>;
}
export const useSite = () => useContext(SiteCtx);

/* ---------------- Toasts ---------------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Math.random();
    setItems((x) => [...x, { id, msg, type }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'error' ? <AlertCircle /> : <CheckCircle2 />} {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------------- Thème ---------------- */
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const toggle = () => {
    const t = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme', t);
    setTheme(t);
  };
  return [theme, toggle];
}
