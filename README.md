# TileForge — Tiled-inspired Map Editor

TileForge is an original browser-based tile-map editor project inspired by the workflow of Tiled. It is not the upstream Tiled application and does not copy its branding or assets.

## Project status

This repository was empty at initialization. This first commit establishes the project plan and implementation roadmap. The editor application will be built incrementally in this repository.

## Goals

- 2D orthogonal tile-map editing in a browser-based interface.
- Paint, erase, fill, rectangle, eyedropper and selection tools.
- Multiple tile layers with visibility, locking, reordering and opacity.
- Import images as tilesets and configure tile dimensions and spacing.
- Object layers, object placement, properties and collision annotations.
- Undo/redo, zoom/pan, grid display, map resize and selection transforms.
- Project save/load, local autosave and JSON import/export.
- Tiled-compatible JSON/TMX import/export where the formats are supported and tested.
- Export pathways and documentation for game engines, including Godot and Unreal Engine pipelines.
- Keyboard accessibility, responsive layout and automated tests.

## Planned technology

- React + TypeScript + Vite for the editor UI.
- HTML Canvas for map rendering and editing interactions.
- Versioned JSON project format with explicit migration rules.
- Vitest and Testing Library for unit and UI tests.

## Roadmap

1. Establish the application shell, map model, canvas renderer and starter tileset.
2. Implement drawing tools, layers, undo/redo and map settings.
3. Implement image tileset import, slicing, tile properties and object layers.
4. Add robust project serialization, autosave and import/export.
5. Add format-compatibility fixtures, accessibility, performance profiling and CI.

## Development

The application source and build instructions will be added in the next implementation commits. Do not treat this initial scaffolding commit as a complete editor or as a validated Tiled-format implementation.

## Licensing and attribution

This is an independent implementation. Before distributing dependencies or adding format-compatibility code, record their licenses and preserve any required notices. Tiled's file formats may be supported for interoperability without claiming that TileForge is the official Tiled application.
