// The tincan namespace in import { tincan } from ".../mod.ts".
// Exposes API for custom runners and hooks, as well as the
// global tincan instance

import { Tincan } from "./tincan.ts";
import { TestReporter } from "./reporter.ts";
import { TestRunner } from "./runner.ts";

export const tincan = new Tincan();

export function setReporter(reporter: TestReporter) {
  tincan.setReporter(reporter);
}

export function setRunner(runner: TestRunner) {
  tincan.setRunner(runner);
}

export * from "./reporter.ts";

export * from "./runner.ts";

export * from "./nodes.ts";
