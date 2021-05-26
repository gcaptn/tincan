// The tincan namespace in import { tincan } from ".../mod.ts".
// Exposes API for custom runners and reporters, as well as the
// environment instance

import { Environment } from "./environment.ts";
import { TestReporter } from "./reporters.ts";

export const env = new Environment();

export function setReporter(reporter: TestReporter) {
  env.setReporter(reporter);
}

export * from "./reporters.ts";

export * from "./nodes.ts";
