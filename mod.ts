import { runNode } from "./runner.ts";
import { root } from "./nodes.ts";

export async function run() {
  const success = await runNode(root);
  if (!success) {
    Deno.exit(1);
  }
}

export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "./nodes.ts";

export * from "https://deno.land/x/expect/mod.ts";
