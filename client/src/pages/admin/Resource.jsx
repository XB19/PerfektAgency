import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Upload } from 'lucide-react';
import { Spinner, Empty, Modal } from '../../components/ui';
import { api } from '../../lib/api';
import { useToast } from '../../lib/context';
import { useApi } from '../../lib/utils';

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  return api('/admin/upload', { method: 'POST', body: fd });
}

export function Field({ f, value, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const common = { id: f.k, value: Array.isArray(value) ? value.join('\n') : value ?? '', onChange: (e) => onChange(e.target.value), required: f.required, placeholder: f.placeholder };
  let input;
  if (f.type === 'textarea') input = <textarea className="textarea" rows={f.rows || 5} {...common} />;
  else if (f.type === 'select') input = <select className="select" {...common}><option value="">—</option>{f.options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>;
  else if (f.type === 'bool') return <label className="check" style={{ gridColumn: f.full ? '1/-1' : undefined }}><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>;
  else if (f.type === 'upload') {
    input = (
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input className="input" {...common} />
        <label className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
          <Upload /> {busy ? '…' : 'Fichier'}
          <input type="file" hidden accept={f.accept} onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setBusy(true);
            try { const r = await uploadFile(file); onChange(r.url); toast('Fichier téléversé'); } catch (err) { toast(err.message, 'error'); }
            setBusy(false);
          }} />
        </label>
      </div>
    );
  } else input = <input className="input" type={f.type || 'text'} {...common} />;
  return (
    <div className={`field ${f.full ? 'full' : ''}`}>
      <label htmlFor={f.k}>{f.label}{f.required && ' *'}</label>
      {input}
      {f.help && <span className="tiny muted">{f.help}</span>}
    </div>
  );
}

/**
 * Gestion générique d'une ressource (liste, recherche, création, édition, suppression)
 * cfg = { res, title, eyebrow, columns: [{ k, label, render }], fields: [...], canCreate, canDelete, actions(row, reload) }
 */
export default function Resource({ cfg }) {
  const [q, setQ] = useState('');
  const { data, loading, reload } = useApi(`/admin/r/${cfg.res}?q=${encodeURIComponent(q)}`, [cfg.res]);
  const [edit, setEdit] = useState(null);
  const toast = useToast();

  const save = async (e) => {
    e.preventDefault();
    const body = { ...edit };
    try {
      if (edit.id) await api(`/admin/r/${cfg.res}/${edit.id}`, { method: 'PUT', body });
      else await api(`/admin/r/${cfg.res}`, { method: 'POST', body });
      toast('Enregistré'); setEdit(null); reload();
    } catch (err) { toast(err.message, 'error'); }
  };
  const del = async (row) => {
    if (!window.confirm('Supprimer définitivement cet élément ?')) return;
    try { await api(`/admin/r/${cfg.res}/${row.id}`, { method: 'DELETE' }); toast('Supprimé'); reload(); } catch (err) { toast(err.message, 'error'); }
  };
  const quick = async (row, patch) => {
    try { await api(`/admin/r/${cfg.res}/${row.id}`, { method: 'PUT', body: patch }); reload(); } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <>
      <div className="dash-title">
        <div><span className="eyebrow">{cfg.eyebrow || 'Gestion'}</span><h1>{cfg.title}</h1></div>
        <div className="row">
          {cfg.headerActions?.(reload)}
          {cfg.fields && cfg.canCreate !== false && <button className="btn btn-sm" onClick={() => setEdit({ ...(cfg.defaults || {}) })}><Plus /> Ajouter</button>}
        </div>
      </div>
      <div className="search-box" style={{ maxWidth: 380, marginBottom: 20 }}><Search /><input className="input input-sm" style={{ height: 44 }} placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {loading && !data ? <Spinner /> : !data?.length ? <Empty title="Aucun élément" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>{cfg.columns.map((c) => <th key={c.k}>{c.label}</th>)}<th style={{ width: 1 }} /></tr></thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  {cfg.columns.map((c) => <td key={c.k}>{c.render ? c.render(row, { quick, reload }) : String(row[c.k] ?? '—')}</td>)}
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
                      {cfg.actions?.(row, { quick, reload, setEdit })}
                      {cfg.fields && <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setEdit(row)} aria-label="Modifier"><Pencil size={15} /></button>}
                      {cfg.canDelete !== false && <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => del(row)} aria-label="Supprimer"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Modifier' : 'Ajouter'} large={cfg.large}>
        {edit && (
          <form onSubmit={save} className="form-grid">
            {cfg.fields.map((f) => <Field key={f.k} f={f} value={edit[f.k]} onChange={(val) => setEdit({ ...edit, [f.k]: val })} />)}
            <div className="full row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Annuler</button>
              <button className="btn">Enregistrer</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
