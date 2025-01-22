/*

Runner.runRoot
  calls .start() on the node

Runner.runIt
  's function calls the node's function and hooks
  's function catches hook errors
  's function still throws when the test function fails

Runner.runNode
  runs hooks in the correct order

*/

import { expect } from "expect";
import { mock } from "expect-legacy";
import { Runner } from "./runner.ts";
import { Hook, ItNode, RootNode, TestFunction, Tree } from "./nodes/mod.ts";
import { SilentReporter, silentTest } from "./test_util.ts";

function makeTestRunner() {
  const runner = new Runner();
  runner.test = silentTest;
  runner.reporter = new SilentReporter();
  return runner;
}

Deno.test("Runner.runRoot calls .start() on the node", () => {
  const root = new RootNode();
  root.start = mock.fn();
  makeTestRunner().runRoot(root);
  expect(root.start).toHaveBeenCalled();
});

function makeItNode(fn: TestFunction) {
  return new ItNode("_", fn, new RootNode());
}

Deno.test("Runner.runIt's function calls the node's function and hooks", async () => {
  const order: string[] = [];

  const it = makeItNode(() => {
    order.push("3");
  });

  const runner = makeTestRunner();

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

Deno.test("Runner.runIt's function catches hook errors", () => {
  const hook = new Hook("internal", () => {
    throw new Error("case error");
  });
  return makeTestRunner().runIt(makeItNode(() => {}), [], [], [], [hook]);
});

Deno.test("Runner.runIt's function still throws when the case fails", async () => {
  const toThrow = new Error("case error");
  const it = makeItNode(() => {
    throw toThrow;
  });

  try {
    await makeTestRunner().runIt(it, [], [], [], []);
    throw new Error("above should throw");
  } catch (err) {
    expect(err).toBe(toThrow);
  }
});

Deno.test("Runner.runNode runs hooks in the correct order", async () => {
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

  await makeTestRunner().runNode(tree.root);

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
