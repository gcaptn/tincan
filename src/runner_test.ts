/*

Deno.test is assignable to the type TestStepFunction

recursiveRun()
  catches hook errors
  throws when the case fails
  runs hooks in the correct order

*/

import { testStepFunction } from "./test_util.ts";
import { expect } from "./deps.ts";
import { recursiveRun, TestStepFunction } from "./runner.ts";
import { Hook, Tree } from "./nodes/mod.ts";

// Deno.test is assignable to the type TestStepFunction
((_a: TestStepFunction) => _a)(Deno.test);

Deno.test("recursiveRun catches hook errors", () => {
  const hook = new Hook("internal", () => {
    throw new Error("case error");
  });

  const tree = new Tree();
  tree.it("_", () => {});

  return recursiveRun(tree.root, [], [hook], testStepFunction);
});

Deno.test("recursiveRun throws when the case fails", async () => {
  const toThrow = new Error("case error");
  const tree = new Tree();
  tree.it("_", () => {
    throw toThrow;
  });

  try {
    await recursiveRun(tree.root, [], [], testStepFunction);
    throw new Error("above should throw");
  } catch (err) {
    expect(err).toBe(toThrow);
  }
});

Deno.test("recursiveRun runs hooks in the correct order", async () => {
  const order: string[] = [];
  const tree = new Tree();

  tree.beforeAll(() => {
    order.push("1 - beforeAll");
  });
  tree.beforeEach(() => {
    order.push("1 - beforeEach");
  });
  tree.afterEach(() => {
    order.push("1 - afterEach");
  });
  tree.afterAll(() => {
    order.push("1 - afterAll");
  });
  tree.it("__", () => {
    order.push("1 - it");
  });

  tree.describe("_", () => {
    tree.beforeAll(() => {
      order.push("2 - beforeAll");
    });
    tree.beforeEach(() => {
      order.push("2 - beforeEach");
    });
    tree.afterEach(() => {
      order.push("2 - afterEach");
    });
    tree.afterAll(() => {
      order.push("2 - afterAll");
    });
    tree.it("__", () => {
      order.push("2 - it");
    });
  });

  await recursiveRun(tree.root, [], [], testStepFunction);

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
