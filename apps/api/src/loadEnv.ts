import path from "node:path";
import dotenv from "dotenv";

// Side-effect-only module: load the repo root .env before anything else runs.
// Must be the first import in any entry point, since modules like db/pool.ts
// read process.env at their own top level during module evaluation - and
// static imports evaluate before the importing file's own body does, so a
// dotenv.config() call placed after other imports (rather than in a module
// imported first) would run too late.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
