import { DescribeNode, ItNode, RootNode, TestFunction } from "./nodes.ts";
import { reportCase, reportEnd, reportStart } from "./report.ts";

type NodeRunner = (
  node: RootNode | DescribeNode | ItNode,
  beforeHooks: TestFunction[],
  afterHooks: TestFunction[],
) => void;

function runRoot(
  node: RootNode,
  nodeRunner: NodeRunner,
) {
  reportStart(node);
  node.isRunning = true;
  let nodeStart: number;

  node.children.forEach((child, i) => {
    let beforeTasks = [...node.beforeEach];
    let afterTasks = [...node.afterEach];

    if (i === 0) {
      beforeTasks = [...node.beforeAll, ...beforeTasks];
      beforeTasks.unshift(function () {
        nodeStart = Date.now();
      });
    }

    let start: number;

    beforeTasks.push(function () {
      start = Date.now();
    });

    afterTasks.push(function () {
      if (child instanceof ItNode) {
        child.timeTaken = Date.now() - start;
      }
    });

    afterTasks.push(function () {
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    });

    if (i === node.children.length - 1) {
      console.log("afterTask", child.headline, afterTasks)
      afterTasks = [...afterTasks, ...node.afterAll];
      afterTasks.push(function () {
        node.timeTaken = Date.now() - nodeStart;
        reportEnd(node);
      });
    }

    nodeRunner(child, beforeTasks, afterTasks);
  })
}

function runDescribe(
  node: DescribeNode,
  beforeHooks: TestFunction[] = [],
  afterHooks: TestFunction[] = [],
  nodeRunner: NodeRunner,
) {
  node.children.forEach((child, i) => {
    let beforeTasks = [...node.beforeEach];
    let afterTasks = [...node.afterEach];

    if (i === 0) {
      beforeTasks = [...node.beforeAll, ...beforeHooks, ...beforeTasks];
    }

    afterTasks.push(function () {
      if (child.result === "FAIL") {
        node.result = "FAIL";
      }
    });

    if (i === node.children.length - 1) {
      console.log("afterTask", child.headline, afterTasks)
      //afterTasks.forEach(task => task())
      console.log(afterHooks) // 1 afterEach, 1 afterall
      // no way to insert 2. afterall in between
      // todo: a before begin, after begin, before end, after end 
      afterTasks = [...afterTasks, ...node.afterAll, ...afterHooks];
      //afterTasks.forEach(task => task())
    }

    nodeRunner(child, beforeTasks, afterTasks);
  })
}

function runIt(
  node: ItNode,
  beforeHooks: TestFunction[] = [],
  afterHooks: TestFunction[] = [],
) {
  async function wrappedFn() {
    for (const hook of beforeHooks) await hook();
    const start = Date.now();
    try {
      await node.fn();
    } catch (err) {
      node.result = "FAIL";
      node.error = err;
    }
    
    node.timeTaken = Date.now() - start;
    reportCase(node);
    for (const hook of afterHooks) await hook();
    if (node.error) {
      throw node.error;
    }
  }

  Deno.test({
    name: node.headline,
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
