const DAY = 86400000;
const format = value => value === null ? 'Not public' : Number(value).toLocaleString();
const day = value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const svgNode = (name, attributes = {}, text) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
};

export function historyPanel(source, resourceId) {
  const panel = document.createElement('div'); panel.className = 'history-panel';
  const message = document.createElement('p'); message.setAttribute('role', 'status');
  message.textContent = 'Loading daily history…'; panel.append(message);
  let loaded = false;
  panel.load = async () => {
    if (loaded) return;
    loaded = true;
    try {
      const response = await fetch(`/assets/data/history/${encodeURIComponent(source)}/${encodeURIComponent(resourceId)}.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('No history');
      const data = await response.json();
      if (data.resourceId !== resourceId) throw new Error('Wrong resource');
      const now = Date.now();
      const rows = data.observations.filter(row => {
        const time = Date.parse(row.observedAt);
        return Number.isFinite(time) && time >= now - 27 * DAY && time <= now;
      }).sort((a, b) => a.observedAt.localeCompare(b.observedAt));
      if (!rows.length) throw new Error('No recent history');
      const controls = document.createElement('div'); controls.className = 'chart-controls';
      controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Graph metric');
      const graph = document.createElement('div');
      const note = document.createElement('p'); note.className = 'chart-note';
      note.textContent = `${rows.length} daily snapshot${rows.length === 1 ? '' : 's'} · ${day(rows[0].observedAt)}–${day(rows.at(-1).observedAt)} (UTC). ${rows.length === 1 ? 'The trend will appear after the next daily collection.' : 'Gaps mark missed collections.'}`;
      if (data.status !== 'ok' || now - Date.parse(rows.at(-1).observedAt) > 36 * 3600000) {
        note.textContent += ' Collection overdue or incomplete; showing saved observations.';
      }
      const buttons = [];
      for (const metric of ['views', 'likes', 'comments']) {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = metric[0].toUpperCase() + metric.slice(1);
        button.addEventListener('click', () => draw(metric));
        buttons.push([metric, button]); controls.append(button);
      }
      function draw(metric) {
        for (const [key, button] of buttons) button.setAttribute('aria-pressed', String(key === metric));
        graph.replaceChildren();
        const points = rows.filter(row => Number.isFinite(row.metrics[metric]));
        if (!points.length) { graph.textContent = 'This count is not public.'; return; }
        const latest = document.createElement('p'); latest.className = 'chart-total';
        latest.textContent = `${format(points.at(-1).metrics[metric])} ${metric} · ${day(points.at(-1).observedAt)}`;
        const width = 420, height = 170, left = 54, right = 12, top = 18, bottom = 28;
        const low = Math.min(...points.map(row => row.metrics[metric]));
        const high = Math.max(...points.map(row => row.metrics[metric]));
        const range = high - low || Math.max(1, high * .05);
        const floor = Math.max(0, low - range * .1), ceiling = high + range * .1;
        const start = Date.parse(rows[0].observedAt), end = Date.parse(rows.at(-1).observedAt);
        const x = row => left + (end === start ? .5 : (Date.parse(row.observedAt) - start) / (end - start)) * (width - left - right);
        const yValue = value => top + (ceiling - value) / (ceiling - floor) * (height - top - bottom);
        const y = row => yValue(row.metrics[metric]);
        const svg = svgNode('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${metric} history, ${points.length} observations. Exact values in daily observations below.` });
        for (const value of high === low ? [high] : [high, low]) {
          const position = yValue(value);
          svg.append(svgNode('line', { x1: left, x2: width - right, y1: position, y2: position, class: 'chart-grid' }));
          svg.append(svgNode('text', { x: left - 8, y: position + 4, 'text-anchor': 'end' }, format(value)));
        }
        // Keep observed intervals separate when a daily collection or metric is missing.
        let segment = [];
        const flush = () => {
          if (segment.length > 1) svg.append(svgNode('polyline', { points: segment.map(row => `${x(row)},${y(row)}`).join(' '), class: 'chart-line' }));
          segment = [];
        };
        let previous;
        for (const row of rows) {
          if (!Number.isFinite(row.metrics[metric])) { flush(); previous = undefined; continue; }
          if (previous && Date.parse(row.observedAt) - Date.parse(previous.observedAt) > 36 * 3600000) flush();
          segment.push(row); previous = row;
        }
        flush();
        for (const row of points) {
          const label = `${day(row.observedAt)}: ${format(row.metrics[metric])} ${metric}`;
          const dot = svgNode('circle', { cx: x(row), cy: y(row), r: 3.5, tabindex: '0', 'aria-label': label });
          dot.append(svgNode('title', {}, label)); svg.append(dot);
        }
        svg.append(svgNode('text', { x: left, y: height - 5 }, day(rows[0].observedAt)));
        if (rows.length > 1) svg.append(svgNode('text', { x: width - right, y: height - 5, 'text-anchor': 'end' }, day(rows.at(-1).observedAt)));
        graph.append(latest, svg);
      }
      const disclosure = document.createElement('details');
      const summary = document.createElement('summary'); summary.textContent = 'Daily observations';
      const table = document.createElement('table');
      const caption = document.createElement('caption'); caption.textContent = 'Observed cumulative counts · UTC';
      const head = document.createElement('thead'); const headings = document.createElement('tr');
      for (const title of ['Observed at', 'Views', 'Likes', 'Comments']) {
        const th = document.createElement('th'); th.scope = 'col'; th.textContent = title; headings.append(th);
      }
      head.append(headings); const body = document.createElement('tbody');
      for (const row of [...rows].reverse()) {
        const tr = document.createElement('tr');
        for (const text of [row.observedAt.replace('T', ' ').replace('Z', ' UTC'), ...['views', 'likes', 'comments'].map(metric => format(row.metrics[metric] ?? null))]) {
          const td = document.createElement('td'); td.textContent = text; tr.append(td);
        }
        body.append(tr);
      }
      table.append(caption, head, body); disclosure.append(summary, table);
      message.textContent = 'Daily history · rolling 27 days';
      panel.append(controls, graph, note, disclosure); draw('views');
    } catch {
      message.textContent = 'No recent history available yet. Daily tracking begins with the first successful collection.';
      const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Retry';
      retry.addEventListener('click', () => { retry.remove(); loaded = false; panel.load(); }); panel.append(retry);
    }
  };
  return panel;
}
