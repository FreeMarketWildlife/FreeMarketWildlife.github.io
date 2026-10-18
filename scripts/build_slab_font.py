"""Build the Pixel Slab heading directly from the approved concept's glyphs.
Developer dependencies: fonttools and Pillow. No website runtime dependency.
Only source pixels are read; output is a native font with integer-grid contours.
"""
from pathlib import Path
from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'design/type-concepts/02-pixel-slab.png'
# Measured ink bounds in the actual approved concept, not approximated letters.
BOUNDS={
 'F':(112,211,260,393),'R':(280,211,444,393),'E':(459,211,593,393),
 'M':(835,211,1014,393),'A':(1028,211,1194,393),'K':(1378,211,1529,393),
 'T':(1690,211,1809,393),'W':(112,426,337,607),'I':(356,426,432,607),
 'L':(457,426,593,607),'D':(607,426,756,607),
}
source=Image.open(REFERENCE).convert('L')
def sample(bounds,height):
 left,top,right,bottom=bounds;sw=right-left;sh=bottom-top
 width=round(sw*height/sh)
 grid=[]
 for y in range(height):
  y0=top+y*sh//height;y1=top+(y+1)*sh//height
  row=[]
  for x in range(width):
   x0=left+x*sw//width;x1=left+(x+1)*sw//width
   white=sum(source.getpixel((xx,yy))>=180 for yy in range(y0,y1) for xx in range(x0,x1))
   # Majority coverage gently trims boundary weight, preserving open counters.
   row.append(int(white/((x1-x0)*(y1-y0))>=.55))
  grid.append(row)
 return grid

def build(small=False):
 height=14 if small else 21;em_cells=16 if small else 24;gap=1 if small else 2
 grids={char:sample(bounds,height) for char,bounds in BOUNDS.items()}
 grids[' ']=[[0]*(5 if small else 8) for _ in range(height)]
 fb=FontBuilder(em_cells*100,isTTF=True)
 names=['.notdef']+[f'u{ord(c):04X}' for c in grids]
 fb.setupGlyphOrder(names);fb.setupCharacterMap({ord(c):f'u{ord(c):04X}' for c in grids})
 glyphs={};metrics={}
 for char,name in [('F','.notdef')]+[(c,f'u{ord(c):04X}') for c in grids]:
  grid=grids[char];pen=TTGlyphPen(None)
  for y,row in enumerate(grid):
   x=0
   while x<len(row):
    if not row[x]:x+=1;continue
    end=x+1
    while end<len(row) and row[end]:end+=1
    x0,x1=x*100,end*100;y0=(height-1-y)*100
    pen.moveTo((x0,y0));pen.lineTo((x0,y0+100));pen.lineTo((x1,y0+100));pen.lineTo((x1,y0));pen.closePath();x=end
  glyphs[name]=pen.glyph();metrics[name]=((len(grid[0])+gap)*100,0)
 fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(metrics)
 ascent=height*100;descent=(em_cells-height)*100
 fb.setupHorizontalHeader(ascent=ascent,descent=-descent)
 family='FMW Slab Small' if small else 'FMW Slab Reference'
 fb.setupNameTable({'familyName':family,'styleName':'Regular','uniqueFontIdentifier':family+'-2','fullName':family,'psName':family.replace(' ',''),'version':'Version 2.0'})
 fb.setupOS2(sTypoAscender=ascent,sTypoDescender=-descent,sTypoLineGap=0,usWinAscent=ascent,usWinDescent=descent)
 fb.setupPost();fb.setupMaxp()
 path=ROOT/'assets/fonts'/('fmw-slab-small.ttf' if small else 'fmw-slab-reference.ttf')
 fb.save(path)
 text='FREE MARKET'
 print(f'{family}: cap {height}, line {sum(metrics[f"u{ord(c):04X}"][0] for c in text)//100} logical pixels')
build();build(True)
