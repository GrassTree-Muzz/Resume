---
name: resume-website-from-pdf
description: "Use when building a new personal resume or portfolio website from an existing PDF resume, profile photo, public LinkedIn URL, and optional supporting links. Creates a complete static site from scratch, verifies claims against supplied sources, and prepares a client-ready handoff."
---

# Resume Website From PDF

Build a polished, responsive personal resume website from a person's existing PDF resume and public professional links. This skill is designed for repeatable work for multiple people, so every project must protect client data, keep source facts traceable, and leave behind a maintainable site rather than a one-off mock-up.

## When to Use

Use this skill when the user asks to:

- Turn a PDF resume into a personal website.
- Build a resume or portfolio site from a CV and LinkedIn profile.
- Create a personal site for another person as a paid service.
- Start a new resume website project from supplied documents, profile images, or links.
- Rebuild an existing resume site using a PDF as the source of truth.

This skill creates a new site from source material. Use `job-application-website` when an existing site needs to be tailored to one specific job application.

## Source and Privacy Rules

Treat the supplied PDF as the primary factual source unless the client explicitly identifies a newer source. Public LinkedIn content and other supplied links may add context, but must not silently override the PDF.

Acceptable inputs include:

```text
Client name:
Target site folder or repository:
PDF path or upload:
Profile photo path:
LinkedIn URL:
Other public links:
Preferred contact details:
Target audience:
Visual preferences:
Sections to include:
Sections to omit:
Hosting target:
```

Mandatory safeguards:

- Never ask for or use a LinkedIn password, session cookie, private API token, or private connection data.
- Use only public URLs or content the client directly supplies.
- Do not scrape around access controls, paywalls, bot protection, or login requirements.
- Do not publish a phone number, email address, location, employer, client name, or reference contact unless the client supplied it for publication.
- Do not publish private recruiter notes, salary information, home addresses, identity documents, or personal data that is not needed for the site.
- Preserve client confidentiality and anonymise confidential employers or projects when the source does so.
- Never invent a result, job title, skill, date, qualification, testimonial, or project detail.
- Ask for clarification when two sources conflict materially; do not choose the more impressive version by default.

## Project Setup

Create a self-contained site in a descriptive folder, such as:

```text
sites/<client-slug>/
  index.html
  assets/
    profile.jpg
```

For this workspace, use a new folder unless the user explicitly asks to replace the existing resume site. Keep each client's files isolated so assets and personal data cannot be mixed between projects.

Prefer a plain static site for a single resume website:

- `index.html` for structure and content.
- A local stylesheet or a `<style>` block for visual design.
- A small local script only for useful interaction.
- Local image assets with relative paths.
- No framework, package manager, analytics, database, or server unless the project genuinely needs one.

If the client asks for a reusable product or many-site generator, stop and define the product architecture separately. Do not turn one client site into a multi-tenant system by accident.

## Workflow

### 1. Inspect the workspace and sources

Before editing, inspect:

- Existing site conventions and nearby pages.
- The PDF filename, page count, and available text.
- Image files and their dimensions.
- All supplied links and whether they are publicly reachable.
- Existing contact, download, or hosting requirements.

Form one local implementation hypothesis and one cheap check. Example: "The PDF contains enough structured text and the site can be delivered as one static page; check that the PDF has readable text and at least one usable profile image before scaffolding."

Do not begin broad design work until the minimum source material is available.

### 2. Build a source-of-truth ledger

Extract the PDF into a factual ledger before writing website copy:

| Category | Extracted fact | Source | Confidence | Public on site? |
|---|---|---|---|---|
| Identity | Name and professional headline | PDF page | Confirmed | Yes |
| Contact | Email, phone, location | PDF or client instruction | Confirmed | Only if approved |
| Experience | Employer, role, dates, responsibilities | PDF page | Confirmed | Yes |
| Education | Institution, qualification, years | PDF page | Confirmed | Yes |
| Skills | Tools and capabilities | PDF page / public link | Confirmed or contextual | Yes if relevant |
| Link | LinkedIn or portfolio URL | Client instruction | Confirmed | Yes |

Separate content into:

- **Verified:** can be stated directly.
- **Contextual:** can be stated only with careful wording and source attribution.
- **Unknown:** omit from the website and record as an open question.

Keep the original PDF as a downloadable resume when the client approves publishing it. Use an accessible link label such as `Download resume (PDF)` and never expose a local filesystem path.

### 3. Review LinkedIn and public links

Use public links to confirm presentation and discover useful context, not to manufacture new claims.

For each link:

1. Confirm the URL and display name.
2. Read only publicly available information.
3. Compare dates, titles, and skills with the PDF.
4. Record conflicts in the ledger.
5. Use the link as an external reference unless the client asks to reproduce specific content.

Prefer linking to LinkedIn over copying an entire profile. If a page cannot be fetched, keep the link and state that the website uses the supplied PDF as its source.

### 4. Design the information architecture

