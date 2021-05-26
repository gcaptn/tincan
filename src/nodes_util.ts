import { DescribeNode, ItNode, RootNode } from "./nodes.ts";
import { bold, gray } from "https://deno.land/std@0.95.0/fmt/colors.ts";

type FindChildResult = ItNode | DescribeNode | undefined;

function findChildWithCase(
  children: (ItNode | DescribeNode)[],
  recursiveSearch: (node: (DescribeNode | RootNode)) => FindChildResult,
): FindChildResult {
  for (const child of children) {
    if (
      child.skipped === false &&
      (child instanceof ItNode || recursiveSearch(child as DescribeNode))
    ) {
      return child;
    }
  }
}

// used by the runner to find the child that runs the beforeAll / afterAll hooks

export function findChildWithFirstCase(
  node: DescribeNode | RootNode,
): FindChildResult {
  return findChildWithCase(node.children, findChildWithFirstCase);
}

export function findChildWithLastCase(
  node: DescribeNode | RootNode,
): FindChildResult {
  return findChildWithCase([...node.children].reverse(), findChildWithLastCase);
}

export function getAncestry(node: DescribeNode | ItNode): DescribeNode[] {
  const ancestors: DescribeNode[] = [];
  let lastAncestor = node.parent;
  while (lastAncestor instanceof DescribeNode) {
    ancestors.push(lastAncestor);
    lastAncestor = lastAncestor.parent;
  }
  return ancestors.reverse();
}

export function getFullCaseName(node: ItNode) {
  const hierarchy = getAncestry(node)
    .map((node: DescribeNode | ItNode) => gray(node.headline));
  hierarchy.push(bold(node.headline));
  return hierarchy.join(" > ");
}

export function getAllCases(node: RootNode | DescribeNode) {
  let nodes: ItNode[] = [];
  node.children.forEach((child) => {
    if (child instanceof ItNode) {
      nodes.push(child);
    } else {
      nodes = [...nodes, ...getAllCases(child)];
    }
  });
  return nodes;
}