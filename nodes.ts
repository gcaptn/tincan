export type TestResult = "FAIL" | "PASS";

export type TestFunction = () => void | Promise<void>;

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

export class RootNode implements ParentNode {
  children: (DescribeNode | ItNode)[] = [];
  beforeAll: TestFunction[] = [];
  afterAll: TestFunction[] = [];
  beforeEach: TestFunction[] = [];
  afterEach: TestFunction[] = [];
  result: TestResult = "PASS";
  isRunning = false;
  timeTaken = 0;
  hasFocused = false;

  updateFocusedChildren() {
    if (this.hasFocused) {
      this.children.forEach((child) => {
        if (child.focused === false) {
          child.skip();
        }
      });
    }
  }
}

export class DescribeNode implements ParentNode, ChildNode {
  children: (DescribeNode | ItNode)[] = [];
  parent: RootNode | DescribeNode;
  headline: string;
  result: TestResult = "PASS";
  beforeAll: TestFunction[] = [];
  afterAll: TestFunction[] = [];
  beforeEach: TestFunction[] = [];
  afterEach: TestFunction[] = [];
  skipped = false;
  focused = false;
  hasFocused = false;

  constructor(headline: string, parent: RootNode | DescribeNode) {
    this.headline = headline;
    this.parent = parent;
    this.beforeEach = [...parent.beforeEach];
    this.afterEach = [...parent.afterEach];
  }

  skip() {
    this.skipped = true;
    this.children.forEach((child) => child.skip());
  }

  focus() {
    this.focused = true;
    this.parent.hasFocused = true;
    this.parent.updateFocusedChildren();
  }

  updateFocusedChildren() {
    if (this.hasFocused) {
      this.children.forEach((child) => {
        if (child.focused === false) {
          child.skip();
        }
      });
    }
  }
}

export class ItNode implements ChildNode {
  parent: DescribeNode | RootNode;
  headline: string;
  fn: TestFunction;
  beforeEach: TestFunction[] = [];
  afterEach: TestFunction[] = [];
  result: TestResult = "PASS";
  error: unknown;
  timeTaken = 0;
  skipped = false;
  focused = false;

  constructor(
    headline: string,
    fn: TestFunction,
    parent: DescribeNode | RootNode,
  ) {
    this.parent = parent;
    this.headline = headline;
    this.fn = fn;
    this.beforeEach = [...parent.beforeEach];
    this.afterEach = [...parent.afterEach];
  }

  skip() {
    this.skipped = true;
  }

  focus() {
    this.focused = true;
    this.parent.hasFocused = true;
    this.parent.updateFocusedChildren();
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

  private addDescribeNode(headline: string, fn: () => void) {
    this.assertDescribeOrRootOnly("describe()");
    const parent = this.currentNode;
    const node = new DescribeNode(headline, parent);
    parent.children.push(node);
    this.currentNode = node;
    fn();
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

  private addItNode(headline: string, fn: TestFunction) {
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
    this.currentNode.beforeAll.push(fn);
  }

  beforeEach(fn: TestFunction) {
    this.assertDescribeOrRootOnly("beforeEach()");
    this.currentNode.beforeEach.push(fn);
  }

  afterAll(fn: TestFunction) {
    this.assertDescribeOrRootOnly("afterAll()");
    this.currentNode.afterAll.unshift(fn);
  }

  afterEach(fn: TestFunction) {
    this.assertDescribeOrRootOnly("afterEach()");
    this.currentNode.afterEach.unshift(fn);
  }
}
