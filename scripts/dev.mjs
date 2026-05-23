import { createServer } from "vite";

process.env.CLOUDFLARE_CF_FETCH_ENABLED = "false";

const args = process.argv.slice(2);
const hostIndex = args.indexOf("--host");
const portIndex = args.indexOf("--port");
const host = hostIndex >= 0 ? args[hostIndex + 1] : undefined;
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : undefined;

const server = await createServer({
  server: {
    host,
    port
  }
});

await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: true });
