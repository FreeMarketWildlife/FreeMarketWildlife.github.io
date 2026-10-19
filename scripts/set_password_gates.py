"""Temporarily open static workspace pages, or restore their preview gates.
Usage: python3 scripts/set_password_gates.py off|on
This controls the static preview interface, not private backend authentication.
"""
from pathlib import Path
import re
import sys
ROOT = Path(__file__).resolve().parents[1]

def configure(enabled):
    app = ROOT / 'assets/js/app.js'
    source = app.read_text()
    source = re.sub(r'const passwordGatesEnabled = (?:true|false);',
                    'const passwordGatesEnabled = ' + str(enabled).lower() + ';', source)
    app.write_text(source)
    count = 0
    for folder in ['', 'portfolio', 'contact', 'tanoshi', 'blog', 'troy-kearns', 'troykearns', 'kat-kai', 'philip-aram']:
        paths = [ROOT / 'index.html', ROOT / '404.html'] if not folder else (ROOT / folder).rglob('*.html')
        for path in paths:
            text = path.read_text()
            if '/assets/js/app.js' not in text:
                continue
            text = re.sub(r'/assets/js/app.js\?v=[^"\s]+', '/assets/js/app.js?v=4-' + ('gated' if enabled else 'open'), text)
            def workspace(match):
                tag = re.sub(r'\s+(?:hidden|inert)(?=[\s>])', '', match[0])
                return tag[:-1] + (' hidden inert>' if enabled else '>')
            text = re.sub(r'<div\b[^>]*id="workspace-content"[^>]*>', workspace, text)
            def gate(match):
                tag = re.sub(r'\s+(?:hidden|open)(?=[\s>])', '', match[0])
                return tag[:-1] + (' open>' if enabled else ' hidden>')
            text = re.sub(r'<dialog\b[^>]*id="workspace-gate"[^>]*>', gate, text)
            def lock(match):
                tag = re.sub(r'\s+hidden(?=[\s>])', '', match[0])
                return tag[:-1] + ('>' if enabled else ' hidden>')
            text = re.sub(r'<button\b[^>]*data-lock-workspace[^>]*>', lock, text)
            if 'id="access-dialog"' in text:
                # Keep the original password form intact for later restoration.
                text = re.sub(r'<form\b[^>]*data-access-form[^>]*>', lambda m: re.sub(r'\s+hidden(?=[\s>])', '', m[0])[:-1] + ('>' if enabled else ' hidden>'), text)
                text = re.sub(r'<nav\b[^>]*data-workspace-links.*?</nav>', '', text, flags=re.S)
                links = '<nav data-workspace-links aria-label="Workspaces"' + (' hidden' if enabled else '') + '><ul><li><a href="/kat-kai/">Kat &amp; Kai</a></li><li><a href="/troykearns/">Troy Kearns</a></li><li><a href="/philip-aram/">Philip Aram</a></li></ul></nav>'
                text = re.sub(r'(<form\b[^>]*data-access-form.*?</form>)', lambda m: m[0] + links, text, count=1, flags=re.S)
                text = re.sub(r'(<h2 id="access-title">).*?(</h2>)', lambda m: m[1] + ('Sign in.' if enabled else 'Workspaces') + m[2], text)
                text = text.replace('Choose a workspace to open.', 'Enter your workspace password to continue.') if enabled else text.replace('Enter your workspace password to continue.', 'Choose a workspace to open.')
                def launcher(match):
                    value = match[0]
                    return value.replace('aria-label="Workspaces"', 'aria-label="Sign in"').replace('>Workspaces<', '>Sign in<') if enabled else value.replace('aria-label="Sign in"', 'aria-label="Workspaces"').replace('>Sign in<', '>Workspaces<')
                text = re.sub(r'<button\b[^>]*data-open-access[^>]*>.*?</button>', launcher, text, flags=re.S)
            path.write_text(text)
            count += 1
    print(f'Password gates {"enabled" if enabled else "disabled"} across {count} site pages.')

if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in ('on', 'off'):
        raise SystemExit('Usage: python3 scripts/set_password_gates.py off|on')
    configure(sys.argv[1] == 'on')
