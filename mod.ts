import { Environment, TestFunction } from "./nodes.ts";
import { Reporter } from "./reporter.ts";
import { Runner } from "./runner.ts";

const env = new Environment();
const runner = new Runner(new Reporter());

export function describe(headline: string, fn: () => void) {
  env.describe(headline, fn);
}

describe.only = function (headline: string, fn: () => void) {
  env.describeOnly(headline, fn);
};

describe.skip = function (headline: string, fn: () => void) {
  env.describeSkip(headline, fn);
};

export function it(headline: string, fn: TestFunction) {
  env.it(headline, fn);
}

it.only = function (headline: string, fn: TestFunction) {
  env.itOnly(headline, fn);
};

it.skip = function (headline: string, fn: TestFunction) {
  env.itSkip(headline, fn);
};

export function beforeAll(fn: TestFunction) {
  env.beforeAll(fn);
}
export function beforeEach(fn: TestFunction) {
  env.beforeEach(fn);
}
export function afterEach(fn: TestFunction) {
  env.afterEach(fn);
}
export function afterAll(fn: TestFunction) {
  env.afterAll(fn);
}

export function run() {
  runner.runNode(env.root);
}

export { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
