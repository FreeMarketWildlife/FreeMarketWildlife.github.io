export function validateShortsAnalysis(value) {
  if (value?.version !== 1 || !Array.isArray(value.records) || value.records.length > 10000) throw Error('Invalid spreadsheet');
  const ids = new Set();
  for (const row of value.records) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(row.videoId) || ids.has(row.videoId) || typeof row.title !== 'string' || !row.title.trim() || row.title.length > 500) throw Error('Invalid video');
    ids.add(row.videoId);
    if (row.url !== `https://www.youtube.com/shorts/${row.videoId}` || typeof row.reviewed !== 'boolean') throw Error('Invalid video source');
    if (!Array.isArray(row.bullets) || row.bullets.some(text => typeof text !== 'string' || !text.trim()) || row.bullets.map(text => '• ' + text).join('\n').length > 1000) throw Error('Invalid commentary');
    if (row.reviewed ? !Number.isInteger(row.rating) || row.rating < 1 || row.rating > 10 || !row.bullets.length : row.rating !== null || row.bullets.length) throw Error('Invalid rating');
    if (row.views !== null && (!Number.isSafeInteger(row.views) || row.views < 0)) throw Error('Invalid views');
    if (!Number.isInteger(row.reviewOrder) || row.reviewOrder < 0) throw Error('Invalid review order');
    for (const field of ['metricSourceAt', 'publishedAt']) if (row[field] !== null && (typeof row[field] !== 'string' || !Number.isFinite(Date.parse(row[field])))) throw Error('Invalid date');
  }
  return value;
}

export function ratingLabel(rating) {
  return rating === null ? 'Not analyzed' : rating >= 9 ? 'Excellent' : rating >= 7 ? 'Strong' : rating >= 5 ? 'Mixed' : 'Needs work';
}

export function selectShorts(records, { query = '', status = 'all', result = 'all', sort = 'reviewed' } = {}) {
  const term = query.trim().toLocaleLowerCase('en-US');
  return records.filter(row => {
    if (status === 'reviewed' && !row.reviewed || status === 'unreviewed' && row.reviewed) return false;
    if (result !== 'all' && ratingLabel(row.rating) !== result) return false;
    return !term || `${row.title} ${row.bullets.join(' ')}`.toLocaleLowerCase('en-US').includes(term);
  }).sort((a, b) => {
    // Analysis stays first for every sort; unreviewed clips never displace it.
    if (a.reviewed !== b.reviewed) return a.reviewed ? -1 : 1;
    let difference = 0;
    if (sort === 'rating-high') difference = (b.rating ?? -1) - (a.rating ?? -1);
    if (sort === 'rating-low') difference = (a.rating ?? 11) - (b.rating ?? 11);
    if (sort === 'views') difference = (b.views ?? -1) - (a.views ?? -1);
    if (sort === 'newest') difference = (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0);
    return difference || a.reviewOrder - b.reviewOrder || a.videoId.localeCompare(b.videoId);
  });
}

