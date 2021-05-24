/*

Runner.runRoot
  calls .start() on the node

Runner.runIt
  's function calls the node's function and hooks

Runner.runNode
  runs hooks in the correct order

*/

import { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
import { Environment, Hook, ItNode, RootNode, TestFunction } from "./nodes.ts";
import { Reporter } from "./reporter.ts";
import { Runner } from "./runner.ts";

class BlankReporter implements Reporter {
  reportStart() {}
  reportEnd() {}
  reportHookError() {}
  reportCase() {}
}

async function testMethod(_: ItNode, wrappedFn: TestFunction) {
  await wrappedFn();
}

Deno.test("runRoot calls .start() on the node", () => {
  const root = new RootNode();
  root.start = mock.fn();
  new Runner(new BlankReporter()).runRoot(root);
  expect(root.start).toHaveBeenCalled();
});

Deno.test("Runner.runIt's function calls the node's function and hooks", async () => {
  const order: string[] = [];

  const it = new Environment().addItNode("_", () => {
    order.push("3");
  });

  const runner = new Runner(new BlankReporter());
  runner.test = testMethod;

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

Deno.test("runNode runs hooks in the correct order", async () => {
  const order: string[] = [];
  const env = new Environment();
  const runner = new Runner(new BlankReporter());
  runner.test = testMethod;

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

  await runner.runNode(env.root);

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
