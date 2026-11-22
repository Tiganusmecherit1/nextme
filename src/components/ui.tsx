import { useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { back as navBack } from '../nav';

export function Rings({ values, size = 132 }: { values: { pct: number; color: string }[]; size?: number }) {
  const stroke = Math.max(3.5, Math.round((size / 132) * 13 * 10) / 10);
  const gap = Math.max(1, (size / 132) * 3);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rings" aria-hidden>
      {values.map((v, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + gap);
        const c = 2 * Math.PI * r;
        const pct = Math.max(0, Math.min(1, v.pct));
        return (
          <g key={i} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={v.color} strokeOpacity="0.2" strokeWidth={stroke} />
            {pct > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={v.color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${c * pct} ${c}`} style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)' }} />}
          </g>
        );
      })}
    </svg>
  );
}

export function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="bar"><div style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, background: color }} /></div>
  );
}

export function Chips<T extends string | number>({ options, value, onChange, multi }: {
  options: { v: T; label: string }[];
  value: T | T[];
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const sel = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  return (
    <div className="chips">
      {options.map((o) => (
        <button type="button" key={String(o.v)} className={'chip' + (sel(o.v) ? ' on' : '')}
          onClick={() => {
            if (!multi) return onChange(o.v);
            const arr = value as T[];
            onChange(arr.includes(o.v) ? arr.filter((x) => x !== o.v) : [...arr, o.v]);
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Disclaimer() {
  return <p className="disclaimer">⚕︎ {t('disclaimerShort')}</p>;
}

export function Header({ title, back, right }: { title: string; back?: boolean; right?: ReactNode }) {
  return (
    <header className="hdr">
      {back && <button className="icon-btn" aria-label={t('back')} onClick={navBack}>‹</button>}
      <h1>{title}</h1>
      <div className="hdr-right">{right}</div>
    </header>
  );
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        {title && <h2 className="sheet-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function NumberPrompt({ label, initial, onSave, onClose, decimal }: { label: string; initial?: number; onSave: (n: number) => void; onClose: () => void; decimal?: boolean }) {
  const [v, setV] = useState(initial ? String(initial) : '');
  return (
    <Sheet open onClose={onClose} title={label}>
      <input className="input big" inputMode={decimal ? 'decimal' : 'numeric'} autoFocus value={v} onChange={(e) => setV(decimal ? e.target.value.replace(/[^\d.,]/g, '') : e.target.value.replace(/[^\d]/g, ''))} />
      <div className="row gap">
        <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
        <button className="btn" onClick={() => { onSave(Number(v.replace(',', '.')) || 0); onClose(); }}>{t('save')}</button>
      </div>
    </Sheet>
  );
}

export const go = (hash: string) => { location.hash = hash; };
