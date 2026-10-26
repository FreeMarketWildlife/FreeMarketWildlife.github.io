"""Verify the exact accepted game release; optionally stage Worker assets."""
from pathlib import Path
import hashlib,json,re,shutil,sys

service=Path(__file__).resolve().parent
repo=service.parents[1]
manifest=json.loads((service/'release-manifest.json').read_text())
actual={str(path.relative_to(repo)) for path in (repo/'games').rglob('*') if path.is_file()}
assert actual==set(manifest),'Unexpected or missing public game assets'
for name,record in manifest.items():
    path=repo/name
    assert name.startswith('games/') and '..' not in Path(name).parts
    assert not path.is_symlink() and path.resolve().is_relative_to((repo/'games').resolve())
    data=path.read_bytes()
    assert len(data)==record['bytes'] and hashlib.sha256(data).hexdigest()==record['sha256'],name
policy=json.loads((service/'listing-visibility.json').read_text())
catalog=json.loads((repo/'games/catalog.json').read_text())
hidden=set(policy['hiddenIds'])
assert {game['id'] for game in catalog if game.get('publicListing') is False}==hidden
expected=['critz-kingdom-conquest' if game['id']=='kingdom-conquest' else game['id'] for game in catalog if game.get('publicListing') is not False]
html=(repo/'games/index.html').read_text()
assert re.findall(r'<a class="game-card" href="\./([^/]+)/"',html)==expected
assert 'games.filter(game=>game.publicListing!==false)' in (repo/'games/catalog.js').read_text()
if '--build' in sys.argv:
    output=service/'.generated/public'
    if output.exists():shutil.rmtree(output)
    for name in manifest:
        destination=output/name
        destination.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(repo/name,destination)
print(json.dumps({'verifiedFiles':len(manifest),'listedGames':len(expected),'hiddenGames':len(hidden),'workerAssetsPrepared':'--build' in sys.argv}))
