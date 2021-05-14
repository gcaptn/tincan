import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DescribeNode,
  it,
  ItNode,
  root,
  RootNode,
} from "./nodes.ts";
import { reportCase, reportEnd, reportStart } from "./report.ts";

async function runNode(node: RootNode | DescribeNode | ItNode) {
  if (node instanceof RootNode) {
    reportStart(node);
    node.isRunning = true;
    const start = Date.now();
    for (const hook of node.beforeAll) await hook();
    for (const child of node.children) {
      await runNode(child);
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    }
    for (const hook of node.afterAll) await hook();
    node.timeTaken = Date.now() - start;
    reportEnd(node);
  } else if (node instanceof DescribeNode) {
    if (node.skip) return;
    for (const hook of node.beforeAll) await hook();
    for (const child of node.children) {
      await runNode(child);
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    }
    for (const hook of node.afterAll) await hook();
  } else {
    if (node.skip) return;
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
  }
}

export async function run() {
  await runNode(root);
}

export { afterAll, afterEach, beforeAll, beforeEach, describe, it };

export * from "https://deno.land/x/expect/mod.ts";
