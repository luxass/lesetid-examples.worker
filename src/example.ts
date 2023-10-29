import type { Octokit } from "@octokit/core";

import { array, literal, merge, object, optional, parseAsync, startsWith, string, union } from "valibot";
import type { Example } from "./types";

const ICON_URL_SCHEMA = string([
  startsWith("/"),
]);

const ExampleFileSchema = object({
  iconUrl: optional(union([
    ICON_URL_SCHEMA,
    object({
      dark: ICON_URL_SCHEMA,
      light: ICON_URL_SCHEMA,
    }),
  ])),
  title: string(),
  url: string(),
});

export const ExampleSchema = merge([ExampleFileSchema, object({
  key: string(),
})]);

const ExamplesSchema = array(object({
  name: string(),
  path: string(),
  url: string(),
  html_url: string(),
  type: union([
    literal("dir"),
    literal("file"),
  ]),
}));

export async function getExamples(octokit: Octokit): Promise<Example[]> {
  const examples: Example[] = [];
  const {
    data,
  } = await octokit.request("https://api.github.com/repos/luxass/lesetid/contents/examples", {
    headers: {
      "User-Agent": "lesetid.dev",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const examplesOutput = await parseAsync(ExamplesSchema, data);

  await Promise.all(examplesOutput.filter((example) => example.type === "dir").map(async (_example) => {
    const exampleContent = await octokit.request(`https://api.github.com/repos/luxass/lesetid/contents/examples/${_example.name}/.lesetid/example.json`, {
      headers: {
        "User-Agent": "lesetid.dev",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }).then((res) => res.data);
    const exampleObj = await parseAsync(ExampleFileSchema, JSON.parse(atob(exampleContent.content)));
    if (typeof exampleObj.iconUrl === "object") {
      exampleObj.iconUrl.dark = `https://raw.githubusercontent.com/luxass/lesetid/main/examples/${_example.name}/.lesetid${exampleObj.iconUrl.dark}`;
      exampleObj.iconUrl.light = `https://raw.githubusercontent.com/luxass/lesetid/main/examples/${_example.name}/.lesetid${exampleObj.iconUrl.light}`;
    } else {
      exampleObj.iconUrl = `https://raw.githubusercontent.com/luxass/lesetid/main/examples/${_example.name}/.lesetid${exampleObj.iconUrl}`;
    }

    examples.push(Object.assign(exampleObj, {
      key: _example.name.replace("-example", ""),
    }));
  }));

  return examples;
}
