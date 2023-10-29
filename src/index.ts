import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { prettyJSON } from "hono/pretty-json";
import { Octokit } from "@octokit/core";
import { serveStatic } from "hono/cloudflare-workers";
import { EXAMPLES, addExampleRedirects } from "./utils";
import { cache } from "./cache";
import type { HonoContext } from "./types";
import { LESETID_EXAMPLE_TYPEBOX_SCHEMA } from "./schema";
import { getExamples } from "./example";

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

app.get("/favicon.ico", serveStatic({ path: "./favicon.ico" }));

app.get("/view-source", (ctx) => {
  return ctx.redirect("https://github.com/luxass/lesetid");
});

app.get("/view", (ctx) => ctx.redirect("https://lesetid.dev/examples"));

app.use("*", async (ctx, next) => {
  if (ctx.req.method !== "GET") {
    return ctx.text("Method not allowed", 405, {
      Allow: "GET",
    });
  }

  if (!EXAMPLES.length) {
    const octokit = new Octokit({
      auth: ctx.env.GITHUB_TOKEN,
    });
    const examples = await getExamples(octokit);
    for (const example of examples) {
      EXAMPLES.push(example);
    }
  }
  const url = new URL(ctx.req.url);

  for (const example of EXAMPLES) {
    if (!url.host.startsWith(`${example.key}-example`)) {
      continue;
    }

    if (url.pathname === "/codesandbox") {
      return ctx.redirect(`/${example.key}/codesandbox`);
    }

    if (url.pathname === "/codespaces") {
      return ctx.redirect(`/${example.key}/codespaces`);
    }

    return ctx.redirect(`/${example.key}/stackblitz`);
  }

  return await next();
});

app.get("/schema", async (ctx) => {
});

app.get("/", async (ctx) => {
  return ctx.json({
    examples: EXAMPLES,
  });
});

const POSSIBLE_PROVIDERS = ["stackblitz", "codesandbox", "codespaces"] as const;
const DEFAULT_PROVIDER: (typeof POSSIBLE_PROVIDERS)[number] = "stackblitz";

app.get("/:example/:provider?", async (ctx) => {
  const found = EXAMPLES.find((example) => example.key === ctx.req.param("example") || example.key === `${ctx.req.param("example")?.replace("-example", "")}`);
  if (!found) {
    return ctx.notFound();
  }

  let provider: (typeof POSSIBLE_PROVIDERS[number]) = DEFAULT_PROVIDER;
  if (ctx.req.param("provider") && POSSIBLE_PROVIDERS.includes((ctx.req.param("provider") as (typeof POSSIBLE_PROVIDERS)[number]) || DEFAULT_PROVIDER)) {
    provider = ctx.req.param("provider") as (typeof POSSIBLE_PROVIDERS)[number];
  }

  if (!provider) {
    provider = DEFAULT_PROVIDER;
  }

  const normalizedExampleName = ctx.req.param("example")?.includes("-example") ? ctx.req.param("example") : `${ctx.req.param("example")}-example`;

  if (provider === "codesandbox") {
    return ctx.redirect(`https://codesandbox.io/p/sandbox/github/luxass/lesetid/tree/main/examples/${normalizedExampleName}`);
  }

  if (provider === "codespaces") {
    return ctx.redirect(`https://codespaces.new/luxass/lesetid?devcontainer_path=.devcontainer/${normalizedExampleName}/devcontainer.json`);
  }

  return ctx.redirect(`https://stackblitz.com/github/luxass/lesetid/tree/main/examples/${normalizedExampleName}?title=${encodeURIComponent(`lesetid | ${found.title}`)}`);
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
  async scheduled(_, env, ctx) {
    const promise = async () => {
      try {
        const octokit = new Octokit({
          auth: env.Bindings.GITHUB_TOKEN,
        });
        const examples = await getExamples(octokit);
        EXAMPLES.splice(0, EXAMPLES.length);
        for (const example of examples) {
          EXAMPLES.push(example);
        }
      } catch (err) {
        console.error(err);
      }
    };
    ctx.waitUntil(promise());
  },
} satisfies ExportedHandler<HonoContext>;
