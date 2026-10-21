const storageKey = 'fmw:troy-kearns:todo:v1';
const status = document.querySelector('#troy-todo-status');
const checkboxes = [...document.querySelectorAll('[data-troy-task]')];
let state = { version: 1, tasks: {} };
let blocked = false;
try {
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    const value = JSON.parse(stored);
    if (value?.version !== 1 || !value.tasks || typeof value.tasks !== 'object' || Array.isArray(value.tasks) || !Object.values(value.tasks).every(v => typeof v === 'boolean')) throw Error('Invalid saved checklist');
    state = value;
  }
} catch {
  blocked = true;
  status.textContent = 'Saved checkmarks could not be read. Saving is paused to protect them; you can still use the checklist in this tab.';
}
for (const checkbox of checkboxes) {
  checkbox.checked = state.tasks[checkbox.dataset.troyTask] === true;
  checkbox.addEventListener('change', () => {
    if (blocked) return;
    const next = { version: 1, tasks: { ...state.tasks, [checkbox.dataset.troyTask]: checkbox.checked } };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      state = next;
      status.textContent = 'Checkmarks saved in this browser only.';
    } catch {
      status.textContent = 'Could not save checkmarks. Keep this tab open to use the checklist.';
    }
  });
}