A strong first version normally includes:

1. **Header:** name, professional headline, profile image, and approved contact actions.
2. **Summary:** two to four sentences that describe the person and their value.
3. **Experience:** reverse chronological roles with concise, scannable evidence.
4. **Capabilities:** grouped skills supported by the PDF or approved links.
5. **Education and credentials:** only verified qualifications.
6. **Selected work:** projects, publications, awards, or volunteer work when relevant.
7. **Links:** LinkedIn, portfolio, GitHub, or other approved public destinations.
8. **Resume download:** the supplied PDF, if publication is approved.

Choose the smallest structure that serves the person's goals. Do not add empty sections simply to make the page look complete.

### 5. Create the visual system

Make the design feel intentional and specific to the person while remaining professional:

- Define colour, surface, text, muted text, accent, border, and focus variables.
- Use a clear typographic hierarchy and a purposeful font choice that works without a build step.
- Keep the profile image prominent and use the exact supplied image unless the client provides a replacement.
- Use restrained motion for page load or section reveals and respect `prefers-reduced-motion`.
- Use real profile, project, or work images when they help explain the person's work.
- Avoid decorative cards nested inside cards, excessive gradients, generic dashboard layouts, and unhelpful marketing copy.
- Make the first viewport communicate who the person is and what they do.
- Keep buttons and links clear, familiar, keyboard accessible, and appropriately labelled.
- Ensure mobile layouts do not crop important text, overflow controls, or hide contact actions.

The site must still be useful when JavaScript is disabled. Progressive enhancement is preferred over making navigation or resume content depend on a script.

### 6. Implement the site

While editing:

- Use semantic HTML: `header`, `nav`, `main`, `section`, `article`, and `footer` where appropriate.
- Use one logical `h1`, then ordered heading levels.
- Give every meaningful image accurate alt text; use empty alt text only for decorative images.
- Use relative paths so the site works from its delivered folder.
- Use `target="_blank" rel="noopener noreferrer"` for external links.
- Add visible `:focus-visible` styles.
- Keep link text meaningful when read out of context.
- Do not expose raw PDF extraction artefacts, hidden metadata, comments, or source paths.
- Escape text imported from PDFs or web pages before inserting it into HTML.
- Keep copy concise and faithful; edit for clarity without changing facts.
- Avoid inline third-party scripts, tracking, and remote assets unless the client has approved them.

Recommended content pattern:

```html
<article class="experience-item">
  <h3>Role title</h3>
  <p class="experience-meta">Employer · Location · Dates</p>
  <ul>
    <li>Verified responsibility or outcome.</li>
    <li>Verified tool, scope, or contribution.</li>
  </ul>
</article>
```

### 7. Prepare a client-ready handoff

Leave the project understandable to someone else:

- Keep the source PDF and approved image in a clearly named asset location.
- Use a descriptive, stable filename for the published PDF.
- Avoid retaining temporary extraction files or private source notes in the public site folder.
- Include a short `README.md` only when setup, hosting, or future editing instructions are needed.
- Record which source files were used and any assumptions that remain.
- Explain where the client should update their experience, links, image, and PDF in future.
- Never commit credentials, private documents, or unapproved personal data.

## Validation

Run focused checks after implementation:

- Confirm the expected files exist and the site opens from its actual folder.
- Check every local image, PDF, script, and stylesheet path.
- Confirm the profile image on the site is the approved source image.
- Confirm the resume download opens and is not an HTML error page.
- Check the LinkedIn and other public URLs for correct destination and safe attributes.
- Search for `TODO`, `TBD`, `lorem`, placeholder links, debug output, and accidental source paths.
- Check for unsupported claims by comparing page copy with the source ledger.
- Validate heading order, image alt text, form labels if any, focus states, colour contrast, and keyboard navigation.
- Test desktop and narrow mobile viewports for overflow, overlap, clipped text, and broken interactions.
- Test with JavaScript disabled when the page uses scripts.
- Check `prefers-reduced-motion` behavior.
- Open the PDF and confirm the portrait and visible content match the site where the same assets are intended to be reused.
- Use an HTML validator or browser console check when available.

If browser tooling is available, capture at least one desktop and one mobile screenshot for review. If a local server is necessary, start it and report the URL; otherwise, provide the local HTML path.

## Completion Checklist

- [ ] The site is in an isolated client folder.
- [ ] The PDF was treated as the primary factual source.
- [ ] LinkedIn was used only through public, approved links.
- [ ] Conflicts and assumptions are recorded.
- [ ] No unsupported or private information was published.
- [ ] The profile image is approved and correctly referenced.
- [ ] The resume download and external links work.
- [ ] The page is responsive, keyboard accessible, and usable without JavaScript.
- [ ] Mobile, desktop, reduced-motion, and overflow checks were completed.
- [ ] No credentials, temporary files, source paths, or debug content are included.
- [ ] The client handoff location and future update points are clear.
