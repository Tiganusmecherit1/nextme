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
      'Site-ul NextMe nu apare în Health Connect, doar aplicația NextMe pentru Android (mai sus). Dacă nu vrei aplicația, poți folosi o aplicație-punte care citește din Health Connect și trimite la NextMe.',
      'Verifică întâi că aplicația ceasului sau a telefonului scrie în Health Connect: în Samsung Health, Fitbit, Google Fit, Withings etc. caută în setări „Health Connect” și activează Pași și Puls.',
      'Instalează puntea **Health Connect Webhook** (dezvoltator Naveen MC). În Google Play costă o singură dată ~15 $. Gratuit: descarcă APK-ul din pagina proiectului pe GitHub (mcnaveen/health-connect-webhook → Releases).',
      'Deschide-o și dă-i permisiune de citire pentru **Pași**, **Puls** și **Puls în repaus**.',
      'La **Webhook URL** lipește linkul tău de mai sus.',
      'Alege sincronizare la interval (de exemplu **la fiecare oră**) sau la ore fixe, apoi apasă **Sync Now** o dată ca să testezi.',
    ],
    en: [
      'The NextMe website can’t show up in Health Connect, only the NextMe Android app (above) can. If you’d rather not install it, use a bridge app that reads Health Connect and sends to NextMe.',
      'First check that your watch or phone app writes to Health Connect: in Samsung Health, Fitbit, Google Fit, Withings etc. look for “Health Connect” in settings and turn on Steps and Heart rate.',
      'Install the bridge **Health Connect Webhook** (developer Naveen MC). On Google Play it is a one-time ~$15. Free: download the APK from the project’s GitHub page (mcnaveen/health-connect-webhook → Releases).',
      'Open it and give it read access to **Steps**, **Heart rate** and **Resting heart rate**.',
      'Under **Webhook URL** paste your link from above.',
      'Choose an interval sync (for example **every hour**) or fixed times, then tap **Sync Now** once to test.',
    ],
  },
};

const md = (s: string) => s.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) =>
  p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p);

// Native NextMe Android app (android/): exposes window.NextMeAndroid and fires 'nextme-health' events.
interface Bridge { status(): void; connect(url: string): void; syncNow(): void; disconnect(): void; openHealthConnect(): void }
interface NativeStatus { version: string; available: number; connected: boolean; granted: string[]; background: boolean; lastResult: string; lastAt: number }
const bridge = (): Bridge | undefined => (window as any).NextMeAndroid;
export const inAndroidApp = () => !!bridge();
export const APK_URL = 'https://github.com/Tiganusmecherit1/nextme/releases/latest/download/NextMe.apk';

