"""Original, integer-grid Pixel Slab wordmark fonts. Dev dependency: fonttools."""
from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
ROOT=Path(__file__).resolve().parents[1]
GLYPHS={}
def make(char,width):
 grid=[[0]*width for _ in range(17)]
 def rect(x,y,w,h):
  for yy in range(y,min(y+h,17)):
   for xx in range(x,min(x+w,width)):
    if xx>=0 and yy>=0:grid[yy][xx]=1
 def line(x0,y0,x1,y1):
  steps=max(abs(x1-x0),abs(y1-y0))
  for n in range(steps+1):
   x=round(x0+(x1-x0)*n/steps);y=round(y0+(y1-y0)*n/steps);rect(x,y,3,3)
 if char in 'FERLDK':rect(2,0,3,17)
 if char in 'FER':rect(0,0,width-2,3)
 if char in 'FE':
  rect(10,0,3,6);rect(4,7,7,3);rect(8,6,3,5)
 if char=='F':rect(0,15,8,2)
 if char=='E':rect(0,14,13,3);rect(10,11,3,6)
 if char=='R':
  rect(10,2,3,6);rect(9,1,3,8);rect(4,7,7,3);line(6,9,10,14);rect(0,15,8,2);rect(9,15,6,2)
 if char=='L':rect(0,0,8,2);rect(0,14,13,3);rect(10,11,3,6)
 if char=='D':
  rect(0,0,10,3);rect(0,14,10,3);rect(9,1,3,3);rect(11,3,3,11);rect(9,13,3,3)
 if char=='K':
  rect(0,0,8,2);rect(0,15,8,2);rect(9,0,6,2);line(10,2,5,8);line(6,8,11,14);rect(9,15,6,2)
 if char=='I':rect(0,0,9,2);rect(3,0,3,17);rect(0,15,9,2)
 if char=='T':rect(0,0,15,3);rect(0,1,3,5);rect(12,1,3,5);rect(6,0,3,17);rect(3,15,9,2)
 if char=='A':
  rect(6,0,3,3);line(5,2,1,14);line(7,2,11,14);rect(3,9,9,3);rect(0,15,7,2);rect(8,15,7,2)
 if char=='M':
  rect(2,0,3,17);rect(12,0,3,17);rect(0,0,6,2);rect(11,0,6,2);rect(0,15,7,2);rect(10,15,7,2);line(4,1,7,5);line(7,5,11,1)
 if char=='W':
  rect(0,0,7,2);rect(10,0,7,2);rect(2,0,3,12);rect(12,0,3,12);line(2,10,5,14);line(5,14,7,10);line(7,10,10,14);line(10,14,12,10)
 GLYPHS[char]=grid
for c,w in [('F',13),('R',15),('E',13),('M',17),('A',15),('K',15),('T',15),('W',17),('I',9),('L',13),('D',15)]:make(c,w)
GLYPHS[' ']=[[0]*6 for _ in range(17)]
def build(narrow=False):
 fb=FontBuilder(2000,isTTF=True);names=['.notdef']+[f'u{ord(c):04X}' for c in GLYPHS];fb.setupGlyphOrder(names);fb.setupCharacterMap({ord(c):f'u{ord(c):04X}' for c in GLYPHS})
 glyphs={};metrics={}
 for c,name in [('F','.notdef')]+[(c,f'u{ord(c):04X}') for c in GLYPHS]:
  grid=GLYPHS[c]
  if narrow:
   width=round(len(grid[0])*.8);grid=[[row[min(len(row)-1,int(x/.8))] for x in range(width)] for row in grid]
  pen=TTGlyphPen(None)
  for y,row in enumerate(grid):
   x=0
   while x<len(row):
    if not row[x]:x+=1;continue
    end=x+1
    while end<len(row) and row[end]:end+=1
    x0,x1=x*100,end*100;y0=(16-y)*100
    pen.moveTo((x0,y0));pen.lineTo((x0,y0+100));pen.lineTo((x1,y0+100));pen.lineTo((x1,y0));pen.closePath();x=end
  glyphs[name]=pen.glyph();metrics[name]=((len(grid[0])+(1 if narrow else 2))*100,0)
 fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=1700,descent=-300)
 family='FMW Slab Narrow' if narrow else 'FMW Slab'
 fb.setupNameTable({'familyName':family,'styleName':'Regular','uniqueFontIdentifier':family+'-1','fullName':family,'psName':family.replace(' ',''),'version':'Version 1.0'})
 fb.setupOS2(sTypoAscender=1700,sTypoDescender=-300,sTypoLineGap=0,usWinAscent=1700,usWinDescent=300);fb.setupPost();fb.setupMaxp();fb.save(ROOT/'assets/fonts'/('fmw-slab-narrow.ttf' if narrow else 'fmw-slab.ttf'))
build();build(True)
print('Built Pixel Slab and its compact portrait variant.')
