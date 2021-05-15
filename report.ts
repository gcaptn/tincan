import { DescribeNode, ItNode, RootNode } from "./nodes.ts";
import {
  bold,
  gray,
  // green,
  // red,
} from "https://deno.land/std@0.95.0/fmt/colors.ts";

const log = console.log;

function getAncestry(node: DescribeNode | ItNode): DescribeNode[] {
  const ancestors: DescribeNode[] = [];
  let lastAncestor = node.parent;
  while (lastAncestor instanceof DescribeNode) {
    ancestors.push(lastAncestor);
    lastAncestor = lastAncestor.parent;
  }
  return ancestors.reverse();
}

export function getFullName(node: ItNode) {
  const hierarchy = getAncestry(node)
    .map((node: DescribeNode | ItNode) => gray(node.headline));
  hierarchy.push(bold(node.headline));
  return hierarchy.join(" > ");
}

// Deno.test's reporter cannot be silenced as of now
/* export function reportCase(node: ItNode) {
  const result = node.result === "PASS" ? green(node.result) : red(node.result);
  log(`${result} ${getFullName(node)} (${node.timeTaken} ms)\n`);
} */

function indent(depth: number) {
  return "  ".repeat(depth);
}

function formatNode(
  node: ItNode | DescribeNode | RootNode,
  depth = 1,
): string {
  let str = "";
  if (node instanceof ItNode) {
    str += gray(
      `${indent(depth)}•${node.skipped ? " [SKIP]" : ""} ${node.headline}\n`,
    );
  } else if (node instanceof DescribeNode) {
    str += `${indent(depth)}${node.skipped ? "[SKIP] " : ""}${node.headline}\n`;
    node.children.forEach((child) => str += formatNode(child, depth + 1));
  } else {
    str = "\n";
    node.children.forEach((child) => str += formatNode(child, depth));
  }
  return str;
}

export function reportStart(node: RootNode) {
  log(formatNode(node));
}

/* function getAllCases(node: RootNode | DescribeNode) {
  let nodes: ItNode[] = [];
  node.children.forEach((child) => {
    if (child instanceof ItNode) {
      nodes.push(child);
    } else {
      nodes = [...nodes, ...getAllCases(child)];
    }
  });
  return nodes;
} */

/* export function reportEnd(node: RootNode) {
  const cases = getAllCases(node);
  const failedCases = cases.filter((node) => node.result === "FAIL");
  const skippedCases = cases.filter((node) => node.skipped);

  console.log("");

  if (failedCases.length > 0) {
    console.log("Failures:\n");
    failedCases.forEach((failedCase) => {
      reportCase(failedCase);
      console.error(failedCase.error);
      console.log("");
    });
  }

  const result = node.result === "PASS" ? green(node.result) : red(node.result);
  console.log([
    `Result: ${result}`,
    `Cases: ` +
    `${cases.length - failedCases.length - skippedCases.length} passed, ` +
    `${failedCases.length} failed, ` +
    `${skippedCases.length} skipped, ` +
    `${cases.length} total ` +
    gray(`(${node.timeTaken} ms)`),
  ].join("\n"));
} */
