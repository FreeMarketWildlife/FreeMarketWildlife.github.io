import {combinedItems, monthCells} from './valori-calendar-model.js';
const grid = document.querySelector('#calendar-grid');
const heading = document.querySelector('#calendar-month');
const status = document.querySelector('#calendar-status');
const today = new Date();
let displayed = new Date(today.getFullYear(), today.getMonth(), 1);
const format = new Intl.DateTimeFormat('en', {month: 'long', year: 'numeric'});
const isoDate = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
function render() {
  const year = displayed.getFullYear(), month = displayed.getMonth();
  const items = combinedItems();
  heading.textContent = format.format(displayed);
  grid.replaceChildren();
  const weekdays = document.createElement('div');
  weekdays.className = 'calendar-row'; weekdays.setAttribute('role', 'row');
  for (const label of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
    const cell = document.createElement('span'); cell.className = 'calendar-weekday';
    cell.setAttribute('role', 'columnheader'); cell.textContent = label; weekdays.append(cell);
  }
  grid.append(weekdays);
  const cells = monthCells(year, month);
  let row;
  cells.forEach((day, index) => {
    if (index % 7 === 0) {
      row = document.createElement('div'); row.className = 'calendar-row';
      row.setAttribute('role', 'row'); grid.append(row);
    }
    const cell = document.createElement('div'); cell.className = 'calendar-day';
    cell.setAttribute('role', 'cell'); row.append(cell);
    if (!day) return;
    const date = isoDate(year, month, day);
    const time = document.createElement('time'); time.dateTime = date; time.textContent = day;
    if (date === isoDate(today.getFullYear(), today.getMonth(), today.getDate())) time.setAttribute('aria-current', 'date');
    cell.append(time);
    const entries = items.filter(item => item.date === date);
    if (entries.length) {
      const list = document.createElement('ul');
      for (const item of entries) {
        const entry = document.createElement('li');
        entry.textContent = `${item.category}: ${item.title}`; list.append(entry);
      }
      cell.append(list);
    }
  });
  const monthPrefix = isoDate(year, month, 1).slice(0, 7);
  status.textContent = items.some(item => item.date.startsWith(monthPrefix)) ? '' : 'No Personal or Bookkeeping Business events for this month.';
  status.hidden = !status.textContent;
}
for (const button of document.querySelectorAll('[data-month]')) button.addEventListener('click', () => {
  displayed = new Date(displayed.getFullYear(), displayed.getMonth() + Number(button.dataset.month), 1); render();
});
document.querySelector('[data-today]').addEventListener('click', () => {
  const current = new Date(); displayed = new Date(current.getFullYear(), current.getMonth(), 1); render();
});
render();
