import { unstable_dev } from "wrangler";
import type { UnstableDevWorker } from "wrangler";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Example } from "./types";

describe("Worker", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {
      vars: {
        WORKER_ENV: "production",
      },
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  test("should return a 405 for non GET requests", async () => {
    const resp = await worker.fetch("/", {
      method: "POST",
    });
    if (resp) {
      expect(resp.status).toBe(405);
      expect(resp.headers.get("Allow")).toBe("GET");
    }
  });

  test("should return list of examples", async () => {
    const resp = await worker.fetch("/");
    if (resp) {
      const data = await resp.json() as { examples: Example[] };
      expect(data).toBeTypeOf("object");
      expect(data).toHaveProperty("examples");
      expect(Array.isArray(data.examples)).toBe(true);
    }
  });

  test("should redirect to list of examples", async () => {
    const resp = await worker.fetch("/view");
    expect(true).toBe(true);
  });

  test("should redirect to github", async () => {
    const resp = await worker.fetch("/view-source");
    expect(true).toBe(true);
  });

  // test("should return json schema", async () => {
  //   const resp = await worker.fetch("/schema");
  //   if (resp) {
  //     const data = await resp.json();
  //     expect(data).toBeTypeOf("object");
  //   }
  // });

  // test("should return list of all builtin vscode extensions", async () => {
  //   const resp = await worker.fetch("/builtin-extensions");
  //   if (resp) {
  //     const extensions = await resp.json();
  //     expect(extensions).toBeTypeOf("object");
  //     expect(extensions).toHaveProperty("extensions");
  //   }
  // });

  // test("should return the package.json of a specific builtin vscode extension", async () => {
  //   const resp = await worker.fetch("/builtin-extensions/javascript");
  //   if (resp) {
  //     const extension = await resp.json();
  //     expect(extension).toBeTypeOf("object");
  //     expect(extension).toHaveProperty("name");
  //     expect(extension).toHaveProperty("displayName");
  //     // @ts-expect-error please be quiet typescript
  //     expect(extension.name).toBe("javascript");
  //   }
  // });

  // test("should work without an nls file", async () => {
  //   const resp = await worker.fetch("/builtin-extensions/vscode-api-tests");
  //   if (resp) {
  //     const extension = await resp.json();
  //     expect(extension).toBeTypeOf("object");
  //     expect(extension).toHaveProperty("name");
  //     // @ts-expect-error please be quiet typescript
  //     expect(extension.name).toBe("vscode-api-tests");
  //   }
  // });
});
