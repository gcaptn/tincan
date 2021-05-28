import { Hook, TestFunction, Tree } from "./nodes/mod.ts";
import { Runner } from "./runner.ts";

export class Environment {
  runner = new Runner();
  currentTree = new Tree();

  // Because run() can be called multiple times and there can be more than one
  // test tree, calling hooks/describe/it inside a test case will register it in
  // another tree. This toggle will change before and after every test case to
  // lock the methods.
  private isRunningCase = false;

  private assertNotRunning(method: string) {
    if (this.isRunningCase) {
      throw new Error(
        `${method} cannot be called while a test case is running!`,
      );
    }
  }

  async run() {
    const tree = this.currentTree;
    this.currentTree = new Tree();

    tree.root.beforeEach.unshift(
      new Hook("internal", () => {
        this.isRunningCase = true;
      }),
    );

    tree.root.afterEach.push(
      new Hook("internal", () => {
        this.isRunningCase = false;
      }),
    );

    await this.runner.runNode(tree.root);
  }

  describe(headline: string, fn: () => void) {
    this.assertNotRunning("describe()");
    this.currentTree.describe(headline, fn);
  }

  describeOnly(headline: string, fn: () => void) {
    this.assertNotRunning("describe.only()");
    this.currentTree.describeOnly(headline, fn);
  }

  describeSkip(headline: string, fn: () => void) {
    this.assertNotRunning("describe.skip()");
    this.currentTree.describeSkip(headline, fn);
  }

  it(headline: string, fn: TestFunction) {
    this.assertNotRunning("it()");
    this.currentTree.it(headline, fn);
  }

  itOnly(headline: string, fn: TestFunction) {
    this.assertNotRunning("it.only()");
    this.currentTree.itOnly(headline, fn);
  }

  itSkip(headline: string, fn: TestFunction) {
    this.assertNotRunning("it.skip()");
    this.currentTree.itSkip(headline, fn);
  }

  beforeAll(fn: TestFunction) {
    this.assertNotRunning("beforeAll()");
    this.currentTree.beforeAll(fn);
  }

  beforeEach(fn: TestFunction) {
    this.assertNotRunning("beforeEach()");
    this.currentTree.beforeEach(fn);
  }

  afterEach(fn: TestFunction) {
    this.assertNotRunning("afterEach()");
    this.currentTree.afterEach(fn);
  }

  afterAll(fn: TestFunction) {
    this.assertNotRunning("afterAll()");
    this.currentTree.afterAll(fn);
  }
}
