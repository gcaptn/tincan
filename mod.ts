import { runNode } from "./runner.ts";
import { root } from "./nodes.ts";

export function run() {
  runNode(root);
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
