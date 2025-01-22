import {
  assertHasCase,
  DescribeNode,
  Hook,
  ItNode,
  RootNode,
  type TestFunction,
} from "./nodes.ts";

export class Tree {
  root: RootNode = new RootNode();
  private currentNode: RootNode | DescribeNode;

  constructor() {
    this.currentNode = this.root;
  }

  addDescribeNode(headline: string, fn: () => void) {
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
    this.currentNode.beforeAll.push(new Hook("beforeAll", fn));
  }

  beforeEach(fn: TestFunction) {
    this.currentNode.beforeEach.push(new Hook("beforeEach", fn));
  }

  afterEach(fn: TestFunction) {
    this.currentNode.afterEach.unshift(new Hook("afterEach", fn));
  }

  afterAll(fn: TestFunction) {
    this.currentNode.afterAll.unshift(new Hook("afterAll", fn));
  }
}
