import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project from https://ArkansasIo.github.io/Tiled/
  base: process.env.GITHUB_ACTIONS ? "/Tiled/" : "/"
});
