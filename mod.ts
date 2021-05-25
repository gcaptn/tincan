import { Hook, TestFunction, Tree } from "./nodes.ts";
import { Reporter } from "./reporter.ts";
import { Runner } from "./runner.ts";

const runner = new Runner(new Reporter());
let tree = new Tree();

// Because run() can be called multiple times and there can be more than one
// test tree, calling hooks/describe/it inside a test case will register it in
// another tree. This toggle will change before and after every test case to
// lock the methods.
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
  tree.describe(headline, fn);
}

describe.only = function (headline: string, fn: () => void) {
  assertNotRunning("describe.only()");
  tree.describeOnly(headline, fn);
};

describe.skip = function (headline: string, fn: () => void) {
  assertNotRunning("describe.skip()");
  tree.describeSkip(headline, fn);
};

export function it(headline: string, fn: TestFunction) {
  assertNotRunning("it()");
  tree.it(headline, fn);
}

it.only = function (headline: string, fn: TestFunction) {
  assertNotRunning("it.only()");
  tree.itOnly(headline, fn);
};

it.skip = function (headline: string, fn: TestFunction) {
  assertNotRunning("it.skip()");
  tree.itSkip(headline, fn);
};

export function beforeAll(fn: TestFunction) {
  assertNotRunning("beforeAll()");
  tree.beforeAll(fn);
}

export function beforeEach(fn: TestFunction) {
  assertNotRunning("beforeEach()");
  tree.beforeEach(fn);
}

export function afterEach(fn: TestFunction) {
  assertNotRunning("afterEach()");
  tree.afterEach(fn);
}

export function afterAll(fn: TestFunction) {
  assertNotRunning("afterAll()");
  tree.afterAll(fn);
}

export function run() {
  const runningTree = tree;
  runningTree.root.beforeEach.unshift(setRunningCase);
  runningTree.root.afterEach.push(setNotRunningCase);
  runner.runNode(runningTree.root);
  tree = new Tree();
}

export { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
