/*

addDescribeNode
  's function is called on construction
  throws when there are no cases

addItNode
  's function is not called on construction

addDescribeNode or addItNode
  adds to the current parent

describe() or it()
  skips itself if it has a focused sibling
  throws when the headline is empty

calling a hook creator adds a hook to the current parent

node.skip()
  skips all of its children

node.focus()
  skips non-focused siblings

node.fail()
  sets the status to fail
  on an ItNode sets the error to the given value
  calls fail on the parent

node.start()
  sets the start time

node.finish()
  sets the time taken

*/

import { expect, mock } from "./deps.ts";
import { DescribeNode, ItNode, RootNode, Tree } from "../src/nodes.ts";

function noop() {}

// describe nodes should have at least one case
function noopDescribe(tree: Tree) {
  return () => {
    tree.it("_", noop);
  };
}

Deno.test("addDescribeNode's function is called on construction", () => {
  const tree = new Tree();
  const fn = mock.fn(noopDescribe(tree));
  tree.addDescribeNode("_", fn);
  expect(fn).toHaveBeenCalled();
});

Deno.test("addDescribeNode throws when there are no running cases", () => {
  const tree = new Tree();

  expect(() => {
    tree.addDescribeNode("_", noop);
  }).toThrow();

  expect(() => {
    tree.addDescribeNode("_", () => {
      tree.addDescribeNode("_", noop);
    });
  }).toThrow();

  expect(() => {
    tree.addDescribeNode("_", () => {
      tree.itSkip("_", noop);
    });
  }).toThrow();

  expect(() => {
    tree.addDescribeNode("_", noopDescribe(tree));
  }).not.toThrow();

  expect(() => {
    tree.addDescribeNode("_", () => {
      tree.addDescribeNode("_", noopDescribe(tree));
    });
  }).not.toThrow();

  expect(() => {
    tree.describeSkip("_", () => {
      tree.it("_", noop);
    });
  }).not.toThrow();

  expect(() => {
    tree.describe("_", () => {
      tree.describeSkip("_", noopDescribe(tree));
      tree.it("_", noop);
    });
  }).not.toThrow();
});

Deno.test("addItNode's function is not called on construction", () => {
  const tree = new Tree();
  const fn = mock.fn();
  tree.addItNode("_", fn);
  expect(fn).not.toHaveBeenCalled();
});

Deno.test("addDescribeNode or addItNode adds to the current parent's children", () => {
  const tree = new Tree();
  let describeNode, itNode;

  const parentNode = tree.addDescribeNode("_", () => {
    describeNode = tree.addDescribeNode("_", noopDescribe(tree));
    itNode = tree.addItNode("_", noop);
  });

  expect(parentNode.children).toContain(describeNode);
  expect(parentNode.children).toContain(itNode);
});

Deno.test("describe() or it() throws when the headline is empty", () => {
  const tree = new Tree();

  expect(() => {
    tree.describe("", noopDescribe(tree));
  }).toThrow();

  expect(() => {
    tree.describe("   ", noopDescribe(tree));
  }).toThrow();

  expect(() => {
    tree.it("", noop);
  }).toThrow();

  expect(() => {
    tree.it("   ", noop);
  }).toThrow();

  expect(() => {
    tree.describe(" _ ", noopDescribe(tree));
  }).not.toThrow();

  expect(() => {
    tree.it(" _ ", noop);
  }).not.toThrow();
});

Deno.test("describe() or it() skips itself if it has a focused sibling", () => {
  const tree = new Tree();
  let focused: ItNode;
  const parentNode = tree.addDescribeNode("_", () => {
    focused = tree.addItNode("_", noop);
    focused.focus();
    tree.describe("_", noopDescribe(tree));
    tree.it("_", noop);
  });

  parentNode.children.forEach((child) => {
    if (child !== focused) {
      expect(child.skipped).toBe(true);
    }
  });
});

Deno.test("calling a hook creator adds a hook to the current parent", () => {
  const tree = new Tree();
  const parentNode = tree.addDescribeNode("_", () => {
    tree.beforeAll(noop);
    tree.beforeEach(noop);
    tree.afterEach(noop);
    tree.afterAll(noop);

    noopDescribe(tree)();
  });
  expect(parentNode.beforeAll.length).toBe(1);
  expect(parentNode.beforeEach.length).toBe(1);
  expect(parentNode.afterEach.length).toBe(1);
  expect(parentNode.afterAll.length).toBe(1);
});

Deno.test("node.skip() skips all of its children", () => {
  const tree = new Tree();
  const unskippedNode = tree.addDescribeNode("_", noopDescribe(tree));
  const describeNode = tree.addDescribeNode("_", () => {
    tree.addItNode("_", noop);
    tree.addDescribeNode("_", () => {
      tree.addItNode("_", noop);
    });
  });

  describeNode.skip();

  expect(unskippedNode.skipped).toBe(false);

  describeNode.children.forEach((child) => {
    expect(child.skipped).toBe(true);
    if (child instanceof DescribeNode && child.children.length > 0) {
      expect(child.children[0].skipped).toBe(true);
    }
  });
});

Deno.test("node.focus() skips non-focused siblings", () => {
  const tree = new Tree();
  const node = tree.addItNode("_", noop);
  const sibling = tree.addItNode("_", noop);
  node.focus();
  expect(sibling.skipped).toBe(true);
});

Deno.test("node.fail() sets the status to FAIL", () => {
  const rootNode = new RootNode();
  const describeNode = new DescribeNode("_", rootNode);
  rootNode.fail();
  describeNode.fail();
  expect(rootNode.result).toBe("FAIL");
  expect(describeNode.result).toBe("FAIL");
});

Deno.test("node.fail() on an ItNode sets the error to the given value", () => {
  const itNode = new ItNode("_", noop, new RootNode());
  const value = new Error();
  itNode.fail(value);
  expect(itNode.error).toBe(value);
});

Deno.test("node.fail() calls .fail() on the parent", () => {
  const parent = new RootNode();
  const itNode = new ItNode("_", noop, parent);
  const describeNode = new DescribeNode("_", parent);
  parent.fail = mock.fn();
  itNode.fail();
  describeNode.fail();
  expect(parent.fail).toHaveBeenCalledTimes(2);
});

Deno.test("node.start() on the root throws if there are no cases", () => {
  const rootNode = new RootNode();
  expect(rootNode.start).toThrow();

  rootNode.children.push(new ItNode("_", noop, rootNode));
  expect(() => {
    rootNode.start();
  }).not.toThrow();
});

Deno.test("node.start() sets the start time", () => {
  const rootNode = new RootNode();
  const itNode = new ItNode("_", noop, rootNode);
  rootNode.children.push(itNode);
  rootNode.start();
  itNode.start();
  expect(rootNode.startTime).not.toBe(0);
  expect(rootNode.startTime).not.toBe(0);
});

Deno.test("node.finish() sets the time taken", () => {
  const rootNode = new RootNode();
  const itNode = new ItNode("_", noop, rootNode);
  rootNode.finish();
  itNode.finish();
  expect(rootNode.timeTaken).not.toBe(0);
  expect(rootNode.timeTaken).not.toBe(0);
});
