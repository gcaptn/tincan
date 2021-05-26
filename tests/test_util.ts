import { TestReporter } from "../src/reporter.ts";
import { Runner } from "../src/runner.ts";
import { ItNode, TestFunction } from "../src/nodes.ts";

export class SilentReporter implements TestReporter {
  reportStart() {}
  reportEnd() {}
  reportHookError() {}
  reportCase() {}
}

export async function silentTest(node: ItNode, wrappedFn: TestFunction) {
  if (!node.skipped) {
    await wrappedFn();
  }
}

export class SilentRunner extends Runner {
  test = silentTest;
  reporter = new SilentReporter();
  constructor() {
    super();
  }
}