function AndroidAppCard() {
  const ro = getLang() === 'ro';
  const [st, setSt] = useState<NativeStatus | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const on = (e: Event) => { setSt((e as CustomEvent<NativeStatus>).detail); setBusy(false); };
    window.addEventListener('nextme-health', on);
    bridge()?.status();
    return () => window.removeEventListener('nextme-health', on);
  }, []);
  const connect = async () => {
    setBusy(true);
    try {
      const r = await api<{ url: string }>('/sync/token', { method: 'POST' });
      bridge()?.connect(r.url);
    } catch { setBusy(false); }
  };
  const disconnect = async () => {
    await api('/sync/token', { method: 'DELETE' }).catch(() => {});
    bridge()?.disconnect();
  };
  const R: Record<string, [string, string]> = {
    ok: ['✓ Sincronizat', '✓ Synced'], no_permission: ['Lipsește permisiunea pentru Pași în Health Connect.', 'Steps permission is missing in Health Connect.'],
    unavailable: ['Health Connect nu e instalat sau trebuie actualizat.', 'Health Connect is missing or needs an update.'],
    revoked: ['Legătura a fost oprită. Apasă din nou pe Conectează.', 'The connection was turned off. Tap Connect again.'],
  };
  const res = st?.lastResult ? (R[st.lastResult]?.[ro ? 0 : 1] ?? (ro ? 'Eroare: ' : 'Error: ') + st.lastResult.replace(/^error:/, '')) : '';
  const when = st?.lastAt ? new Date(st.lastAt).toLocaleString(ro ? 'ro-RO' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const has = (k: string) => st?.granted.some((g) => g.toUpperCase().includes(k)) ?? false;
  return (
    <section className="card">
      <h3>❤️ Health Connect</h3>
      <p className="small muted">{ro
        ? 'Aplicația NextMe citește direct din Health Connect pașii și pulsul de pe telefon și de pe ceas (Samsung, Pixel, Fitbit, Garmin, Xiaomi, Withings…), când o deschizi și o dată pe oră în fundal.'
        : 'The NextMe app reads steps and heart rate from your phone and watch (Samsung, Pixel, Fitbit, Garmin, Xiaomi, Withings…) straight from Health Connect, when you open it and hourly in the background.'}</p>
      {!st ? <p className="muted small">…</p> : st.available === 1 ? (
        <>
          <p className="warn">⚠︎ {ro ? 'Telefonul nu are Health Connect.' : 'This phone doesn’t have Health Connect.'}</p>
          <button className="btn sm" onClick={() => bridge()?.openHealthConnect()}>{ro ? 'Instalează Health Connect' : 'Install Health Connect'}</button>
        </>
      ) : st.connected ? (
        <>
          <p className="ok">✓ {ro ? 'Conectat' : 'Connected'}{when ? ` · ${when}` : ''}</p>
          {res && <p className="small">{res}</p>}
          <p className="small muted">{has('STEPS') ? '✓' : '✗'} {ro ? 'Pași' : 'Steps'} · {has('HEART_RATE') ? '✓' : '✗'} {ro ? 'Puls' : 'Heart rate'} · {st.background ? '✓' : '✗'} {ro ? 'în fundal' : 'in background'}</p>
          {!st.background && <p className="small muted">{ro ? 'Fără permisiunea „în fundal”, pașii se actualizează când deschizi aplicația.' : 'Without the “background” permission, steps update when you open the app.'}</p>}
          <div className="row gap-s">
            <button className="btn sm" disabled={busy} onClick={() => { setBusy(true); bridge()?.syncNow(); }}>{ro ? 'Sincronizează acum' : 'Sync now'}</button>
            <button className="btn sm ghost" onClick={() => bridge()?.openHealthConnect()}>{ro ? 'Permisiuni' : 'Permissions'}</button>
          </div>
          <button className="link danger" onClick={disconnect}>{ro ? 'Deconectează' : 'Disconnect'}</button>
        </>
      ) : (
        <>
          <button className="btn full" disabled={busy} onClick={connect}>{ro ? 'Conectează Health Connect' : 'Connect Health Connect'}</button>
          <p className="small muted">{ro ? 'Bifează Pași, Puls și „Acces în fundal” în ecranul care apare.' : 'Tick Steps, Heart rate and “Background access” on the screen that opens.'}</p>
        </>
      )}
      <p className="small muted">{ro ? 'Dacă ceasul nu apare, activează Health Connect în aplicația lui (Samsung Health, Fitbit, Garmin Connect etc.).' : 'If your watch doesn’t show up, turn on Health Connect in its own app (Samsung Health, Fitbit, Garmin Connect etc.).'}</p>
    </section>
  );
}

