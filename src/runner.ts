import { DescribeNode, Hook, RootNode } from "./nodes/mod.ts";
import { colors } from "./deps.ts";

export type TestStepFunction = (definition: {
  fn: ((t: { step: TestStepFunction }) => Promise<void> | void);
  name: string;
  ignore?: boolean;
  // sanitizeOps?: boolean;
  // sanitizeResources?: boolean;
  // sanitizeExit?: boolean;
}) => // Deno's step function returns a Promise<boolean> when
// the only parameter is a TestStepDefinition
unknown;

export async function runHook(hook: Hook) {
  try {
    await hook.fn();
  } catch (e) {
    console.log(`\n${colors.red("ERROR")} in ${hook.type} hook:`);
    if (hook.type === "internal") {
      console.log(
        "This is probably a bug. Please file an issue if you see this message.",
      );
    }
    console.error(e);
  }
}

export async function recursiveRun(
  node: DescribeNode | RootNode,
  inheritedBeforeEachHooks: Hook[],
  inheritedAfterEachHooks: Hook[],
  stepFunction: TestStepFunction,
) {
  for (const hook of node.beforeAll) {
    console.log("beforeall", hook.type, node.constructor.name);
    await runHook(hook);
  }

  for (const child of node.children) {
    await stepFunction({
      name: child.headline,
      ignore: child.skipped,
      fn: async (t) => {
        if (child instanceof DescribeNode) {
          await recursiveRun(
            child,
            [...inheritedBeforeEachHooks, ...node.beforeEach],
            [...node.afterEach, ...inheritedAfterEachHooks],
            t.step,
          );
        } else {
          for (const hook of inheritedBeforeEachHooks) {
            await runHook(hook);
          }

          for (const hook of node.beforeEach) {
            await runHook(hook);
          }

          let didThrow = false;
          let err: unknown;
          try {
            await child.fn();
          } catch (e) {
            didThrow = true;
            err = e;
          }

          for (const hook of node.afterEach) {
            await runHook(hook);
          }

          for (const hook of inheritedAfterEachHooks) {
            await runHook(hook);
          }

          if (didThrow) throw err;
        }
      },
    });
  }

  for (const hook of node.afterAll) {
    await runHook(hook);
  }
}
