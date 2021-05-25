/*

Tincan.setReporter / Tincan.setRunner
  sets the reporter and runner

Tincan.run
  replaces the tree
  can run again when the previous run finishes
  sets the runner's reporter to its reporter

Tincan
  refuses to add hooks within a test case
  refuses to add nodes within a test case

*/

import { Tincan } from "./tincan.ts";
import { SilentReporter, SilentRunner } from "./test_util.ts";
import { expect } from "https://deno.land/x/expect@v0.2.6/mod.ts";

function noop() {}

function createTestTincan() {
  const tincan = new Tincan();
  tincan.setRunner(new SilentRunner());
  tincan.setReporter(new SilentReporter());
  return tincan;
}

Deno.test("Tincan.setReporter / Tincan.setRunner sets the reporter and runner", () => {
  const tincan = new Tincan();
  const runner = new SilentRunner();
  const reporter = new SilentReporter();
  tincan.setRunner(runner);
  tincan.setReporter(reporter);

  expect(tincan.runner).toBe(runner);
  expect(tincan.reporter).toBe(reporter);

  // .run() will update the runner's reporter right before running
  expect(tincan.runner.reporter).not.toBe(reporter);
});

Deno.test("Tincan.run replaces the tree", async () => {
  const tincan = createTestTincan();
  const tree = tincan.currentTree;
  tincan.it("_", noop);
  await tincan.run();
  expect(tincan.currentTree).not.toBe(tree);
});

Deno.test("Tincan.run can run again when the previous run finishes", async () => {
  const tincan = createTestTincan();
  tincan.it("_", noop);
  await tincan.run();

  expect(() => {
    tincan.it("_", noop);
    tincan.run();
  }).not.toThrow();
});

Deno.test("Tincan.run sets the runner's reporter to its reporter", async () => {
  const tincan = createTestTincan();
  const reporter = new SilentReporter();
  tincan.setReporter(reporter);

  tincan.it("_", noop);
  await tincan.run();

  expect(tincan.runner.reporter).toBe(reporter);
});

Deno.test("Tincan refuses to add hooks within a test case", async () => {
  const tincan = createTestTincan();

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
  const tincan = createTestTincan();

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
