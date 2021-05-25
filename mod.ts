import { Environment, Hook, TestFunction } from "./nodes.ts";
import { Reporter } from "./reporter.ts";
import { Runner } from "./runner.ts";

const runner = new Runner(new Reporter());
let env = new Environment();

// Because run() can be called multiple times and there can be more than one
// test environment, calling hooks/describe/it inside a test case will
// register it in another environment. This toggle will change before and after
// every test case to lock the methods.
let isRunningCase = false;

const setRunningCase = new Hook("internal", () => {
  isRunningCase = true;
});

const setNotRunningCase = new Hook("internal", () => {
  isRunningCase = false;
});

function assertNotRunning(method: string) {
  if (isRunningCase) {
    throw new Error(`${method} cannod be called inside a test case!`);
  }
}

export function describe(headline: string, fn: () => void) {
  assertNotRunning("describe()");
  env.describe(headline, fn);
}

describe.only = function (headline: string, fn: () => void) {
  assertNotRunning("describe.only()");
  env.describeOnly(headline, fn);
};

describe.skip = function (headline: string, fn: () => void) {
  assertNotRunning("describe.skip()");
  env.describeSkip(headline, fn);
};

export function it(headline: string, fn: TestFunction) {
  assertNotRunning("it()");
  env.it(headline, fn);
}

it.only = function (headline: string, fn: TestFunction) {
  assertNotRunning("it.only()");
  env.itOnly(headline, fn);
};

it.skip = function (headline: string, fn: TestFunction) {
  assertNotRunning("it.skip()");
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

export function run() {
  const runningEnv = env;
  runningEnv.root.beforeEach.unshift(setRunningCase);
  runningEnv.root.afterEach.push(setNotRunningCase);
  runner.runNode(runningEnv.root);
  env = new Environment();
}

export { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
