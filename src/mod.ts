import { TestFunction } from "./nodes/mod.ts";
import { Environment } from "./environment.ts";

const env = new Environment();

/** Register a suite to group related tests. */
export function describe(headline: string, fn: () => void) {
  env.describe(headline, fn);
}

/**
 * Run only this suite and skip all the other sibling test suites/cases. Will
 * not skip siblings that are also registered with `.only()`.
 */
describe.only = function (headline: string, fn: () => void) {
  env.describeOnly(headline, fn);
};

/** Skip this test suite. */
describe.skip = function (headline: string, fn: () => void) {
  env.describeSkip(headline, fn);
};

/** Register a test case. */
export function it(headline: string, fn: TestFunction) {
  env.it(headline, fn);
}

/**
 * Run only this test case and skip all the other sibling test suites/cases.
 * Will not skip siblings that are also registered with `.only()`.
 */
it.only = function (headline: string, fn: TestFunction) {
  env.itOnly(headline, fn);
};

/** Skip this test case. */
it.skip = function (headline: string, fn: TestFunction) {
  env.itSkip(headline, fn);
};

/**
 * Register a hook to run before any of the tests in the current scope are ran.
 * If the hook fails, it would only report an error and test cases would still
 * run.
 */
export function beforeAll(fn: TestFunction) {
  env.beforeAll(fn);
}

/**
 * Register a hook to run before every test case. If the hook fails, it would
 * only report an error and test cases would still run.
 */
export function beforeEach(fn: TestFunction) {
  env.beforeEach(fn);
}

/** Register a hook to run after every test case. */
export function afterEach(fn: TestFunction) {
  env.afterEach(fn);
}

/**
 * Register a hook to run after all the test suites/cases in the current scope
 * have completed.
 */
export function afterAll(fn: TestFunction) {
  env.afterAll(fn);
}

/**
 * Call at the bottom of every test file after all the test suites/cases
 * have been registered.
 */
export function run() {
  env.run();
}

import { expect as expect_, mock as mock_ } from "./deps.ts";

/**
 * Matchers re-exported from allain/expect. These are not required to do
 * assertions in tincan, so you can use the standard library (std/testing) or
 * bring your own matchers. See https://deno.land/x/expect@v0.4.0/ for more
 * information.
 */
export function expect(value: unknown) {
  return expect_(value);
}

/**
 * Function mocking utilities re-exported from allain/expect. See
 * https://deno.land/x/expect@v0.2.9/ for more information.
 */
export const mock = mock_;
