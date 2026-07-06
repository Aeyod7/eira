// Just runs ensureSchema() — safe to run repeatedly. Use on first deploy.
import { ensureSchema } from "../lib/db.js";
await ensureSchema();
console.log("Schema ready.");
process.exit(0);
