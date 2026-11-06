const get = id => document.getElementById(id);
const tree = get('tree');
const search = get('person-search');
const results = get('people-results');
const depth = get('tree-depth');
const profile = get('profile');
const svgNS = 'http://www.w3.org/2000/svg';

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function button(text, action, className) {
  const element = node('button', text, className);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
}

function dates(person) {
  return [person.birth && `b. ${person.birth}`, person.death && `d. ${person.death}`].filter(Boolean).join(' · ');
}

function normalize(name) {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function citation(label, url) {
  const link = node('a', label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  return link;
}

function record(entry) {
  const item = node('div', '', 'research-record');
  item.append(node('p', entry.text), node('p', entry.researcher, 'archive-label'));
  if (entry.url) item.append(citation(entry.source, entry.url));
  else if (entry.source) item.append(node('p', entry.source, 'archive-muted'));
  return item;
}

function start(archive) {
  const people = new Map(archive.people.map(person => [person.id, person]));
  if (!people.has(archive.root)) throw new Error('Missing starting person');
  const children = new Map();
  const unions = new Map();
  for (const person of people.values()) {
    for (const parent of person.parents) {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(person.id);
    }
  }
  for (const union of archive.unions) {
    for (const person of union.people) {
      if (!unions.has(person)) unions.set(person, []);
      unions.get(person).push(union);
    }
  }

  let active = archive.root;
  const roster = [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
  const sourceLink = citation(`${archive.source.title} · ${archive.source.author}`, archive.source.url);
  get('collection-count').textContent = `${people.size} people · ${Math.max(...roster.flatMap(p => p.positions.map(n => Math.floor(Math.log2(n)) + 1)))} generations in the source`;
  get('archive-source').append(
    node('p', 'Collection sources', 'archive-label'),
    sourceLink,
    node('p', 'Profiles credit the original book, family accounts, and additional research.', 'archive-muted')
  );

  function select(id, keyboard) {
    active = id;
    search.value = '';
    results.hidden = true;
    renderTree();
    renderProfile();
    if (keyboard) tree.querySelector('[aria-current="true"]').focus();
  }

  const startingParents = people.get(archive.root).parents;
  startingParents.forEach((id, index) => {
    const name = index === 0 ? 'Paternal branch' : 'Maternal branch';
    get('branch-links').append(button(name, event => select(id, event.detail === 0)));
  });
  for (const branch of archive.branches || []) {
    if (people.has(branch.id)) get('branch-links').append(button(branch.label, event => select(branch.id, event.detail === 0)));
  }
  get('home-person').addEventListener('click', event => select(archive.root, event.detail === 0));
  depth.addEventListener('change', renderTree);

  function updateSearch() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    results.replaceChildren();
    results.hidden = !words.length;
    if (!words.length) return;
    const matches = roster.filter(person =>
      [person.name, ...(person.aliases || [])].some(name => words.every(word => normalize(name).includes(word))));
    for (const person of matches) {
      const result = button(person.name, event => select(person.id, event.detail === 0));
      const years = dates(person);
      if (years) result.append(node('small', years));
      results.append(result);
    }
    if (!matches.length) results.append(node('p', 'No matching names.'));
  }
  search.addEventListener('input', updateSearch);
  search.addEventListener('focus', updateSearch);
  search.parentElement.addEventListener('focusout', event => {
    if (!search.parentElement.contains(event.relatedTarget)) results.hidden = true;
  });
  search.parentElement.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      search.focus();
      results.hidden = true;
    }
    if (event.key === 'ArrowDown' && event.target === search && !results.hidden) {
      event.preventDefault();
      results.querySelector('button')?.focus();
    }
  });

  function renderTree() {
    const nodes = [];
    let leaves = 0;
    const xGap = 206;
    const yGap = 79;
    const height = 65;
    function visit(id, generation, trail) {
      const person = people.get(id);
      const point = { person, x: generation * xGap, y: 0, parents: [] };
      nodes.push(point);
      if (generation + 1 < Number(depth.value)) {
        point.parents = person.parents.filter(parent => people.has(parent) && !trail.includes(parent))
          .map(parent => visit(parent, generation + 1, [...trail, id]));
      }
      point.y = point.parents.length
        ? (point.parents[0].y + point.parents.at(-1).y) / 2
        : leaves++ * yGap;
      return point;
    }
    const focus = visit(active, 0, []);
    const width = Math.max(...nodes.map(point => point.x)) + 168;
    const canvas = node('div', '', 'tree-canvas');
    canvas.style.width = `${width}px`;
    canvas.style.height = `${(leaves - 1) * yGap + height}px`;
    const connectors = document.createElementNS(svgNS, 'svg');
    connectors.setAttribute('width', width);
    connectors.setAttribute('height', (leaves - 1) * yGap + height);
    connectors.setAttribute('aria-hidden', 'true');
    canvas.append(connectors);
    for (const point of nodes) {
      const card = button('', event => select(point.person.id, event.detail === 0), 'tree-person');
      card.append(node('span', point.person.name), node('small', dates(point.person)));
      card.title = point.person.name;
      if (point === focus) card.setAttribute('aria-current', 'true');
      card.style.left = `${point.x}px`;
      card.style.top = `${point.y}px`;
      canvas.append(card);
      for (const parent of point.parents) {
        const path = document.createElementNS(svgNS, 'path');
        const start = point.y + height / 2;
        const end = parent.y + height / 2;
        const middle = point.x + (xGap + 168) / 2;
        path.setAttribute('d', `M ${point.x + 168} ${start} H ${middle} V ${end} H ${parent.x}`);
        connectors.append(path);
      }
    }
    tree.replaceChildren(canvas);
    tree.scrollTo(0, Math.max(0, focus.y - (tree.clientHeight - height) / 2 + 18));
  }

  function renderProfile() {
    const person = people.get(active);
    const heading = node('h2', person.name);
    heading.id = 'person-title';
    profile.replaceChildren(node('p', 'Selected person', 'archive-label'), heading);
    if (dates(person)) profile.append(node('p', dates(person), 'archive-muted'));
    if (person.pages.length) profile.append(node('p', `Book research · ${archive.source.author}`, 'archive-muted'));

    const parents = person.parents;
    const familyUnions = unions.get(active) || [];
    const relationGroups = [
      ['Parents', parents],
      ['Siblings', [...new Set(parents.flatMap(id => children.get(id) || []))].filter(id => id !== active)],
      ['Partners', [...new Set(familyUnions.flatMap(union => union.people))].filter(id => id !== active)],
      ['Children', children.get(active) || []]
    ];
    for (const [label, ids] of relationGroups) {
      if (!ids.length) continue;
      const links = node('div', '', 'profile-links');
      for (const id of ids) {
        if (people.has(id)) links.append(button(people.get(id).name, event => select(id, event.detail === 0)));
      }
      profile.append(node('h3', label === 'Siblings' ? 'Siblings and half-siblings' : label), links);
    }
    if (!parents.length) profile.append(node('p', 'No documented parents in the tree yet.', 'archive-muted'));

    const findings = [...(person.findings || []), ...familyUnions.flatMap(union => union.findings || [])];
    if (findings.length) {
      profile.append(node('h3', 'Life and family records'), ...findings.map(record));
    }
    if (person.leads?.length) {
      const leads = node('details');
      leads.append(node('summary', 'Research leads to verify'), ...person.leads.map(record));
      profile.append(leads);
    }

    if (!person.pages.length) return;
    const records = node('details');
    records.append(node('summary', `Transcribed records · ${archive.source.author}`));
    if (person.notes.length) {
      for (const excerpt of person.notes) records.append(node('p', excerpt, 'record-text'));
    } else {
      records.append(node('p', 'This person appears in another profile in the source.', 'record-text'));
    }
    const citations = node('details');
    citations.append(node('summary', 'Source pages and citations'));
    for (const page of person.pages) {
      const link = sourceLink.cloneNode(true);
      link.href += `#page=${page}`;
      link.textContent = `PDF page ${page}`;
      const paragraph = node('p');
      paragraph.append(link);
      citations.append(paragraph);
    }
    const citationsText = Object.values(archive.source.citations).flat().join('\n');
    if (citationsText) {
      const index = node('details');
      index.append(node('summary', 'Citation lists from the book'), node('p', citationsText, 'record-text'));
      citations.append(index);
    }
    profile.append(records, citations);
  }

  get('explorer').hidden = false;
  get('load-status').hidden = true;
  select(active, false);
}

async function load() {
  const status = get('load-status');
  try {
    const response = await fetch('./api/collection', { cache: 'no-store', redirect: 'error' });
    if (response.status === 404) {
      status.textContent = 'The private collection has not been installed.';
      return;
    }
    if (!response.ok) throw new Error('Collection unavailable');
    start(await response.json());
  } catch {
    status.hidden = false;
    status.textContent = 'The family archive could not be loaded. Refresh the page to try again.';
  }
}

load();
