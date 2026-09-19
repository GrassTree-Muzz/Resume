import { renderDocument, fingerprint, hashString } from './render.js';
import { validateProject, validateIteration, validateAllIterations, isSafeId, isSafeOutputPath, slugify } from './validate.js';

const state = {
  rootHandle: null,
  editorDirHandle: null,
  projectData: null,
  templateText: null,
  selectedId: null,
  view: 'shared',
  projectLoadedModified: null,
  dirty: false
};

const $ = (id) => document.getElementById(id);

function log(message, kind) {
  const line = document.createElement('div');
  line.className = 'log-line' + (kind ? ' log-' + kind : '');
  const stamp = new Date().toLocaleTimeString();
  line.textContent = '[' + stamp + '] ' + message;
  $('log').prepend(line);
}

function setStatus(text) {
  $('statusText').textContent = text;
}

function markDirty() {
  state.dirty = true;
  $('unsavedBadge').hidden = false;
}

function clearDirty() {
  state.dirty = false;
  $('unsavedBadge').hidden = true;
}

// ---------- File System Access helpers ----------

async function getSubDirHandle(startHandle, relativePath, create) {
  const parts = relativePath.split('/').filter(Boolean);
  let handle = startHandle;
  for (let i = 0; i < parts.length; i++) {
    handle = await handle.getDirectoryHandle(parts[i], { create: !!create });
  }
  return handle;
}

async function getFileHandleForPath(rootHandle, relativePath, create) {
  const parts = relativePath.split('/').filter(Boolean);
  const fileName = parts.pop();
  const dirHandle = await getSubDirHandle(rootHandle, parts.join('/'), create);
  return dirHandle.getFileHandle(fileName, { create: !!create });
}

async function readTextFile(fileHandle) {
  const file = await fileHandle.getFile();
  return { text: await file.text(), lastModified: file.lastModified };
}

