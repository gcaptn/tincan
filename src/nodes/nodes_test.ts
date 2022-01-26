/*

node.skip()
  skips all of its children

node.focus()
  calls updateFocusedChildren on the parent

node.updateFocusedChildren()
  skips non-focused children

*/

import { expect, mock } from "../deps.ts";
import { DescribeNode, RootNode } from "./nodes.ts";
import { addDescribeNode, addItNode } from "../test_util.ts";

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

Deno.test("node.focus() calls updateFocusedChildren on the parent", () => {
  const root = new RootNode();
  root.updateFocusedChildren = mock.fn();
  const node = addItNode(root);
  node.focus();
  expect(root.updateFocusedChildren).toHaveBeenCalled();
});

Deno.test("node.updateFocusedChildren() skips non-focused children", () => {
  function updateFocusedChildrenTest(node: DescribeNode | RootNode) {
    const child = addItNode(node);
    const notFocusedChild = addItNode(node);
    child.focused = true;
    node.updateFocusedChildren();
    expect(notFocusedChild.skipped).toBe(true);
  }

  updateFocusedChildrenTest(new RootNode());
  updateFocusedChildrenTest(addDescribeNode(new RootNode()));
});
