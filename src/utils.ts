import type { Context } from "hono";
import type { Example } from "./types";

export function addExampleRedirects<TContext extends Context>(ctx: TContext, url: URL, example: string) {
  console.info("\n\n\n", url.host, url.host.startsWith(`${example}-example`), "\n\n\n");

  if (url.host.startsWith(`${example}-example`)) {
    if (url.pathname === "/codesandbox") {
      return ctx.redirect(`/${example}/codesandbox`);
    }

    if (url.pathname === "/codespaces") {
      return ctx.redirect(`/${example}/codespaces`);
    }

    return ctx.redirect(`/${example}/stackblitz`);
  }
}

export const EXAMPLES: Example[] = [];
