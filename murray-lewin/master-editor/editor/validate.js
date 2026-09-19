// Structural + safety validation for the project source model.
// Kept separate from render.js so both the editor and generation pipeline
// share one set of rules for "can this be safely written".

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'iteration';
}

export function isSafeId(id) {
  return /^[a-z0-9-]{2,60}$/.test(id);
}

export function isSafeOutputPath(path) {
  if (typeof path !== 'string' || !path) { return false; }
  if (path.includes('..') || path.startsWith('/') || /^[a-zA-Z]:/.test(path)) { return false; }
  return /^applications\/[a-z0-9-]+\/index\.html$/.test(path) || /^general\/index\.html$/.test(path);
}

export function validateProject(data) {
  var errors = [];
  if (!data || typeof data !== 'object') { errors.push('Project file is not a valid object.'); return errors; }
  if (data.schemaVersion !== 1) { errors.push('Unsupported schema version.'); }
  if (!data.project || !data.project.id) { errors.push('Missing project metadata.'); }
  if (!data.shared) { errors.push('Missing shared content block.'); }
  if (!Array.isArray(data.iterations)) { errors.push('Missing iterations array.'); }
  return errors;
}

export function validateIteration(iteration, allIterations) {
  var errors = [];
  if (!iteration) { errors.push('Iteration is missing.'); return errors; }
  if (!isSafeId(iteration.id)) { errors.push('Iteration id "' + iteration.id + '" is not a safe identifier (lowercase letters, numbers, hyphens).'); }
  if (!iteration.displayName) { errors.push('Iteration "' + iteration.id + '" is missing a display name.'); }
  if (!isSafeOutputPath(iteration.outputPath)) { errors.push('Iteration "' + iteration.id + '" has an unsafe or invalid output path: ' + iteration.outputPath); }
  var duplicates = (allIterations || []).filter(function (other) { return other !== iteration && other.outputPath === iteration.outputPath; });
  if (duplicates.length) { errors.push('Output path "' + iteration.outputPath + '" is used by more than one iteration.'); }
  if (!iteration.pageTitle) { errors.push('Iteration "' + iteration.id + '" is missing a page title.'); }
  if (!iteration.about || !iteration.about.lead) { errors.push('Iteration "' + iteration.id + '" is missing an About summary.'); }
  if (!iteration.why || !iteration.why.heading) { errors.push('Iteration "' + iteration.id + '" is missing a Why section heading.'); }
  return errors;
}

export function validateAllIterations(iterations) {
  var errors = [];
  (iterations || []).forEach(function (iteration) {
    errors = errors.concat(validateIteration(iteration, iterations));
  });
  return errors;
}
