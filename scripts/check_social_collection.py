"""Fail the CI run after publishing retained data when a collection is incomplete."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
failed = []
for account in json.loads((ROOT / 'config/social-accounts.json').read_text())['accounts']:
    for suffix in ['', '-videos', '-history']:
        path = ROOT / f"assets/data/{account['output']}{suffix}.json"
        data = json.loads(path.read_text()) if path.exists() else {}
        if data.get('status') != 'ok' or data.get('collectionStatus'):
            failed.append(account['output'] + suffix)
if failed:
    print('::error::Social collection incomplete: ' + ', '.join(failed) + '. Saved recent data was published where available; check collection logs.')
    raise SystemExit(1)
print('All registered client collections completed successfully.')
