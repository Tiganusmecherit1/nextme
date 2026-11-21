import { useEffect, useState } from 'react';
import { api } from '../api';
import { getLang } from '../i18n';
import { Chips, Disclaimer, Header } from '../components/ui';

type Dev = 'ios' | 'android';
const guessDev = (): Dev => (/android/i.test(navigator.userAgent) ? 'android' : 'ios');

// Step-by-step guides. The phone or watch sends totals straight to the user's private NextMe link.
const GUIDE: Record<Dev, { ro: string[]; en: string[] }> = {
  ios: {
    ro: [
      'Deschide aplicația **Scurtături** (Shortcuts) → tab-ul **Automatizare** → **+** → **Oră din zi**.',
      'Alege ora **21:00**, **Zilnic**, apoi **Rulează imediat** (fără confirmare). Poți face încă una la 13:00.',
      'Adaugă acțiunea **Găsește mostre de sănătate**: Tip = **Pași**, Data de început = **Azi**, Grupează după = **Zi**.',
      'Adaugă **Calculează statistici** → **Sumă** din mostrele găsite.',
      'Adaugă încă o acțiune **Găsește mostre de sănătate**: Tip = **Puls în repaus**, Data de început = **Azi**, Limită = **1**, Sortează după **Cele mai recente**.',
      'Adaugă **Obține conținutul URL-ului**: lipește linkul tău de mai sus, Metodă = **POST**, Corp cerere = **JSON**, câmpuri: `steps` = Statistici, `resting_hr` = Mostre de sănătate.',
      'Apasă ▶︎ o dată ca să testezi. Pe iPhone îți cere acces la Sănătate: permite Pași și Puls.',
    ],
    en: [
      'Open the **Shortcuts** app → **Automation** tab → **+** → **Time of Day**.',
      'Pick **9:00 PM**, **Daily**, then **Run Immediately** (no confirmation). You can add another at 1:00 PM.',
      'Add the action **Find Health Samples**: Type = **Steps**, Start Date = **Today**, Group By = **Day**.',
      'Add **Calculate Statistics** → **Sum** of the health samples.',
      'Add another **Find Health Samples**: Type = **Resting Heart Rate**, Start Date = **Today**, Limit = **1**, Sort by **Latest First**.',
      'Add **Get Contents of URL**: paste your link from above, Method = **POST**, Request Body = **JSON**, fields: `steps` = Statistics, `resting_hr` = Health Samples.',
      'Tap ▶︎ once to test. The iPhone asks for Health access: allow Steps and Heart Rate.',
    ],
  },
  android: {
    ro: [
      'Verifică că aplicația ceasului sau a telefonului scrie în **Health Connect** (Samsung Health, Fitbit, Google Fit, Withings etc.: în setările lor caută „Health Connect”).',
      'Instalează din Google Play aplicația gratuită **HC Webhook** (Health Connect Webhook).',
      'Dă-i permisiune de citire pentru **Pași**, **Puls** și **Puls în repaus**.',
      'La **Webhook URL** lipește linkul tău de mai sus.',
      'Alege sincronizare la interval, de exemplu **la fiecare oră**, sau la ore fixe.',
      'Apasă **Sync Now** o dată ca să testezi. Pașii apar în NextMe în câteva secunde.',
    ],
    en: [
      'Make sure your watch or phone app writes to **Health Connect** (Samsung Health, Fitbit, Google Fit, Withings etc.: look for “Health Connect” in their settings).',
      'Install the free **HC Webhook** (Health Connect Webhook) app from Google Play.',
      'Give it read access to **Steps**, **Heart rate** and **Resting heart rate**.',
      'Under **Webhook URL** paste your link from above.',
      'Choose an interval sync, for example **every hour**, or fixed times.',
      'Tap **Sync Now** once to test. Steps show up in NextMe within seconds.',
    ],
  },
};

const md = (s: string) => s.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) =>
  p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p);

