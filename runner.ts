import { DescribeNode, Hook, ItNode, RootNode } from "./nodes.ts";
import { getFullName, reportHookError, reportStart } from "./report.ts";

type NodeRunner = (
  node: RootNode | DescribeNode | ItNode,
  beforeHooks: Hook[],
  afterHooks: Hook[],
) => void;

function runRoot(node: RootNode, nodeRunner: NodeRunner) {
  reportStart(node);
  node.isRunning = true;
  // let start: number;

  node.children.forEach((child, i) => {
    let childBeforeHooks: Hook[] = [];
    let childAfterHooks: Hook[] = [];

    if (i === 0) {
      childBeforeHooks = [...node.beforeAll];
      // childBeforeHooks.unshift(new Hook("internal", () => {
      //   start = Date.now();
      // }));
    }

    childAfterHooks.push(
      new Hook("internal", () => {
        if (child.result === "FAIL") {
          node.result = "FAIL";
        }
      }),
    );

    if (i === node.children.length - 1) {
      childAfterHooks = [...childAfterHooks, ...node.afterAll];
      // childAfterHooks.push(new Hook("internal", () => {
      //   node.timeTaken = Date.now() - start;
      //   reportEnd(node);
      // }));
    }

    nodeRunner(child, childBeforeHooks, childAfterHooks);
  });
}

function runDescribe(
  node: DescribeNode,
  beforeHooks: Hook[],
  afterHooks: Hook[],
  nodeRunner: NodeRunner,
) {
  node.children.forEach((child, i) => {
    let childBeforeHooks: Hook[] = [];
    let childAfterHooks: Hook[] = [];

    if (i === 0) {
      childBeforeHooks = [...beforeHooks, ...node.beforeAll];
    }

    childAfterHooks.push(
      new Hook("internal", () => {
        if (child.result === "FAIL") {
          node.result = "FAIL";
        }
      }),
    );

    if (i === node.children.length - 1) {
      childAfterHooks = [...node.afterAll, ...afterHooks];
    }

    nodeRunner(child, childBeforeHooks, childAfterHooks);
  });
}

async function runHook(hook: Hook) {
  try {
    await hook.fn();
  } catch (error) {
    reportHookError(hook, error);
  }
}

function runIt(
  node: ItNode,
  beforeHooks: Hook[],
  afterHooks: Hook[],
) {
  async function wrappedFn() {
    for (const hook of beforeHooks) {
      await runHook(hook);
    }

    for (const hook of node.parent.beforeEach) {
      await runHook(hook);
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
      await runHook(hook);
    }

    for (const hook of afterHooks) {
      await runHook(hook);
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
  beforeHooks: Hook[] = [],
  afterHooks: Hook[] = [],
) {
  if (node instanceof RootNode) {
    runRoot(node, runNode);
  } else if (node instanceof DescribeNode) {
    runDescribe(node, beforeHooks, afterHooks, runNode);
  } else {
    runIt(node, beforeHooks, afterHooks);
  }
}
