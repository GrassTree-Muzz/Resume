// Single rendering path shared by preview and generation.
// Builds the document structurally (arrays -> markup fragments) rather than
// doing text replacement against already-rendered HTML.

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Allows only <b> and <strong> markup already present in curated content
// (experience bullets/paragraphs). Everything else is escaped first, then
// the whitelisted tags are restored from their escaped form.
export function sanitizeRich(value) {
  var escaped = escapeHtml(value);
  return escaped
    .replace(/&lt;(\/?)(b|strong)&gt;/gi, '<$1$2>');
}

function renderKvList(items) {
  return (items || []).map(function (item) {
    return '<div class="kv"><b>' + escapeHtml(item.label) + '</b>' + escapeHtml(item.value) + '</div>';
  }).join('');
}

function renderFilterChips(chips) {
  return (chips || []).map(function (chip, index) {
    var pressed = index === 0 ? 'true' : 'false';
    return '<button class="chip" data-tag="' + escapeHtml(chip.tag) + '" aria-pressed="' + pressed + '">' + escapeHtml(chip.label) + '</button>';
  }).join('');
}

function renderExperienceJobs(jobs) {
  return (jobs || []).map(function (job) {
    var paragraphs = (job.paragraphs || []).map(function (p) { return '<p>' + sanitizeRich(p) + '</p>'; }).join('');
    var bullets = (job.bullets || []).map(function (b) { return '<li>' + sanitizeRich(b) + '</li>'; }).join('');
    return '<details class="card job" data-tags="' + escapeHtml(job.tags) + '"' + (job.open ? ' open' : '') + '>' +
      '<summary><span class="role">' + sanitizeRich(job.role) + '</span>' +
      '<span class="org">' + sanitizeRich(job.org) + '</span>' +
      '<span class="dates">' + escapeHtml(job.dates) + '</span></summary>' +
      '<div class="job-body">' + paragraphs + '<ul>' + bullets + '</ul></div></details>';
  }).join('');
}

function renderSkillsGroups(groups) {
  return (groups || []).map(function (group) {
    var chips = (group.chips || []).map(function (chip) {
      return '<span class="chip static">' + escapeHtml(chip) + '</span>';
    }).join('');
    return '<h2>' + escapeHtml(group.heading) + '</h2><div class="chips">' + chips + '</div>';
  }).join('');
}

function renderEducationBlock(education) {
  var entries = (education.entries || []).map(function (entry) {
    return '<div class="card"><div class="card-pad"><span class="role">' + escapeHtml(entry.role) + '</span>' +
      '<span class="org">' + escapeHtml(entry.org) + '</span>' +
      '<span class="dates">' + sanitizeRich(entry.dates) + '</span></div></div>';
  }).join('');
  var project = education.project;
  var projectBlock = '';
  if (project) {
    var bullets = (project.bullets || []).map(function (b) { return '<li>' + sanitizeRich(b) + '</li>'; }).join('');
    projectBlock = '<h2>University project</h2><details class="card job" open><summary><span class="role">' +
      escapeHtml(project.title) + '</span><span class="org">' + sanitizeRich(project.org) + '</span>' +
      '<span class="dates">' + escapeHtml(project.dates) + '</span></summary>' +
      '<div class="job-body"><ul>' + bullets + '</ul></div></details>';
  }
  return '<h2>Education</h2>' + entries + projectBlock;
}

function renderMoreBlocks(blocks) {
  return (blocks || []).map(function (block) {
    if (block.kvItems) {
      return '<h2>' + escapeHtml(block.heading) + '</h2><div class="card"><div class="card-pad">' + renderKvList(block.kvItems) + '</div></div>';
    }
    var cls = block.style === 'evidence' ? ' evidence' : '';
    return '<h2>' + escapeHtml(block.heading) + '</h2><div class="card' + cls + '"><div class="card-pad"><p style="margin:0">' + escapeHtml(block.text) + '</p></div></div>';
  }).join('');
}

function renderEvidenceBlock(text) {
  if (!text) { return ''; }
  return '<div class="card evidence"><div class="card-pad"><b>Evidence boundary</b><p>' + escapeHtml(text) + '</p></div></div>';
}

function renderSourceLinkBlock(url) {
  if (!url) { return ''; }
  return ' &middot; <a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">Source job advertisement</a>';
}

// Replaces {{TOKEN}} with escaped scalar text and {{{TOKEN}}} with
// already-safe structural HTML fragments built above.
function applyTokens(template, tokens) {
  var output = template;
  Object.keys(tokens.raw || {}).forEach(function (key) {
    output = output.split('{{{' + key + '}}}').join(tokens.raw[key]);
  });
  Object.keys(tokens.scalar || {}).forEach(function (key) {
    output = output.split('{{' + key + '}}').join(escapeHtml(tokens.scalar[key]));
  });
  return output;
}

export function renderDocument(templateText, shared, iteration) {
  var scalar = {
    META_DESCRIPTION: iteration.metaDescription,
    PAGE_TITLE: iteration.pageTitle,
    PHOTO_FILE_URL: shared.photoFile,
    EYEBROW: iteration.eyebrow,
    TAGLINE: iteration.tagline,
    INTRO: iteration.intro,
    PHONE_HREF: shared.contact.phoneHref,
    PHONE_DISPLAY: shared.contact.phoneDisplay,
    EMAIL: shared.contact.email,
    LINKEDIN_URL: shared.contact.linkedinUrl,
    PDF_FILE_URL: shared.pdf.file,
    PDF_DOWNLOAD_NAME: shared.pdf.downloadName,
    WHY_TAB_LABEL: iteration.whyTabLabel,
    ABOUT_LEAD: iteration.about.lead,
    ABOUT_SECONDARY: iteration.about.secondary,
    CONFIDENTIALITY_NOTE: shared.confidentialityNote,
    WHY_HEADING: iteration.why.heading,
    WHY_LEAD: iteration.why.lead,
    WHY_BODY: iteration.why.body,
    COMMUNITY_TEXT: shared.community.text,
    COMMUNITY_ACHIEVEMENT: shared.community.achievement
  };
  var raw = {
    ABOUT_KV: renderKvList(iteration.about.atAGlance),
    WHY_MAP_KV: renderKvList(iteration.why.mapItems),
    EVIDENCE_BOUNDARY_BLOCK: renderEvidenceBlock(iteration.why.evidenceBoundary),
    FILTER_CHIPS: renderFilterChips(shared.filterChips),
    EXPERIENCE_JOBS: renderExperienceJobs(shared.experience),
    SKILLS_GROUPS: renderSkillsGroups(shared.skills),
    EDUCATION_BLOCK: renderEducationBlock(shared.education),
    MORE_PRE_BLOCKS: renderMoreBlocks(iteration.more.preBlocks),
    MORE_POST_BLOCKS: renderMoreBlocks(iteration.more.postBlocks),
    SOURCE_LINK_BLOCK: renderSourceLinkBlock(iteration.sourceJobUrl)
  };
  return applyTokens(templateText, { scalar: scalar, raw: raw });
}

// Small, non-cryptographic fingerprint used only to flag "needs generation".
export function hashString(text) {
  var hash = 5381;
  for (var i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return (hash >>> 0).toString(16);
}

export function fingerprint(templateText, shared, iteration) {
  return hashString(templateText + JSON.stringify(shared) + JSON.stringify(iteration));
}
