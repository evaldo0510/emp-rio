import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "./index.ts";

Deno.test("logos-spiritual-insight returns 400 when prompt is missing", async () => {
  const req = new Request("http://localhost:8000/logos-spiritual-insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const res = await handler(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Prompt is required");
});

Deno.test("logos-spiritual-insight returns 200 for OPTIONS request (CORS)", async () => {
  const req = new Request("http://localhost:8000/logos-spiritual-insight", {
    method: "OPTIONS",
  });

  const res = await handler(req);
  assertEquals(res.status, 200);
});
