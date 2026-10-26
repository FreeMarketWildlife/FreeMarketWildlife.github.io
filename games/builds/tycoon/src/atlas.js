// Appearance-only atlas loader. No collision, story state or storage access.
export async function loadAtlas(manifestUrl) {
  const url = new URL(manifestUrl, location.href);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Atlas manifest failed to load (${response.status}).`);
  const manifest = await response.json();
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets))
    throw new Error("Unsupported atlas manifest.");
  const image = new Image();
  image.src = new URL(manifest.image, url).href;
  await image.decode();
  if (image.naturalWidth !== manifest.size[0] || image.naturalHeight !== manifest.size[1])
    throw new Error("Atlas dimensions do not match its manifest.");
  const entries = new Map();
  for (const entry of manifest.assets) {
    const rect = entry.rect;
    if (typeof entry.id !== "string" || entries.has(entry.id) ||
        !Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isInteger))
      throw new Error("Invalid or duplicate atlas entry.");
    const [x, y, w, h] = rect;
    if (x < 0 || y < 0 || w < 1 || h < 1 || x + w > image.naturalWidth || y + h > image.naturalHeight)
      throw new Error(`Atlas entry is out of bounds: ${entry.id}`);
    entries.set(entry.id, entry);
  }
  return {
    manifest,
    draw(context, id, x, y) {
      const entry = entries.get(id);
      if (!entry) throw new Error(`Missing atlas ID: ${id}`);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, ...entry.rect, Math.round(x), Math.round(y), entry.rect[2], entry.rect[3]);
    },
  };
}
