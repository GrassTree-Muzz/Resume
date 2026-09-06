---
name: job-application-website
description: "Use when creating or updating a tailored personal resume website for a new job application from a job posting, role brief, recruiter message, or company information, including recurring formatting updates. Extracts role requirements, maps them to verified experience, creates a focused static site, and validates the result."
---

# Job Application Website

Create a truthful, polished, role-specific resume website from a new application brief. The website should help a hiring manager understand the candidate's fit quickly, while remaining maintainable as part of the existing resume workspace.

## When to Use

Use this skill when the user provides any of the following:

- A job advertisement or pasted role description.
- A company, team, position title, or application URL.
- A request to tailor a resume, cover letter, portfolio page, or personal site for a role.
- A request to "make a website for this application" or "auto populate a new application site".

If the role information is incomplete, continue with clearly marked assumptions and ask only for information that blocks truthful completion. Never invent qualifications, employers, dates, metrics, tools, certifications, or achievements.

## Workspace Contract

This workspace is a static HTML resume site. Preserve its existing architecture unless the user explicitly asks for a framework migration:

- `index.html` is the main tailored resume page.
- `general/index.html` is the broad, non-targeted resume.
- `data/experience.js` is the reusable experience source of truth.
- Root-level images and PDFs are reusable assets.
- The existing profile image used by the PDF is the canonical website profile image. Reuse that exact asset and its crop unless the user supplies a replacement; do not create a second near-identical copy.
- New role-specific pages belong in a descriptive folder, for example `applications/<company>-<role>/index.html`, unless the user requests that the root page be replaced.
- When the user requests a recurring formatting or visual update, record that preference in this skill and apply it to the current page unless the user says the change is one-off.

Prefer plain HTML, CSS, and JavaScript. Reuse existing visual patterns, responsive behavior, accessibility conventions, and shared data where practical. Do not introduce a build system for a small static change.

## Inputs to Gather

Before editing, build a compact application brief:

```text
Company:
Role title:
Location / work pattern:
Role posting or source URL:
Hiring themes:
Required capabilities:
Preferred capabilities:
Key responsibilities:
Company or team context:
Application deadline:
Known constraints:
```

Use the supplied posting as the source for role requirements. If the URL cannot be fetched, work from pasted text and state that the site was tailored from the provided excerpt.

Also inventory the candidate's verified material from the workspace:

- Existing roles, dates, employers, projects, education, tools, and outcomes.
- Existing pages that show the correct contact details and asset paths.
- Existing PDFs or documents that contain authoritative resume content.
- Any client-confidentiality or anonymisation language already used.

## Core Workflow

### 1. Inspect locally before writing

Read the nearest relevant page and `data/experience.js` before making changes. Identify:

- The page structure and reusable sections.
- How role cards are populated.
- Asset paths relative to the new page.
- Existing theme, typography, navigation, and responsive rules.
- Existing scripts for tabs, filters, theme switching, dialogs, and update dates.

Form one local hypothesis about the implementation path and use the cheapest check that can disconfirm it. For example: "The new application can reuse the existing static page structure and only needs a new data-driven page; check that all required sections are present without a build step."

### 2. Analyse the role

Convert the posting into a priority matrix:

| Priority | Role requirement | Evidence from candidate | Site treatment |
|---|---|---|---|
| Must-have | Exact requirement | Verified role, project, or skill | Summary, mapping section, and relevant experience |
| Strong fit | Important responsibility | Direct or adjacent evidence | Highlighted project or experience bullet |
| Transferable | Useful but indirect | Honest related evidence | "Relevant experience" wording |
| Gap | Not evidenced | None | Omit or state the gap privately; never fabricate |

Rank evidence by directness, recency, measurable impact, and similarity to the target environment. Keep client names generalised when the source material does so.

### 3. Select the page strategy

Choose the smallest appropriate change:

- **New application page:** create `applications/<company>-<role>/index.html` when the existing pages should remain unchanged.
- **Replace the current target page:** update `index.html` only when the user clearly wants the new application to become the primary site.
- **Shared data improvement:** update `data/experience.js` only when the improvement is generally true and useful across applications.
- **New reusable asset:** add one only when it improves the role-specific experience and the asset is available or can be created lawfully.

Do not duplicate the entire general resume unless the page needs a deliberate, self-contained deployment path. If duplicating, keep the content synchronized deliberately and record which file is authoritative.

### 4. Populate the page

