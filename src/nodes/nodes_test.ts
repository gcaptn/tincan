/*

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

import { expect, mock } from "../deps.ts";
import { DescribeNode, ItNode, RootNode } from "./nodes.ts";

function noop() {}

function addItNode(parent: DescribeNode | RootNode) {
  const node = new ItNode("_", noop, parent);
  parent.children.push(node);
  return node;
}

function addDescribeNode(parent: DescribeNode | RootNode) {
  const node = new DescribeNode("_", parent);
  parent.children.push(node);
  return node;
}

Deno.test("node.skip() skips all of its children", () => {
  const root = new RootNode();
  const unskippedNode = addItNode(root);
  const describeNode = addDescribeNode(root);

  const childIt = addItNode(describeNode);
  const childDescribe = addDescribeNode(describeNode);

  const nestedChildIt = addItNode(childDescribe);

  describeNode.skip();

  expect(unskippedNode.skipped).toBe(false);
  expect(childIt.skipped).toBe(true);
  expect(childDescribe.skipped).toBe(true);
  expect(nestedChildIt.skipped).toBe(true);
});

Deno.test("node.focus() skips non-focused siblings", () => {
  const root = new RootNode();
  const node = addItNode(root);
  const sibling = addItNode(root);
  node.focus();
  expect(sibling.skipped).toBe(true);
});

Deno.test("node.fail() sets the status to FAIL", () => {
  const root = new RootNode();
  root.fail();
  expect(root.result).toBe("FAIL");

  const describeNode = addDescribeNode(root);
  describeNode.fail();
  expect(describeNode.result).toBe("FAIL");
});

Deno.test("node.fail() on an ItNode sets the error to the given value", () => {
  const itNode = addItNode(new RootNode());
  const value = new Error();
  itNode.fail(value);
  expect(itNode.error).toBe(value);
});

Deno.test("node.fail() calls .fail() on the parent", () => {
  const parent = new RootNode();
  const itNode = addItNode(parent);
  const describeNode = addDescribeNode(parent);

  parent.fail = mock.fn();
  itNode.fail();
  describeNode.fail();

  expect(parent.fail).toHaveBeenCalledTimes(2);
});

Deno.test("node.start() on the root throws if there are no cases", () => {
  const rootNode = new RootNode();
  expect(rootNode.start).toThrow();

  addItNode(rootNode);
  expect(() => {
    rootNode.start();
  }).not.toThrow();
});

Deno.test("node.start() sets the start time", () => {
  const rootNode = new RootNode();
  const itNode = addItNode(rootNode);

  rootNode.start();
  expect(rootNode.startTime).not.toBe(0);

  itNode.start();
  expect(itNode.startTime).not.toBe(0);
});

Deno.test("node.finish() sets the time taken", () => {
  const rootNode = new RootNode();
  const itNode = addItNode(rootNode);

  rootNode.finish();
  expect(rootNode.timeTaken).not.toBe(0);

  itNode.finish();
  expect(itNode.timeTaken).not.toBe(0);
});
