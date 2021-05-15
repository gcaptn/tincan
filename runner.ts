import { DescribeNode, ItNode, RootNode, TestFunction } from "./nodes.ts";
import { getFullName, reportStart } from "./report.ts";

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
    let beforeTasks: TestFunction[] = [];
    let afterTasks: TestFunction[] = [];

    if (i === 0) {
      beforeTasks = [...node.beforeAll];
      // beforeTasks.unshift(() => {
      //   start = Date.now();
      // });
    }

    afterTasks.push(() => {
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    });

    if (i === node.children.length - 1) {
      afterTasks = [...afterTasks, ...node.afterAll];
      afterTasks.push(() => {
        // node.timeTaken = Date.now() - start;
        // reportEnd(node);
      });
    }

    nodeRunner(child, beforeTasks, afterTasks);
  });
}

function runDescribe(
  node: DescribeNode,
  beforeTasks: TestFunction[],
  afterTasks: TestFunction[],
  nodeRunner: NodeRunner,
) {
  node.children.forEach((child, i) => {
    let childBeforeTasks: TestFunction[] = [];
    let childAfterTasks: TestFunction[] = [];

    if (i === 0) {
      childBeforeTasks = [...beforeTasks, ...node.beforeAll];
    }

    childAfterTasks.push(() => {
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    });

    if (i === node.children.length - 1) {
      childAfterTasks = [...node.afterAll, ...afterTasks];
    }

    nodeRunner(child, childBeforeTasks, childAfterTasks);
  });
}

function runIt(
  node: ItNode,
  beforeTasks: TestFunction[],
  afterTasks: TestFunction[],
) {
  async function wrappedFn() {
    for (const hook of beforeTasks) await hook();
    for (const hook of node.beforeEach) await hook();

    const start = Date.now();
    try {
      await node.fn();
    } catch (err) {
      node.result = "FAIL";
      node.error = err;
    }
    node.timeTaken = Date.now() - start;
    // reportCase(node);

    for (const hook of node.afterEach) await hook();
    for (const hook of afterTasks) await hook();

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
