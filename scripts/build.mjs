import { build } from "vite";

process.env.CLOUDFLARE_CF_FETCH_ENABLED = "false";

await build();
