"""Apply the retained visibility policy to static and catalog-generated listings."""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parent
games=root.parents[1]/'games'
policy=json.loads((root/'listing-visibility.json').read_text())
hidden=set(policy['hiddenIds'])
catalog=json.loads((games/'catalog.json').read_text())
cards=json.loads((root/'hub-card-templates.json').read_text())
assert hidden.issubset({g['id'] for g in catalog})
assert {g['id'] for g in catalog}==set(cards)
for game in catalog:
    game['publicListing']=game['id'] not in hidden
(games/'catalog.json').write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+'\n')
page=games/'index.html'
html=page.read_text()
replacement='<div class="arcade-grid">\n'+'\n'.join(cards[g['id']] for g in catalog if g['publicListing'])+'\n</div>'
html,count=re.subn(r'<div class="arcade-grid">.*?</div>',lambda _:replacement,html,flags=re.S)
assert count==1
page.write_text(html)
script=games/'catalog.js'
text=script.read_text()
text=text.replace('for(const g of games){','for(const g of games.filter(game=>game.publicListing!==false)){')
assert 'games.filter(game=>game.publicListing!==false)' in text
script.write_text(text)
assert len(re.findall(r'<a class="game-card"',html))==sum(g['publicListing'] for g in catalog)
print(json.dumps({'visible':sum(g['publicListing'] for g in catalog),'hidden':[g['title'] for g in catalog if not g['publicListing']]}))
