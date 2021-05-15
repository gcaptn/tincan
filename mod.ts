import { Environment, TestFunction } from "./nodes.ts";
import { runNode } from "./runner.ts";

const env = new Environment();

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

export const beforeAll = (fn: TestFunction) => env.beforeAll(fn);
export const beforeEach = (fn: TestFunction) => env.beforeEach(fn);
export const afterEach = (fn: TestFunction) => env.afterEach(fn);
export const afterAll = (fn: TestFunction) => env.afterAll(fn);

export function run() {
  runNode(env.root);
}

export { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
