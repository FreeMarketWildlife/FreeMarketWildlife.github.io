import { clients, clientForPasscode } from './clients.js';

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

// A shared passcode-only launcher routes directly to the matching folder.
const access = $('#access-dialog');
const accessForm = $('[data-access-form]');
const accessInput = $('#access-code');
const accessError = $('#access-error');
if (access && accessForm) {
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
    if (client) location.assign(client.path);
    else rejectPasscode(accessInput, accessError, 'Passcode not recognized. Check it and try again.');
  });
}

// Every workspace load starts locked. Nothing is persisted in browser storage.
const gate = $('#workspace-gate');
const workspace = $('#workspace-content');
if (gate && workspace) {
  const form = $('[data-gate-form]');
  const input = $('#gate-code');
  const error = $('#gate-error');
  const client = clients[document.body.dataset.client];
  const openGate = () => {
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
  openGate();
  gate.addEventListener('cancel', event => event.preventDefault());
  resetError(input, error);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!client || input.value.trim() !== client.passcode) {
      rejectPasscode(input, error, 'Incorrect workspace passcode. Please try again.');
      return;
    }
    workspace.hidden = false;
    gate.close();
    workspace.inert = false;
    $('#main').focus({ preventScroll: true });
    form.reset();
  });
  $('[data-lock-workspace]').addEventListener('click', openGate);
  // Re-lock restored history entries as well as normal reloads.
  window.addEventListener('pageshow', event => { if (event.persisted) openGate(); });
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
