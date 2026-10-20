const key = 'fmw:kat-kai:thumbnail-todo:v1';
const checkboxes = [...document.querySelectorAll('[data-todo]')];
const status = document.querySelector('#todo-save-status');
let saved = {};
try {
  const value = JSON.parse(localStorage.getItem(key) || '{}');
  if (value && typeof value === 'object' && !Array.isArray(value)) saved = value;
} catch {
  status.textContent = 'Saved checkmarks could not be loaded. You can still use this checklist.';
}
for (const checkbox of checkboxes) {
  checkbox.checked = saved[checkbox.dataset.todo] === true;
  checkbox.addEventListener('change', () => {
    saved[checkbox.dataset.todo] = checkbox.checked;
    try {
      localStorage.setItem(key, JSON.stringify(saved));
      status.textContent = 'Checkmarks saved in this browser only. For each monthly refresh, uncheck the list and use it again.';
    } catch {
      status.textContent = 'Checkmarks could not be saved in this browser. Keep this tab open to use the checklist.';
    }
  });
}
