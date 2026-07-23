import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(appRoot, "src"),
    },
  },
  plugins: [vue()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2018",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: "iife",
        name: "PlantumlSmetanaApp",
        inlineDynamicImports: true,
        entryFileNames: "assets/app.js",
      },
    },
  },
});
