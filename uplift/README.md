# Murray Lewin resume uplift

This folder contains a compact, portable CV. The original root and `general/` sites are unchanged. The page uses a small portrait, restrained colours and plain experience rows rather than a photo background, promotional headings or statistics panels.

## Open locally

Open [index.html](index.html) directly in a browser. No build step, package manager, server, analytics or external runtime dependency is required.

## Reading tools

- Overview and full-detail views, with native disclosure controls for individual entries.
- Search across the actual experience text, combined with a capability filter. Matches are highlighted and their entries opened. Clearing the filter restores the earlier reading state.
- Short searches such as `AI` and `BI` match whole terms, not letters inside unrelated words. Multiple search terms must all occur in an entry.
- Selected skill links open supporting experience. Skills without an explicit project reference remain plain text; there are no inferred proficiency scores or generated claims.
- Print includes every experience entry, even when filtered or collapsed, then restores the on-screen state.
- Email copy with a selection fallback when clipboard permission is unavailable.
- Light theme by default, with an optional locally remembered dark theme. Search text is not stored or sent anywhere.
- `/` focuses search outside editable controls; `Escape` clears both search and focus. Every disclosure also works with the keyboard.
- Without JavaScript, all experience detail is open, navigation and downloads still work, and inactive enhancement controls are hidden.

## Source ledger

Copy was checked directly against the supplied `Murray Lewin Resume - Fortescue (AU).docx`, reading its Word XML paragraphs, and the existing website. Dates are abbreviated for display; responsibilities are condensed without adding outcomes. No graduation year, proficiency rating, employment duration or new result has been inferred.

The downloadable PDF is the existing Fortescue version, not a newly generated general resume. Its SHA-256 and the portrait's SHA-256 match the original supplied files. The PDF was not independently text-extracted during this redesign.

| Category | Source | Use |
| --- | --- | --- |
| Name, role, summary, contact and location | Word resume overview and contact details | Checked; published |
| MSO; Consultant Engineer; Jan 2026 - Current | Word resume work experience | Checked; published as Jan 2026 - Present |
| Framework; Consultant Engineer; Sep 2025 - Jan 2026 | Word resume continued project experience | Checked; published |
| Asset Health Index; Consultant Engineer; Mar - Sep 2025 | Word resume continued project experience | Checked; published |
| Labour Benchmarking; Data & Reporting Analyst; Jan - Mar 2025 | Word resume continued project experience | Checked; published |
| Substations; Engineering Analyst; Sep - Dec 2024 | Word resume continued project experience | Checked; published |
| Asset Tactics Review; Graduate Team Member; Jun - Sep 2024 | Word resume continued project experience | Checked; published |
| Macmahon; Storefront; Nov 2022 - Mar 2024; part time / ad hoc | Word resume previous experience | Checked; published |
| Technical and personal skills | Word resume skills and project bullets | Checked; published without ratings |
| BSc, majors, Hale School dates, university project and 90% mark | Word resume education and university experience | Checked; published |
| Community organisations and Duke of Edinburgh award | Word resume volunteering and achievements | Checked; published |
| Portrait | `Mlewin 09-2026.jpg` | Unchanged local copy |
| Referee contact details | Original documents | Not repeated on the page; the supplied PDF is unchanged |

Client identities remain generalised. The seven experience entries represent projects and roles, not seven separate jobs.

## Maintenance

- Update page copy and experience entries in [index.html](index.html). Keep each entry's ID stable for direct links.
- Search is indexed from `.searchable` text, not a separate dataset. `data-tags` supplies the capability grouping; `data-search-term` links a skill to text already in the experience.
- Update visual tokens and responsive rules in [styles.css](styles.css).
- Update reading controls, theme and print handling in [app.js](app.js).
- Replace the portrait and PDF in `assets/` while keeping their stable filenames.
- The seven bundled SVG icons live in `assets/icons/`, separate from personal content, and are from `lucide-static` 0.468.0. Their original licence is [assets/icons/LICENSE](assets/icons/LICENSE) and must stay with them; ISC requires the notice to be kept with redistributed copies. No third-party script runs on the page.

## Checks

- `node --check uplift/app.js`
- `npm exec --yes --package=html-validate@9.7.1 -- html-validate uplift/index.html`
- Browser checks at 320, 390, 768 and 1366 pixels: portrait loaded, no horizontal overflow or clipped headings and controls.
- Desktop and mobile screenshots reviewed.
- Search terms, literal special characters, combined filters, empty-state reset, skill links, native keyboard expansion and restoration of reading state checked.
- Print emulation included all seven entries with a search active and restored the previous state afterwards.
- JavaScript-disabled reading, theme persistence and reduced motion checked. Sampled text contrast was at least 5.73:1 in light mode and 6.48:1 in dark mode; this is not a full WCAG audit.

## Existing-site review

The original pages have a data alignment risk: `data/experience.js` replaces job cards by array position, while `general/index.html` contains fewer and differently selected cards. This causes its final visible card to be replaced by the fifth data record rather than the intended Macmahon role. The uplift avoids positional hydration and keeps each role's content and filter metadata together.
