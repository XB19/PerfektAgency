import { useEffect, useState } from 'react';
import { api } from './api';

export const fcfa = (n) => (n == null ? '' : `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`);
export const priceOf = (c) => (c.promo_price != null && c.promo_price < c.price ? c.promo_price : c.price);
export const date = (d, opts = { day: '2-digit', month: 'long', year: 'numeric' }) => (d ? new Date(d).toLocaleDateString('fr-FR', opts) : '');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '');
export const initials = (name = '') => name.split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
export const minutes = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`);

// Chargement de données simple
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true }));
    api(path).then((data) => setState({ data, loading: false, error: null })).catch((error) => setState({ data: null, loading: false, error }));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [path, ...deps]);
  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })) };
}

// SEO : titre, description, Open Graph, URL canonique et JSON-LD par page
export function useSeo({ title, description, image, jsonLd, noindex } = {}) {
  useEffect(() => {
    const full = title ? `${title} — PERFEKT AGENCY` : 'PERFEKT AGENCY — Créativité, communication visuelle & PERFEKT Academy';
    document.title = full;
    const set = (sel, attr, val) => {
      let el = document.head.querySelector(sel);
      if (!el) {
        el = document.createElement(sel.startsWith('link') ? 'link' : 'meta');
        const m = sel.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/);
        if (m) el.setAttribute(m[1], m[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };
    if (description) {
      set('meta[name="description"]', 'content', description);
      set('meta[property="og:description"]', 'content', description);
    }
    set('meta[property="og:title"]', 'content', full);
    set('meta[property="og:url"]', 'content', window.location.href);
    if (image) set('meta[property="og:image"]', 'content', image);
    set('link[rel="canonical"]', 'href', window.location.origin + window.location.pathname);
    set('meta[name="robots"]', 'content', noindex ? 'noindex,nofollow' : 'index,follow');
    let script;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.page = '1';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, image, noindex, JSON.stringify(jsonLd || null)]); // eslint-disable-line react-hooks/exhaustive-deps
}
