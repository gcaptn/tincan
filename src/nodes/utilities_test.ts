/*

getAncestry
  returns a node's describe ancestors starting from the highest

findChildWithFirstCase
  finds the child that will run the first case

findChildWithLastCase
  finds the child that will run the last case

getAllCases
  gets every ItNode descendant in order of execution

*/

import { expect } from "expect";
import { RootNode } from "./nodes.ts";
import { Tree } from "./tree.ts";
import { addDescribeNode, addItNode } from "../test_util.ts";
import {
  findChildWithFirstCase,
  findChildWithLastCase,
  getAllCases,
  getAncestry,
} from "./utilities.ts";

function noop() {}

Deno.test("getAncestry returns a node's describe ancestors starting from the highest", () => {
  const firstNode = addDescribeNode(new RootNode());
  const secondNode = addDescribeNode(firstNode);
  expect(getAncestry(addItNode(secondNode))).toEqual([
    firstNode,
    secondNode,
  ]);
});

function findChildEnv() {
  const tree = new Tree();

  tree.describeSkip("_", () => {
    tree.it("_", noop);
  });

  const first = tree.addDescribeNode("_", () => {
    tree.it("_", noop);
  });

  const last = tree.addDescribeNode("_", () => {
    tree.itSkip("_", noop);
    tree.it("_", noop);
  });

  return { tree, first, last };
}

Deno.test("findChildWithFirstCase finds the child that will run the first case", () => {
  const { tree, first } = findChildEnv();
  expect(findChildWithFirstCase(tree.root)).toBe(first);
});

Deno.test("findChildWithLastCase finds the child that will run the first case", () => {
  const { tree, last } = findChildEnv();
  expect(findChildWithLastCase(tree.root)).toBe(last);
});

Deno.test("getAllCases gets every ItNode descendant in order of execution", () => {
  const root = new RootNode();

  const firstIt = addItNode(root);
  const firstDescribe = addDescribeNode(root);
  const secondIt = addItNode(firstDescribe);
  const secondDescribe = addDescribeNode(firstDescribe);
  // thirdIt, although nested will run first because
  // its parent describe node comes before foruthIt
  const thirdIt = addItNode(secondDescribe);
  const fourthIt = addItNode(firstDescribe);

  expect(getAllCases(root)).toEqual([firstIt, secondIt, thirdIt, fourthIt]);
});
