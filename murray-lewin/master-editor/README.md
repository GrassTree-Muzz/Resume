# Resume Master Editor

A local, offline tool for maintaining the four near-identical application resume
pages (`hays-defence-mechanical-engineer`, `kinexus-mechanical-engineer`,
`mad3-mechanical-engineer`, `horizon-power-data-engineer`) from one shared
source of truth, without hand-editing four copies of the work-experience list,
contact details, skills and education every time something changes.

## Start it up

1. Requires desktop **Microsoft Edge** or **Chrome** (File System Access API).
2. Serve this folder's parent (`murray-lewin/`) over a local loopback server -
   opening `master.html` directly via `file://` will not have folder-write
   permission. From the `murray-lewin` folder run, for example:
   ```
   python -m http.server 8000
   ```
3. Visit `http://localhost:8000/master-editor/master.html`.
4. Click **Open Project Folder...** and select the `murray-lewin` folder
   (the one containing `applications/`, `general/`, `data/` and
   `master-editor/`).

## Workflow

- **Shared Content** tab: work experience, contact details, PDF export
  filename, skills, education and community text. One edit here updates every
  registered iteration when you rebuild.
- **Iteration Content** tab: per-application fields (tagline, "why this role"
  section, at-a-glance facts, eligibility notes, output path).
- **Create** / **Duplicate** in the left navigator to add a new application.
  Duplicating never modifies the source iteration.
- **Preview** updates automatically as you type (right pane).
- **Save Project** writes `project.json`, backing up the previous version into
  `backups/` first.
- **Generate Selected** renders and writes only the highlighted iteration's
  output file.
- **Rebuild All** validates every iteration, then renders and writes all
  outputs whose content has changed since they were last generated. Each
  existing output file is backed up before being replaced. Results (generated
  / unchanged / failed) are shown in the log panel at the bottom.

## What is (and isn't) covered

Only the four listed application pages are registered iterations - they share
one template (`templates/document.html`) and one stylesheet/script
(`../application.css`, `../application.js`). The `general/`, `raptortech`,
`uplift` and top-level `murray-lewin/index.html` pages use different page
structures and are **not** managed by this tool; extending it to them would
need a second template variant.

## Recovery

Every overwritten `project.json` or output HTML file is copied into
`master-editor/backups/` (timestamped, `.bak`) before being replaced. If a
rebuild is interrupted partway, already-written files stay in place and the
log panel reports exactly which iterations succeeded, were unchanged, or
failed, so nothing is silently reported as fully complete.
