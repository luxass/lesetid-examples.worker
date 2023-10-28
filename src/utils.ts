import {
  Octokit,
} from "@octokit/core";
import {
  paginateRest,
} from "@octokit/plugin-paginate-rest";
import type { Context } from "hono";

export const $Octokit = Octokit.plugin(paginateRest);

export function addExampleRedirects<TContext extends Context>(ctx: TContext, url: URL, example: string) {
  if (url.host.startsWith(example) || url.host.startsWith(`${example}-example`)) {
    if (url.pathname === "/codesandbox" || url.pathname === "/csb") {
      return ctx.redirect(`/${example}/codesandbox`);
    }

    if (url.pathname === "/codespaces" || url.pathname === "/codespace") {
      return ctx.redirect(`/${example}/codespace`);
    }

    return ctx.redirect(`/${example}/stackblitz`);
  }
}

export const EXAMPLES_MAP = new Map();
