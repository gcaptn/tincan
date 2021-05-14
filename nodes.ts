export type Hook = () => void;

export type TestResult = "FAIL" | "PASS";

export type TestFunction = () => void | Promise<void>;

export class RootNode {
  children: (DescribeNode | ItNode)[] = [];
  beforeAll: Hook[] = [];
  afterAll: Hook[] = [];
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
  result: TestResult = "PASS";
  isRunning = false;
  hasFocused = false;
  timeTaken = 0;
}

export class DescribeNode {
  children: (DescribeNode | ItNode)[] = [];
  parent: RootNode | DescribeNode;
  headline: string;
  result: TestResult = "PASS";
  beforeAll: Hook[] = [];
  afterAll: Hook[] = [];
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
  skip = false;
  only = false;
  hasFocused = false;

  constructor(headline: string, parent: RootNode | DescribeNode) {
    this.headline = headline;
    this.parent = parent;
    this.beforeEach = [...parent.beforeEach];
    this.afterEach = [...parent.afterEach];
  }

  setSkipped() {
    this.skip = true;
    this.children.forEach((child) => child.setSkipped());
  }
}

export class ItNode {
  parent: DescribeNode | RootNode;
  headline: string;
  fn: TestFunction;
  beforeEach: Hook[] = [];
  afterEach: Hook[] = [];
  result: TestResult = "PASS";
  error: unknown;
  timeTaken = 0;
  skip = false;
  only = false;

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

  setSkipped() {
    this.skip = true;
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

// todo: child nodes shouldn't know their parents exist

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
    node.parent.children.forEach((child) => {
      if (child.only === false) {
        child.setSkipped();
      }
    });
  }
}

describe.skip = function (headline: string, fn: () => void) {
  const node = addDescribeNode(headline, fn);
  node.setSkipped();
};

describe.only = function (headline: string, fn: () => void) {
  const node = addDescribeNode(headline, fn);
  node.only = true;
  node.parent.hasFocused = true;
  node.parent.children.forEach((child) => {
    if (child.only === false) {
      child.setSkipped();
    }
  });
};

function addItNode(headline: string, fn: TestFunction) {
  const parent = currentNode;
  const node = new ItNode(headline, fn, parent);
  parent.children.push(node);
  return node;
}

export function it(headline: string, fn: TestFunction) {
  const node = addItNode(headline, fn);
  if (node.parent.hasFocused) {
    node.parent.children.forEach((child) => {
      if (child.only === false) {
        child.setSkipped();
      }
    });
  }
}

it.skip = function (headline: string, fn: TestFunction) {
  const node = addItNode(headline, fn);
  node.setSkipped();
};

it.only = function (headline: string, fn: TestFunction) {
  const node = addItNode(headline, fn);
  node.only = true;
  node.parent.hasFocused = true;
  node.parent.children.forEach((child) => {
    if (child.only === false) {
      child.setSkipped();
    }
  });
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
