import { TestReporter } from "./reporter.ts";
import { Runner } from "./runner.ts";
import { ItNode, TestFunction } from "./nodes.ts";

export class BlankReporter implements TestReporter {
  reportStart() {}
  reportEnd() {}
  reportHookError() {}
  reportCase() {}
}

export async function testMethod(_: ItNode, wrappedFn: TestFunction) {
  await wrappedFn();
}

export class SilentRunner extends Runner {
  test = testMethod;
  constructor() {
    super(new BlankReporter());
  }
}
