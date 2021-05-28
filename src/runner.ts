import {
  DescribeNode,
  findChildWithFirstCase,
  findChildWithLastCase,
  Hook,
  ItNode,
  RootNode,
  TestFunction,
} from "./nodes/mod.ts";
import { Reporter, TestReporter } from "./reporters.ts";

export class Runner {
  reporter: TestReporter = new Reporter();

  async runNode(
    node: RootNode | DescribeNode | ItNode,
    beforeHooks: Hook[] = [],
    beforeEachHooks: Hook[] = [],
    afterEachHooks: Hook[] = [],
    afterHooks: Hook[] = [],
  ) {
    if (node instanceof RootNode) {
      await this.runRoot(node);
    } else if (node instanceof DescribeNode) {
      await this.runDescribe(
        node,
        beforeHooks,
        beforeEachHooks,
        afterEachHooks,
        afterHooks,
      );
    } else {
      await this.runIt(
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

  async runRoot(node: RootNode) {
    node.start();
    this.reporter.reportStart(node);

    const childWithFirstCase = findChildWithFirstCase(node);
    const childWithLastCase = findChildWithLastCase(node);

    for (const child of node.children) {
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

      await this.runNode(
        child,
        childBeforeHooks,
        [...node.beforeEach],
        [...node.afterEach],
        childAfterHooks,
      );
    }
  }

  async runDescribe(
    node: DescribeNode,
    beforeHooks: Hook[],
    beforeEachHooks: Hook[],
    afterEachHooks: Hook[],
    afterHooks: Hook[],
  ) {
    const childWithFirstCase = findChildWithFirstCase(node);
    const childWithLastCase = findChildWithLastCase(node);

    for (const child of node.children) {
      let childBeforeHooks: Hook[] = [];
      let childAfterHooks: Hook[] = [];

      if (child === childWithFirstCase) {
        childBeforeHooks = [...beforeHooks, ...node.beforeAll];
      }

      if (child === childWithLastCase) {
        childAfterHooks = [...node.afterAll, ...afterHooks];
      }

      await this.runNode(
        child,
        childBeforeHooks,
        [...beforeEachHooks, ...node.beforeEach],
        [...node.afterEach, ...afterEachHooks],
        childAfterHooks,
      );
    }
  }

  async runIt(
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

    await this.test(node, wrappedFn);
  }

  test(node: ItNode, fn: TestFunction) {
    Deno.test({
      name: this.reporter.getTestCaseName(node),
      fn,
      ignore: node.skipped,
    });
  }
}
