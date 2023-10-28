import type { Input } from "valibot";
import type { ExampleSchema } from "./example";

export interface HonoContext {
  Bindings: {
    GITHUB_TOKEN: string
    WORKER_ENV: string
  }
}

export type Example = Input<typeof ExampleSchema>;
