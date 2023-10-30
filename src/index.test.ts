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

  // TODO: Find out how to detect if the redirect actually happended
});
