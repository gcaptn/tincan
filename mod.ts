import { Environment, Hook, TestFunction } from "./nodes.ts";
import { Reporter } from "./reporter.ts";
import { Runner } from "./runner.ts";

let env = new Environment();
let isRunning = false;
const runner = new Runner(new Reporter());

function assertNotRunning(method: string) {
  if (isRunning) {
    throw new Error(`${method} cannod be called inside a test case!`);
  }
}

export function describe(headline: string, fn: () => void) {
  assertNotRunning("describe()");
  env.describe(headline, fn);
}

describe.only = function (headline: string, fn: () => void) {
  assertNotRunning("describe()");
  env.describeOnly(headline, fn);
};

describe.skip = function (headline: string, fn: () => void) {
  assertNotRunning("describe()");
  env.describeSkip(headline, fn);
};

export function it(headline: string, fn: TestFunction) {
  assertNotRunning("it()");
  env.it(headline, fn);
}

it.only = function (headline: string, fn: TestFunction) {
  assertNotRunning("it()");
  env.itOnly(headline, fn);
};

it.skip = function (headline: string, fn: TestFunction) {
  assertNotRunning("it()");
  env.itSkip(headline, fn);
};

export function beforeAll(fn: TestFunction) {
  assertNotRunning("beforeAll()");
  env.beforeAll(fn);
}

export function beforeEach(fn: TestFunction) {
  assertNotRunning("beforeEach()");
  env.beforeEach(fn);
}

export function afterEach(fn: TestFunction) {
  assertNotRunning("afterEach()");
  env.afterEach(fn);
}

export function afterAll(fn: TestFunction) {
  assertNotRunning("afterAll()");
  env.afterAll(fn);
}

const setRunning = new Hook("internal", () => {
  isRunning = true;
});

const setNotRunning = new Hook("internal", () => {
  isRunning = false;
});

export function run() {
  const runningEnv = env;
  runningEnv.root.beforeEach.unshift(setRunning);
  runningEnv.root.afterEach.push(setNotRunning);
  runner.runNode(runningEnv.root);
  env = new Environment();
}

export { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
