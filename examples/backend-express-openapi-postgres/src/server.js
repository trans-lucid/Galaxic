import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_ITEMS = [
  { id: 1, name: "example" },
  { id: 2, name: "galaxic" },
];

export function createApp({ items = DEFAULT_ITEMS } = {}) {
  return createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "GET" && url.pathname === "/health") {
      return writeJson(response, 200, { ok: true, service: "backend-api-example" });
    }

    if (request.method === "GET" && url.pathname === "/items") {
      return writeJson(response, 200, { items });
    }

    return writeJson(response, 404, { error: "not_found" });
  });
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 8080);
  const server = createApp();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend API example listening on ${port}`);
  });
}
