import { TestReporter } from "./reporters.ts";
import { DescribeNode, ItNode, RootNode, TestFunction } from "./nodes/mod.ts";

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

export function addItNode(parent: DescribeNode | RootNode) {
  const node = new ItNode("_", () => {}, parent);
  parent.children.push(node);
  return node;
}

export function addDescribeNode(parent: DescribeNode | RootNode) {
  const node = new DescribeNode("_", parent);
  parent.children.push(node);
  return node;
}
