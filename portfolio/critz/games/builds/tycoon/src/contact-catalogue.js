// Lossless expansion of the build's shared B-contact metadata.
export function expandContactCatalogue(catalogue) {
  if(catalogue.schemaVersion!==1||!Array.isArray(catalogue.tiles))throw Error('Unsupported contact catalogue');
  return {assemblies:catalogue.assemblies,tiles:catalogue.tiles.map(tile=>tile.contact===1?{...tile,contact:catalogue.rule}:tile)};
}
