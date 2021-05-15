export type Hook = () => void;

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
  beforeAll: Hook[] = [];
  afterAll: Hook[] = [];
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
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
  beforeAll: Hook[] = [];
  afterAll: Hook[] = [];
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
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
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
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

export const root = new RootNode();
let currentNode: RootNode | DescribeNode = root;

function assertDescribeOrRootOnly(method: string) {
  if (root.isRunning) {
    throw new Error(
      `${method} can only be called at the top level or directly within describe()`,
    );
  }
}

function addDescribeNode(headline: string, fn: () => void) {
  assertDescribeOrRootOnly("describe()");
  const parent = currentNode;
  const node = new DescribeNode(headline, parent);
  parent.children.push(node);
  currentNode = node;
  fn();
  currentNode = parent;
  return node;
}

export function describe(headline: string, fn: () => void) {
  const node = addDescribeNode(headline, fn);
  if (node.parent.hasFocused) {
    node.skip();
  }
}

describe.skip = function (headline: string, fn: () => void) {
  const node = addDescribeNode(headline, fn);
  node.skip();
};

describe.only = function (headline: string, fn: () => void) {
  const node = addDescribeNode(headline, fn);
  node.focus();
};

function addItNode(headline: string, fn: TestFunction) {
  assertDescribeOrRootOnly("it()");
  const parent = currentNode;
  const node = new ItNode(headline, fn, parent);
  parent.children.push(node);
  return node;
}

export function it(headline: string, fn: TestFunction) {
  const node = addItNode(headline, fn);
  if (node.parent.hasFocused) {
    node.skip();
  }
}

it.skip = function (headline: string, fn: TestFunction) {
  const node = addItNode(headline, fn);
  node.skip();
};

it.only = function (headline: string, fn: TestFunction) {
  const node = addItNode(headline, fn);
  node.focus();
};

export function beforeAll(fn: TestFunction) {
  assertDescribeOrRootOnly("beforeAll()");
  currentNode.beforeAll.push(fn);
}

export function afterAll(fn: TestFunction) {
  assertDescribeOrRootOnly("afterAll()");
  currentNode.afterAll.unshift(fn);
}

export function beforeEach(fn: TestFunction) {
  assertDescribeOrRootOnly("beforeEach()");
  currentNode.beforeEach.push(fn);
}

export function afterEach(fn: TestFunction) {
  assertDescribeOrRootOnly("afterEach()");
  currentNode.afterEach.unshift(fn);
}
