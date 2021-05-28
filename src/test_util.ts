import { TestReporter } from "./reporters.ts";
import { ItNode, TestFunction } from "./nodes/mod.ts";

export class SilentReporter implements TestReporter {
  getTestCaseName = () => "";
  reportStart() {}
  reportHookError() {}
}

export async function silentTest(node: ItNode, wrappedFn: TestFunction) {
  if (!node.skipped) {
    await wrappedFn();
  }
}
