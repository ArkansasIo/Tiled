import { describe, expect, it } from "vitest";
import { createProject, exportProject, importProject, validateProject, exportTiledJson } from "./model";
describe("TileForge project model", () => {
  it("creates a valid map with a correctly sized layer", () => {
    const project = createProject(8, 5);
    expect(validateProject(project)).toBe(true);
    expect(project.layers[0].data).toHaveLength(40);
  });
  it("round-trips its project format", () => {
    const project = createProject(6, 4);
    expect(importProject(exportProject(project))).toEqual(project);
  });
  it("rejects unsupported or malformed data", () => {
    expect(() => importProject('{"format":"wrong"}')).toThrow();
  });
  it("exports a Tiled-style orthogonal JSON map structure", () => {
    const output = exportTiledJson(createProject(4, 3));
    expect(output.type).toBe("map");
    expect(output.orientation).toBe("orthogonal");
    expect(output.layers[0].data).toHaveLength(12);
  });
});