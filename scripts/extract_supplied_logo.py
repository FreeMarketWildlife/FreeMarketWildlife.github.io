"""Copy the supplied pixel silhouette exactly; convert ink to white, discard backdrop.
No generative redraw, shape adjustment, smoothing, or resampling is performed.
Run with Pillow and the supplied source-image path.
"""
from pathlib import Path
import sys
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=Image.open(sys.argv[1]).convert('RGB')
# Tight source region around the emblem on the handheld screen, excluding frame.
crop=source.crop((800,510,1100,810))
mask=Image.new('1',crop.size)
for y in range(crop.height):
 for x in range(crop.width):
  r,g,b=crop.getpixel((x,y))
  if r<75 and g<80 and b<100:mask.putpixel((x,y),1)
bounds=mask.getbbox()
assert bounds
mask=mask.crop(bounds)
# Retain every source silhouette pixel. SVG rectangle runs keep source edges
# exact and let the existing logo references retain their path and transparency.
runs=[]
for y in range(mask.height):
 x=0
 while x<mask.width:
  if not mask.getpixel((x,y)):x+=1;continue
  end=x+1
  while end<mask.width and mask.getpixel((end,y)):end+=1
  runs.append(f'<rect x="{x}" y="{y}" width="{end-x}" height="1"/>');x=end
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {mask.width} {mask.height}" shape-rendering="crispEdges"><g fill="#fff">'+''.join(runs)+'</g></svg>\n'
(root/'assets/images/mark.svg').write_text(svg)
preview=Image.new('RGBA',mask.size,(0,0,0,0))
preview.paste((255,255,255,255),(0,0),mask.convert('L'))
preview.save(root/'assets/images/pixel/supplied-logo.png')
print('Copied logo mask:',mask.size,'source bounds:',bounds)
