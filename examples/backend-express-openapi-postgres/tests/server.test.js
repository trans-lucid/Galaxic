import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/server.js";

let server;
let baseUrl;

before(async () => {
  server = createApp({ items: [{ id: 42, name: "from-test" }] });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /health returns service health", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { ok: true, service: "backend-api-example" });
});

test("GET /items returns items", async () => {
  const response = await fetch(`${baseUrl}/items`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { items: [{ id: 42, name: "from-test" }] });
});
