/*

Tincan
  refuses to add hooks within a test case
  refuses to add nodes within a test case

Tincan.run()
  replaces the tree

*/

import { Tincan } from "./tincan.ts";
import { ItNode, TestFunction } from "./nodes.ts";
import { Runner } from "./runner.ts";
import { Reporter } from "./reporter.ts";
import { expect } from "https://deno.land/x/expect@v0.2.6/mod.ts";

function noop() {}

class BlankReporter implements Reporter {
  reportStart() {}
  reportEnd() {}
  reportHookError() {}
  reportCase() {}
}

async function testMethod(_: ItNode, wrappedFn: TestFunction) {
  await wrappedFn();
}

class SilentRunner extends Runner {
  test = testMethod;
  constructor() {
    super(new BlankReporter());
  }
}

Deno.test("Tincan refuses to add hooks within a test case", async () => {
  const tincan = new Tincan();
  tincan.runner = new SilentRunner();

  tincan.it("_", () => {
    expect(() => {
      tincan.beforeAll(noop);
    }).toThrow();

    expect(() => {
      tincan.beforeEach(noop);
    }).toThrow();

    expect(() => {
      tincan.afterEach(noop);
    }).toThrow();

    expect(() => {
      tincan.afterAll(noop);
    }).toThrow();
  });

  await tincan.run();
});

Deno.test("Tincan refuses to add nodes within a test case", async () => {
  const tincan = new Tincan();
  tincan.runner = new SilentRunner();

  tincan.it("_", () => {
    expect(() => {
      tincan.it("_", noop);
    }).toThrow();

    expect(() => {
      tincan.describe("_", () => {
        tincan.it("_", noop);
      });
    }).toThrow();
  });

  await tincan.run();
});

Deno.test("Tincan.run() replaces the tree", async () => {
  const tincan = new Tincan();
  tincan.runner = new SilentRunner();
  const tree = tincan.currentTree;
  tincan.it("_", noop);
  await tincan.run();
  expect(tincan.currentTree).not.toBe(tree);
});
