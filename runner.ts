import { DescribeNode, Hook, ItNode, RootNode } from "./nodes.ts";
import { findChildWithFirstCase, findChildWithLastCase } from "./nodes_util.ts";
import { TestReporter } from "./reporter.ts";

export type TestMethod = {
  (t: Deno.TestDefinition): void;
  (name: string, fn: () => void | Promise<void>): void;
};

export class Runner {
  test: TestMethod = Deno.test;
  reporter: TestReporter;

  constructor(reporter: TestReporter) {
    this.reporter = reporter;
  }

  runNode(
    node: RootNode | DescribeNode | ItNode,
    beforeHooks: Hook[] = [],
    beforeEachHooks: Hook[] = [],
    afterEachHooks: Hook[] = [],
    afterHooks: Hook[] = [],
  ) {
    if (node instanceof RootNode) {
      this.runRoot(node);
    } else if (node instanceof DescribeNode) {
      this.runDescribe(
        node,
        beforeHooks,
        beforeEachHooks,
        afterEachHooks,
        afterHooks,
      );
    } else {
      this.runIt(
        node,
        beforeHooks,
        beforeEachHooks,
        afterEachHooks,
        afterHooks,
      );
    }
  }

  async runHook(hook: Hook) {
    try {
      await hook.fn();
    } catch (error) {
      this.reporter.reportHookError(hook, error);
    }
  }

  runRoot(node: RootNode) {
    node.start();
    this.reporter.reportStart(node);

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
            this.reporter.reportEnd(node);
          }),
        );
      }

      this.runNode(
        child,
        childBeforeHooks,
        [...node.beforeEach],
        [...node.afterEach],
        childAfterHooks,
      );
    });
  }

  runDescribe(
    node: DescribeNode,
    beforeHooks: Hook[],
    beforeEachHooks: Hook[],
    afterEachHooks: Hook[],
    afterHooks: Hook[],
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

      this.runNode(
        child,
        childBeforeHooks,
        [...beforeEachHooks, ...node.beforeEach],
        [...node.afterEach, ...afterEachHooks],
        childAfterHooks,
      );
    });
  }

  runIt(
    node: ItNode,
    beforeHooks: Hook[],
    beforeEachHooks: Hook[],
    afterEachHooks: Hook[],
    afterHooks: Hook[],
  ) {
    // Deno.test() *registers* tests and runs them separately. Hooks
    // have to be passsed down and ran in one function with the test

    const wrappedFn = async () => {
      for (const hook of beforeHooks) {
        await this.runHook(hook);
      }

      for (const hook of beforeEachHooks) {
        await this.runHook(hook);
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
      this.reporter.reportCase(node);

      for (const hook of afterEachHooks) {
        await this.runHook(hook);
      }

      for (const hook of afterHooks) {
        await this.runHook(hook);
      }

      if (didThrow) {
        throw node.error;
      }
    };

    this.test({
      name: this.reporter.getFullCaseName(node),
      fn: wrappedFn,
      ignore: node.skipped,
    });
  }
}
