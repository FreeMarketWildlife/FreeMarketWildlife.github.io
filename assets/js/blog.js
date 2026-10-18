// Static, published HTML posts only. No analytics collection or invented counts.
// Future posts need a unique data-post-id and ISO data-published-at.
// Set data-popularity only when backed by a genuine, documented source.
export function comparePosts(a, b, order = 'newest') {
  const stable = () => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  const newest = () => b.publishedAt - a.publishedAt || stable();
  if (order === 'oldest') return a.publishedAt - b.publishedAt || stable();
  if (order === 'popular') {
    const aKnown = Number.isFinite(a.popularity), bKnown = Number.isFinite(b.popularity);
    if (aKnown !== bKnown) return aKnown ? -1 : 1;
    if (aKnown && a.popularity !== b.popularity) return b.popularity - a.popularity;
  }
  return newest();
}
const select = document.querySelector('#blog-sort');
const container = document.querySelector('[data-blog-posts]');
const status = document.querySelector('[data-blog-status]');
if (select && container && status) {
  const posts = [...container.querySelectorAll('[data-post-id]')].map(element => ({
    element, id: element.dataset.postId,
    publishedAt: Date.parse(element.dataset.publishedAt),
    popularity: element.dataset.popularity?.trim() ? Number(element.dataset.popularity) : null,
  }));
  const update = () => {
    const order = select.value;
    [...posts].sort((a, b) => comparePosts(a, b, order)).forEach(post => container.append(post.element));
    const noPopularity = !posts.some(post => Number.isFinite(post.popularity));
    status.textContent = !posts.length
      ? 'No posts published yet.' + (order === 'popular' ? ' Popularity data is not available yet.' : '')
      : order === 'popular' && noPopularity ? 'Popularity data is not available yet. Showing newest first.'
      : order === 'popular' ? 'Posts without popularity data follow ranked posts, newest first.' : '';
  };
  select.addEventListener('change', update);
  update();
}
