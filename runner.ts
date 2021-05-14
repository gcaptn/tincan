import { DescribeNode, ItNode, RootNode } from "./nodes.ts";
import { reportCase, reportEnd, reportStart } from "./report.ts";

type NodeRunner = (node: RootNode | DescribeNode | ItNode) => Promise<boolean>;

async function runRoot(
  node: RootNode,
  nodeRunner: NodeRunner,
): Promise<boolean> {
  reportStart(node);
  node.isRunning = true;
  const start = Date.now();
  for (const hook of node.beforeAll) await hook();
  for (const child of node.children) {
    await nodeRunner(child);
    if (child.result === "FAIL") {
      node.result = "FAIL";
    }
  }
  for (const hook of node.afterAll) await hook();
  node.timeTaken = Date.now() - start;
  reportEnd(node);
  return node.result === "PASS";
}

async function runDescribe(
  node: DescribeNode,
  nodeRunner: NodeRunner,
): Promise<boolean> {
  if (node.skipped) return true;
  for (const hook of node.beforeAll) await hook();
  for (const child of node.children) {
    await nodeRunner(child);
    if (child.result === "FAIL") {
      node.result = "FAIL";
    }
  }
  for (const hook of node.afterAll) await hook();
  return node.result === "PASS";
}

async function runIt(node: ItNode): Promise<boolean> {
  if (node.skipped) return true;
  for (const hook of node.beforeEach) await hook();
  const start = Date.now();
  try {
    await node.fn();
  } catch (err) {
    node.result = "FAIL";
    node.error = err;
  }
  node.timeTaken = Date.now() - start;
  reportCase(node);
  for (const hook of node.afterEach) await hook();
  return node.result === "PASS";
}

export async function runNode(
  node: RootNode | DescribeNode | ItNode,
): Promise<boolean> {
  if (node instanceof RootNode) {
    return await runRoot(node, runNode);
  } else if (node instanceof DescribeNode) {
    return await runDescribe(node, runNode);
  } else {
    return await runIt(node);
  }
}
