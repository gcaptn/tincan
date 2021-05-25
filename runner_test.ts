/*

Runner.setReporter
  sets the runner's reporter

Runner.runRoot
  calls .start() on the node

Runner.runIt
  's function calls the node's function and hooks

Runner.runNode
  runs hooks in the correct order

*/

import { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
import { Hook, RootNode, Tree } from "./nodes.ts";
import { SilentReporter, SilentRunner } from "./test_util.ts";

Deno.test("Runner.setReporter sets the runner's reporter", () => {
  const reporter = new SilentReporter();
  const runner = new SilentRunner();
  runner.setReporter(reporter);
  expect(runner.reporter).toBe(reporter);
});

Deno.test("Runner.runRoot calls .start() on the node", () => {
  const root = new RootNode();
  root.start = mock.fn();
  new SilentRunner().runRoot(root);
  expect(root.start).toHaveBeenCalled();
});

Deno.test("Runner.runIt's function calls the node's function and hooks", async () => {
  const order: string[] = [];

  const it = new Tree().addItNode("_", () => {
    order.push("3");
  });

  const runner = new SilentRunner();

  await runner.runIt(
    it,
    [
      new Hook("beforeAll", () => {
        order.push("1");
      }),
    ],
    [
      new Hook("beforeEach", () => {
        order.push("2");
      }),
    ],
    [
      new Hook("afterEach", () => {
        order.push("4");
      }),
    ],
    [
      new Hook("afterAll", () => {
        order.push("5");
      }),
    ],
  );

  expect(order).toEqual(["1", "2", "3", "4", "5"]);
});

Deno.test("Runner.runNode runs hooks in the correct order", async () => {
  const order: string[] = [];
  const tree = new Tree();
  const runner = new SilentRunner();

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

  await runner.runNode(tree.root);

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