export function SyncScreen() {
  const ro = getLang() === 'ro';
  const lang = getLang();
  const [state, setState] = useState<{ enabled: boolean; lastAt: string | null } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [dev, setDev] = useState<Dev>(guessDev());
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api<{ sync?: { enabled: boolean; lastAt: string | null } }>('/me').then((r) => setState(r.sync ?? { enabled: false, lastAt: null })).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (state?.enabled && !confirm(ro ? 'Linkul vechi nu va mai funcționa. Continui?' : 'Your old link will stop working. Continue?')) return;
    setBusy(true);
    try {
      const r = await api<{ url: string }>('/sync/token', { method: 'POST' });
      setLink(r.url);
      setCopied(false);
      load();
    } finally { setBusy(false); }
  };
  const stop = async () => {
    if (!confirm(ro ? 'Oprești sincronizarea automată?' : 'Turn off automatic sync?')) return;
    await api('/sync/token', { method: 'DELETE' });
    setLink(null);
    load();
  };
  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { /* user can select the text */ }
  };

  const last = state?.lastAt ? new Date(state.lastAt).toLocaleString(ro ? 'ro-RO' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : null;

  return (
    <div className="page">
      <Header title={ro ? 'Ceas și telefon' : 'Watch & phone'} back />
      <section className="card">
        <h3>⌚ {ro ? 'Pași și puls, automat' : 'Steps and heart rate, automatically'}</h3>
        <p className="small muted">{ro
          ? 'Telefonul sau ceasul trimite singur pașii și pulsul în NextMe, printr-un link privat doar al tău. Merge cu iPhone + Apple Watch (prin Apple Health) și cu Android + orice ceas care scrie în Health Connect.'
          : 'Your phone or watch sends steps and heart rate to NextMe by itself, through a private link that is yours only. Works with iPhone + Apple Watch (via Apple Health) and Android + any watch that writes to Health Connect.'}</p>
        {state === null ? <p className="muted small">…</p> : state.enabled
          ? <p className="ok">✓ {ro ? 'Activă' : 'On'}{last ? ` · ${ro ? 'ultima sincronizare' : 'last sync'} ${last}` : ` · ${ro ? 'nicio sincronizare încă' : 'no sync yet'}`}</p>
          : <p className="muted small">{ro ? 'Oprită' : 'Off'}</p>}
        {link ? (
          <div className="sync-link">
            <p className="small"><b>{ro ? 'Linkul tău privat' : 'Your private link'}</b> · {ro ? 'apare o singură dată, copiază-l acum:' : 'shown only once, copy it now:'}</p>
            <input className="input mono" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
            <button className="btn sm" onClick={copy}>{copied ? (ro ? '✓ Copiat' : '✓ Copied') : (ro ? 'Copiază linkul' : 'Copy link')}</button>
          </div>
        ) : (
          <button className="btn sm" disabled={busy} onClick={create}>{state?.enabled ? (ro ? 'Generează un link nou' : 'Make a new link') : (ro ? 'Pornește și creează linkul' : 'Turn on and create link')}</button>
        )}
        {state?.enabled && <button className="link danger" onClick={stop}>{ro ? 'Oprește sincronizarea' : 'Turn off sync'}</button>}
        <p className="small muted">🔒 {ro ? 'Nu da linkul nimănui: oricine îl are poate trimite pași în contul tău. Dacă l-ai pierdut, generează unul nou.' : 'Don’t share the link: anyone who has it can send steps to your account. If you lost it, make a new one.'}</p>
      </section>

      <section className="card">
        <Chips options={[{ v: 'ios', label: 'iPhone / Apple Watch' }, { v: 'android', label: 'Android' }]} value={dev} onChange={(v: Dev) => setDev(v)} />
        <ol className="steps-list">{GUIDE[dev][lang].map((x, i) => <li key={dev + i}>{md(x)}</li>)}</ol>
        {dev === 'ios'
          ? <p className="small muted">{ro
            ? 'Ceasuri Garmin, Polar, Withings, Oura, Xiaomi: activează în aplicația lor „Apple Health / Sănătate”, apoi pașii ajung automat și în NextMe. Dacă vezi pașii dublați (telefon + ceas), la pasul 3 adaugă filtrul Sursă = ceasul tău.'
            : 'Garmin, Polar, Withings, Oura, Xiaomi watches: turn on “Apple Health” in their app, and steps then reach NextMe too. If steps look doubled (phone + watch), add a Source = your watch filter in step 3.'}</p>
          : <p className="small muted">{ro
            ? 'HC Webhook e o aplicație separată, gratuită și open-source; datele merg direct de pe telefonul tău în NextMe. Dacă vezi pașii dublați, lasă în Health Connect o singură aplicație care scrie pași (telefonul sau ceasul).'
            : 'HC Webhook is a separate, free and open-source app; data goes straight from your phone to NextMe. If steps look doubled, let only one app write steps in Health Connect (the phone or the watch).'}</p>}
      </section>

      <section className="card">
        <h3>🛠️ {ro ? 'Pentru alte aplicații' : 'For other apps'}</h3>
        <p className="small muted">{ro ? 'Orice automatizare (Tasker, MacroDroid, Make) poate trimite un POST cu JSON la linkul tău:' : 'Any automation (Tasker, MacroDroid, Make) can send a POST with JSON to your link:'}</p>
        <pre className="code">{'{ "date": "2026-11-21", "steps": 8421, "resting_hr": 58, "hr_avg": 74 }'}</pre>
        <p className="small muted">{ro ? 'Data e opțională (implicit azi). Trimiterea înlocuiește totalul zilei.' : 'Date is optional (defaults to today). Each send replaces that day’s total.'}</p>
      </section>
      <Disclaimer />
    </div>
  );
}
