"""Dependency-free source checks for the static GitHub Pages deployment."""
import re, struct, zlib
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
ROOT=Path(__file__).resolve().parents[1]
errors=[]
SERVER_FILE_ROUTES={'/troykearns/spreadsheets/shorts-analysis.xlsx':'services/workspace-auth/src/troy-spreadsheets.js'}
gates_enabled = 'const passwordGatesEnabled = true;' in (ROOT/'assets/js/app.js').read_text()
def require(condition,message):
 if not condition: errors.append(message)
class Document(HTMLParser):
 def __init__(self,path):
  super().__init__();self.path=path;self.ids=set();self.refs=[];self.h1=0;self.gate=False;self.hidden=False;self.main=False
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:
   require(attrs['id'] not in self.ids,f'{self.path}: duplicate id {attrs["id"]}')
   self.ids.add(attrs['id'])
  if tag=='h1':self.h1+=1
  if tag=='main':self.main=True
  if attrs.get('id')=='workspace-gate': self.gate='open' in attrs
  if attrs.get('id')=='workspace-content': self.hidden='hidden' in attrs and 'inert' in attrs
  for attr in ('href','src','poster'):
   if attrs.get(attr):self.refs.append(attrs[attr])
  if tag=='input':require(attrs.get('type')!='tel',f'{self.path}: unexpected contact field')
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
PAGES=['valori-corson/index.html','valori-corson/bookkeeping-business/index.html','valori-corson/calendar/index.html','troykearns/spreadsheets/index.html','troykearns/to-do/index.html','troykearns/links/index.html','kat-kai/to-do/index.html','portfolio/critz/stories/index.html','portfolio/critz/games/index.html','portfolio/critz/dragex/index.html','portfolio/critz/index.html','portfolio/equip/index.html','tanoshi/music/index.html','tanoshi/youtube/index.html','tutorials/index.html','tutorials/youtube-stats-access/index.html','privacy/index.html','build-a-business/index.html','troykearns/content-ideas/index.html','kat-kai/content-ideas/index.html','troykearns/strategy/index.html','troykearns/roadmap/index.html','kat-kai/strategy/index.html','kat-kai/roadmap/index.html','philip-aram/index.html','index.html','blog/index.html','portfolio/index.html','tanoshi/index.html','contact/index.html','troy-kearns/index.html','troykearns/index.html','troykearns/statistics/index.html','troykearns/connect/index.html','kat-kai/index.html','kat-kai/statistics/index.html','404.html']
for name in PAGES:
 path=ROOT/name;text=path.read_text();doc=Document(name);doc.feed(text)
 require(doc.h1==1,f'{name}: expected one h1');require(doc.main,f'{name}: missing main')
 require('Tanoshi Creative' not in text and 'TANOSHI CREATIVE' not in text,f'{name}: old name remains')
 require('phone' not in text.lower(),f'{name}: unexpected contact detail')
 for ref in doc.refs:
  url=urlsplit(ref)
  if url.scheme or url.netloc:continue
  if url.path in SERVER_FILE_ROUTES:
   route_owner=ROOT/SERVER_FILE_ROUTES[url.path]
   require(route_owner.is_file() and url.path in route_owner.read_text(),f'{name}: missing server file route {ref}')
   continue
  if url.path:
   target=(ROOT/url.path.lstrip('/')) if url.path.startswith('/') else (path.parent/unquote(url.path))
   if target.is_dir():target/= 'index.html'
   require(target.is_file(),f'{name}: missing local reference {ref}')
  elif url.fragment:require(url.fragment in doc.ids,f'{name}: missing fragment {url.fragment}')
 if name.startswith(('philip-aram/','troy-kearns/','troykearns/','kat-kai/')):
  require(doc.gate and doc.hidden if gates_enabled else not doc.gate and not doc.hidden, f'{name}: workspace access does not match configured preview mode')
