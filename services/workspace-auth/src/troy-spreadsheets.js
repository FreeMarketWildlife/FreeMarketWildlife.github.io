const files = new Map([
  ['/troykearns/spreadsheets/shorts-analysis.json', { key: 'troy-kearns/spreadsheets/shorts-analysis.json', type: 'application/json; charset=utf-8' }],
  ['/troykearns/spreadsheets/shorts-analysis.xlsx', { key: 'troy-kearns/spreadsheets/shorts-analysis.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: 'Troy Kearns - Shorts Analysis.xlsx' }]
]);

// Public read-only workspace downloads; only these explicit storage keys are exposed.
export async function troySpreadsheetFile(req, env, path) {
  const file = files.get(path);
  if (!file) return null;
  const headers = {
    'Cache-Control': 'private, no-store', 'Vary': 'Cookie',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer'
  };
  if (!['GET', 'HEAD'].includes(req.method)) return new Response('Method not allowed.', { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
  if (!env.TASK_PHOTOS) return new Response('Spreadsheet storage is not available.', { status: 503, headers });
  const object = await env.TASK_PHOTOS.get(file.key);
  if (!object) return new Response('This spreadsheet is not available yet.', { status: 404, headers });
  headers['Content-Type'] = file.type;
  if (file.filename) headers['Content-Disposition'] = `attachment; filename="${file.filename}"`;
  if (Number.isSafeInteger(object.size)) headers['Content-Length'] = String(object.size);
  return new Response(req.method === 'HEAD' ? null : object.body, { status: 200, headers });
}
