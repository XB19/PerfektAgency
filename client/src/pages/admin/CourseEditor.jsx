import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, ArrowLeft, Save, ChevronUp, ChevronDown, ClipboardCheck, Pencil } from 'lucide-react';
import { Spinner, Empty, Modal } from '../../components/ui';
import { Field } from './Resource';
import { api } from '../../lib/api';
import { useToast } from '../../lib/context';
import { useApi, fcfa } from '../../lib/utils';
import { LEVELS } from '../../lib/data';

export function AdminCourses() {
  const { data, loading } = useApi('/admin/courses');
  const nav = useNavigate();
  const toast = useToast();
  const create = async () => {
    const title = window.prompt('Titre de la nouvelle formation');
    if (!title) return;
    try { const r = await api('/admin/courses', { method: 'POST', body: { title, published: false } }); nav(`/admin/formations/${r.id}`); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <div className="dash-title"><div><span className="eyebrow">Academy</span><h1>Formations</h1></div><button className="btn btn-sm" onClick={create}><Plus /> Nouvelle formation</button></div>
      {loading ? <Spinner /> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Formation</th><th>Catégorie</th><th>Niveau</th><th>Prix</th><th>Leçons</th><th>Étudiants</th><th>Statut</th><th /></tr></thead>
          <tbody>{data.map((c) => (
            <tr key={c.id}>
              <td><Link to={`/admin/formations/${c.id}`} style={{ fontWeight: 700 }}>{c.title}</Link>{c.featured && <span className="badge badge-wait" style={{ marginLeft: 8 }}>À la une</span>}</td>
              <td>{c.category || '—'}</td><td>{c.level}</td>
              <td>{fcfa(c.promo_price ?? c.price)}{c.promo_price != null && <div className="tiny muted"><s>{fcfa(c.price)}</s></div>}</td>
              <td>{c.lessons}</td><td>{c.students}</td>
              <td><span className={`badge ${c.published ? 'badge-ok' : 'badge-neutral'}`}>{c.published ? 'Publiée' : 'Brouillon'}</span></td>
              <td><Link to={`/admin/formations/${c.id}`} className="btn btn-ghost btn-xs"><Pencil size={13} /> Éditer</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}

const listToText = (a) => (a || []).join('\n');
const textToList = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
const faqToText = (a) => (a || []).map((f) => `${f.q}\n${f.a}`).join('\n\n');
const textToFaq = (t) => t.split(/\n\s*\n/).map((b) => { const [q, ...a] = b.trim().split('\n'); return { q, a: a.join(' ') }; }).filter((f) => f.q && f.a);

function InfoTab({ course, cats, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState(() => ({
    ...course, objectives: listToText(course.objectives), prerequisites: listToText(course.prerequisites), skills: listToText(course.skills), faq: faqToText(course.faq),
  }));
  const set = (k) => (val) => setV((x) => ({ ...x, [k]: val }));
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(`/admin/courses/${course.id}`, { method: 'PUT', body: {
        ...v, objectives: textToList(v.objectives), prerequisites: textToList(v.prerequisites), skills: textToList(v.skills), faq: textToFaq(v.faq),
        price: Number(v.price) || 0, promo_price: v.promo_price === '' || v.promo_price == null ? null : Number(v.promo_price), pass_score: Number(v.pass_score) || 70,
      } });
      toast('Formation enregistrée'); onSaved();
    } catch (err) { toast(err.message, 'error'); }
  };
  const F = (f) => <Field key={f.k} f={f} value={v[f.k]} onChange={set(f.k)} />;
  return (
    <form onSubmit={save} className="card form-grid">
      {F({ k: 'title', label: 'Titre', required: true, full: true })}
      {F({ k: 'subtitle', label: 'Accroche', full: true })}
      {F({ k: 'slug', label: 'Slug (URL)' })}
      {F({ k: 'category_id', label: 'Catégorie', type: 'select', options: cats.map((c) => ({ value: c.id, label: c.name })) })}
      {F({ k: 'level', label: 'Niveau', type: 'select', options: LEVELS })}
      {F({ k: 'duration_hours', label: 'Durée (heures)', type: 'number' })}
      {F({ k: 'sessions', label: 'Nombre de séances pratiques', type: 'number' })}
      {F({ k: 'price', label: 'Prix (FCFA)', type: 'number', required: true })}
      {F({ k: 'promo_price', label: 'Prix promotionnel (FCFA)', type: 'number', help: 'Laisser vide si pas de promotion' })}
      {F({ k: 'instructor_name', label: 'Formateur' })}
      {F({ k: 'pass_score', label: 'Score minimum examen final (%)', type: 'number' })}
      {F({ k: 'description', label: 'Présentation', type: 'textarea', rows: 6, full: true })}
      {F({ k: 'objectives', label: 'Objectifs (un par ligne)', type: 'textarea', rows: 4 })}
      {F({ k: 'skills', label: 'Compétences acquises (une par ligne)', type: 'textarea', rows: 4 })}
      {F({ k: 'prerequisites', label: 'Prérequis (un par ligne)', type: 'textarea', rows: 3 })}
      {F({ k: 'final_project', label: 'Projet final', type: 'textarea', rows: 3 })}
      {F({ k: 'faq', label: 'FAQ (question sur une ligne, réponse dessous, ligne vide entre deux)', type: 'textarea', rows: 6, full: true })}
      {F({ k: 'image_url', label: 'Image de couverture', type: 'upload', accept: 'image/*', full: true })}
      {F({ k: 'preview_video_url', label: 'Vidéo d’aperçu publique (URL)', full: true })}
      {F({ k: 'downloads_allowed', label: 'Autoriser le téléchargement des documents', type: 'bool' })}
      {F({ k: 'featured', label: 'Mettre à la une', type: 'bool' })}
      {F({ k: 'published', label: 'Publiée (visible dans le catalogue)', type: 'bool' })}
      <div className="full"><button className="btn"><Save /> Enregistrer</button></div>
    </form>
  );
}

const LESSON_FIELDS = [
  { k: 'title', label: 'Titre', required: true, full: true },
  { k: 'type', label: 'Type', type: 'select', options: [{ value: 'video', label: 'Vidéo' }, { value: 'pdf', label: 'Document PDF' }, { value: 'text', label: 'Texte' }, { value: 'exercise', label: 'Exercice / TP / projet' }], required: true },
  { k: 'duration_min', label: 'Durée (min)', type: 'number' },
  { k: 'video_url', label: 'Vidéo (fichier MP4 ou URL)', type: 'upload', accept: 'video/*', full: true, help: 'Les vidéos téléversées restent privées et sont diffusées uniquement en streaming protégé.' },
  { k: 'file_url', label: 'Document PDF', type: 'upload', accept: 'application/pdf', full: true, help: 'Valeur « support » = PDF généré automatiquement à partir du contenu.' },
  { k: 'content', label: 'Contenu / consignes', type: 'textarea', rows: 5, full: true },
  { k: 'is_preview', label: 'Leçon d’aperçu gratuite', type: 'bool' },
];

function ProgramTab({ course, reload }) {
  const toast = useToast();
  const [lesson, setLesson] = useState(null);
  const call = async (method, path, body) => { try { await api(path, { method, body }); reload(); } catch (e) { toast(e.message, 'error'); } };
  const addModule = () => { const t = window.prompt('Titre du module'); if (t) call('POST', '/admin/sub/modules', { course_id: course.id, title: t, position: course.modules.length }); };
  const saveLesson = async (e) => {
    e.preventDefault();
    const { id, ...body } = lesson;
    await call(id ? 'PUT' : 'POST', id ? `/admin/sub/lessons/${id}` : '/admin/sub/lessons', body);
    setLesson(null);
  };
  const move = (list, i, d, table) => {
    const a = list[i], b = list[i + d]; if (!b) return;
    Promise.all([api(`/admin/sub/${table}/${a.id}`, { method: 'PUT', body: { position: i + d } }), api(`/admin/sub/${table}/${b.id}`, { method: 'PUT', body: { position: i } })]).then(reload);
  };
  return (
    <>
      {course.modules.length === 0 && <Empty title="Aucun module">Commencez par créer un module.</Empty>}
      <div className="grid" style={{ gap: 18 }}>
        {course.modules.map((m, mi) => (
          <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="row between" style={{ padding: '16px 20px', background: 'var(--bg-soft)' }}>
              <strong>Module {mi + 1} · {m.title}</strong>
              <div className="row" style={{ gap: 6 }}>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => move(course.modules, mi, -1, 'modules')} aria-label="Monter"><ChevronUp size={15} /></button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => move(course.modules, mi, 1, 'modules')} aria-label="Descendre"><ChevronDown size={15} /></button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Renommer" onClick={() => { const t = window.prompt('Titre du module', m.title); if (t) call('PUT', `/admin/sub/modules/${m.id}`, { title: t }); }}><Pencil size={14} /></button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Supprimer" onClick={() => window.confirm('Supprimer ce module et ses leçons ?') && call('DELETE', `/admin/sub/modules/${m.id}`)}><Trash2 size={14} /></button>
              </div>
            </div>
            {m.lessons.map((l, li) => (
              <div key={l.id} className="row between small" style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', flexWrap: 'nowrap' }}>
                <span><span className="badge badge-neutral" style={{ marginRight: 8 }}>{l.type}</span>{l.title} {l.is_preview && <span className="badge badge-wait">Aperçu</span>}</span>
                <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => move(m.lessons, li, -1, 'lessons')} aria-label="Monter"><ChevronUp size={14} /></button>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => move(m.lessons, li, 1, 'lessons')} aria-label="Descendre"><ChevronDown size={14} /></button>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setLesson(l)} aria-label="Modifier"><Pencil size={13} /></button>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => window.confirm('Supprimer cette leçon ?') && call('DELETE', `/admin/sub/lessons/${l.id}`)} aria-label="Supprimer"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
              <button className="btn btn-ghost btn-xs" onClick={() => setLesson({ module_id: m.id, type: 'video', position: m.lessons.length, duration_min: 10 })}><Plus size={14} /> Ajouter une leçon</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-sm" style={{ marginTop: 18 }} onClick={addModule}><Plus /> Ajouter un module</button>
      <Modal open={!!lesson} onClose={() => setLesson(null)} title={lesson?.id ? 'Modifier la leçon' : 'Nouvelle leçon'} large>
        {lesson && (
          <form onSubmit={saveLesson} className="form-grid">
            {LESSON_FIELDS.map((f) => <Field key={f.k} f={f} value={lesson[f.k]} onChange={(val) => setLesson({ ...lesson, [f.k]: val })} />)}
            <div className="full row" style={{ justifyContent: 'flex-end' }}><button className="btn"><Save /> Enregistrer</button></div>
          </form>
        )}
      </Modal>
    </>
  );
}

function QuizTab({ course, reload }) {
  const toast = useToast();
  const [q, setQ] = useState(null);
  const call = async (method, path, body) => { try { await api(path, { method, body }); reload(); } catch (e) { toast(e.message, 'error'); } };
  const addQuiz = () => {
    const mod = window.prompt(`Numéro du module (1 à ${course.modules.length})`);
    const m = course.modules[Number(mod) - 1];
    if (!m) return toast('Module invalide', 'error');
    call('POST', '/admin/sub/quizzes', { course_id: course.id, module_id: m.id, title: `Quiz — ${m.title}`, is_final: false });
  };
  const saveQ = async (e) => {
    e.preventDefault();
    const options = q.optionsText.split('\n').map((x) => x.trim()).filter(Boolean);
    if (options.length < 2) return toast('Au moins 2 réponses', 'error');
    const body = { quiz_id: q.quiz_id, question: q.question, options, correct_index: Number(q.correct_index) - 1, position: q.position ?? 0 };
    if (body.correct_index < 0 || body.correct_index >= options.length) return toast('Numéro de bonne réponse invalide', 'error');
    await call(q.id ? 'PUT' : 'POST', q.id ? `/admin/sub/questions/${q.id}` : '/admin/sub/questions', body);
    setQ(null);
  };
  return (
    <>
      <div className="grid" style={{ gap: 18 }}>
        {course.quizzes.map((qz) => (
          <div key={qz.id} className="card" style={{ borderColor: qz.is_final ? 'var(--gold)' : undefined }}>
            <div className="row between">
              <strong className="row" style={{ gap: 8 }}><ClipboardCheck size={18} className="gold" />{qz.title} {qz.is_final && <span className="badge badge-wait">Examen final → attestation</span>}</strong>
              {!qz.is_final && <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => window.confirm('Supprimer ce quiz ?') && call('DELETE', `/admin/sub/quizzes/${qz.id}`)} aria-label="Supprimer"><Trash2 size={14} /></button>}
            </div>
            <ol style={{ margin: '14px 0', paddingLeft: 20 }} className="small">
              {qz.questions.map((x) => (
                <li key={x.id} style={{ marginBottom: 10 }}>
                  <div className="row between" style={{ flexWrap: 'nowrap' }}>
                    <span><strong>{x.question}</strong><br /><span className="muted">{x.options.map((o, i) => (i === x.correct_index ? `✓ ${o}` : o)).join(' · ')}</span></span>
                    <span className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Modifier" onClick={() => setQ({ ...x, optionsText: x.options.join('\n'), correct_index: x.correct_index + 1 })}><Pencil size={13} /></button>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Supprimer" onClick={() => call('DELETE', `/admin/sub/questions/${x.id}`)}><Trash2 size={13} /></button>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
            <button className="btn btn-ghost btn-xs" onClick={() => setQ({ quiz_id: qz.id, question: '', optionsText: '', correct_index: 1, position: qz.questions.length })}><Plus size={14} /> Ajouter une question</button>
          </div>
        ))}
      </div>
      <button className="btn btn-sm" style={{ marginTop: 18 }} onClick={addQuiz} disabled={!course.modules.length}><Plus /> Ajouter un quiz de module</button>
      <Modal open={!!q} onClose={() => setQ(null)} title="Question">
        {q && (
          <form onSubmit={saveQ} className="grid" style={{ gap: 14 }}>
            <div className="field"><label>Question</label><textarea className="textarea" rows={2} required value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} /></div>
            <div className="field"><label>Réponses (une par ligne)</label><textarea className="textarea" rows={5} required value={q.optionsText} onChange={(e) => setQ({ ...q, optionsText: e.target.value })} /></div>
            <div className="field"><label>Numéro de la bonne réponse</label><input className="input" type="number" min="1" required value={q.correct_index} onChange={(e) => setQ({ ...q, correct_index: e.target.value })} /></div>
            <button className="btn"><Save /> Enregistrer</button>
          </form>
        )}
      </Modal>
    </>
  );
}

export function CourseEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data: course, loading, reload } = useApi(`/admin/courses/${id}`);
  const cats = useApi('/categories');
  const [tab, setTab] = useState('info');
  const [ver, setVer] = useState(0);
  useEffect(() => setVer((v) => v + 1), [course?.id]);
  if (loading || !cats.data) return <Spinner />;
  const del = async () => {
    if (!window.confirm('Supprimer définitivement cette formation (leçons, quiz, inscriptions) ?')) return;
    try { await api(`/admin/courses/${id}`, { method: 'DELETE' }); nav('/admin/formations'); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <Link to="/admin/formations" className="link small muted"><ArrowLeft /> Formations</Link>
      <div className="dash-title" style={{ marginTop: 12 }}>
        <div><span className="eyebrow">Éditeur</span><h1>{course.title}</h1></div>
        <div className="row">
          <Link to={`/formations/${course.slug}`} target="_blank" className="btn btn-ghost btn-sm"><ExternalLink /> Voir</Link>
          <Link to={`/apprendre/${course.slug}`} target="_blank" className="btn btn-ghost btn-sm">Tester le lecteur</Link>
          <button className="btn btn-danger btn-sm" onClick={del}><Trash2 /> Supprimer</button>
        </div>
      </div>
      <div className="tabs">
        {[['info', 'Informations'], ['program', `Programme (${course.modules.length} modules)`], ['quiz', `Quiz & examen (${course.quizzes.length})`]].map(([k, l]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'info' && <InfoTab key={ver} course={course} cats={cats.data} onSaved={reload} />}
      {tab === 'program' && <ProgramTab course={course} reload={reload} />}
      {tab === 'quiz' && <QuizTab course={course} reload={reload} />}
    </>
  );
}
