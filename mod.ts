import { Tincan } from "./tincan.ts";
import { Reporter, TestReporter } from "./reporter.ts";
import { Runner, TestRunner } from "./runner.ts";
import {
  DescribeNode,
  Hook,
  ItNode,
  RootNode,
  TestFunction,
  Tree,
} from "./nodes.ts";

const tincan = new Tincan();

const tincanAPI = {
  setReporter(reporter: TestReporter) {
    tincan.setReporter(reporter);
  },
  setRunner(runner: TestRunner) {
    tincan.setRunner(runner);
  },
  Hook,
  ItNode,
  DescribeNode,
  RootNode,
  Tree,
  Reporter,
  Runner,
};

export { tincanAPI as tincan };

export function describe(headline: string, fn: () => void) {
  tincan.describe(headline, fn);
}

describe.only = function (headline: string, fn: () => void) {
  tincan.describeOnly(headline, fn);
};

describe.skip = function (headline: string, fn: () => void) {
  tincan.describeSkip(headline, fn);
};

export function it(headline: string, fn: TestFunction) {
  tincan.it(headline, fn);
}

it.only = function (headline: string, fn: TestFunction) {
  tincan.itOnly(headline, fn);
};

it.skip = function (headline: string, fn: TestFunction) {
  tincan.itSkip(headline, fn);
};

export function beforeAll(fn: TestFunction) {
  tincan.beforeAll(fn);
}

export function beforeEach(fn: TestFunction) {
  tincan.beforeEach(fn);
}

export function afterEach(fn: TestFunction) {
  tincan.afterEach(fn);
}

export function afterAll(fn: TestFunction) {
  tincan.afterAll(fn);
}

export function run() {
  tincan.run();
}

export { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
