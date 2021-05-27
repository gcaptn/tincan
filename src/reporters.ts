import { DescribeNode, Hook, ItNode, RootNode } from "./nodes.ts";
import { colors } from "./deps.ts";

export type TestReporter = {
  reportStart: (node: RootNode) => void;
  reportEnd: (node: RootNode) => void;
  reportHookError: (hook: Hook, error: unknown) => void;
  reportCase: (node: ItNode) => void;
};

const log = console.log;
const logError = console.error;

function indent(depth: number) {
  return "  ".repeat(depth);
}

function formatNode(
  node: ItNode | DescribeNode | RootNode,
  depth = 1,
): string {
  let str = "";
  if (node instanceof ItNode) {
    str += colors.gray(
      `${indent(depth - 1)}•${
        node.skipped ? " [SKIP]" : ""
      } ${node.headline}\n`,
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

export class DenoReporter implements TestReporter {
  reportEnd() {}
  reportCase() {}

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
