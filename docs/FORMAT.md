# Project and export formats

## Native TileForge format

The native format is versioned JSON. The current version stores dimensions, palette colors, named tile layers, visibility/lock flags, and one numeric tile reference or null for each map cell. Tile index 0 is the first TileForge palette entry.

## Tiled JSON export

The current export emits a finite orthogonal Tiled-style map with tile layer data, dimensions and basic map metadata. It uses Tiled's conventional global tile IDs by adding one to each non-empty TileForge index and writes empty cells as zero. This is only a partial interoperability export: tileset definitions are currently empty, so projects that use the generated palette are not yet guaranteed to render identically in Tiled. Before treating the exported file as a production map, associate an actual tileset image and add its tileset metadata and relative source path.

Object layers, image collections, animations, custom tile properties, infinite maps, compression, chunked data and TMX output are not currently implemented.
