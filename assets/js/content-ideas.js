export const formats = ['Short', 'Long-form', 'Other'];
export const stages = ['Idea', 'Developing', 'Ready'];
export function storageKey(workspace) {
  if (!/^[a-z0-9-]+$/.test(workspace)) throw Error('Invalid workspace.');
  return `fmw:content-ideas:${workspace}:v1`;
}
export function validateIdeas(value, workspace) {
  if (!value || value.version !== 1 || value.workspace !== workspace || !Array.isArray(value.ideas) || value.ideas.length > 500) throw Error('Invalid backup or different workspace.');
  const ids = new Set();
  for (const idea of value.ideas) {
    if (!idea || typeof idea.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(idea.id) || ids.has(idea.id) || typeof idea.title !== 'string' || !idea.title.trim() || idea.title.length > 160 || typeof idea.topic !== 'string' || idea.topic.length > 100 || typeof idea.notes !== 'string' || idea.notes.length > 5000 || !formats.includes(idea.format) || !stages.includes(idea.stage)) throw Error('Invalid content idea.');
    if (idea.thumbnail !== undefined && (typeof idea.thumbnail !== 'string' || idea.thumbnail.length > 1000000 || (idea.thumbnail && !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(idea.thumbnail)))) throw Error('Invalid thumbnail.');
    ids.add(idea.id);
  }
  return value;
}
export function mergeIdeas(current, backup) {
  validateIdeas(current, current.workspace); validateIdeas(backup, current.workspace);
  const ids = new Set(current.ideas.map(idea => idea.id));
  return validateIdeas({...current, ideas: [...current.ideas, ...backup.ideas.filter(idea => !ids.has(idea.id))]}, current.workspace);
}
const mounted = new WeakSet();
const el = (tag, text, cls) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; };
export function mountIdeas(root) {
  if (mounted.has(root)) return; mounted.add(root);
  const workspace = root.dataset.contentIdeas, key = storageKey(workspace);
  const video = workspace === 'kat-kai';
  let thumbnail = '';
  let state = {version: 1, workspace, ideas: []}, blocked = false, editing = null;
  const status = el('p', '', 'planner-status'); status.setAttribute('role', 'status');
  try { const saved = localStorage.getItem(key); if (saved) state = validateIdeas(JSON.parse(saved), workspace); }
  catch { blocked = true; status.textContent = 'Saved ideas could not be read. Changes are paused to protect them.'; }
  root.append(el('p', 'Ideas save only in this browser on this device, separately for this workspace. Export a backup to keep a copy. Private account sync is not connected.', 'planner-note'), status);
  const filters = el('div', undefined, 'idea-filters'), fields = {};
  for (const [name, title, options] of [['topic', 'Topic', null], ['format', 'Format', formats], ['stage', 'Stage', stages]]) {
    const label = el('label', title), input = el(options ? 'select' : 'input');
    if (options) { const all = el('option', 'All'); all.value = ''; input.append(all); for (const value of options) { const option = el('option', value); option.value = value; input.append(option); } }
    else { input.type = 'search'; input.placeholder = 'Filter topics'; }
    input.setAttribute('aria-label', `Filter ideas by ${name}`); input.addEventListener('input', render); input.addEventListener('change', render); label.append(input); fields[name] = input; filters.append(label);
  }
  const list = el('div'), editor = el('details'), summary = el('summary', video ? 'Add a video idea' : 'Add a content idea'), form = el('form', undefined, 'idea-form'), inputs = {};
  for (const [name, labelText, options] of [['title', 'Title', null], ['topic', 'Topic (optional)', null], ['format', 'Format', formats], ['stage', 'Stage', stages], ['notes', video ? 'Description (optional)' : 'Notes (optional)', null]]) {
    if (video && ['topic', 'format', 'stage'].includes(name)) continue;
    const label = el('label', labelText), input = el(options ? 'select' : name === 'notes' ? 'textarea' : 'input');
    if (options) for (const value of options) { const option = el('option', value); input.append(option); }
    else { input.maxLength = name === 'notes' ? 5000 : name === 'topic' ? 100 : 160; if (name === 'notes') input.rows = 5; else input.type = 'text'; }
    input.setAttribute('aria-label', labelText); input.name = name; input.required = name === 'title'; label.append(input); form.append(label); inputs[name] = input;
  }
  const preview = el('img'); preview.alt = 'Thumbnail preview'; preview.className = 'idea-thumbnail'; preview.hidden = true;
  const upload = el('input'); upload.type = 'file'; upload.accept = 'image/jpeg,image/png,image/webp'; upload.name = 'thumbnail';
  const remove = el('button', 'Remove thumbnail'); remove.type = 'button'; remove.hidden = true;
  function showThumbnail() { preview.hidden = remove.hidden = !thumbnail; if (thumbnail) preview.src = thumbnail; else preview.removeAttribute('src'); }
  remove.addEventListener('click', () => { thumbnail = ''; upload.value = ''; showThumbnail(); });
  if (video) {
    const label = el('label', 'Thumbnail (optional)'); label.append(upload);
    form.append(label, el('p', 'JPG, PNG or WebP, up to 5 MB. Images are resized for storage.', 'planner-note'), preview, remove);
    upload.addEventListener('change', async () => {
      const file = upload.files[0]; if (!file) return;
      submit.disabled = true;
      try {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5000000) throw Error('Choose a JPG, PNG or WebP image under 5 MB.');
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
        const result = canvas.toDataURL('image/jpeg', 0.8); if (result.length > 1000000) throw Error('Image is too large. Choose a smaller image.');
        thumbnail = result; showThumbnail(); status.textContent = '';
      } catch (error) { upload.value = ''; status.textContent = error.message || 'Could not read this image.'; }
      finally { submit.disabled = blocked; }
    });
  }
  const submit = el('button', 'Save idea'); submit.type = 'submit';
  const cancel = el('button', 'Cancel'); cancel.type = 'button'; cancel.addEventListener('click', reset);
  form.append(submit, cancel); editor.append(summary, form);
  function reset() { form.reset(); thumbnail = ''; showThumbnail(); editing = null; summary.textContent = video ? 'Add a video idea' : 'Add a content idea'; editor.open = false; }
  function save(next) {
    try { if (blocked) throw Error('Saved data needs recovery.'); validateIdeas(next, workspace); localStorage.setItem(key, JSON.stringify(next)); state = next; status.textContent = 'Saved on this device.'; return true; }
    catch (error) { status.textContent = `Could not save: ${error.message} Keep a backup before leaving.`; return false; }
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); if (submit.disabled) return; const old = state.ideas.find(idea => idea.id === editing); const idea = {topic: '', format: 'Long-form', stage: 'Idea', notes: '', ...old, id: editing || crypto.randomUUID()}; if (video) idea.thumbnail = thumbnail; for (const [name, input] of Object.entries(inputs)) idea[name] = input.value.trim();
    if (save({...state, ideas: editing ? state.ideas.map(old => old.id === editing ? idea : old) : [...state.ideas, idea]})) { reset(); render(); }
  });
  const toolbar = el('div', undefined, 'planner-toolbar'), exportButton = el('button', 'Export ideas'); exportButton.type = 'button';
  exportButton.addEventListener('click', () => {
    // Preserve the raw saved value on read failure rather than exporting a misleading empty backup.
    let backup; try { backup = blocked ? localStorage.getItem(key) : JSON.stringify(state, null, 2); if (backup === null) throw Error(); } catch { status.textContent = 'Could not read ideas for export. Existing saved data has not been changed.'; return; }
    const url = URL.createObjectURL(new Blob([backup], {type: 'application/json'})), a = el('a'); a.href = url; a.download = `${workspace}-content-ideas.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const importLabel = el('label', 'Import ideas', 'planner-import'), importInput = el('input'); importInput.type = 'file'; importInput.accept = '.json,application/json';
  importInput.addEventListener('change', async () => { const file = importInput.files[0]; if (!file) return; try { if (file.size > 20000000) throw Error('Backup too large.'); const next = mergeIdeas(state, JSON.parse(await file.text())); if (save(next)) render(); } catch (error) { status.textContent = `Import stopped: ${error.message}`; } importInput.value = ''; });
  importLabel.append(importInput); toolbar.append(exportButton, importLabel);
  if (!video) root.append(filters);
  root.append(editor, toolbar, list);
  function render() {
    list.replaceChildren();
    const visible = state.ideas.filter(idea => (!fields.topic.value || idea.topic.toLowerCase().includes(fields.topic.value.toLowerCase())) && (!fields.format.value || idea.format === fields.format.value) && (!fields.stage.value || idea.stage === fields.stage.value));
    if (!visible.length) { list.append(el('p', state.ideas.length ? 'No ideas match these filters.' : video ? 'No video ideas saved yet.' : 'No content ideas saved yet.')); return; }
    for (const stage of stages) {
      const items = visible.filter(idea => idea.stage === stage).sort((a, b) => a.topic.localeCompare(b.topic) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
      if (!items.length) continue; const section = el('section'); section.append(el('h3', stage));
      for (const idea of items) { const card = el('article', undefined, 'goal-card'); if (idea.thumbnail) { const image = el('img'); image.src = idea.thumbnail; image.alt = `Thumbnail for ${idea.title}`; image.className = 'idea-thumbnail'; card.append(image); } card.append(el('h4', idea.title), el('p', video ? '' : `${idea.topic || 'No topic'} · ${idea.format}`, 'planner-note'), el('p', idea.notes, 'idea-notes')); const edit = el('button', 'Edit idea'); edit.type = 'button'; edit.setAttribute('aria-label', `Edit ${idea.title}`); edit.addEventListener('click', () => { editing = idea.id; for (const [name, input] of Object.entries(inputs)) input.value = idea[name]; thumbnail = idea.thumbnail || ''; showThumbnail(); summary.textContent = video ? 'Edit video idea' : 'Edit content idea'; editor.open = true; inputs.title.focus(); }); card.append(edit); section.append(card); }
      list.append(section);
    }
  }
  if (blocked) { submit.disabled = true; importInput.disabled = true; }
  render();
}
if (typeof document !== 'undefined') for (const root of document.querySelectorAll('[data-content-ideas]')) mountIdeas(root);
