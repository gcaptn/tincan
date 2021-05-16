import { DescribeNode, ItNode, RootNode, TestFunction } from "./nodes.ts";
import { getFullName, reportHookError, reportStart } from "./report.ts";

type NodeRunner = (
  node: RootNode | DescribeNode | ItNode,
  beforeHooks: TestFunction[],
  afterHooks: TestFunction[],
) => void;

function runRoot(node: RootNode, nodeRunner: NodeRunner) {
  reportStart(node);
  node.isRunning = true;
  // let start: number;

  node.children.forEach((child, i) => {
    let childBeforeHooks: TestFunction[] = [];
    let childAfterHooks: TestFunction[] = [];

    if (i === 0) {
      childBeforeHooks = [...node.beforeAll];
      // childBeforeHooks.unshift(() => {
      //   start = Date.now();
      // });
    }

    childAfterHooks.push(() => {
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    });

    if (i === node.children.length - 1) {
      childAfterHooks = [...childAfterHooks, ...node.afterAll];
      // childAfterHooks.push(() => {
      //   node.timeTaken = Date.now() - start;
      //   reportEnd(node);
      // });
    }

    nodeRunner(child, childBeforeHooks, childAfterHooks);
  });
}

function runDescribe(
  node: DescribeNode,
  beforeHooks: TestFunction[],
  afterHooks: TestFunction[],
  nodeRunner: NodeRunner,
) {
  node.children.forEach((child, i) => {
    let childBeforeHooks: TestFunction[] = [];
    let childAfterHooks: TestFunction[] = [];

    if (i === 0) {
      childBeforeHooks = [...beforeHooks, ...node.beforeAll];
    }

    childAfterHooks.push(() => {
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    });

    if (i === node.children.length - 1) {
      childAfterHooks = [...node.afterAll, ...afterHooks];
    }

    nodeRunner(child, childBeforeHooks, childAfterHooks);
  });
}

async function runHook(hookName: string, hook: TestFunction) {
  try {
    await hook();
  } catch (error) {
    reportHookError(hookName, error);
  }
}

function runIt(
  node: ItNode,
  beforeHooks: TestFunction[],
  afterHooks: TestFunction[],
) {
  async function wrappedFn() {
    for (const hook of beforeHooks) {
      await runHook("beforeAll", hook);
    }

    for (const hook of node.parent.beforeEach) {
      await runHook("beforeEach", hook);
    }

    const start = Date.now();

    try {
      await node.fn();
    } catch (error) {
      node.result = "FAIL";
      node.error = error;
    }

    node.timeTaken = Date.now() - start;
    // reportCase(node);

    for (const hook of node.parent.afterEach) {
      await runHook("afterEach", hook);
    }

    for (const hook of afterHooks) {
      await runHook("afterAll", hook);
    }

    if (node.error) {
      throw node.error;
    }
  }

  Deno.test({
    name: getFullName(node),
    fn: wrappedFn,
    ignore: node.skipped,
  });
}

export function runNode(
  node: RootNode | DescribeNode | ItNode,
  beforeHooks: TestFunction[] = [],
  afterHooks: TestFunction[] = [],
) {
  if (node instanceof RootNode) {
    runRoot(node, runNode);
  } else if (node instanceof DescribeNode) {
    runDescribe(node, beforeHooks, afterHooks, runNode);
  } else {
    runIt(node, beforeHooks, afterHooks);
  }
}
