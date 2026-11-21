import { useMemo, useState } from 'react';
import { getLang, L, t } from '../i18n';
import { Disclaimer, go, Header } from '../components/ui';
import { Markdown, parseFrontmatter } from '../markdown';
import { SUPPLEMENTS, type Grade, type SupCat } from '../data/supplements';

// Lessons written by the education module live in /content/learn (index.json + <lang>/<id>.md).
const RAW = import.meta.glob('/content/learn/*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const INDEX = import.meta.glob('/content/learn/index.json', { import: 'default', eager: true }) as Record<string, any>;

interface Lesson { id: string; lang: string; meta: Record<string, any>; body: string }
const LESSONS: Lesson[] = Object.entries(RAW).map(([path, src]) => {
  const [, lang, file] = path.match(/\/content\/learn\/(\w+)\/([^/]+)\.md$/) || [];
  const { meta, body } = parseFrontmatter(src);
  return { id: String(meta.id || file), lang, meta, body };
});
const chapters: { id: string; order?: number; title: { ro: string; en: string }; icon?: string; lessons: string[] }[] =
  (Object.values(INDEX)[0]?.chapters ?? []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

const ICONS: Record<string, string> = { brain: '🧠', cell: '🧬', flame: '🔥', droplet: '💧', bone: '🦴', dumbbell: '🏋️', leaf: '🥬', heart: '❤️', moon: '🌙', pill: '💊', scale: '⚖️', apple: '🍎' };

function lessonFor(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id && l.lang === getLang()) ?? LESSONS.find((l) => l.id === id && l.lang === 'ro');
}

export function Learn() {
  return (
    <div className="page">
      <Header title={t('learn')} />
      <button className="card list-item hero-link" onClick={() => go('#/supplements')}>
        <span className="emoji">💊</span>
        <div><b>{t('supplements')}</b><p className="small muted">{t('supplementsText')}</p></div>
        <span className="chev">›</span>
      </button>
      <h2 className="section-title">📚 {t('lessons')}</h2>
      {chapters.length === 0 && <p className="muted">{t('lessonsSoon')}</p>}
      {chapters.map((c) => (
        <section key={c.id} className="card">
          <h3>{ICONS[c.icon ?? ''] ?? '📘'} {L(c.title)}</h3>
          {c.lessons.map((id) => {
            const l = lessonFor(id);
            if (!l) return null;
            return (
              <button key={id} className="lesson-row" onClick={() => go('#/lesson/' + id)}>
                <div><b>{l.meta.title}</b><p className="small muted">{l.meta.summary}</p></div>
                <span className="small muted nowrap">{l.meta.readMinutes ?? 3} {t('readMin')}</span>
              </button>
            );
          })}
        </section>
      ))}
      <Disclaimer />
    </div>
  );
}

export function LessonView({ id }: { id: string }) {
  const l = lessonFor(id);
  if (!l) return <div className="page"><Header title="—" back /></div>;
  const sources: { label: string; url?: string }[] = Array.isArray(l.meta.sources) ? l.meta.sources : [];
  // next lesson in the same chapter order
  const flat = chapters.flatMap((c) => c.lessons);
  const next = flat[flat.indexOf(id) + 1];
  return (
    <div className="page lesson">
      <Header title={l.meta.title} back />
      <article className="card prose">
        <p className="eyebrow">{l.meta.readMinutes ?? 3} {t('readMin')}</p>
        <Markdown src={l.body.replace(/^\s*#\s+[^\n]*\n/, '')} lang={getLang()} />
        {sources.length > 0 && (
          <div className="sources">
            <h4>{t('source')}</h4>
            <ol>{sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}</li>)}</ol>
          </div>
        )}
      </article>
      <p className="disclaimer lesson-disc">⚕︎ {getLang() === 'ro' ? 'Informații educaționale, nu sfat medical. Consultă medicul înainte de schimbări de dietă sau antrenament.' : 'Educational information, not medical advice. Consult your doctor before changing your diet or training.'}</p>
      {next && lessonFor(next) && <button className="btn full" onClick={() => go('#/lesson/' + next)}>{t('next')}: {lessonFor(next)!.meta.title}</button>}
      <Disclaimer />
    </div>
  );
}

const CATS: Record<SupCat, { ro: string; en: string }> = {
  performance: { ro: 'Sport', en: 'Sport' }, vitamins: { ro: 'Vitamine', en: 'Vitamins' }, minerals: { ro: 'Minerale', en: 'Minerals' },
  gut: { ro: 'Intestin', en: 'Gut' }, metabolic: { ro: 'Glicemie', en: 'Blood sugar' }, sleep_stress: { ro: 'Somn și stres', en: 'Sleep & stress' },
  joints: { ro: 'Articulații', en: 'Joints' }, heart: { ro: 'Inimă', en: 'Heart' }, immune: { ro: 'Imunitate', en: 'Immunity' },
  weight: { ro: 'Slăbit', en: 'Weight' }, other: { ro: 'Altele', en: 'Other' },
};

export function Supplements() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<SupCat | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const lang = getLang();
  const list = useMemo(() => SUPPLEMENTS.filter((s) =>
    (cat === 'all' || s.cat === cat) && (!q || (s.name.ro + ' ' + s.name.en).toLowerCase().includes(q.toLowerCase()))
  ), [q, cat]);
  const gradeLabel = (g: Grade) => t(('grade' + g) as 'gradeA');
  return (
    <div className="page">
      <Header title={t('supplements')} back />
      <section className="card warn-card small">
        ⚕︎ {lang === 'ro'
          ? 'Suplimentele nu înlocuiesc mâncarea, somnul și mișcarea. Discută cu medicul sau farmacistul, mai ales dacă iei medicamente, ești însărcinată sau ai o boală cronică.'
          : 'Supplements don’t replace food, sleep and exercise. Talk to your doctor or pharmacist, especially if you take medication, are pregnant or have a chronic illness.'}
      </section>
      <input className="input" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips scroll-x">
        <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>{lang === 'ro' ? 'Toate' : 'All'} ({SUPPLEMENTS.length})</button>
        {(Object.keys(CATS) as SupCat[]).map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{CATS[c][lang]}</button>)}
      </div>
      <p className="small muted">A = {t('gradeA')} · B = {t('gradeB')} · C = {t('gradeC')} · D = {t('gradeD')}</p>
      {list.map((s) => (
        <section key={s.id} className="card sup" onClick={() => setOpen(open === s.id ? null : s.id)}>
          <div className="sup-head">
            <span className={'grade g' + s.grade}>{s.grade}</span>
            <div><b>{s.name[lang]}</b><p className="small muted">{s.use[lang]}</p></div>
          </div>
          {open === s.id && (
            <div className="sup-body">
              <p><b>{t('grade')}:</b> {gradeLabel(s.grade)}</p>
              <p><b>{t('dose')}:</b> {lang === 'ro' ? s.dose : s.dose.replace(/\/zi/g, '/day').replace(/săptămână/g, 'week').replace(/ înainte/g, ' before').replace(/ cu masa/g, ' with meals')}</p>
              <p className="warn">⚠︎ <b>{t('caution')}:</b> {s.caution[lang]}</p>
            </div>
          )}
        </section>
      ))}
      <p className="small muted">{lang === 'ro' ? 'Surse: EFSA, NIH Office of Dietary Supplements, ISSN, recenzii Cochrane.' : 'Sources: EFSA, NIH Office of Dietary Supplements, ISSN, Cochrane reviews.'}</p>
      <Disclaimer />
    </div>
  );
}
