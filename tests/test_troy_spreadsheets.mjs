import assert from 'node:assert/strict';
import { selectShorts, validateShortsAnalysis } from '../assets/js/troy-spreadsheets.js';

const rows = [
  { videoId: 'AAAAAAAAAAA', title: 'Expert plumbing answer', url: 'https://www.youtube.com/shorts/AAAAAAAAAAA', reviewed: true, bullets: ['Clear expert answer.'], views: 100, reviewOrder: 0, publishedAt: '2024-01-01', metricSourceAt: '2026-10-20' },
  { videoId: 'BBBBBBBBBBB', title: 'Missing captions', url: 'https://www.youtube.com/shorts/BBBBBBBBBBB', reviewed: true, bullets: ['Your story needs captions.'], views: null, reviewOrder: 1, publishedAt: '2026-01-01', metricSourceAt: '2026-10-20' },
  { videoId: 'CCCCCCCCCCC', title: 'New unreviewed clip', url: 'https://www.youtube.com/shorts/CCCCCCCCCCC', reviewed: false, bullets: [], views: 999999, reviewOrder: 2, publishedAt: '2026-10-01', metricSourceAt: '2026-10-20' }
];
assert.equal(validateShortsAnalysis({ version: 1, records: rows }).records, rows);
for (const sort of ['reviewed', 'views', 'newest']) {
  const result = selectShorts(rows, { sort });
  assert.equal(result.at(-1).reviewed, false, 'Unreviewed clips stay below analyzed clips for every sort');
}
assert.equal(selectShorts(rows, { sort: 'views' })[0].views, 100, 'Missing views do not become a real zero');
assert.deepEqual(selectShorts(rows, { query: ' CAPTIONS ' }).map(row => row.videoId), ['BBBBBBBBBBB']);
assert.equal(selectShorts(rows, { status: 'reviewed' }).length, 2);
assert.equal(selectShorts(rows, { query: 'no matching video' }).length, 0);
assert.deepEqual(rows.map(row => row.videoId), ['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC'], 'Sorting preserves source order');
for (const patch of [
  { bullets: ['a'.repeat(999)] }, { bullets: [] }, { url: 'https://example.com/AAAAAAAAAAA' }, { views: -1 }, { publishedAt: 'bad date' }
]) assert.throws(() => validateShortsAnalysis({ version: 1, records: [{ ...rows[0], ...patch }] }));
assert.throws(() => validateShortsAnalysis({ version: 1, records: [rows[0], rows[0]] }));
assert.throws(() => validateShortsAnalysis({ version: 1, records: [{ ...rows[2], bullets: ['Not reviewed'] }] }));
console.log('PASS: analyzed-first sorting, filters, source preservation, 1,000-character limit and safe video sources.');
