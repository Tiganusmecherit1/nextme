# NextMe

PWA de fitness și sănătate (RO + EN): onboarding pe vârste (20–60+), planuri de sală și acasă după timp și zile, recunoașterea aparatelor din poză, mese românești și europene cu restricții, calorii din poza farfuriei, apă cu mementouri, calendar cu sincronizare Google Calendar, mișcare rapidă (dimineață, birou, scaun, seară), kinetoterapie după ghiduri clinice, check-in „schimbările corpului”, 100+ suplimente cu nivel de dovezi și lecții educaționale.

> NextMe nu înlocuiește medicul, nutriționistul sau kinetoterapeutul.

## Stack

- **Frontend:** Vite + React + TypeScript, PWA (manifest + service worker), fără framework CSS.
- **Backend:** Cloudflare Pages Functions (`functions/api/[[route]].ts`).
- **Bază de date:** Cloudflare D1 (`migrations/`).
- **AI foto:** Workers AI (`@cf/meta/llama-3.2-11b-vision-instruct`), limită zilnică per utilizator (`AI_DAILY_LIMIT`, implicit 5) ca să rămână pe planul gratuit.
- **Auth:** user + parolă (PBKDF2-SHA256, 100k iterații), cookie de sesiune HttpOnly.
- **Lecții:** fișiere Markdown în `content/learn/` (`index.json` + `ro/<id>.md`, `en/<id>.md`).

## Publicare pe Cloudflare (o singură dată)

1. Instalează dependențele: `npm install`
2. Autentificare: `npx wrangler login`
3. Creează baza de date: `npx wrangler d1 create nextme-db` și copiază `database_id` în `wrangler.toml`.
4. Aplică schema: `npm run db:remote`
5. Publică: `npm run deploy` (prima dată creează proiectul Pages `nextme`).
6. Prima analiză foto acceptă automat licența modelului Llama 3.2 Vision pe contul tău.

Alternativ, în dashboard: Workers & Pages → Create → Pages → Connect to Git → `nextme`, build `npm run build`, output `dist`. Legăturile (D1 `DB`, Workers AI `AI`) se iau din `wrangler.toml`.

## Dezvoltare locală

```bash
npm install
npm run db:local
npm run build && npx wrangler pages dev dist   # http://localhost:8788
```

## Surse principale

Mifflin-St Jeor (1990), EFSA (apă 2010, proteine 2012, fibre 2010, limite superioare), ISSN position stands, ACSM (progresie 2009, vârstnici), OMS 2020 (activitate fizică), NICE NG59 / NG226, Cochrane, NIH ODS. Sursele sunt citate în cod și în aplicație.

## Faza 2

Mementouri push de pe server (Web Push + Cron), social, provocări pe puncte între utilizatori, ceasuri (Health Connect / Apple Health prin aplicație nativă), pași automați.
