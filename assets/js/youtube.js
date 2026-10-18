const status = document.querySelector('#youtube-status');
const body = document.querySelector('#youtube-history');
const date = value => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const cell = value => {
  const td = document.createElement('td');
  td.textContent = value;
  return td;
};
try {
  const response = await fetch('/assets/data/youtube.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Data unavailable');
  const data = await response.json();
  const cutoff = Date.now() - 27 * 86400000;
  const rows = data.snapshots.filter(row => Number.isFinite(Date.parse(row.observedAt)) &&
    Date.parse(row.observedAt) >= cutoff && Date.parse(row.observedAt) <= Date.now());
  const latest = rows[0];
  if (latest) {
    status.textContent = `Last successful update: ${date(latest.observedAt)}.`;
    if (Date.now() - Date.parse(latest.observedAt) > 36 * 3600000) status.textContent += ' Update overdue; these counts are not current.';
    if (data.status !== 'ok') status.textContent += ' The latest collection did not complete.';
    for (const row of rows) {
      const tr = document.createElement('tr');
      tr.append(cell(date(row.observedAt)), ...['subscribers', 'views', 'videos'].map(key =>
        cell(row[key] === null ? 'Not public' : Number(row[key]).toLocaleString())));
      body.append(tr);
    }
  } else {
    status.textContent = data.status === 'not_configured'
      ? 'Not connected yet. Counts will appear after the YouTube API key is configured and the first update runs.'
      : 'No recent data available. Check the latest GitHub Actions run.';
    const tr = document.createElement('tr');
    const td = cell('No observations yet.');
    td.colSpan = 4;
    tr.append(td);
    body.append(tr);
  }
} catch {
  status.textContent = 'YouTube data could not be loaded. Try again later.';
}

const videoStatus = document.querySelector('#video-status');
const videoRows = document.querySelector('#video-rows');
const search = document.querySelector('#video-search');
const sort = document.querySelector('#video-sort');
const previous = document.querySelector('#video-prev');
const next = document.querySelector('#video-next');
const pageLabel = document.querySelector('#video-page');
const resultsLabel = document.querySelector('#video-results');
const number = value => value === undefined || value === null ? '—' : Number(value).toLocaleString();
const duration = iso => {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso || '');
  if (!match) return '—';
  const hours = Number(match[1] || 0) * 24 + Number(match[2] || 0);
  const mins = Number(match[3] || 0);
  const secs = String(Number(match[4] || 0)).padStart(2, '0');
  return hours ? `${hours}:${String(mins).padStart(2, '0')}:${secs}` : `${mins}:${secs}`;
};
let videos = [], page = 0;
function renderVideos() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = videos.filter(v => [v.snippet.title, v.snippet.description, ...(v.snippet.tags || [])]
    .join(' ').toLocaleLowerCase().includes(query));
  filtered.sort((a, b) => {
    if (sort.value === 'oldest') return a.snippet.publishedAt.localeCompare(b.snippet.publishedAt);
    if (sort.value === 'newest') return b.snippet.publishedAt.localeCompare(a.snippet.publishedAt);
    const field = { views: 'viewCount', likes: 'likeCount', comments: 'commentCount' }[sort.value];
    return Number(b.statistics?.[field] ?? -1) - Number(a.statistics?.[field] ?? -1);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 50));
  page = Math.min(page, pages - 1);
  videoRows.replaceChildren();
  for (const video of filtered.slice(page * 50, page * 50 + 50)) {
    const tr = document.createElement('tr');
    const titleCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = video.snippet.title;
    const details = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'Details';
    const description = document.createElement('p'); description.className = 'video-description';
    description.textContent = video.snippet.description || 'No description.';
    const tags = document.createElement('p'); tags.textContent = `Tags: ${(video.snippet.tags || []).join(', ') || '—'}`;
    const meta = document.createElement('p');
    meta.textContent = `Language: ${video.snippet.defaultAudioLanguage || video.snippet.defaultLanguage || '—'} · Captions: ${video.contentDetails?.caption ?? '—'} · License: ${video.status?.license || '—'}`;
    const rawDetails = document.createElement('details');
    const rawSummary = document.createElement('summary'); rawSummary.textContent = 'All returned public metadata';
    const raw = document.createElement('pre'); raw.textContent = JSON.stringify(video, null, 2);
    rawDetails.append(rawSummary, raw);
    details.append(summary, description, tags, meta, rawDetails);
    titleCell.append(link, details);
    tr.append(titleCell, cell(new Date(video.snippet.publishedAt).toLocaleDateString()),
      cell(duration(video.contentDetails?.duration)), cell(number(video.statistics?.viewCount)),
      cell(number(video.statistics?.likeCount)), cell(number(video.statistics?.commentCount)));
    videoRows.append(tr);
  }
  if (!filtered.length) { const tr = document.createElement('tr'); const td = cell('No matching videos.'); td.colSpan = 6; tr.append(td); videoRows.append(tr); }
  resultsLabel.textContent = `${filtered.length.toLocaleString()} videos${query ? ' match your search' : ''}.`;
  pageLabel.textContent = `Page ${page + 1} of ${pages}`;
  previous.disabled = page === 0;
  next.disabled = page + 1 >= pages;
}
if (videoStatus) {
  search.addEventListener('input', () => { page = 0; renderVideos(); });
  sort.addEventListener('change', () => { page = 0; renderVideos(); });
  previous.addEventListener('click', () => { page--; renderVideos(); });
  next.addEventListener('click', () => { page++; renderVideos(); });
  try {
    const response = await fetch('/assets/data/youtube-videos.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Video data unavailable');
    const catalog = await response.json();
    const age = Date.now() - Date.parse(catalog.updatedAt);
    if (catalog.status !== 'ok' || !Number.isFinite(age) || age > 27 * 86400000 || age < 0) {
      throw new Error('No recent catalog');
    }
    videos = catalog.videos;
    videoStatus.textContent = `Last successful video update: ${date(catalog.updatedAt)}. Checked ${catalog.uploadIdsChecked.toLocaleString()} upload IDs; ${videos.length.toLocaleString()} public videos returned.`;
    if (age > 36 * 3600000) videoStatus.textContent += ' Update overdue.';
    renderVideos();
  } catch {
    videoStatus.textContent = 'Video catalog is not available yet. Check the latest scheduled update.';
  }
}
