// Tiny, safe Markdown renderer (no raw HTML): headings, paragraphs, bold/italic, links, lists,
// blockquotes with GitHub alerts, pipe tables, horizontal rules.
import type { ReactNode } from 'react';

export function parseFrontmatter(src: string): { meta: Record<string, any>; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: src };
  const meta: Record<string, any> = {};
  const lines = m[1].split(/\r?\n/);
  let listKey: string | null = null;
  let cur: Record<string, string> | null = null;
  const val = (v: string) => {
    v = v.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  };
  for (const line of lines) {
    if (!line.trim()) continue;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      const kv = item[1].match(/^(\w+):\s*(.*)$/);
      if (kv) { cur = { [kv[1]]: val(kv[2]) as string }; meta[listKey].push(cur); }
      else { cur = null; meta[listKey].push(val(item[1])); }
      continue;
    }
    const nested = line.match(/^\s{2,}(\w+):\s*(.*)$/);
    if (nested && cur) { cur[nested[1]] = val(nested[2]) as string; continue; }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      if (kv[2].trim() === '') { listKey = kv[1]; meta[kv[1]] = []; cur = null; }
      else if (kv[2].trim().startsWith('[')) {
        listKey = null;
        meta[kv[1]] = kv[2].trim().slice(1, -1).split(',').map((x) => val(x)).filter((x) => x !== '');
      } else { listKey = null; meta[kv[1]] = val(kv[2]); }
    }
  }
  return { meta, body: src.slice(m[0].length) };
}

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = key;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={k++}>{inline(m[2], k * 100)}</strong>);
    else if (m[3] || m[4]) out.push(<em key={k++}>{m[3] || m[4]}</em>);
    else if (m[5]) {
      const href = /^(https?:|#|\/)/.test(m[6]) ? m[6] : '#';
      out.push(<a key={k++} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{m[5]}</a>);
    } else if (m[7]) out.push(<code key={k++}>{m[7]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const ALERTS: Record<string, { cls: string; ro: string; en: string; icon: string }> = {
  TIP: { cls: 'tip', ro: 'În practică', en: 'In practice', icon: '💡' },
  NOTE: { cls: 'note', ro: 'Știai că', en: 'Did you know', icon: '🧠' },
  WARNING: { cls: 'warning', ro: 'Mit vs realitate', en: 'Myth vs reality', icon: '⚖️' },
  CAUTION: { cls: 'caution', ro: 'Atenție medicală', en: 'Medical note', icon: '⚕️' },
  IMPORTANT: { cls: 'note', ro: 'Important', en: 'Important', icon: '❗' },
};

export function Markdown({ src, lang = 'ro' }: { src: string; lang?: 'ro' | 'en' }) {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(4, h[1].length + 1);
      const Tag = (`h${lvl}`) as 'h2' | 'h3' | 'h4';
      blocks.push(<Tag key={k++}>{inline(h[2])}</Tag>);
      i++; continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { blocks.push(<hr key={k++} />); i++; continue; }
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      const am = buf[0]?.match(/^\[!(\w+)\]\s*(.*)$/);
      if (am && ALERTS[am[1].toUpperCase()]) {
        const a = ALERTS[am[1].toUpperCase()];
        const rest = [am[2], ...buf.slice(1)].join('\n').trim();
        blocks.push(<div key={k++} className={'callout ' + a.cls}><p className="callout-t">{a.icon} {a[lang]}</p><Markdown src={rest} lang={lang} /></div>);
      } else blocks.push(<blockquote key={k++}><Markdown src={buf.join('\n')} lang={lang} /></blockquote>);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++; }
      blocks.push(<ul key={k++}>{items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++; }
      blocks.push(<ol key={k++}>{items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ol>);
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const row = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = row(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(row(lines[i])); i++; }
      blocks.push(
        <div key={k++} className="table-wrap"><table>
          <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, n) => <td key={n}>{inline(c)}</td>)}</tr>)}</tbody>
        </table></div>
      );
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\s*[-*+]\s|\s*\d+[.)]\s|-{3,})/.test(lines[i])) { buf.push(lines[i]); i++; }
    if (!buf.length) { buf.push(lines[i]); i++; }
    blocks.push(<p key={k++}>{inline(buf.join(' '))}</p>);
  }
  return <>{blocks}</>;
}
