# Murray Lewin resume uplift

This folder contains an isolated, portable redesign of the existing resume website. The original root and `general/` sites are unchanged.

## Open locally

Open `index.html` directly in a browser. No build step, package manager, server, analytics or external runtime dependency is required.

## What changed

- Replaced tab-gated content with a single scannable narrative that remains complete without JavaScript.
- Made the approved portrait the first-viewport visual.
- Added searchable and filterable project evidence, persistent light/dark themes, active navigation and restrained reveal motion.
- Added keyboard support: `/` focuses experience search and `Escape` clears it.
- Added responsive mobile layouts, visible focus treatment, reduced-motion support and print styles.
- Packaged the portrait and PDF locally under `assets/`.

## Source ledger

The existing website and `Murray Lewin Resume - Fortescue (AU).docx` were used as factual sources. The matching PDF remains the downloadable source document.

| Category | Source | Use |
| --- | --- | --- |
| Identity, contact and location | Existing website and resume | Published |
| Deloitte and Macmahon experience | Resume project history and existing website | Published, client names remain generalised |
| Skills and systems | Resume skills lists and project evidence | Published |
| Education and university project | Resume and existing website | Published |
| Portrait | `Mlewin 09-2026.jpg` | Published locally |
| Referee contact details | Existing website | Deliberately omitted from the uplift to minimise third-party personal data |

No new result, qualification, title or project claim was introduced.

## Maintenance

- Update page copy and project cards in `index.html`.
- Update visual tokens and responsive rules in `styles.css`.
- Update filters, theme and enhancement logic in `app.js`.
- Replace the portrait and PDF in `assets/` while keeping their stable filenames.

## Existing-site review

The original pages have a data alignment risk: `data/experience.js` replaces job cards by array position, while `general/index.html` contains fewer and differently selected cards. This causes its final visible card to be replaced by the fifth data record rather than the intended Macmahon role. The uplift avoids positional hydration and keeps each role's content and filter metadata together.
