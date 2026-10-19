import { clients, clientForPasscode } from './clients.js?v=3';

// Temporary public preview mode. Restore with scripts/set_password_gates.py on.
const passwordGatesEnabled = false;

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
$$('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

function rejectPasscode(input, error, message) {
  error.textContent = message;
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  input.select();
}
function resetError(input, error) {
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  });
}

// Temporary browser-only preview access; this is not authentication.
// Session storage avoids asking twice when moving from the launcher to a page.
const previewKey = client => `fmw-preview:${client}`;
function rememberPreview(client) {
  try { sessionStorage.setItem(previewKey(client), 'open'); } catch { /* Direct gate still works. */ }
}
function hasPreview(client) {
  try { return sessionStorage.getItem(previewKey(client)) === 'open'; } catch { return false; }
}
function forgetPreview(client) {
  try { sessionStorage.removeItem(previewKey(client)); } catch { /* No persisted state. */ }
}
// A shared password launcher routes directly to the matching folder.
const access = $('#access-dialog');
const accessForm = $('[data-access-form]');
const accessInput = $('#access-code');
const accessError = $('#access-error');
if (access && accessForm && passwordGatesEnabled) {
  $$('[data-open-access]').forEach(button => button.addEventListener('click', () => {
    accessForm.reset();
    accessError.textContent = '';
    accessInput.removeAttribute('aria-invalid');
    access.showModal();
    accessInput.focus();
  }));
  $('[data-close-access]').addEventListener('click', () => access.close());
  resetError(accessInput, accessError);
  accessForm.addEventListener('submit', event => {
    event.preventDefault();
    const client = clientForPasscode(accessInput.value.trim());
    if (client) {
      const clientId = Object.keys(clients).find(id => clients[id] === client);
      rememberPreview(clientId);
      location.assign(client.path);
    }
    else rejectPasscode(accessInput, accessError, 'Password not recognized. Check it and try again.');
  });
}

if (access && !passwordGatesEnabled) {
  $$('[data-open-access]').forEach(button => button.addEventListener('click', () => access.showModal()));
  $('[data-close-access]')?.addEventListener('click', () => access.close());
}

// Workspaces require the demo password only while preview gates are enabled.
const gate = $('#workspace-gate');
const workspace = $('#workspace-content');
if (gate && workspace && !passwordGatesEnabled) {
  if (gate.open) gate.close();
  gate.hidden = true;
  workspace.hidden = false;
  workspace.inert = false;
  $$('[data-lock-workspace]').forEach(button => { button.hidden = true; });
}
if (gate && workspace && passwordGatesEnabled) {
  const form = $('[data-gate-form]');
  const input = $('#gate-code');
  const error = $('#gate-error');
  const client = clients[document.body.dataset.client];
  const revealWorkspace = () => {
    workspace.hidden = false;
    if (gate.open) gate.close();
    workspace.inert = false;
    $('#main').focus({ preventScroll: true });
    form.reset();
  };
  const openGate = () => {
    forgetPreview(document.body.dataset.client);
    workspace.hidden = true;
    workspace.inert = true;
    if (gate.open) gate.close();
    gate.showModal();
    form.reset();
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    input.focus();
  };
  // Convert the immediately visible HTML barrier into a focus-trapping dialog.
  gate.removeAttribute('open');
  if (hasPreview(document.body.dataset.client)) revealWorkspace();
  else openGate();
  gate.addEventListener('cancel', event => event.preventDefault());
  resetError(input, error);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!client || input.value.trim() !== client.passcode) {
      rejectPasscode(input, error, 'Incorrect workspace password. Please try again.');
      return;
    }
    rememberPreview(document.body.dataset.client);
    revealWorkspace();
  });
  $('[data-lock-workspace]').addEventListener('click', openGate);
  // Re-lock restored history entries after signing out.
  window.addEventListener('pageshow', event => {
    if (event.persisted && !hasPreview(document.body.dataset.client)) openGate();
  });
}

const email = 'FreeMarketWildlife@gmail.com';
const contactForm = $('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get('name')).trim();
    const from = String(data.get('email')).trim();
    const message = String(data.get('message')).trim();
    if (!name || !message) {
      $('#contact-status').textContent = 'Please enter your name and a message before continuing.';
      return;
    }
    const subject = `Website inquiry from ${name.replace(/[\r\n]/g, ' ')}`;
    const body = `Name: ${name}\nEmail: ${from}\n\n${message}`;
    location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#contact-status').textContent = 'Email handoff prepared. Send it from your mail app. If no app opens, copy the address and send your message directly.';
  });
}
const copyButton = $('[data-copy-email]');
if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const status = $('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(email);
      status.textContent = 'Email address copied.';
    } catch {
      status.textContent = `Copy this address: ${email}`;
    }
  });
}
