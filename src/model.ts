export type Tool = "paint" | "erase" | "fill" | "rect" | "eyedropper" | "select";
export type Tile = number | null;
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  data: Tile[];
}
export interface TileMapProject {
  format: "tileforge";
  version: 1;
  name: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: Layer[];
  palette: string[];
}
export const DEFAULT_PALETTE = [
  "#202b34", "#405b45", "#658553", "#9eae6b", "#d8c88e", "#a77c55",
  "#77594a", "#596b7c", "#7198a5", "#dce5e3", "#8d5c72", "#bb7564",
  "#e2a65c", "#eadcbd", "#f1f4f0", "#7f8d45"
];
export function createProject(width = 24, height = 16): TileMapProject {
  const data: Tile[] = Array.from({ length: width * height }, (_, i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    // Simple original sample map: grass border variation and a pond.
    const inPond = x >= 13 && x <= 17 && y >= 5 && y <= 9;
    if (inPond) return (x + y) % 3 === 0 ? 8 : 7;
    if ((x * 17 + y * 13) % 23 === 0) return 2;
    if ((x + y) % 31 === 0) return 3;
    return 1;
  });
  return {
    format: "tileforge", version: 1, name: "Untitled Map",
    width, height, tileWidth: 32, tileHeight: 32,
    layers: [{ id: "layer-ground", name: "Ground", visible: true, locked: false, data }],
    palette: DEFAULT_PALETTE
  };
}
export function validateProject(value: unknown): value is TileMapProject {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<TileMapProject>;
  return p.format === "tileforge" && p.version === 1 &&
    typeof p.name === "string" && Number.isInteger(p.width) && (p.width ?? 0) > 0 &&
    Number.isInteger(p.height) && (p.height ?? 0) > 0 &&
    Number.isInteger(p.tileWidth) && (p.tileWidth ?? 0) > 0 &&
    Number.isInteger(p.tileHeight) && (p.tileHeight ?? 0) > 0 &&
    Array.isArray(p.palette) && Array.isArray(p.layers) &&
    p.layers.every(layer => typeof layer.id === "string" && typeof layer.name === "string" &&
      typeof layer.visible === "boolean" && typeof layer.locked === "boolean" &&
      Array.isArray(layer.data) && layer.data.length === (p.width ?? 0) * (p.height ?? 0) &&
      layer.data.every(cell => cell === null || (Number.isInteger(cell) && cell >= 0 && cell < (p.palette?.length ?? 0))));
}
export function exportProject(project: TileMapProject): string {
  return JSON.stringify(project, null, 2);
}
export function importProject(text: string): TileMapProject {
  const parsed: unknown = JSON.parse(text);
  if (!validateProject(parsed)) throw new Error("Invalid or unsupported TileForge project file.");
  return parsed;
}
export function exportTiledJson(project: TileMapProject) {
  // Tiled's JSON schema is intentionally emitted as an interoperability export.
  // Only a subset is covered; advanced objects, animations and tileset metadata are not yet represented.
  return {
    compressionlevel: -1,
    height: project.height,
    infinite: false,
    layers: project.layers.map(layer => ({
      data: layer.data.map(tile => tile === null ? 0 : tile + 1),
      height: project.height,
      id: Number(layer.id.replace(/\\D/g, "")) || 1,
      name: layer.name,
      opacity: 1,
      type: "tilelayer",
      visible: layer.visible,
      width: project.width,
      x: 0,
      y: 0
    })),
    nextlayerid: project.layers.length + 1,
    nextobjectid: 1,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.11.0",
    tileheight: project.tileHeight,
    tilesets: [],
    tilewidth: project.tileWidth,
    type: "map",
    version: "1.10",
    width: project.width
  };
}