function GetAndroidApp() {
  const ro = getLang() === 'ro';
  return (
    <section className="card accent-violet">
      <h3>🤖 {ro ? 'Aplicația NextMe pentru Android' : 'NextMe app for Android'}</h3>
      <p className="small">{ro
        ? 'Pe Android, aplicația NextMe ia singură pașii și pulsul din Health Connect. Nu ai nevoie de nicio altă aplicație și nici de link.'
        : 'On Android, the NextMe app takes steps and heart rate from Health Connect by itself. No other app or link needed.'}</p>
      <ol className="steps-list">
        <li>{ro ? 'Apasă butonul de mai jos și descarcă NextMe.apk.' : 'Tap the button below and download NextMe.apk.'}</li>
        <li>{ro ? 'Deschide fișierul. Android îți cere o dată să permiți instalarea din browser: apasă Setări → Permite, apoi Instalează.' : 'Open the file. Android asks once to allow installs from your browser: tap Settings → Allow, then Install.'}</li>
        <li>{ro ? 'Deschide NextMe, intră în cont, apoi Profil → Ceas și telefon → Conectează Health Connect.' : 'Open NextMe, log in, then Profile → Watch & phone → Connect Health Connect.'}</li>
      </ol>
      <a className="btn full" href={APK_URL}>{ro ? '⬇︎ Descarcă aplicația Android' : '⬇︎ Download the Android app'}</a>
      <p className="small muted">{ro ? 'Aplicația nu e (încă) în Google Play, de aceea Android cere confirmarea. Contul și datele rămân aceleași.' : 'The app isn’t on Google Play (yet), which is why Android asks. Your account and data stay the same.'}</p>
    </section>
  );
}

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
      {inAndroidApp() ? <><AndroidAppCard /><Disclaimer /></> : <>
      {dev === 'android' && <GetAndroidApp />}
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
        {dev === 'android' && <p className="small"><b>{ro ? 'Alternativă fără aplicația NextMe:' : 'Alternative without the NextMe app:'}</b></p>}
        <ol className="steps-list">{GUIDE[dev][lang].map((x, i) => <li key={dev + i}>{md(x)}</li>)}</ol>
        {dev === 'ios'
          ? <p className="small muted">{ro
            ? 'Ceasuri Garmin, Polar, Withings, Oura, Xiaomi: activează în aplicația lor „Apple Health / Sănătate”, apoi pașii ajung automat și în NextMe. Dacă vezi pașii dublați (telefon + ceas), la pasul 3 adaugă filtrul Sursă = ceasul tău.'
            : 'Garmin, Polar, Withings, Oura, Xiaomi watches: turn on “Apple Health” in their app, and steps then reach NextMe too. If steps look doubled (phone + watch), add a Source = your watch filter in step 3.'}</p>
          : <p className="small muted">{ro
            ? 'Health Connect Webhook e o aplicație separată, open-source, care nu ține de NextMe; datele merg direct de pe telefonul tău în NextMe. Dacă vezi pașii dublați, lasă în Health Connect o singură aplicație care scrie pași (telefonul sau ceasul). Nu vrei să instalezi nimic? Apasă pe cardul Pași și scrie numărul de pe ceas.'
            : 'Health Connect Webhook is a separate open-source app, not made by NextMe; data goes straight from your phone to NextMe. If steps look doubled, let only one app write steps in Health Connect (the phone or the watch). Rather not install anything? Tap the Steps card and type the number from your watch.'}</p>}
        {dev === 'android' && <p className="small"><a href="https://play.google.com/store/apps/details?id=com.hcwebhook.app" target="_blank" rel="noopener noreferrer">Google Play ↗</a> · <a href="https://github.com/mcnaveen/health-connect-webhook/releases" target="_blank" rel="noopener noreferrer">GitHub (APK) ↗</a></p>}
      </section>

      <section className="card">
        <h3>🛠️ {ro ? 'Pentru alte aplicații' : 'For other apps'}</h3>
        <p className="small muted">{ro ? 'Orice automatizare (Tasker, MacroDroid, Make) poate trimite un POST cu JSON la linkul tău:' : 'Any automation (Tasker, MacroDroid, Make) can send a POST with JSON to your link:'}</p>
        <pre className="code">{'{ "date": "2026-11-21", "steps": 8421, "resting_hr": 58, "hr_avg": 74 }'}</pre>
        <p className="small muted">{ro ? 'Data e opțională (implicit azi). Trimiterea înlocuiește totalul zilei.' : 'Date is optional (defaults to today). Each send replaces that day’s total.'}</p>
      </section>
      <Disclaimer />
      </>}
    </div>
  );
}
