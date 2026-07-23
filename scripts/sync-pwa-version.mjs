import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const packageJsonPath = path.join(appRoot, "package.json");
const swPath = path.join(appRoot, "public", "sw.js");

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

let swSource = readFileSync(swPath, "utf8");
swSource = swSource.replace(
  /const APP_VERSION = "[^"]+";/,
  `const APP_VERSION = "${version}";`,
);
writeFileSync(swPath, swSource);

console.log(`Synced service worker APP_VERSION to ${version}`);
