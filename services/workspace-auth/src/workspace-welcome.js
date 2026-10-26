const escape = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');

// Only public branding appears here. Protected assets are never fetched to render this page.
export function workspaceWelcome(workspace, returnTo, emailEnabled, notice='') {
  const themes = {
    'troy-kearns': {css:'troy-workspace', logo:'/assets/images/troy-millionaire-mentorship.svg', alt:'Millionaire Mentorship'},
    'kat-kai': {css:'kat-kai', logo:'/assets/images/kat-kai-logo.webp', alt:'Kat & Kai'},
    'philip-aram': {css:'philip', logo:'/assets/images/mark.svg', alt:'Free Market Wildlife'}
  };
  const theme=themes[workspace.id], name=escape(workspace.name);
  const google='/auth/start?returnTo='+encodeURIComponent(returnTo);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Welcome — ${name} | Free Market Wildlife</title>
<link rel="stylesheet" href="/assets/css/troy.css?v=3"><link rel="stylesheet" href="/assets/css/${theme.css}.css">
<link rel="stylesheet" href="/assets/css/workspace-welcome.css?v=1">
<script type="module" src="/assets/js/workspace-signin.js?v=1"></script></head>
<body data-client="${workspace.id}" class="workspace-welcome">
<main id="main" class="welcome-main"><img class="welcome-logo" src="${theme.logo}" alt="${escape(theme.alt)}">
<p class="welcome-brand">Free Market Wildlife</p>
<h1>Welcome to the <span>${name}</span> Free Market Wildlife Workspace</h1>
<p class="welcome-intro">Sign in to open your workspace.</p>
<section class="welcome-signin" aria-label="Sign in" data-return-to="${escape(returnTo)}">
<a class="welcome-provider" href="${escape(google)}">Continue with Google</a>
${emailEnabled?'<p class="welcome-divider">or</p><form data-email-signin><label for="signin-email">Email address</label><input id="signin-email" name="email" type="email" autocomplete="email" maxlength="254" required><button class="welcome-provider" type="submit">Continue with email</button></form>':''}
<p class="welcome-status" role="status">${escape(notice)}</p>
<noscript><p>Google sign-in works directly. Enable JavaScript to sign in with email.</p></noscript>
</section><p class="welcome-footer"><a href="/">Back home</a><a href="/privacy/">Privacy</a></p></main></body></html>`;
}