home=(ROOT/'index.html').read_text()
require('Build a Business</a>' in home,'Homepage business menu link missing')
require('class="landing-tagline"' not in home,'Removed homepage tagline has returned')
require(home.index('/build-a-business/')<home.index('/portfolio/')<home.index('/tanoshi/'),'Homepage navigation order wrong')
nav=re.search(r'<nav class="landing-nav"[^>]*>(.*?)</nav>',home,re.S).group(1)
require(re.findall(r'href="([^"]+)"',nav)==['/build-a-business/','/portfolio/','/tanoshi/'],'Homepage Blog link must stay hidden for now')
require('No posts published yet.' in (ROOT/'blog/index.html').read_text(),'Blog empty state missing')
require('contact blog ' in (ROOT/'.github/workflows/pages.yml').read_text(),'Blog missing from deployment')
css=(ROOT/'assets/css/styles.css').read_text()
colors={c.lower() for c in re.findall(r'#[0-9a-fA-F]{3,8}\b',css)}
require(colors<={'#000','#fff','#000000','#ffffff'},f'Non-binary CSS colors: {colors}')
require(not re.search(r'@keyframes|\btransition\s*:|\banimation\s*:',css),'Animation found in static release')
for path in (ROOT/'assets/images').rglob('*.svg'):
 if path.name in {'kat-seed.svg','kat-sprout.svg','kat-young-plant.svg','kat-tree.svg','kat-flower-paint.svg','troy-millionaire-mentorship.svg'}:continue # Owner-approved client brand artwork; public site artwork remains monochrome.
 text=path.read_text()
 colors={c.lower() for c in re.findall(r'#[0-9a-fA-F]{3,8}\b',text)}
 require(colors<={'#000','#fff','#000000','#ffffff'},f'{path.name}: non-binary SVG color')
for name,expected in [('landscape',(263,168)),('bird',(18,16))]:
 data=(ROOT/f'assets/images/pixel/{name}.png').read_bytes()
 require(struct.unpack('>II',data[16:24])==expected,f'{name}: incorrect source grid')
 require(data[24:26]==bytes([1,0]),f'{name}: must be 1-bit grayscale PNG')
 require(b'tRNS\0\0' in data,f'{name}: transparent black mask missing')
 compressed=b'';offset=8
 while offset<len(data):
  length=struct.unpack('>I',data[offset:offset+4])[0];kind=data[offset+4:offset+8];payload=data[offset+8:offset+8+length]
  require(zlib.crc32(kind+payload)&0xffffffff==struct.unpack('>I',data[offset+8+length:offset+12+length])[0],f'{name}: PNG checksum mismatch')
  if kind==b'IDAT':compressed+=payload
  offset+=12+length
 require(len(zlib.decompress(compressed))==(1+(expected[0]+7)//8)*expected[1],f'{name}: invalid PNG scanlines')
for path in (ROOT/'assets/css').glob('*.css'):
 for ref in re.findall(r'url\([\"\']?([^\)\"\']+)',path.read_text()):
  require(((ROOT/urlsplit(ref).path.lstrip('/')) if ref.startswith('/') else (path.parent/urlsplit(ref).path)).is_file(),f'{path.name}: missing font/image {ref}')
for path in (ROOT/'assets/js').glob('*.js'):
 text=path.read_text()
 for ref in re.findall(r"from\s+['\"]([^'\"]+)['\"]",text):require(((ROOT/urlsplit(ref).path.lstrip('/')) if ref.startswith('/') else (path.parent/urlsplit(ref).path)).is_file(),f'{path.name}: missing module {ref}')
 if path.name=='scene.js':require('reduced.matches' in text and 'document.hidden' in text,'Siege must respect reduced motion and hidden tabs')
require((ROOT/'CNAME').read_text().strip()=='freemarketwildlife.com','Custom domain mismatch')
if errors:
 print('\n'.join(errors));raise SystemExit(1)
print(f'PASS: {len(PAGES)} pages, local references, configured workspace access, monochrome palette, binary sprites, fonts, and motion accessibility contract.')
