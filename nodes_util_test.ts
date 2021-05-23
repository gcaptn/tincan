/*

getAncestry
  returns a node's describe ancestors starting from the highest

findChildWithFirstCase
  finds the child that will run the first case

findChildWithLastCase
  finds the child that will run the last case

*/

import { DescribeNode, Environment, ItNode, RootNode } from "./nodes.ts";
import {
  findChildWithFirstCase,
  findChildWithLastCase,
  getAncestry,
} from "./nodes_util.ts";
import { expect } from "https://deno.land/x/expect@v0.2.6/mod.ts";

function noop() {}

Deno.test("getAncestry returns a node's describe ancestors starting from the highest", () => {
  const firstNode = new DescribeNode("_", new RootNode());
  const secondNode = new DescribeNode("_", firstNode);
  expect(getAncestry(new ItNode("_", noop, secondNode))).toEqual([
    firstNode,
    secondNode,
  ]);
});

function findChildEnv() {
  const env = new Environment();

  env.describeSkip("_", () => {
    env.it("_", noop);
  });

  const first = env.addDescribeNode("_", () => {
    env.it("_", noop);
  });

  const last = env.addDescribeNode("_", () => {
    env.itSkip("_", noop);
    env.it("_", noop);
  });

  return { env, first, last };
}

Deno.test("findChildWithFirstCase finds the child that will run the first case", () => {
  const { env, first } = findChildEnv();
  expect(findChildWithFirstCase(env.root)).toBe(first);
});

Deno.test("findChildWithLastCase finds the child that will run the first case", () => {
  const { env, last } = findChildEnv();
  expect(findChildWithLastCase(env.root)).toBe(last);
});
