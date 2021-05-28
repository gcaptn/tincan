import { colors } from "./deps.ts";
import {
  DescribeNode,
  getAncestry,
  Hook,
  ItNode,
  RootNode,
} from "./nodes/mod.ts";

export type TestReporter = {
  reportStart: (node: RootNode) => void;
  reportHookError: (hook: Hook, error: unknown) => void;
  getTestCaseName: (node: ItNode) => string;
};

const log = console.log;
const logError = console.error;

function indent(depth: number) {
  return "  ".repeat(depth);
}

function skipTag(isSkipped: boolean) {
  return isSkipped ? colors.yellow(" [SKIP]") : "";
}

function formatNode(
  node: ItNode | DescribeNode | RootNode,
  depth = 1,
): string {
  let str = "";
  if (node instanceof ItNode) {
    str += colors.gray(
      `${indent(depth - 1)}• ${node.headline}${skipTag(node.skipped)}\n`,
    );
  } else if (node instanceof DescribeNode) {
    str += `${indent(depth)}${node.headline}${skipTag(node.skipped)}\n`;
    node.children.forEach((child) => str += formatNode(child, depth + 1));
  } else {
    str = "\n";
    node.children.forEach((child) => str += formatNode(child, depth));
  }
  return str;
}

export class Reporter implements TestReporter {
  getTestCaseName(node: ItNode) {
    const hierarchy = getAncestry(node)
      .map((node: DescribeNode | ItNode) => colors.gray(node.headline));
    hierarchy.push(colors.bold(node.headline));
    return "\b".repeat(5) + hierarchy.join(" > ");
  }

  reportStart(node: RootNode) {
    log(formatNode(node));
  }

  reportHookError(hook: Hook, error: unknown) {
    log(`\n${colors.red("ERROR")} in ${hook.type} hook:`);
    if (hook.type === "internal") {
      log(
        "This is probably a bug. Please file an issue if you see this message.",
      );
    }
    logError(error);
  }
}
