/*

describe()
  's function is called on construction

addDescribeNode or addItNode
  adds to the current parent

DescribeNode
  inherits the parent's Each hooks

describe() or it() skips itself if it has a focused sibling
calling a hook creator adds a hook to the current parent
calling a hook or creating a node inside it() throws

it()
  's function is not called on construction

node.skip()
  skips all of its children

node.focus()
  skips non-focused siblings

*/

import { expect } from "https://deno.land/x/expect@v0.2.6/mod.ts";
import { DescribeNode, Environment, Hook, ItNode, RootNode } from "./nodes.ts";

const noop = () => {};

Deno.test("describe()'s function is called on construction", () => {
  const env = new Environment();
  let called = false;
  env.describe("_", () => {
    called = true;
  });
  expect(called).toBe(true);
});

Deno.test("it()'s function is not called on construction", () => {
  const env = new Environment();
  let called = false;
  env.it("_", () => {
    called = true;
  });
  expect(called).toBe(false);
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

Deno.test("DescribeNode inherits the parent's Each hooks", () => {
  const beforeHook = new Hook("beforeEach", noop);
  const afterHook = new Hook("afterEach", noop);
  const parentNode = new RootNode();
  parentNode.beforeEach.push(beforeHook);
  parentNode.afterEach.push(afterHook);
  const describeNode = new DescribeNode("_", parentNode);
  expect(describeNode.beforeEach).toContain(beforeHook);
  expect(describeNode.afterEach).toContain(afterHook);
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
