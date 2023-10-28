import type { Context } from "hono";
import type { Example } from "./types";

export function addExampleRedirects<TContext extends Context>(ctx: TContext, url: URL, example: string) {
  console.info("addExampleRedirects", example, url);

  if (url.host.startsWith(`${example}-example`)) {
    if (url.pathname === "/codesandbox") {
      return ctx.redirect(`/${example}/codesandbox`);
    }

    if (url.pathname === "/codespaces") {
      return ctx.redirect(`/${example}/codespace`);
    }

    return ctx.redirect(`/${example}/stackblitz`);
  }
}

export const EXAMPLES: Example[] = [];
