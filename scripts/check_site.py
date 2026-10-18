"""Dependency-free source checks for the static GitHub Pages deployment."""
import re, struct, zlib
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
ROOT=Path(__file__).resolve().parents[1]
errors=[]
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
PAGES=['index.html','portfolio/index.html','tanoshi/index.html','contact/index.html','troy-kearns/index.html','kat-kai/index.html','404.html']
for name in PAGES:
 path=ROOT/name;text=path.read_text();doc=Document(name);doc.feed(text)
 require(doc.h1==1,f'{name}: expected one h1');require(doc.main,f'{name}: missing main')
 require('Tanoshi Creative' not in text and 'TANOSHI CREATIVE' not in text,f'{name}: old name remains')
 require('phone' not in text.lower(),f'{name}: unexpected contact detail')
 for ref in doc.refs:
  url=urlsplit(ref)
  if url.scheme or url.netloc:continue
  if url.path:
   target=(ROOT/url.path.lstrip('/')) if url.path.startswith('/') else (path.parent/unquote(url.path))
   if target.is_dir():target/= 'index.html'
   require(target.is_file(),f'{name}: missing local reference {ref}')
  elif url.fragment:require(url.fragment in doc.ids,f'{name}: missing fragment {url.fragment}')
 if name.startswith(('troy-kearns/','kat-kai/')):
  require(doc.gate and doc.hidden,f'{name}: workspace must start gated, hidden, inert')
home=(ROOT/'index.html').read_text()
require('Build a Career' in home,'Homepage tagline missing')
require(home.index('/portfolio/')<home.index('/tanoshi/')<home.index('/contact/'),'Homepage navigation order wrong')
css=(ROOT/'assets/css/styles.css').read_text()
colors={c.lower() for c in re.findall(r'#[0-9a-fA-F]{3,8}\b',css)}
require(colors<={'#000','#fff','#000000','#ffffff'},f'Non-binary CSS colors: {colors}')
require(not re.search(r'@keyframes|\btransition\s*:|\banimation\s*:',css),'Animation found in static release')
for path in (ROOT/'assets/images').rglob('*.svg'):
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
  require((path.parent/ref).is_file(),f'{path.name}: missing font/image {ref}')
for path in (ROOT/'assets/js').glob('*.js'):
 text=path.read_text()
 for ref in re.findall(r"from\s+['\"]([^'\"]+)['\"]",text):require((path.parent/ref).is_file(),f'{path.name}: missing module {ref}')
 if path.name=='scene.js':require(not re.search(r'\b(requestAnimationFrame|setInterval|setTimeout)\s*\(',text),'Autonomous scene animation found')
require((ROOT/'CNAME').read_text().strip()=='freemarketwildlife.com','Custom domain mismatch')
if errors:
 print('\n'.join(errors));raise SystemExit(1)
print('PASS: 7 pages, local references, workspace barriers, monochrome palette, binary sprites, fonts, and static scene contract.')
