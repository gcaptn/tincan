import { DescribeNode, Hook, ItNode, RootNode } from "./nodes.ts";
import { getFullName, reportHookError, reportStart } from "./report.ts";

type NodeRunner = (
  node: RootNode | DescribeNode | ItNode,
  beforeHooks: Hook[],
  beforeEachHooks: Hook[],
  afterEachHooks: Hook[],
  afterHooks: Hook[],
) => void;

export function runRoot(node: RootNode, nodeRunner: NodeRunner) {
  node.start();
  reportStart(node);

  node.children.forEach((child, i) => {
    let childBeforeHooks: Hook[] = [];
    let childAfterHooks: Hook[] = [];

    if (i === 0) {
      childBeforeHooks = [...node.beforeAll];
    }

    if (i === node.children.length - 1) {
      childAfterHooks = [...childAfterHooks, ...node.afterAll];
      childAfterHooks.push(
        new Hook("internal", () => {
          node.finish();
        }),
      );
    }

    nodeRunner(child, childBeforeHooks, [], [], childAfterHooks);
  });
}

export function runDescribe(
  node: DescribeNode,
  beforeHooks: Hook[],
  beforeEachHooks: Hook[],
  afterEachHooks: Hook[],
  afterHooks: Hook[],
  nodeRunner: NodeRunner,
) {
  node.children.forEach((child, i) => {
    let childBeforeHooks: Hook[] = [];
    let childAfterHooks: Hook[] = [];

    if (i === 0) {
      childBeforeHooks = [...beforeHooks, ...node.beforeAll];
    }

    if (i === node.children.length - 1) {
      childAfterHooks = [...node.afterAll, ...afterHooks];
    }

    nodeRunner(
      child,
      childBeforeHooks,
      [...beforeEachHooks, ...node.beforeEach],
      [...node.afterEach, ...afterEachHooks],
      childAfterHooks,
    );
  });
}

export async function runHook(hook: Hook) {
  try {
    await hook.fn();
  } catch (error) {
    reportHookError(hook, error);
  }
}

export function runIt(
  node: ItNode,
  beforeHooks: Hook[],
  beforeEachHooks: Hook[],
  afterEachHooks: Hook[],
  afterHooks: Hook[],
) {
  async function wrappedFn() {
    for (const hook of beforeHooks) {
      await runHook(hook);
    }

    for (const hook of beforeEachHooks) {
      await runHook(hook);
    }

    node.start();

    try {
      await node.fn();
    } catch (error) {
      node.fail(error);
    }

    node.finish();
    // reportCase(node);

    for (const hook of afterEachHooks) {
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
  beforeEachHooks: Hook[] = [],
  afterEachHooks: Hook[] = [],
  afterHooks: Hook[] = [],
) {
  if (node instanceof RootNode) {
    runRoot(node, runNode);
  } else if (node instanceof DescribeNode) {
    runDescribe(
      node,
      beforeHooks,
      beforeEachHooks,
      afterEachHooks,
      afterHooks,
      runNode,
    );
  } else {
    runIt(node, beforeHooks, beforeEachHooks, afterEachHooks, afterHooks);
  }
}
