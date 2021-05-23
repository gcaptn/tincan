/*

findChildWithFirstCase
  finds the child that will run the first case

findChildWithLastCase
  finds the child that will run the last case

runRoot
  calls .start() on the node

runNode
  runs hooks in the correct order

*/

import { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
import { Environment, RootNode } from "./nodes.ts";
import { TestReporter } from "./reporter.ts"; // todo: fake a reporter
import {
  findChildWithFirstCase,
  findChildWithLastCase,
  Runner,
} from "./runner.ts";

function noop() {}

Deno.test("runRoot calls .start() on the node", () => {
  const root = new RootNode();
  root.start = mock.fn();
  new Runner(Deno.test, new TestReporter()).runRoot(root);
  expect(root.start).toHaveBeenCalled();
});

function findChildEnv() {
  const env = new Environment();

  env.describeSkip("_", () => {
    env.it("_", noop);
  });

  const first = env.addDescribeNode("_", () => {
    env.it("_", noop);
  });

  const last = env.addDescribeNode("_", () => {
    env.itSkip("_", noop);
    env.it("_", noop);
  });

  return { env, first, last };
}

Deno.test("findChildWithFirstCase finds the child that will run the first case", () => {
  const { env, first } = findChildEnv();
  expect(findChildWithFirstCase(env.root)).toBe(first);
});

Deno.test("findChildWithLastCase finds the child that will run the first case", () => {
  const { env, last } = findChildEnv();
  expect(findChildWithLastCase(env.root)).toBe(last);
});

const order: string[] = [];

const env = new Environment();

env.beforeAll(() => {
  order.push("1 - beforeAll");
});
env.beforeEach(() => {
  order.push("1 - beforeEach");
});
env.afterEach(() => {
  order.push("1 - afterEach");
});
env.afterAll(() => {
  order.push("1 - afterAll");
});
env.it("__", () => {
  order.push("1 - it");
});

env.describe("_", () => {
  env.beforeAll(() => {
    order.push("2 - beforeAll");
  });
  env.beforeEach(() => {
    order.push("2 - beforeEach");
  });
  env.afterEach(() => {
    order.push("2 - afterEach");
  });
  env.afterAll(() => {
    order.push("2 - afterAll");
  });
  env.it("__", () => {
    order.push("2 - it");
  });
});

new Runner(Deno.test, new TestReporter()).runNode(env.root);

Deno.test("runNode runs hooks in the correct order", () => {
  expect(order).toEqual([
    "1 - beforeAll",
    "1 - beforeEach",
    "1 - it",
    "1 - afterEach",
    "2 - beforeAll",
    "1 - beforeEach",
    "2 - beforeEach",
    "2 - it",
    "2 - afterEach",
    "1 - afterEach",
    "2 - afterAll",
    "1 - afterAll",
  ]);
});
