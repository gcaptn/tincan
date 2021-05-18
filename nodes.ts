export type TestResult = "FAIL" | "PASS";

export type TestFunction = () => void | Promise<void>;

type HookType =
  | "internal"
  | "beforeAll"
  | "beforeEach"
  | "afterEach"
  | "afterAll";

type ParentNode = {
  children: (DescribeNode | ItNode)[];
  hasFocused: boolean;
  updateFocusedChildren: () => void;
};

type ChildNode = {
  parent: DescribeNode | RootNode;
  skipped: boolean;
  focused: boolean;
  skip: () => void;
  focus: () => void;
};

function assertNotEmpty(headline: string) {
  if (!headline.match(/\S/g)) {
    throw new Error("Headline cannot be empty!");
  }
}

function hasCase(node: DescribeNode | RootNode): boolean {
  for (const child of node.children) {
    if (child instanceof ItNode) {
      return true;
    } else {
      return hasCase(child);
    }
  }
  return false;
}

function assertHasCase(node: DescribeNode | RootNode, method: string) {
  if (!hasCase(node)) {
    throw new Error(`${method} should have at least one test case!`);
  }
}

export class Hook {
  type: HookType;
  fn: TestFunction;
  constructor(type: HookType, fn: TestFunction) {
    this.type = type;
    this.fn = fn;
  }
}

export class RootNode implements ParentNode {
  children: (DescribeNode | ItNode)[] = [];
  beforeAll: Hook[] = [];
  afterAll: Hook[] = [];
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
  result: TestResult = "PASS";
  isRunning = false;
  timeTaken = 0;
  startTime = 0;
  hasFocused = false;

  updateFocusedChildren() {
    this.hasFocused = true;
    this.children.forEach((child) => {
      if (child.focused === false) {
        child.skip();
      }
    });
  }

  start() {
    assertHasCase(this, "Tests");
    this.startTime = Date.now();
    this.isRunning = true;
  }

  fail() {
    this.result = "FAIL";
  }

  finish() {
    this.timeTaken = Date.now() - this.startTime;
  }
}

export class DescribeNode implements ParentNode, ChildNode {
  children: (DescribeNode | ItNode)[] = [];
  parent: RootNode | DescribeNode;
  headline: string;
  result: TestResult = "PASS";
  beforeAll: Hook[] = [];
  afterAll: Hook[] = [];
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
  skipped = false;
  focused = false;
  hasFocused = false;

  constructor(headline: string, parent: RootNode | DescribeNode) {
    assertNotEmpty(headline);
    this.headline = headline;
    this.parent = parent;
  }

  skip() {
    this.skipped = true;
    this.children.forEach((child) => child.skip());
  }

  focus() {
    this.focused = true;
    this.parent.updateFocusedChildren();
  }

  updateFocusedChildren() {
    this.hasFocused = true;
    this.children.forEach((child) => {
      if (child.focused === false) {
        child.skip();
      }
    });
  }

  fail() {
    this.result = "FAIL";
    this.parent.fail();
  }
}

export class ItNode implements ChildNode {
  parent: DescribeNode | RootNode;
  headline: string;
  fn: TestFunction;
  result: TestResult = "PASS";
  error: unknown;
  timeTaken = 0;
  startTime = 0;
  skipped = false;
  focused = false;

  constructor(
    headline: string,
    fn: TestFunction,
    parent: DescribeNode | RootNode,
  ) {
    assertNotEmpty(headline);
    this.parent = parent;
    this.headline = headline;
    this.fn = fn;
  }

  skip() {
    this.skipped = true;
  }

  focus() {
    this.focused = true;
    this.parent.hasFocused = true;
    this.parent.updateFocusedChildren();
  }

  start() {
    this.startTime = Date.now();
  }

  fail(error?: unknown) {
    this.result = "FAIL";
    this.error = error;
    this.parent.fail();
  }

  finish() {
    this.timeTaken = Date.now() - this.startTime;
  }
}

export class Environment {
  root: RootNode;
  private currentNode: RootNode | DescribeNode;

  constructor() {
    this.root = new RootNode();
    this.currentNode = this.root;
  }

  private assertDescribeOrRootOnly(method: string) {
    if (this.root.isRunning) {
      throw new Error(
        `${method} can only be called at the top level or directly within describe()`,
      );
    }
  }

  addDescribeNode(headline: string, fn: () => void) {
    this.assertDescribeOrRootOnly("describe()");
    const parent = this.currentNode;
    const node = new DescribeNode(headline, parent);
    parent.children.push(node);
    this.currentNode = node;
    fn();
    assertHasCase(node, "describe()");
    this.currentNode = parent;
    return node;
  }

  describe(headline: string, fn: () => void) {
    const node = this.addDescribeNode(headline, fn);
    if (node.parent.hasFocused) {
      node.skip();
    }
  }

  describeSkip(headline: string, fn: () => void) {
    const node = this.addDescribeNode(headline, fn);
    node.skip();
  }

  describeOnly(headline: string, fn: () => void) {
    const node = this.addDescribeNode(headline, fn);
    node.focus();
  }

  addItNode(headline: string, fn: TestFunction) {
    this.assertDescribeOrRootOnly("it()");
    const parent = this.currentNode;
    const node = new ItNode(headline, fn, parent);
    parent.children.push(node);
    return node;
  }

  it(headline: string, fn: TestFunction) {
    const node = this.addItNode(headline, fn);
    if (node.parent.hasFocused) {
      node.skip();
    }
  }

  itSkip(headline: string, fn: TestFunction) {
    const node = this.addItNode(headline, fn);
    node.skip();
  }

  itOnly(headline: string, fn: TestFunction) {
    const node = this.addItNode(headline, fn);
    node.focus();
  }

  beforeAll(fn: TestFunction) {
    this.assertDescribeOrRootOnly("beforeAll()");
    this.currentNode.beforeAll.push(new Hook("beforeAll", fn));
  }

  beforeEach(fn: TestFunction) {
    this.assertDescribeOrRootOnly("beforeEach()");
    this.currentNode.beforeEach.push(new Hook("beforeEach", fn));
  }

  afterEach(fn: TestFunction) {
    this.assertDescribeOrRootOnly("afterEach()");
    this.currentNode.afterEach.unshift(new Hook("afterEach", fn));
  }

  afterAll(fn: TestFunction) {
    this.assertDescribeOrRootOnly("afterAll()");
    this.currentNode.afterAll.unshift(new Hook("afterAll", fn));
  }
}
