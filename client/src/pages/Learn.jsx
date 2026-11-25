import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Check, Lock, PlayCircle, FileText, PenLine, ClipboardCheck, Award, ChevronLeft, ChevronRight, Download, MessageCircle, StickyNote,
  HelpCircle, Send, Gauge, CheckCircle2, XCircle, ArrowLeft,
} from 'lucide-react';
import { Spinner, Empty } from '../components/ui';
import { api, openPdf } from '../lib/api';
import { useAuth, useToast } from '../lib/context';
import { useApi, useSeo, dateTime, minutes, initials } from '../lib/utils';

const ICON = { video: PlayCircle, pdf: FileText, text: FileText, exercise: PenLine };
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/* ---------- Lecteur vidéo protégé : jeton court, pas d'URL directe, reprise automatique ---------- */
function VideoLesson({ lesson, onProgress }) {
  const ref = useRef(null);
  const [src, setSrc] = useState(null);
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem('speed')) || 1);
  const [err, setErr] = useState('');
  const lastSave = useRef(0);
  const completedRef = useRef(lesson.completed);

  useEffect(() => {
    let alive = true;
    setSrc(null); setErr('');
    api(`/learn/lessons/${lesson.id}/stream-token`).then((r) => alive && setSrc(r.url)).catch((e) => alive && setErr(e.message));
    return () => { alive = false; };
  }, [lesson.id]);

  const save = useCallback((completed = false) => {
    const v = ref.current; if (!v) return;
    onProgress(lesson.id, { position: v.currentTime, completed });
  }, [lesson.id, onProgress]);

  useEffect(() => () => { if (ref.current && ref.current.currentTime > 0) save(false); }, [save]);

  if (err) return <div className="player-stage" style={{ display: 'grid', placeItems: 'center', color: '#fff' }}>{err}</div>;
  return (
    <div className="player-stage" onContextMenu={(e) => e.preventDefault()}>
      {src && (
        <video
          key={src} ref={ref} src={src} controls autoPlay playsInline preload="auto"
          controlsList="nodownload noremoteplayback" disablePictureInPicture
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = speed;
            if (lesson.position_seconds > 3 && lesson.position_seconds < e.currentTarget.duration - 3) e.currentTarget.currentTime = lesson.position_seconds;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            const done = v.duration && v.currentTime / v.duration > 0.9;
            if (done && !completedRef.current) { completedRef.current = true; save(true); lastSave.current = Date.now(); return; }
            if (Date.now() - lastSave.current > 10_000) { lastSave.current = Date.now(); save(false); }
          }}
          onPause={() => save(false)}
          onEnded={() => save(true)}
          onError={() => api(`/learn/lessons/${lesson.id}/stream-token`).then((r) => setSrc(r.url)).catch(() => setErr('Lecture impossible'))}
        />
      )}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 4, background: 'rgba(0,0,0,.55)', borderRadius: 999, padding: 4 }}>
        <Gauge size={16} color="#fff" style={{ margin: '6px 4px 0 8px' }} />
        {SPEEDS.map((s) => (
          <button key={s} onClick={() => { setSpeed(s); localStorage.setItem('speed', s); if (ref.current) ref.current.playbackRate = s; }}
            style={{ border: 0, borderRadius: 999, padding: '4px 9px', fontSize: '.75rem', fontWeight: 700, background: speed === s ? 'var(--gold)' : 'transparent', color: speed === s ? '#0b0b0c' : '#fff' }}>
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

function ExerciseLesson({ lesson, onDone }) {
  const sub = useApi(`/learn/lessons/${lesson.id}/submission`);
  const [content, setContent] = useState('');
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    try { const r = await api(`/learn/lessons/${lesson.id}/submission`, { method: 'POST', body: { content } }); onDone(r.progress); setContent(''); sub.reload(); toast('Travail envoyé au formateur'); }
    catch (err) { toast(err.message, 'error'); }
  };
  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 className="row" style={{ gap: 10 }}><PenLine className="gold" /> Rendre mon travail</h3>
      {sub.data && (
        <div className="alert alert-info" style={{ margin: '14px 0' }}>
          <strong>Dernier envoi ({dateTime(sub.data.created_at)}) :</strong> {sub.data.content.slice(0, 200)}
          <div style={{ marginTop: 6 }}>{sub.data.grade != null ? <>Note : <strong>{sub.data.grade}/20</strong>{sub.data.feedback && ` — ${sub.data.feedback}`}</> : 'En attente de correction'}</div>
        </div>
      )}
      <form onSubmit={submit}>
        <textarea className="textarea" required minLength={10} placeholder="Décrivez votre démarche et collez le lien vers votre travail (Drive, Behance, YouTube…)" value={content} onChange={(e) => setContent(e.target.value)} />
        <button className="btn btn-sm" style={{ marginTop: 12 }}><Send /> Envoyer</button>
      </form>
    </div>
  );
}

function Quiz({ quizId, onPassed }) {
  const { data: quiz, loading, error } = useApi(`/learn/quizzes/${quizId}`);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => { setAnswers({}); setResult(null); }, [quizId]);
  if (loading) return <Spinner />;
  if (error) return <Empty icon={Lock} title="Évaluation verrouillée">{error.message}</Empty>;
  const submit = async () => {
    setBusy(true);
    try { const r = await api(`/learn/quizzes/${quizId}/submit`, { method: 'POST', body: { answers } }); setResult(r); onPassed(r, quiz); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };
  return (
    <div style={{ maxWidth: 780 }}>
      <span className="eyebrow">{quiz.is_final ? 'Examen final' : 'Quiz de module'}</span>
      <h1 className="serif" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', margin: '10px 0 8px' }}>{quiz.title}</h1>
      <p className="muted">{quiz.questions.length} questions · score minimum pour valider : {quiz.pass_score} %</p>
      {result && (
        <div className={`alert ${result.passed ? 'alert-ok' : 'alert-error'}`} style={{ margin: '20px 0', display: 'flex', gap: 14, alignItems: 'center' }}>
          {result.passed ? <CheckCircle2 /> : <XCircle />}
          <div>
            <strong style={{ fontSize: '1.1rem' }}>Score : {result.score} % ({result.correct}/{result.total})</strong>
            <div>{result.passed ? (quiz.is_final ? 'Félicitations ! Votre attestation a été générée automatiquement.' : 'Quiz validé, bravo !') : 'Score insuffisant — relisez les leçons et réessayez.'}</div>
            {result.certificate && <Link to="/compte/attestations" className="btn btn-sm" style={{ marginTop: 10 }}><Award /> Voir mon attestation</Link>}
          </div>
        </div>
      )}
      <div className="grid" style={{ gap: 28, marginTop: 28 }}>
        {quiz.questions.map((q, i) => (
          <fieldset key={q.id} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 700, marginBottom: 12 }}>{i + 1}. {q.question}</legend>
            <div className="grid" style={{ gap: 8 }}>
              {q.options.map((o, j) => {
                const sel = Number(answers[q.id]) === j;
                const cls = result ? (result.corrections[q.id] === j ? 'ok' : sel ? 'ko' : '') : sel ? 'sel' : '';
                return (
                  <label key={j} className={`quiz-opt ${cls}`}>
                    <input type="radio" name={`q${q.id}`} disabled={!!result} checked={sel} onChange={() => setAnswers({ ...answers, [q.id]: j })} />{o}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="row" style={{ marginTop: 32 }}>
        {!result ? (
          <button className="btn btn-gold" disabled={busy || Object.keys(answers).length < quiz.questions.length} onClick={submit}>
            Valider mes réponses ({Object.keys(answers).length}/{quiz.questions.length})
          </button>
        ) : !result.passed && <button className="btn" onClick={() => { setAnswers({}); setResult(null); }}>Recommencer</button>}
      </div>
    </div>
  );
}

function NotesPanel({ lessonId }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const timer = useRef(null);
  useEffect(() => { api(`/learn/lessons/${lessonId}/note`).then((r) => setContent(r.content)); }, [lessonId]);
  const onChange = (e) => {
    setContent(e.target.value); setStatus('Enregistrement…');
    clearTimeout(timer.current);
    const val = e.target.value;
    timer.current = setTimeout(() => api(`/learn/lessons/${lessonId}/note`, { method: 'PUT', body: { content: val } }).then(() => setStatus('Enregistré ✓')), 700);
  };
  return (
    <div>
      <textarea className="textarea" style={{ minHeight: 200 }} placeholder="Vos notes personnelles sur cette leçon (enregistrement automatique)…" value={content} onChange={onChange} />
      <div className="tiny muted" style={{ marginTop: 6 }}>{status}</div>
    </div>
  );
}

function Discussion({ lessonId }) {
  const { data, reload } = useApi(`/learn/lessons/${lessonId}/comments`);
  const [content, setContent] = useState('');
  const [isQ, setIsQ] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const toast = useToast();
  const post = async (e) => {
    e.preventDefault();
    try { await api(`/learn/lessons/${lessonId}/comments`, { method: 'POST', body: { content, is_question: isQ, parent_id: replyTo?.id } }); setContent(''); setReplyTo(null); setIsQ(false); reload(); }
    catch (err) { toast(err.message, 'error'); }
  };
  const roots = (data || []).filter((c) => !c.parent_id);
  const Msg = ({ c, child }) => (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', marginLeft: child ? 48 : 0 }}>
      <span className="avatar" style={{ width: 36, height: 36 }}>{initials(c.name)}</span>
      <div style={{ flex: 1 }}>
        <div className="row" style={{ gap: 8 }}>
          <strong className="small">{c.name}</strong>
          {c.role !== 'student' && <span className="badge badge-ok">Formateur</span>}
          {c.is_question && <span className="badge badge-wait">Question au formateur</span>}
          <span className="tiny muted">{dateTime(c.created_at)}</span>
        </div>
        <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }} className="small">{c.content}</p>
        {!child && <button className="tiny gold" style={{ background: 'none', border: 0, padding: 0, fontWeight: 700 }} onClick={() => setReplyTo(c)}>Répondre</button>}
      </div>
    </div>
  );
  return (
    <div>
      <form onSubmit={post} className="card card-soft" style={{ padding: 18, marginBottom: 12 }}>
        {replyTo && <div className="tiny muted" style={{ marginBottom: 8 }}>Réponse à {replyTo.name} · <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 0, color: 'var(--gold)', padding: 0 }}>annuler</button></div>}
        <textarea className="textarea" style={{ minHeight: 80 }} required placeholder="Partagez une idée ou posez une question…" value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="row between" style={{ marginTop: 10 }}>
          {!replyTo ? <label className="check small"><input type="checkbox" checked={isQ} onChange={(e) => setIsQ(e.target.checked)} /> <HelpCircle size={15} /> Question au formateur</label> : <span />}
          <button className="btn btn-sm"><Send /> Publier</button>
        </div>
      </form>
      {roots.length === 0 ? <p className="muted small">Aucun message pour l’instant. Lancez la discussion !</p> : roots.map((c) => (
        <div key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
          <Msg c={c} />
          {(data || []).filter((r) => r.parent_id === c.id).map((r) => <Msg key={r.id} c={r} child />)}
        </div>
      ))}
    </div>
  );
}

export default function Learn() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data: course, loading, error, setData } = useApi(`/learn/${slug}`);
  const [tab, setTab] = useState('notes');
  useSeo({ title: course?.title, noindex: true });

  const lessons = course ? course.modules.flatMap((m) => m.lessons) : [];
  const quizId = Number(params.get('quiz')) || null;
  const lessonId = Number(params.get('lecon')) || course?.last_lesson_id || lessons.find((l) => !l.completed)?.id || lessons[0]?.id;
  const lesson = !quizId ? lessons.find((l) => l.id === lessonId) : null;
  const idx = lesson ? lessons.indexOf(lesson) : -1;
  const allDone = course && course.progress.done >= course.progress.total;

  const go = (q) => { setParams(q, { replace: false }); window.scrollTo({ top: 0 }); };

  const onProgress = useCallback(async (id, body) => {
    try {
      const r = await api(`/learn/lessons/${id}/progress`, { method: 'POST', body });
      setData((c) => c && ({
        ...c, progress: r.progress, last_lesson_id: id,
        modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === id ? { ...l, completed: l.completed || !!body.completed, position_seconds: Math.floor(body.position || 0) } : l)) })),
      }));
    } catch { /* hors ligne : la progression sera renvoyée au prochain enregistrement */ }
  }, [setData]);

  const markDone = (r) => setData((c) => ({ ...c, progress: r, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, completed: true } : l)) })) }));

  if (loading) return <Spinner />;
  if (error) return (
    <div className="container section"><Empty icon={Lock} title="Accès réservé">{error.message}<div style={{ marginTop: 16 }}><Link to={`/formations/${slug}`} className="btn btn-sm">Voir la formation</Link></div></Empty></div>
  );

  return (
    <div className="player">
      <div className="player-main">
        {lesson?.type === 'video' && <VideoLesson key={lesson.id} lesson={lesson} onProgress={onProgress} />}
        <div style={{ padding: 'clamp(22px, 4vw, 44px)' }}>
          <Link to="/compte" className="link small muted" style={{ marginBottom: 16 }}><ArrowLeft /> Mon espace</Link>
          {quizId ? (
            <Quiz quizId={quizId} onPassed={(r, quiz) => {
              setData((c) => ({ ...c, ...(r.certificate ? { certificate: { number: r.certificate.number, score: r.score } } : {}),
                final_quiz: quiz.is_final ? { ...c.final_quiz, best_score: Math.max(r.score, c.final_quiz?.best_score || 0) } : c.final_quiz }));
              if (r.certificate) toast('🎓 Attestation générée !');
            }} />
          ) : lesson ? (
            <>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <span className="eyebrow">{course.modules.find((m) => m.id === lesson.module_id)?.title}</span>
                  <h1 className="serif" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)', margin: '8px 0 6px' }}>{lesson.title}</h1>
                  <span className="small muted">{minutes(lesson.duration_min)} · Leçon {idx + 1}/{lessons.length}</span>
                </div>
                <div className="row">
                  <button className="icon-btn" disabled={idx <= 0} onClick={() => go({ lecon: lessons[idx - 1].id })} aria-label="Leçon précédente"><ChevronLeft /></button>
                  <button className="icon-btn" disabled={idx >= lessons.length - 1} onClick={() => go({ lecon: lessons[idx + 1].id })} aria-label="Leçon suivante"><ChevronRight /></button>
                </div>
              </div>
              {lesson.content && <p className="prose" style={{ marginTop: 22 }}>{lesson.content}</p>}
              <div className="row" style={{ marginTop: 20 }}>
                {lesson.has_file && (
                  course.downloads_allowed || user.role !== 'student'
                    ? <button className="btn btn-ghost btn-sm" onClick={() => openPdf(`/learn/lessons/${lesson.id}/file`, `support-${lesson.id}.pdf`).catch((e) => toast(e.message, 'error'))}><Download /> Télécharger le support PDF</button>
                    : <span className="pill"><Lock size={13} /> Téléchargement désactivé par l’administrateur</span>
                )}
                {lesson.type !== 'video' && lesson.type !== 'exercise' && !lesson.completed && (
                  <button className="btn btn-sm" onClick={() => api(`/learn/lessons/${lesson.id}/progress`, { method: 'POST', body: { completed: true } }).then((r) => markDone(r.progress))}><Check /> Marquer comme terminé</button>
                )}
                {lesson.completed && <span className="badge badge-ok">✓ Leçon terminée</span>}
                {idx < lessons.length - 1 && <button className="btn btn-gold btn-sm" onClick={() => go({ lecon: lessons[idx + 1].id })}>Leçon suivante <ChevronRight /></button>}
              </div>
              {lesson.type === 'exercise' && <ExerciseLesson lesson={lesson} onDone={markDone} />}
              <div className="tabs" style={{ marginTop: 44 }}>
                <button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}><StickyNote size={15} style={{ display: 'inline', verticalAlign: -2 }} /> Mes notes</button>
                <button className={tab === 'forum' ? 'active' : ''} onClick={() => setTab('forum')}><MessageCircle size={15} style={{ display: 'inline', verticalAlign: -2 }} /> Discussion & questions</button>
              </div>
              {tab === 'notes' ? <NotesPanel lessonId={lesson.id} /> : <Discussion lessonId={lesson.id} />}
            </>
          ) : <Empty title="Aucune leçon" />}
        </div>
      </div>

      <aside className="player-side">
        <div style={{ padding: 22, borderBottom: '1px solid var(--line)' }}>
          <Link to={`/formations/${course.slug}`} className="small muted">Formation</Link>
          <strong style={{ display: 'block', fontSize: '1.05rem', margin: '4px 0 14px', lineHeight: 1.3 }}>{course.title}</strong>
          <div className="progress"><div style={{ width: `${course.progress.percent}%` }} /></div>
          <div className="row between tiny muted" style={{ marginTop: 6, fontWeight: 700 }}><span>{course.progress.done}/{course.progress.total} leçons</span><span>{course.progress.percent} %</span></div>
          {course.certificate && (
            <Link to="/compte/attestations" className="btn btn-gold btn-sm btn-block" style={{ marginTop: 14 }}><Award /> Mon attestation</Link>
          )}
        </div>
        {course.modules.map((m, mi) => (
          <div key={m.id}>
            <div className="ps-module">Module {mi + 1} · {m.title}</div>
            {m.lessons.map((l) => {
              const Icon = ICON[l.type] || PlayCircle;
              return (
                <button key={l.id} className={`ps-lesson ${!quizId && l.id === lessonId ? 'active' : ''}`} onClick={() => go({ lecon: l.id })}>
                  <span className={`st ${l.completed ? 'done' : ''}`}>{l.completed && <Check />}</span>
                  <span style={{ flex: 1 }}>{l.title}<span className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Icon size={12} />{minutes(l.duration_min)}</span></span>
                </button>
              );
            })}
            {m.quiz && (
              <button className={`ps-lesson ${quizId === m.quiz.id ? 'active' : ''}`} onClick={() => go({ quiz: m.quiz.id })}>
                <span className={`st ${m.quiz.best_score != null && m.quiz.best_score >= course.pass_score ? 'done' : ''}`}><ClipboardCheck /></span>
                <span style={{ flex: 1 }}>{m.quiz.title}{m.quiz.best_score != null && <span className="tiny muted" style={{ display: 'block' }}>Meilleur score : {m.quiz.best_score} %</span>}</span>
              </button>
            )}
          </div>
        ))}
        {course.final_quiz && (
          <div style={{ padding: 20 }}>
            <button className={`card ${quizId === course.final_quiz.id ? '' : 'card-soft'}`} style={{ width: '100%', textAlign: 'left', padding: 18, borderColor: allDone ? 'var(--gold)' : undefined }}
              onClick={() => (allDone || user.role !== 'student' ? go({ quiz: course.final_quiz.id }) : toast('Terminez toutes les leçons pour débloquer l’examen final', 'error'))}>
              <div className="row" style={{ gap: 10 }}>{allDone ? <Award className="gold" /> : <Lock size={18} className="muted" />}<strong>Examen final</strong></div>
              <div className="tiny muted" style={{ marginTop: 6 }}>
                {course.certificate ? `Réussi · ${course.certificate.score} %` : allDone ? `Score minimum ${course.pass_score} % → attestation automatique` : `Débloqué après les ${course.progress.total} leçons`}
              </div>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
