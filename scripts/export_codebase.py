"""Export complete, copyable source blocks for review without a build tool."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
files=['index.html','assets/css/styles.css','assets/css/troy.css','assets/js/app.js','assets/js/clients.js','assets/js/scene.js','assets/js/scene-sprites.js','portfolio/index.html','tanoshi/index.html','contact/index.html','troy-kearns/index.html','troykearns/index.html','troykearns/statistics/index.html','kat-kai/index.html','404.html','.github/workflows/pages.yml','CNAME']
languages={'.html':'html','.css':'css','.js':'javascript','.yml':'yaml'}
parts=['# Free Market Wildlife — complete source code\n\nThe actual editable files live at the paths below. Local font and sprite files are included in the repository. See README.md for preview, design contracts, and deployment setup.\n\n```text\n'+'\n'.join(files)+'\n```\n']
for name in files:
 path=root/name
 parts.append(f'## {name}\n\n```{languages.get(path.suffix,"text")}\n{path.read_text().rstrip()}\n```\n')
(root/'CODEBASE.md').write_text('\n'.join(parts))
print('Exported complete code blocks to CODEBASE.md')
