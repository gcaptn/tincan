/*

describe()
  's function is called on construction

addDescribeNode or addItNode
  adds to the current parent

describe() or it()
  skips itself if it has a focused sibling
  throws when the headline is empty

calling a hook creator adds a hook to the current parent
calling a hook or creating a node inside it() throws

it()
  's function is not called on construction

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

import { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";
import { DescribeNode, Environment, ItNode, RootNode } from "./nodes.ts";

const noop = () => {};

Deno.test("describe()'s function is called on construction", () => {
  const env = new Environment();
  const fn = mock.fn();
  env.describe("_", fn);
  expect(fn).toHaveBeenCalled();
});

Deno.test("it()'s function is not called on construction", () => {
  const env = new Environment();
  const fn = mock.fn();
  env.it("_", fn);
  expect(fn).not.toHaveBeenCalled();
});

Deno.test("addDescribeNode or addItNode adds to the current parent's children", () => {
  const env = new Environment();
  let describeNode, itNode;

  const parentNode = env.addDescribeNode("_", () => {
    describeNode = env.addDescribeNode("_", noop);
    itNode = env.addItNode("_", noop);
  });

  expect(parentNode.children).toContain(describeNode);
  expect(parentNode.children).toContain(itNode);
});

Deno.test("describe() or it() throws when the headline is empty", () => {
  const env = new Environment();

  expect(() => {
    env.describe("", noop);
  }).toThrow();

  expect(() => {
    env.describe("   ", noop);
  }).toThrow();

  expect(() => {
    env.it("", noop);
  }).toThrow();

  expect(() => {
    env.it("   ", noop);
  }).toThrow();

  expect(() => {
    env.describe(" _ ", noop);
  }).not.toThrow();

  expect(() => {
    env.it(" _ ", noop);
  }).not.toThrow();
});

Deno.test("describe() or it() skips itself if it has a focused sibling", () => {
  const env = new Environment();
  let focused: ItNode;
  const parentNode = env.addDescribeNode("_", () => {
    focused = env.addItNode("_", noop);
    focused.focus();
    env.describe("_", noop);
    env.it("_", noop);
  });

  parentNode.children.forEach((child) => {
    if (child !== focused) {
      expect(child.skipped).toBe(true);
    }
  });
});

Deno.test("calling a hook creator adds a hook to the current parent", () => {
  const env = new Environment();
  const parentNode = env.addDescribeNode("_", () => {
    env.beforeAll(noop);
    env.beforeEach(noop);
    env.afterEach(noop);
    env.afterAll(noop);
  });
  expect(parentNode.beforeAll.length).toBe(1);
  expect(parentNode.beforeEach.length).toBe(1);
  expect(parentNode.afterEach.length).toBe(1);
  expect(parentNode.afterAll.length).toBe(1);
});

Deno.test("calling a hook or creating a node inside it() throws", () => {
  const env = new Environment();
  const itNode = env.addItNode("_", () => {
    env.beforeAll(noop);
    env.beforeEach(noop);
    env.afterEach(noop);
    env.afterAll(noop);
    env.describe("_", noop);
  });
  env.root.isRunning = true;
  expect(itNode.fn).toThrow();
});

Deno.test("node.skip() skips all of its children", () => {
  const env = new Environment();
  const unskippedNode = env.addDescribeNode("_", noop);
  const describeNode = env.addDescribeNode("_", () => {
    env.addItNode("_", noop);
    env.addDescribeNode("_", () => {
      env.addItNode("_", noop);
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
  const env = new Environment();
  const node = env.addItNode("_", noop);
  const sibling = env.addItNode("_", noop);
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
  const describeNode = new ItNode("_", noop, parent);
  parent.fail = mock.fn();
  itNode.fail();
  describeNode.fail();
  expect(parent.fail).toHaveBeenCalledTimes(2);
});

Deno.test("node.start() sets the start time", () => {
  const rootNode = new RootNode();
  const itNode = new ItNode("_", noop, rootNode);
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
