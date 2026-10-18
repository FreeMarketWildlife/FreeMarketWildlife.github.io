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
