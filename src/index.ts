import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { prettyJSON } from "hono/pretty-json";
import { EXAMPLES_MAP, addExampleRedirects } from "./utils";
import { cache } from "./cache";
import type { HonoContext } from "./types";
import { LESETID_EXAMPLE_TYPEBOX_SCHEMA } from "./schema";

const app = new Hono<HonoContext>();

app.use("*", prettyJSON());
app.use("*", logger());
app.get(
  "*",
  cache({
    cacheName: "lesetid-examples",
    cacheControl: "max-age=3600",
  }),
);

app.get("/view-source", (ctx) => {
  return ctx.redirect("https://github.com/luxass/lesetid");
});

app.use("*", async (ctx, next) => {
  const url = new URL(ctx.req.url);

  addExampleRedirects(ctx, url, "astro");
  addExampleRedirects(ctx, url, "next");
  addExampleRedirects(ctx, url, "nuxt");
  addExampleRedirects(ctx, url, "sveltekit");
  addExampleRedirects(ctx, url, "vite");

  return await next();
});

app.get("/schema", async (ctx) => {
  return ctx.json(LESETID_EXAMPLE_TYPEBOX_SCHEMA);
});

app.get("/", async (ctx) => {
  return ctx.json({
    examples: [...EXAMPLES_MAP],
  });
});

app.use("/:example/*", async (ctx, next) => {
  return await next();
});

app.onError(async (err, ctx) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  const message = ctx.env.WORKER_ENV === "production" ? "Internal server error" : err.stack;
  return new Response(message, {
    status: 500,
  });
});

app.notFound(async () => {
  return new Response("Not found", {
    status: 404,
  });
});

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    console.info("Cron trigger!");
    ctx.waitUntil(new Promise((resolve) => setTimeout(resolve, 1000)));
  },
} satisfies ExportedHandler<HonoContext>;
