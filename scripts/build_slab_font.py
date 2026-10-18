"""Normal type -> monochrome hinted pixel glyphs -> a native web typeface.
Developer dependencies: Pillow and fonttools. Runtime dependencies: none.
Source: Roboto Slab Regular, Apache 2.0, bundled with attribution/license.
"""
from pathlib import Path
from math import ceil
from PIL import Image, ImageDraw, ImageFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import newTable, TTFont
from fontTools.ttLib.tables._k_e_r_n import KernTable_format_0
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/fonts/RobotoSlab-Variable.ttf'
CHARS=sorted(set('FREE MARKETWILDLIFE'))
copyright_text=TTFont(SOURCE)['name'].getDebugName(0)

def build(small=False):
 size=18 if small else 29;em=16 if small else 24
 source=ImageFont.truetype(str(SOURCE),size)
 source.set_variation_by_axes([400])
 cap=-source.getbbox('H',anchor='ls')[1]
 fb=FontBuilder(em*100,isTTF=True)
 names=['.notdef']+[f'u{ord(c):04X}' for c in CHARS]
 fb.setupGlyphOrder(names);fb.setupCharacterMap({ord(c):f'u{ord(c):04X}' for c in CHARS})
 glyphs={};metrics={}
 for char,name in [('F','.notdef')]+[(c,f'u{ord(c):04X}') for c in CHARS]:
  advance=round(source.getlength(char))
  # FreeType's native monochrome rasterization/hinting retains normal letter
  # anatomy and produces real one-bit pixels. No traced AI letterforms.
  mask=Image.new('1',(max(1,advance+2),cap))
  ImageDraw.Draw(mask).text((0,cap),char,font=source,fill=1,anchor='ls')
  pen=TTGlyphPen(None)
  for y in range(mask.height):
   x=0
   while x<mask.width:
    if not mask.getpixel((x,y)):x+=1;continue
    end=x+1
    while end<mask.width and mask.getpixel((end,y)):end+=1
    x0,x1=x*100,end*100;y0=(cap-1-y)*100
    pen.moveTo((x0,y0));pen.lineTo((x0,y0+100));pen.lineTo((x1,y0+100));pen.lineTo((x1,y0));pen.closePath();x=end
  glyphs[name]=pen.glyph();metrics[name]=(advance*100,0)
 fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(metrics)
 fb.setupHorizontalHeader(ascent=cap*100,descent=-(em-cap)*100)
 family='FMW Clean Slab Small' if small else 'FMW Clean Slab'
 fb.setupNameTable({'familyName':family,'styleName':'Regular','uniqueFontIdentifier':family+'-1','fullName':family,'psName':family.replace(' ',''),'version':'Version 1.0','copyright':copyright_text,'licenseDescription':'Derived from Roboto Slab, Apache License 2.0. See RobotoSlab-LICENSE.txt and NOTICE.txt.','licenseInfoURL':'https://www.apache.org/licenses/LICENSE-2.0'})
 fb.setupOS2(sTypoAscender=cap*100,sTypoDescender=-(em-cap)*100,sTypoLineGap=0,usWinAscent=cap*100,usWinDescent=(em-cap)*100)
 fb.setupPost();fb.setupMaxp()
 kern={}
 for a in CHARS:
  for b in CHARS:
   value=round(source.getlength(a+b)-source.getlength(a)-source.getlength(b))*100
   if value:kern[(f'u{ord(a):04X}',f'u{ord(b):04X}')]=value
 if kern:
  table=newTable('kern');table.version=0
  sub=KernTable_format_0();sub.version=0;sub.coverage=1;sub.kernTable=kern;table.kernTables=[sub];fb.font['kern']=table
 path=ROOT/'assets/fonts'/('fmw-clean-slab-small.ttf' if small else 'fmw-clean-slab.ttf')
 fb.save(path)
 print(f'{family}: normal weight 400, {cap}-pixel cap, {round(source.getlength("FREE MARKET"))}-pixel title width')
build();build(True)
(ROOT/'assets/fonts/NOTICE.txt').write_text('FMW Clean Slab and FMW Clean Slab Small are monochrome rasterized derivatives of Roboto Slab Regular.\n'+copyright_text+'\nSource: https://github.com/google/fonts/tree/main/apache/robotoslab\nSource font: scripts/fonts/RobotoSlab-Variable.ttf\nLicense: Apache License, Version 2.0; see RobotoSlab-LICENSE.txt.\nModifications: integer-grid monochrome rasterization, title-only glyph subset, renamed family, and reconstructed pixel contours.\n')
