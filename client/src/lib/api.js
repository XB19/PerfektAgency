const TOKEN_KEY = 'perfekt_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(path, { method = 'GET', body, raw } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, {
    method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (raw) {
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur');
    return res;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized(data.error);
    const err = new Error(data.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Ouvre un PDF protégé (facture, attestation, support) dans un nouvel onglet
export async function openPdf(path, download) {
  const win = download ? null : window.open('', '_blank');
  try {
    const res = await api(path, { raw: true });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (download) {
      const a = document.createElement('a');
      a.href = url; a.download = download; a.click();
    } else if (win) win.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    win?.close();
    throw e;
  }
}
