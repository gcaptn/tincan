// The tincan namespace in import { tincan } from ".../mod.ts".
// Exposes API for custom runners and reporters, as well as the
// environment instance

import { Environment } from "./environment.ts";
import { TestReporter } from "./reporter.ts";
import { TestRunner } from "./runner.ts";

export const env = new Environment();

export function setReporter(reporter: TestReporter) {
  env.setReporter(reporter);
}

export function setRunner(runner: TestRunner) {
  env.setRunner(runner);
}

export * from "./reporter.ts";

export * from "./runner.ts";

export * from "./nodes.ts";
