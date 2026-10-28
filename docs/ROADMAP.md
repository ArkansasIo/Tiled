# TileForge roadmap

## Milestone 1 — editor baseline
- [x] Canvas renderer and starter map
- [x] Paint, erase, fill, rectangle, eyedropper selection
- [x] Layer visibility, lock, reorder, add and delete
- [x] Grid and zoom controls
- [x] Project JSON import/export and local persistence
- [x] Tiled-style JSON export scaffold
- [x] Build/test CI workflow

## Milestone 2 — map editing reliability
- [ ] Make undo/redo transactional for every drag and fill operation
- [ ] Add pan, cell-selection marquee and copy/paste
- [ ] Add property editing and opacity per layer
- [ ] Add map resize dialog with offset/anchor options
- [ ] Add validation and recovery for corrupt local saves

## Milestone 3 — tileset workflow
- [ ] Upload PNG/WebP tilesets
- [ ] Slice using tile size, margin, spacing and columns
- [ ] Store tileset image and metadata in the project
- [ ] Add tile animation and custom properties
- [ ] Add object layers, collision shapes and polygon editing

## Milestone 4 — interchange and shipping
- [ ] Round-trip fixtures against real Tiled JSON projects
- [ ] Implement TMX import/export with tileset references
- [ ] Add browser tests and accessibility checks
- [ ] Add a release build and deploy documentation
- [ ] Add Unreal and Godot export/import guides
