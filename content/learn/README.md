# NextMe – modulul educațional („Învață”)

60 de lecții în română (~27.000 de cuvinte, ~55–60 de pagini), grupate în 13 capitole.

## Format

- `index.json` – capitolele, în ordine, cu `id`, `order`, `icon`, `title.ro` / `title.en` și lista de lecții.
- `ro/<lessonId>.md` – o lecție. Versiunile în engleză vor sta în `en/<lessonId>.md`; aplicația folosește `ro/` dacă lipsește fișierul `en/`.

Fiecare lecție are frontmatter YAML simplu:

```yaml
id: 35-glicemia
chapter: glicemie
order: 35
title: "..."
summary: ...
readMinutes: 4
sources:
  - label: "Autor. Titlu. Revistă, an"
    url: "https://doi.org/..."
```

Corpul e Markdown simplu: titluri `#`/`##`, paragrafe, **bold**, liste fără imbricare, tabele GFM și casete:

- `> [!TIP]` – În practică
- `> [!NOTE]` – Știai că
- `> [!WARNING]` – Mit vs realitate / atenție
- `> [!CAUTION]` – disclaimer medical / când mergi la medic

Fiecare lecție se termină cu `## Pe scurt`. Fără HTML brut și fără imagini.

## Surse

Ghiduri oficiale (OMS, EFSA, ACSM, ADA, EWGSOP2) și studii publicate în reviste cu peer review. Unde nu am putut confirma un DOI exact, linkul duce la căutarea titlului în PubMed sau în arhiva OMS, ca să fie mereu verificabil.

## Disclaimer

Conținutul e educațional și nu înlocuiește consultul medical. Aplicația afișează disclaimerul medical pe ecranul modulului și la finalul fiecărei lecții.
