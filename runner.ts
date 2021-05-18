import { DescribeNode, Hook, ItNode, RootNode } from "./nodes.ts";
import { getFullName, reportHookError, reportStart } from "./report.ts";

type NodeRunner = (
  node: RootNode | DescribeNode | ItNode,
  beforeHooks: Hook[],
  beforeEachHooks: Hook[],
  afterEachHooks: Hook[],
  afterHooks: Hook[],
) => void;

type FindChildResult = ItNode | DescribeNode | undefined;

function findChildWithCase(
  children: (ItNode | DescribeNode)[],
  recursiveSearch: (node: (DescribeNode | RootNode)) => FindChildResult,
): FindChildResult {
  for (const child of children) {
    if (
      child.skipped === false &&
      (child instanceof ItNode || recursiveSearch(child as DescribeNode))
    ) {
      return child;
    }
  }
}

// Find the child that will run the beforeAll/afterAll hooks

function findChildWithFirstCase(
  node: DescribeNode | RootNode,
): FindChildResult {
  return findChildWithCase(node.children, findChildWithFirstCase);
}

function findChildWithLastCase(
  node: DescribeNode | RootNode,
): FindChildResult {
  return findChildWithCase([...node.children].reverse(), findChildWithLastCase);
}

export function runRoot(node: RootNode, nodeRunner: NodeRunner) {
  node.start();
  reportStart(node);

  const childWithFirstCase = findChildWithFirstCase(node);
  const childWithLastCase = findChildWithLastCase(node);

  node.children.forEach((child) => {
    let childBeforeHooks: Hook[] = [];
    let childAfterHooks: Hook[] = [];

    if (child === childWithFirstCase) {
      childBeforeHooks = [...node.beforeAll];
    }

    if (child === childWithLastCase) {
      childAfterHooks = [...childAfterHooks, ...node.afterAll];
      childAfterHooks.push(
        new Hook("internal", () => {
          node.finish();
        }),
      );
    }

    nodeRunner(
      child,
      childBeforeHooks,
      [...node.beforeEach],
      [...node.afterEach],
      childAfterHooks,
    );
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
  const childWithFirstCase = findChildWithFirstCase(node);
  const childWithLastCase = findChildWithLastCase(node);

  node.children.forEach((child) => {
    let childBeforeHooks: Hook[] = [];
    let childAfterHooks: Hook[] = [];

    if (child === childWithFirstCase) {
      childBeforeHooks = [...beforeHooks, ...node.beforeAll];
    }

    if (child === childWithLastCase) {
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
  // Deno.test() *registers* tests and runs them separately. Hooks
  // have to be passsed down and ran in one function with the test

  async function wrappedFn() {
    for (const hook of beforeHooks) {
      await runHook(hook);
    }

    for (const hook of beforeEachHooks) {
      await runHook(hook);
    }

    node.start();

    let didThrow = false;

    try {
      await node.fn();
    } catch (error) {
      node.fail(error);
      didThrow = true;
    }

    node.finish();
    // reportCase(node);

    for (const hook of afterEachHooks) {
      await runHook(hook);
    }

    for (const hook of afterHooks) {
      await runHook(hook);
    }

    if (didThrow) {
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