if (typeof document !== 'undefined' && document.querySelector('[data-shorts-sheet]')) mount();
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function mount() {
  const root = document.querySelector('[data-shorts-sheet]');
  const body = root.querySelector('tbody');
  const status = root.querySelector('#sheet-status');
  const search = root.querySelector('#sheet-search');
  const analysis = root.querySelector('#sheet-analysis');
  const outcome = root.querySelector('#sheet-outcome');
  const sort = root.querySelector('#sheet-sort');
  const pageSize = root.querySelector('#sheet-page-size');
  const prev = root.querySelector('#sheet-prev');
  const next = root.querySelector('#sheet-next');
  const pageLabel = root.querySelector('#sheet-page');
  const retry = root.querySelector('#sheet-retry');
  const summary = root.querySelector('#sheet-summary');
  const download = document.querySelector('#shorts-download');
  const controls = [search, analysis, outcome, sort, pageSize];
  const numbers = new Intl.NumberFormat('en-US');
  const dates = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  let records = [], page = 1;
  for (const control of controls) control.addEventListener(control === search ? 'input' : 'change', () => { page = 1; render(); });
  prev.addEventListener('click', () => { page--; render(); });
  next.addEventListener('click', () => { page++; render(); });
  retry.addEventListener('click', load);
  function render() {
    const filtered = selectShorts(records, { query: search.value, status: analysis.value, result: outcome.value, sort: sort.value });
    const size = Number(pageSize.value);
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.max(1, Math.min(page, pages));
    const offset = (page - 1) * size;
    body.replaceChildren();
    for (const row of filtered.slice(offset, offset + size)) {
      const tr = node('tr'); tr.dataset.reviewed = String(row.reviewed); tr.dataset.videoId = row.videoId;
      const video = node('td', undefined, 'sheet-video');
      const link = node('a', row.title); link.href = row.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      video.append(link);
      const facts = [];
      if (row.publishedAt) facts.push(dates.format(new Date(row.publishedAt)));
      if (Number.isFinite(row.duration)) facts.push(`${Math.floor(row.duration / 60)}:${String(row.duration % 60).padStart(2, '0')}`);
      video.append(node('p', facts.join(' · '), 'sheet-video-meta'));
      if (row.reviewBasis === 'Frame-based review') video.append(node('span', 'Frame-based review', 'sheet-basis'));
      const rating = node('td', undefined, 'sheet-rating');
      rating.append(node('span', 'Editorial rating', 'sheet-cell-label'));
      const score = node('div', row.reviewed ? String(row.rating) : '—', 'sheet-score');
      if (row.reviewed) score.append(node('span', '/10'));
      const label = ratingLabel(row.rating);
      rating.dataset.level = row.rating === null ? 'pending' : row.rating >= 7 ? 'strong' : row.rating >= 5 ? 'mixed' : 'weak';
      rating.append(score, node('span', label, 'sheet-verdict'));
      const views = node('td', undefined, 'sheet-views');
      views.append(node('span', 'Snapshot views', 'sheet-cell-label'), node('strong', row.views === null ? '—' : numbers.format(row.views)));
      if (row.metricSourceAt) { const date = node('time', dates.format(new Date(row.metricSourceAt))); date.dateTime = row.metricSourceAt; date.title = row.metricSourceAt; views.append(date); }
      const notes = node('td', undefined, 'sheet-analysis');
      notes.append(node('span', 'Analysis', 'sheet-cell-label'));
      if (row.reviewed) {
        const list = node('ul');
        for (const bullet of row.bullets) list.append(node('li', bullet));
        notes.append(list);
      } else notes.append(node('p', 'Not analyzed yet.', 'sheet-pending'));
      tr.append(video, rating, views, notes); body.append(tr);
    }
    if (!filtered.length) { const tr = node('tr'); const td = node('td', 'No Shorts match these filters.', 'sheet-empty'); td.colSpan = 4; tr.append(td); body.append(tr); }
    status.textContent = filtered.length ? `${offset + 1}–${Math.min(offset + size, filtered.length)} of ${numbers.format(filtered.length)} Shorts. Analyzed videos stay first.` : 'No matching Shorts.';
    pageLabel.textContent = `${page} / ${pages}`;
    prev.disabled = page === 1; next.disabled = page === pages || !filtered.length;
  }
  async function load() {
    retry.hidden = true; status.textContent = 'Loading Shorts analysis…';
    controls.forEach(control => { control.disabled = true; });
    try {
      const response = await fetch('/troykearns/spreadsheets/shorts-analysis.json', { cache: 'no-store' });
      if (!response.ok) throw Error('Spreadsheet unavailable');
      records = validateShortsAnalysis(await response.json()).records;
      const reviewed = records.filter(row => row.reviewed).length;
      summary.textContent = `${reviewed} analyzed · ${records.length - reviewed} not analyzed · ${records.length} Shorts`;
      controls.forEach(control => { control.disabled = false; });
      download.hidden = false; render();
    } catch {
      body.replaceChildren(); download.hidden = true;
      status.textContent = 'Could not load the spreadsheet. Check your connection and sign-in, then try again.';
      retry.hidden = false;
    }
  }
  load();
}
