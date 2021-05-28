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

*/

import { Tree } from "./tree.ts";
import { ItNode } from "./nodes.ts";
import { expect, mock } from "../deps.ts";

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
