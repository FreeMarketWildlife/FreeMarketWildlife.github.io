// Keep old Strategy section URLs pointing to the preserved original summary.
const legacySections = new Set(['strategy-title', 'strategy-observation-title', 'strategy-trust-title', 'strategy-community-title', 'strategy-cta-title', 'strategy-related-title']);
if (/^\/troykearns\/strategy\/(?:index\.html)?$/.test(location.pathname) && legacySections.has(location.hash.slice(1))) {
  location.replace('/troykearns/strategy/shorts-analysis-summary/' + location.hash);
}
const track = document.querySelector('.folio-track');
if (track) {
  const pages = [...track.querySelectorAll('.folio-page')];
  const links = [...document.querySelectorAll('[data-folio-link]')];
  const previous = document.querySelector('[data-folio-prev]');
  const next = document.querySelector('[data-folio-next]');
  const status = document.querySelector('[data-folio-status]');
  const mobile = matchMedia('(max-width: 760px)');
  let current = 0;
  function update(index) {
    current = index;
    links.forEach((link, i) => i === index ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    previous.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
  }
  function go(index, record = true) {
    if (index < 0 || index >= pages.length) return;
    if (mobile.matches) pages[index].scrollIntoView({block: 'start', behavior: 'instant'});
    else track.scrollTo({left: pages[index].offsetLeft - pages[0].offsetLeft, behavior: 'instant'});
    update(index);
    if (record) history.replaceState(null, '', '#' + pages[index].id);
  }
  links.forEach((link, i) => link.addEventListener('click', event => { event.preventDefault(); go(i); }));
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  track.addEventListener('keydown', event => {
    if (mobile.matches || event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    go(event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let scheduled = false;
  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (mobile.matches) {
        let nearest = 0;
        pages.forEach((page, i) => { if (page.getBoundingClientRect().top < innerHeight * .5) nearest = i; });
        update(nearest);
      } else {
        const width = pages[1].offsetLeft - pages[0].offsetLeft;
        update(Math.max(0, Math.min(pages.length - 1, Math.round(track.scrollLeft / width))));
      }
    });
  }
  track.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('hashchange', () => {
    const index = pages.findIndex(page => '#' + page.id === location.hash);
    if (index >= 0) go(index, false);
  });
  mobile.addEventListener('change', () => go(current, false));
  document.querySelector('.folio-controls').hidden = false;
  const initial = pages.findIndex(page => '#' + page.id === location.hash);
  requestAnimationFrame(() => go(initial >= 0 ? initial : 0, false));
}
