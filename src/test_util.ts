import { DescribeNode, ItNode, RootNode, TestFunction } from "./nodes/mod.ts";
import { TestStepFunction } from "./runner.ts";

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

export const testStepFunction: TestStepFunction = async (obj) => {
  if (obj.ignore) return;
  await obj.fn({ step: testStepFunction });
};