async function writeTextFile(fileHandle, text) {
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function fileExists(rootHandle, relativePath) {
  try {
    await getFileHandleForPath(rootHandle, relativePath, false);
    return true;
  } catch (err) {
    return false;
  }
}

async function backupContent(prefix, content) {
  const backupsDir = await state.rootHandle.getDirectoryHandle('master-editor', { create: true })
    .then((d) => d.getDirectoryHandle('backups', { create: true }));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const handle = await backupsDir.getFileHandle(prefix + '-' + stamp + '.bak', { create: true });
  await writeTextFile(handle, content);
}

// ---------- Remembering the last opened folder (IndexedDB) ----------

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('resume-master-editor', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('handles'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly');
    const req = tx.objectStore('handles').get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// ---------- Project lifecycle ----------

async function loadProjectFromRootHandle(rootHandle) {
  const editorDirHandle = await rootHandle.getDirectoryHandle('master-editor', { create: true });
  const projectFileHandle = await editorDirHandle.getFileHandle('project.json', { create: false });
  const { text, lastModified } = await readTextFile(projectFileHandle);
  const data = JSON.parse(text);
  const errors = validateProject(data);
  if (errors.length) {
    log('Project file failed validation: ' + errors.join(' '), 'error');
    return;
  }
  const templateHandle = await editorDirHandle.getDirectoryHandle('templates', { create: true })
    .then((d) => d.getFileHandle('document.html', { create: false }));
  const templateText = (await readTextFile(templateHandle)).text;

  state.rootHandle = rootHandle;
  state.editorDirHandle = editorDirHandle;
  state.projectData = data;
  state.templateText = templateText;
  state.projectLoadedModified = lastModified;
  state.selectedId = data.iterations[0] ? data.iterations[0].id : null;
  clearDirty();

  $('actionBar').hidden = false;
  setStatus('Project opened: ' + data.project.title);
  log('Opened project "' + data.project.title + '" with ' + data.iterations.length + ' iteration(s).', 'ok');
  renderAll();

  idbSet('lastRootHandle', rootHandle).catch(() => {});
}

async function openProject() {
  if (!window.showDirectoryPicker) {
    setStatus('This browser cannot open folders. Use desktop Edge or Chrome.');
    log('File System Access API is not available in this browser.', 'error');
    return;
  }
  try {
    // "id" lets the browser remember this picker's last visited location across sessions.
    const rootHandle = await window.showDirectoryPicker({ id: 'murray-lewin-project-root' });
    await loadProjectFromRootHandle(rootHandle);
  } catch (err) {
    if (err.name === 'AbortError') { return; }
    log('Failed to open project: ' + err.message, 'error');
  }
}

async function reopenLastProject() {
  const handle = await idbGet('lastRootHandle').catch(() => null);
  if (!handle) { log('No previously opened folder is remembered yet.', 'warn'); return; }
  try {
    let permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') { permission = await handle.requestPermission({ mode: 'readwrite' }); }
    if (permission !== 'granted') { log('Permission to reopen the last folder was not granted.', 'error'); return; }
    await loadProjectFromRootHandle(handle);
  } catch (err) {
    log('Failed to reopen the last folder: ' + err.message, 'error');
  }
}

async function saveProject({ silent } = {}) {
  if (!state.projectData) { return false; }
  const errors = validateProject(state.projectData);
  if (errors.length) {
    log('Save blocked - project data is invalid: ' + errors.join(' '), 'error');
    return false;
  }
  try {
    const projectFileHandle = await state.editorDirHandle.getFileHandle('project.json', { create: true });
    const current = await readTextFile(projectFileHandle);
    if (state.projectLoadedModified && current.lastModified !== state.projectLoadedModified) {
      const proceed = window.confirm('project.json was modified outside this editor since it was loaded. Overwrite anyway? Cancel to reload manually.');
      if (!proceed) { log('Save cancelled - external change detected in project.json.', 'warn'); return false; }
    }
    if (current.text && current.text.trim()) {
      await backupContent('project', current.text);
    }
    const nextText = JSON.stringify(state.projectData, null, 2);
    await writeTextFile(projectFileHandle, nextText);
    const refreshed = await readTextFile(projectFileHandle);
    state.projectLoadedModified = refreshed.lastModified;
    clearDirty();
    if (!silent) { log('Project saved.', 'ok'); }
    return true;
  } catch (err) {
    log('Save failed: ' + err.message, 'error');
    return false;
  }
}

// ---------- Rendering / fingerprints ----------

function getIteration(id) {
  if (!state.projectData) { return null; }
  return (state.projectData.iterations || []).find((it) => it.id === id) || null;
}

function currentFingerprint(iteration) {
  return fingerprint(state.templateText, state.projectData.shared, iteration);
}

function generationStatus(iteration) {
  const record = state.projectData.generationRecords[iteration.id];
  if (!record) { return 'needs-generation'; }
  return record.hash === currentFingerprint(iteration) ? 'up-to-date' : 'needs-generation';
}

function updatePreview() {
  const iteration = getIteration(state.selectedId);
  const frame = $('previewFrame');
  if (!iteration) { frame.srcdoc = '<p style="font:14px sans-serif;padding:20px">No iteration selected.</p>'; return; }
  try {
    const html = renderDocument(state.templateText, state.projectData.shared, iteration);
    // srcdoc resolves relative URLs against master.html's own location, not the
    // iteration's real output folder, so inject a preview-only <base> to match it.
    frame.srcdoc = html.replace('<head>', '<head><base href="../' + iteration.outputPath + '">');
  } catch (err) {
    frame.srcdoc = '<pre style="color:#b00;padding:20px">Preview error: ' + err.message + '</pre>';
  }
}

// ---------- Navigator ----------

function renderNavigator() {
  const list = $('iterationList');
  list.innerHTML = '';
  if (!state.projectData) { return; }
  (state.projectData.iterations || []).forEach((iteration) => {
    const item = document.createElement('li');
    item.className = 'iteration-item' + (iteration.id === state.selectedId ? ' selected' : '');
    const status = generationStatus(iteration);
    item.innerHTML =
      '<button class="iteration-select" type="button">' +
      '<span class="iteration-name"></span>' +
      '<span class="badge badge-' + status + '">' + (status === 'up-to-date' ? 'Up to date' : 'Needs generation') + '</span>' +
      '</button>';
    item.querySelector('.iteration-name').textContent = iteration.displayName || iteration.id;
    item.querySelector('.iteration-select').addEventListener('click', () => {
      state.selectedId = iteration.id;
      renderAll();
    });
    list.appendChild(item);
  });
}

// ---------- Form builders ----------

function field(labelText, inputEl) {
  const wrap = document.createElement('label');
  wrap.className = 'field';
  const span = document.createElement('span');
  span.textContent = labelText;
  wrap.appendChild(span);
  wrap.appendChild(inputEl);
  return wrap;
}

function textInput(value, onChange, multiline) {
  const input = document.createElement(multiline ? 'textarea' : 'input');
  if (!multiline) { input.type = 'text'; }
  input.value = value || '';
  input.addEventListener('input', () => { onChange(input.value); markDirty(); renderNavigator(); updatePreview(); });
  return input;
}

function kvListEditor(items, onChange) {
  const container = document.createElement('div');
  container.className = 'kv-editor';
  function redraw() {
    container.innerHTML = '';
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'kv-row';
      const labelInput = textInput(item.label, (v) => { item.label = v; onChange(items); });
      labelInput.placeholder = 'Label';
      const valueInput = textInput(item.value, (v) => { item.value = v; onChange(items); });
      valueInput.placeholder = 'Value';
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'small-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => { items.splice(index, 1); onChange(items); redraw(); markDirty(); updatePreview(); });
      row.appendChild(labelInput);
      row.appendChild(valueInput);
      row.appendChild(removeBtn);
      container.appendChild(row);
    });
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'small-btn';
    addBtn.textContent = '+ Add row';
    addBtn.addEventListener('click', () => { items.push({ label: '', value: '' }); onChange(items); redraw(); markDirty(); updatePreview(); });
    container.appendChild(addBtn);
  }
  redraw();
  return container;
}

function stringListEditor(items, onChange) {
  const container = document.createElement('div');
  container.className = 'string-list-editor';
  function redraw() {
    container.innerHTML = '';
    items.forEach((value, index) => {
      const row = document.createElement('div');
      row.className = 'string-row';
      const input = textInput(value, (v) => { items[index] = v; onChange(items); });
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'small-btn';
      removeBtn.textContent = 'x';
      removeBtn.addEventListener('click', () => { items.splice(index, 1); onChange(items); redraw(); markDirty(); updatePreview(); });
      row.appendChild(input);
      row.appendChild(removeBtn);
      container.appendChild(row);
    });
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'small-btn';
    addBtn.textContent = '+ Add item';
    addBtn.addEventListener('click', () => { items.push(''); onChange(items); redraw(); markDirty(); updatePreview(); });
    container.appendChild(addBtn);
  }
  redraw();
  return container;
}

function renderSharedForm(container) {
  const shared = state.projectData.shared;
  const note = document.createElement('p');
  note.className = 'panel-note';
  note.textContent = 'Shared content applies to every registered document. Rebuild All is required to publish these edits.';
  container.appendChild(note);

  const sections = [
    { title: 'Contact', build: () => {
      const wrap = document.createElement('div');
      wrap.appendChild(field('Phone (display)', textInput(shared.contact.phoneDisplay, (v) => shared.contact.phoneDisplay = v)));
      wrap.appendChild(field('Phone (tel href)', textInput(shared.contact.phoneHref, (v) => shared.contact.phoneHref = v)));
      wrap.appendChild(field('Email', textInput(shared.contact.email, (v) => shared.contact.email = v)));
      wrap.appendChild(field('LinkedIn URL', textInput(shared.contact.linkedinUrl, (v) => shared.contact.linkedinUrl = v)));
      return wrap;
    } },
    { title: 'PDF export', build: () => {
      const wrap = document.createElement('div');
      wrap.appendChild(field('PDF file (relative to project root)', textInput(shared.pdf.file, (v) => shared.pdf.file = v)));
      wrap.appendChild(field('PDF download filename', textInput(shared.pdf.downloadName, (v) => shared.pdf.downloadName = v)));
      return wrap;
    } },
    { title: 'Confidentiality note', build: () => field('Note text', textInput(shared.confidentialityNote, (v) => shared.confidentialityNote = v, true)) },
    { title: 'Work experience', build: () => renderExperienceEditor(shared) },
    { title: 'Skills groups', build: () => renderSkillsEditor(shared) },
    { title: 'Education', build: () => renderEducationEditor(shared) },
    { title: 'Community', build: () => {
      const wrap = document.createElement('div');
      wrap.appendChild(field('Community text', textInput(shared.community.text, (v) => shared.community.text = v, true)));
      wrap.appendChild(field('Achievement line', textInput(shared.community.achievement, (v) => shared.community.achievement = v)));
      return wrap;
    } }
  ];

  sections.forEach((section) => {
    const details = document.createElement('details');
    details.open = true;
    const summary = document.createElement('summary');
    summary.textContent = section.title;
    details.appendChild(summary);
    details.appendChild(section.build());
    container.appendChild(details);
  });
}

function renderExperienceEditor(shared) {
  const container = document.createElement('div');
  function redraw() {
    container.innerHTML = '';
    shared.experience.forEach((job, index) => {
      const card = document.createElement('div');
      card.className = 'job-editor-card';
      card.appendChild(field('Role', textInput(job.role, (v) => { job.role = v; }, true)));
      card.appendChild(field('Organisation', textInput(job.org, (v) => { job.org = v; }, true)));
      card.appendChild(field('Dates', textInput(job.dates, (v) => { job.dates = v; })));
      card.appendChild(field('Tags (space separated)', textInput(job.tags, (v) => { job.tags = v; })));
      const paraLabel = document.createElement('div');
      paraLabel.className = 'sub-label';
      paraLabel.textContent = 'Paragraphs';
      card.appendChild(paraLabel);
      card.appendChild(stringListEditor(job.paragraphs, (v) => { job.paragraphs = v; }));
      const bulletLabel = document.createElement('div');
      bulletLabel.className = 'sub-label';
      bulletLabel.textContent = 'Bullets';
      card.appendChild(bulletLabel);
      card.appendChild(stringListEditor(job.bullets, (v) => { job.bullets = v; }));
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'small-btn danger';
      removeBtn.textContent = 'Remove role';
      removeBtn.addEventListener('click', () => { shared.experience.splice(index, 1); redraw(); markDirty(); renderNavigator(); updatePreview(); });
      card.appendChild(removeBtn);
      container.appendChild(card);
    });
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'small-btn';
    addBtn.textContent = '+ Add role';
    addBtn.addEventListener('click', () => {
      shared.experience.push({ role: 'New role', org: 'Organisation', dates: 'Dates', tags: '', open: false, paragraphs: [], bullets: [] });
      redraw(); markDirty(); renderNavigator(); updatePreview();
    });
    container.appendChild(addBtn);
  }
  redraw();
  return container;
}

function renderSkillsEditor(shared) {
  const container = document.createElement('div');
  function redraw() {
    container.innerHTML = '';
    shared.skills.forEach((group) => {
      const card = document.createElement('div');
      card.className = 'job-editor-card';
      card.appendChild(field('Heading', textInput(group.heading, (v) => { group.heading = v; markDirty(); renderNavigator(); updatePreview(); })));
      const chipLabel = document.createElement('div');
      chipLabel.className = 'sub-label';
      chipLabel.textContent = 'Chips';
      card.appendChild(chipLabel);
      card.appendChild(stringListEditor(group.chips, (v) => { group.chips = v; }));
      container.appendChild(card);
    });
  }
  redraw();
  return container;
}

function renderEducationEditor(shared) {
  const container = document.createElement('div');
  shared.education.entries.forEach((entry) => {
    container.appendChild(field('Role/Title', textInput(entry.role, (v) => entry.role = v)));
    container.appendChild(field('Organisation', textInput(entry.org, (v) => entry.org = v)));
    container.appendChild(field('Dates', textInput(entry.dates, (v) => entry.dates = v)));
  });
  const project = shared.education.project;
  container.appendChild(field('Project title', textInput(project.title, (v) => project.title = v)));
  container.appendChild(field('Project org', textInput(project.org, (v) => project.org = v)));
  container.appendChild(field('Project dates', textInput(project.dates, (v) => project.dates = v)));
  const bulletLabel = document.createElement('div');
  bulletLabel.className = 'sub-label';
  bulletLabel.textContent = 'Project bullets';
  container.appendChild(bulletLabel);
  container.appendChild(stringListEditor(project.bullets, (v) => project.bullets = v));
  return container;
}

function renderIterationForm(container) {
  const iteration = getIteration(state.selectedId);
  if (!iteration) { container.textContent = 'No iteration selected.'; return; }

  const meta = document.createElement('div');
  meta.className = 'field-grid';
  meta.appendChild(field('Display name', textInput(iteration.displayName, (v) => iteration.displayName = v)));
  meta.appendChild(field('Output path', textInput(iteration.outputPath, (v) => iteration.outputPath = v)));
  meta.appendChild(field('Source job URL', textInput(iteration.sourceJobUrl || '', (v) => iteration.sourceJobUrl = v)));
  meta.appendChild(field('Page title', textInput(iteration.pageTitle, (v) => iteration.pageTitle = v)));
  meta.appendChild(field('Meta description', textInput(iteration.metaDescription, (v) => iteration.metaDescription = v)));
  meta.appendChild(field('Eyebrow', textInput(iteration.eyebrow, (v) => iteration.eyebrow = v)));
  meta.appendChild(field('Tagline', textInput(iteration.tagline, (v) => iteration.tagline = v)));
  meta.appendChild(field('Why-tab label', textInput(iteration.whyTabLabel, (v) => iteration.whyTabLabel = v)));
  container.appendChild(meta);
  container.appendChild(field('Intro', textInput(iteration.intro, (v) => iteration.intro = v, true)));

  const aboutDetails = document.createElement('details');
  aboutDetails.open = true;
  aboutDetails.innerHTML = '<summary>About</summary>';
  aboutDetails.appendChild(field('Lead paragraph', textInput(iteration.about.lead, (v) => iteration.about.lead = v, true)));
  aboutDetails.appendChild(field('Secondary paragraph', textInput(iteration.about.secondary, (v) => iteration.about.secondary = v, true)));
  const aboutKvLabel = document.createElement('div');
  aboutKvLabel.className = 'sub-label';
  aboutKvLabel.textContent = 'At a glance';
  aboutDetails.appendChild(aboutKvLabel);
  aboutDetails.appendChild(kvListEditor(iteration.about.atAGlance, (v) => iteration.about.atAGlance = v));
  container.appendChild(aboutDetails);

  const whyDetails = document.createElement('details');
  whyDetails.open = true;
  whyDetails.innerHTML = '<summary>Why this role</summary>';
  whyDetails.appendChild(field('Heading', textInput(iteration.why.heading, (v) => iteration.why.heading = v)));
  whyDetails.appendChild(field('Lead paragraph', textInput(iteration.why.lead, (v) => iteration.why.lead = v, true)));
  whyDetails.appendChild(field('Body paragraph', textInput(iteration.why.body, (v) => iteration.why.body = v, true)));
  const mapLabel = document.createElement('div');
  mapLabel.className = 'sub-label';
  mapLabel.textContent = 'How I map to the role';
  whyDetails.appendChild(mapLabel);
  whyDetails.appendChild(kvListEditor(iteration.why.mapItems, (v) => iteration.why.mapItems = v));
  whyDetails.appendChild(field('Evidence boundary (optional)', textInput(iteration.why.evidenceBoundary || '', (v) => iteration.why.evidenceBoundary = v, true)));
  container.appendChild(whyDetails);

  const moreDetails = document.createElement('details');
  moreDetails.innerHTML = '<summary>More / eligibility</summary>';
  const preLabel = document.createElement('div');
  preLabel.className = 'sub-label';
  preLabel.textContent = 'Blocks shown before Community (e.g. Eligibility)';
  moreDetails.appendChild(preLabel);
  moreDetails.appendChild(renderMoreBlocksEditor(iteration.more.preBlocks));
  const postLabel = document.createElement('div');
  postLabel.className = 'sub-label';
  postLabel.textContent = 'Blocks shown after Community (e.g. Evidence note)';
  moreDetails.appendChild(postLabel);
  moreDetails.appendChild(renderMoreBlocksEditor(iteration.more.postBlocks));
  container.appendChild(moreDetails);
}

function renderMoreBlocksEditor(blocks) {
  const container = document.createElement('div');
  function redraw() {
    container.innerHTML = '';
    blocks.forEach((block, index) => {
      const card = document.createElement('div');
      card.className = 'job-editor-card';
      card.appendChild(field('Heading', textInput(block.heading, (v) => block.heading = v)));
      if (block.kvItems) {
        card.appendChild(kvListEditor(block.kvItems, (v) => block.kvItems = v));
      } else {
        card.appendChild(field('Text', textInput(block.text || '', (v) => block.text = v, true)));
      }
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'small-btn danger';
      removeBtn.textContent = 'Remove block';
      removeBtn.addEventListener('click', () => { blocks.splice(index, 1); redraw(); markDirty(); updatePreview(); });
      container.appendChild(card);
    });
    const addKvBtn = document.createElement('button');
    addKvBtn.type = 'button';
    addKvBtn.className = 'small-btn';
    addKvBtn.textContent = '+ Add key/value block';
    addKvBtn.addEventListener('click', () => { blocks.push({ heading: 'Heading', kvItems: [] }); redraw(); markDirty(); updatePreview(); });
    const addTextBtn = document.createElement('button');
    addTextBtn.type = 'button';
    addTextBtn.className = 'small-btn';
    addTextBtn.textContent = '+ Add text block';
    addTextBtn.addEventListener('click', () => { blocks.push({ heading: 'Heading', text: '' }); redraw(); markDirty(); updatePreview(); });
    container.appendChild(addKvBtn);
    container.appendChild(addTextBtn);
  }
  redraw();
  return container;
}

function renderAll() {
  renderNavigator();
  const container = $('editorForm');
  container.innerHTML = '';
  if (!state.projectData) {
    container.innerHTML = '<p class="panel-note">Open a project folder to start editing.</p>';
    updatePreview();
    return;
  }
  if (state.view === 'shared') {
    renderSharedForm(container);
  } else {
    renderIterationForm(container);
  }
  updatePreview();
}

// ---------- Create / duplicate ----------

function blankIteration(id, displayName, outputPath) {
  return {
    id, displayName, outputPath,
    sourceJobUrl: '',
    pageTitle: 'Murray Lewin - ' + displayName,
    metaDescription: 'Murray Lewin application resume.',
    eyebrow: 'Application resume &middot; ' + displayName,
    tagline: 'Role title &middot; positioning statement',
    intro: 'Short introduction tailored to this application.',
    whyTabLabel: 'Why this role',
    about: { lead: '', secondary: '', atAGlance: [] },
    why: { heading: 'Why this role', lead: '', body: '', mapItems: [], evidenceBoundary: '' },
    more: { preBlocks: [], postBlocks: [] }
  };
}

function createIteration(newId, displayName) {
  const id = slugify(newId || displayName);
  if (!isSafeId(id)) { log('Cannot create iteration: invalid id.', 'error'); return; }
  if (getIteration(id)) { log('An iteration with id "' + id + '" already exists.', 'error'); return; }
  const outputPath = 'applications/' + id + '/index.html';
  if (!isSafeOutputPath(outputPath)) { log('Cannot create iteration: unsafe output path.', 'error'); return; }
  const iteration = blankIteration(id, displayName || id, outputPath);
  state.projectData.iterations.push(iteration);
  state.selectedId = id;
  markDirty();
  log('Created new iteration "' + id + '".', 'ok');
  renderAll();
}

function duplicateIteration(sourceId, newId, newDisplayName) {
  const source = getIteration(sourceId);
  if (!source) { return; }
  const id = slugify(newId || (source.id + '-copy'));
  if (!isSafeId(id) || getIteration(id)) { log('Cannot duplicate: id "' + id + '" is invalid or already exists.', 'error'); return; }
  const outputPath = 'applications/' + id + '/index.html';
  const clone = JSON.parse(JSON.stringify(source));
  clone.id = id;
  clone.displayName = newDisplayName || (source.displayName + ' (copy)');
  clone.outputPath = outputPath;
  state.projectData.iterations.push(clone);
  state.selectedId = id;
  markDirty();
  log('Duplicated "' + source.id + '" as "' + id + '". Original is unchanged.', 'ok');
  renderAll();
}

function removeIteration(id) {
  const index = state.projectData.iterations.findIndex((it) => it.id === id);
  if (index === -1) { return; }
  state.projectData.iterations.splice(index, 1);
  delete state.projectData.generationRecords[id];
  if (state.selectedId === id) { state.selectedId = state.projectData.iterations[0] ? state.projectData.iterations[0].id : null; }
  markDirty();
  log('Removed iteration "' + id + '" from the project. Its previously generated output file was left untouched on disk.', 'warn');
  renderAll();
}

// ---------- Generation ----------

async function generateOne(iteration) {
  const html = renderDocument(state.templateText, state.projectData.shared, iteration);
  const outputExists = await fileExists(state.rootHandle, iteration.outputPath);
  let existingText = '';
  if (outputExists) {
    const handle = await getFileHandleForPath(state.rootHandle, iteration.outputPath, false);
    existingText = (await readTextFile(handle)).text;
    const record = state.projectData.generationRecords[iteration.id];
    if (record && record.outputHash && hashString(existingText) !== record.outputHash) {
      const proceed = window.confirm('"' + iteration.outputPath + '" was modified outside this tool since it was last generated. Overwrite anyway?');
      if (!proceed) { throw new Error('skipped - external changes present at ' + iteration.outputPath); }
    }
    if (existingText.trim()) {
      await backupContent(iteration.id, existingText);
    }
  }
  const handle = await getFileHandleForPath(state.rootHandle, iteration.outputPath, true);
  await writeTextFile(handle, html);
  state.projectData.generationRecords[iteration.id] = {
    hash: currentFingerprint(iteration),
    outputHash: hashString(html),
    generatedAt: new Date().toISOString()
  };
}

async function generateSelected() {
  const iteration = getIteration(state.selectedId);
  if (!iteration) { log('No iteration selected.', 'error'); return; }
  const errors = validateIteration(iteration, state.projectData.iterations);
  if (errors.length) { log('Cannot generate - ' + errors.join(' '), 'error'); return; }
  const saved = await saveProject({ silent: true });
  if (!saved) { log('Generate aborted: project could not be saved first.', 'error'); return; }
  try {
    await generateOne(iteration);
    await saveProject({ silent: true });
    log('Generated ' + iteration.outputPath, 'ok');
    renderAll();
  } catch (err) {
    log('Generation failed for ' + iteration.id + ': ' + err.message, 'error');
  }
}

async function rebuildAll() {
  const iterations = state.projectData.iterations;
  const errors = validateAllIterations(iterations);
  if (errors.length) {
    log('Rebuild All aborted - fix these issues first: ' + errors.join(' '), 'error');
    return;
  }
  const saved = await saveProject({ silent: true });
  if (!saved) { log('Rebuild All aborted: project could not be saved first.', 'error'); return; }

  const results = { generated: [], unchanged: [], failed: [] };
  for (const iteration of iterations) {
    const status = generationStatus(iteration);
    if (status === 'up-to-date') { results.unchanged.push(iteration.id); continue; }
    try {
      await generateOne(iteration);
      results.generated.push(iteration.id);
    } catch (err) {
      results.failed.push(iteration.id + ': ' + err.message);
    }
  }
  await saveProject({ silent: true });
  log('Rebuild All complete - generated: ' + (results.generated.join(', ') || 'none') +
    ' | unchanged: ' + (results.unchanged.join(', ') || 'none') +
    ' | failed: ' + (results.failed.join(', ') || 'none'), results.failed.length ? 'error' : 'ok');
  renderAll();
}

// ---------- Wiring ----------

function initModal() {
  const dialog = $('newIterationDialog');
  $('createIterationBtn').addEventListener('click', () => {
    dialog.dataset.mode = 'create';
    $('newIterationId').value = '';
    $('newIterationName').value = '';
    dialog.showModal();
  });
  $('duplicateIterationBtn').addEventListener('click', () => {
    if (!state.selectedId) { log('Select an iteration to duplicate first.', 'error'); return; }
    dialog.dataset.mode = 'duplicate';
    $('newIterationId').value = '';
    $('newIterationName').value = '';
    dialog.showModal();
  });
  $('newIterationForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const id = $('newIterationId').value.trim();
    const name = $('newIterationName').value.trim();
    if (dialog.dataset.mode === 'duplicate') {
      duplicateIteration(state.selectedId, id, name);
    } else {
      createIteration(id, name);
    }
    dialog.close();
  });
  $('removeIterationBtn').addEventListener('click', () => {
    if (!state.selectedId) { return; }
    if (window.confirm('Remove "' + state.selectedId + '" from the project? This does not delete its generated file.')) {
      removeIteration(state.selectedId);
    }
  });
}