A tailored page should normally contain:

1. Candidate name and target-relevant headline.
2. Contact links and a working resume download where available.
3. A concise professional summary aligned to the role.
4. A "why this role" or "fit" section tied to the company's needs.
5. A prioritised experience section with the most relevant roles first.
6. A capability or skills section using terms from the posting only when supported.
7. Education, projects, community work, or references when relevant.
8. A clear confidentiality note when client names are generalised.

Write for scanning:

- Put the strongest evidence in the first viewport or first content panel.
- Use specific outcomes and scope when verified.
- Prefer concrete verbs over generic claims.
- Translate internal project language into language a hiring manager will recognise.
- Do not keyword-stuff or repeat the same claim in every section.
- Keep the page useful on mobile and when printed or opened without JavaScript.

### 5. Implement safely

When editing:

- Use the existing HTML/CSS/JavaScript style unless a small improvement is required.
- Use semantic headings, `main`, `nav`, sections, buttons, links, and accessible labels.
- Keep keyboard focus visible and maintain sufficient colour contrast.
- Respect `prefers-reduced-motion` if adding animation.
- Use relative paths that work from the new page's directory.
- Escape HTML content and avoid inserting untrusted posting text as executable markup.
- Keep external links safe with `target="_blank" rel="noopener noreferrer"`.
- Keep confidential client descriptions generalised.
- Never include private recruiter notes, salary expectations, passwords, API keys, or personal data that was not intended for publication.

For data-driven experience, prefer this shape:

```js
{
  role: 'Target-relevant role title',
  org: 'Employer · Generalised client or team',
  dates: 'Month year - Month year',
  tags: 'capability-one capability-two',
  paragraphs: ['Verified context and scope.'],
  bullets: [
    '<b>Capability</b> - specific evidence and outcome.'
  ]
}
```

Do not alter verified dates or facts just to match the posting. If a bullet is tailored, preserve the underlying meaning and use wording that remains defensible in an interview.

### 6. Validate the result

Run the cheapest available checks first, then broaden only as needed:

- Confirm the new file exists in the intended folder.
- Validate HTML structure and check for unclosed tags or malformed attributes.
- Check every local image, script, PDF, and stylesheet path from the new page.
- Confirm the profile image resolves to the same canonical asset used by the PDF and that its `alt` text describes the candidate accurately.
- Search for placeholder text such as `TODO`, `TBD`, `lorem`, or accidental template labels.
- Search for unsupported claims, invented metrics, or client names that should be anonymised.
- Verify navigation, tabs, accordions, filters, theme switching, dialogs, and downloads if present.
- Open the page in a browser at a desktop and narrow mobile viewport when browser tooling is available.
- Check that the first viewport communicates the target role and that no text overlaps or overflows.
- Check keyboard navigation, visible focus, heading order, image alt text, link labels, and reduced-motion behavior.
- If a local static server is needed, start one and report the URL. Do not add a server solely for a page that can be opened directly.

A successful completion should leave the user with:

- The tailored website page.
- A concise summary of what was matched to the role.
- Any assumptions or evidence gaps.
- The validation performed and any remaining limitations.

## Content Rules

These rules are mandatory:

- Truth beats keyword alignment.
- Never fabricate experience, tools, seniority, results, qualifications, or company knowledge.
- Never expose confidential client identities or internal data.
- Do not claim the candidate has used a technology solely because it appears in the job posting.
- Distinguish direct experience, adjacent experience, and interest in learning.
- Keep the general resume broadly accurate; target-specific claims belong on the application page unless they are universally true.
- Do not overwrite user changes in unrelated files.
- Do not commit or create branches unless explicitly requested.

## Output Checklist

Before finishing, confirm:

- [ ] The role, company, and page purpose are clear.
- [ ] The strongest verified evidence appears early.
- [ ] Every requirement highlighted on the page has supporting evidence.
- [ ] Gaps are not disguised as experience.
- [ ] Confidentiality language is preserved.
- [ ] The page works from its actual directory with relative paths.
- [ ] The profile image is the same canonical image used by the PDF, with a working path and accurate alt text.
- [ ] Mobile layout, keyboard access, focus states, and reduced motion are considered.
- [ ] No placeholder, debug text, secret, or unsupported claim remains.
- [ ] A focused executable or browser validation was run, or the limitation is reported.
- [ ] Any recurring formatting preference from the user was added to this skill and applied to the page.
