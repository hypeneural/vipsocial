import { existsSync } from "node:fs";
import { resolve } from "node:path";

const specPath = resolve(process.cwd(), "openapi.json");

if (!existsSync(specPath)) {
  console.error("packages/api-contract/openapi.json not found. Run pnpm api:generate-spec first.");
  process.exit(1);
}

console.log("OpenAPI spec found:", specPath);
