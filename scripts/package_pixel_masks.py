"""Package already-rendered 1-bit scanlines as transparent PNG files (stdlib)."""
import base64, json, struct, zlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def chunk(kind,data):
 return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
for name,mask in json.loads((root/'scripts/pixel-masks.json').read_text()).items():
 compressed=base64.b64decode(mask['deflate'])
 width,height=mask['width'],mask['height']
 assert len(zlib.decompress(compressed))==(1+(width+7)//8)*height
 png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,1,0,0,0,0))+chunk(b'tRNS',b'\0\0')+chunk(b'IDAT',compressed)+chunk(b'IEND',b'')
 (root/f'assets/images/pixel/{name}.png').write_bytes(png)
 print(f'{name}: {width} x {height}, 1-bit white + transparent, {len(png)} bytes')
