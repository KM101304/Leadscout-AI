import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";

const tsconfigPath = new URL("../tsconfig.json", import.meta.url);
const tempPath = new URL("../tsconfig.typecheck.json", import.meta.url);
const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));

tsconfig.include = (tsconfig.include || []).filter((entry) => entry !== ".next/types/**/*.ts");

writeFileSync(tempPath, JSON.stringify(tsconfig, null, 2));

try {
  execSync("npx tsc --noEmit -p tsconfig.typecheck.json", {
    stdio: "inherit",
    cwd: new URL("..", import.meta.url)
  });
} finally {
  unlinkSync(tempPath);
}