function init() {
  if (!window.showDirectoryPicker) {
    setStatus('Unsupported browser: use desktop Microsoft Edge or Chrome with folder access support.');
    log('window.showDirectoryPicker is unavailable. Open this editor in desktop Edge or Chrome.', 'error');
  }
  $('openProjectBtn').addEventListener('click', openProject);
  $('reopenProjectBtn').addEventListener('click', reopenLastProject);
  $('saveProjectBtn').addEventListener('click', () => saveProject());
  $('generateSelectedBtn').addEventListener('click', generateSelected);
  $('rebuildAllBtn').addEventListener('click', rebuildAll);
  $('viewSharedBtn').addEventListener('click', () => { state.view = 'shared'; setActiveViewButtons(); renderAll(); });
  $('viewIterationBtn').addEventListener('click', () => { state.view = 'iteration'; setActiveViewButtons(); renderAll(); });
  initModal();
  checkForRememberedProject();
}

async function checkForRememberedProject() {
  if (!window.indexedDB) { return; }
  const handle = await idbGet('lastRootHandle').catch(() => null);
  if (handle) { $('reopenProjectBtn').hidden = false; }
}

function setActiveViewButtons() {
  $('viewSharedBtn').classList.toggle('active', state.view === 'shared');
  $('viewIterationBtn').classList.toggle('active', state.view === 'iteration');
}

init();
