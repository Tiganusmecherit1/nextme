import { useState } from 'react';
import { api, ApiError } from '../api';
import { getLang, setLang, t, type Key } from '../i18n';

export function Auth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [, force] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/auth/' + mode, { method: 'POST', body: { username, password } });
      onDone();
    } catch (er) {
      const code = er instanceof ApiError ? er.code : 'server_error';
      const k = ('err_' + code) as Key;
      setError(['err_bad_username', 'err_weak_password', 'err_username_taken', 'err_bad_credentials'].includes(k) ? t(k) : t('error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-glow" />
      <button className="lang-toggle" onClick={() => { setLang(getLang() === 'ro' ? 'en' : 'ro'); force((x) => x + 1); }}>
        {getLang() === 'ro' ? 'EN' : 'RO'}
      </button>
      <div className="logo-big">Next<span>Me</span></div>
      <p className="muted center">{t('appTagline')}</p>
      <form className="card auth-card" onSubmit={submit}>
        <label className="lbl">{t('username')}</label>
        <input className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <label className="lbl">{t('password')}</label>
        <input className="input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : 1} />
        {mode === 'register' && <p className="hint">{t('passwordHint')}</p>}
        {error && <p className="err">{error}</p>}
        <button className="btn full" disabled={busy}>{mode === 'login' ? t('login') : t('register')}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? t('noAccount') : t('haveAccount')}
        </button>
      </form>
      <p className="disclaimer center">⚕︎ {t('disclaimerShort')}</p>
    </div>
  );
}
