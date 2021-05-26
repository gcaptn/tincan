import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  run,
} from "../src/mod.ts";
import { expect, mock } from "https://deno.land/x/expect@v0.2.6/mod.ts";

function noop() {}

describe("test", () => {
  it("should wait for promises", () => {
    return new Promise((resolve) => setTimeout(resolve, 20));
  });

  it("should refuse to add hooks within a case", () => {
    expect(() => {
      beforeAll(noop);
    }).toThrow();

    expect(() => {
      beforeEach(noop);
    }).toThrow();

    expect(() => {
      afterEach(noop);
    }).toThrow();

    expect(() => {
      afterAll(noop);
    }).toThrow();
  });

  it("should refuse to add nodes within a case", () => {
    expect(() => {
      describe("_", noop);
    }).toThrow();

    expect(() => {
      it("_", noop);
    }).toThrow();
  });

  it.skip("should log a pretty output for failing cases", () => {
    throw new Error("error");
  });

  describe("skip", () => {
    it.skip("should not run skipped tests", () => {
      throw new Error("this should not run");
    });

    describe.skip("skipped suites", () => {
      it("should mark its children as skipped", () => {
        throw new Error("this should not run");
      });
    });

    it("_", noop);
  });

  describe("only", () => {
    it.only("should only run focused nodes", noop);

    it("should mark everything else as skipped", () => {
      throw new Error("this should not run");
    });

    describe.only("focused suites", () => {
      const caseFn = mock.fn();

      it("_", caseFn);

      it("should run cases inside", () => {
        expect(caseFn).toHaveBeenCalled();
      });
    });

    describe.only("focused nested cases", () => {
      it("should not run other cases", () => {
        throw new Error("this should not run");
      });

      const caseFn = mock.fn();

      it.only("_", caseFn);

      it.only("should run focused cases", () => {
        expect(caseFn).toHaveBeenCalled();
      });
    });
  });

  describe("hooks", () => {
    describe("hook errors", () => {
      beforeAll(() => {
        throw new Error("hook error");
      });
      it("should catch and report hook errors", noop);
    });
  });
});

run();

expect(() => {
  it("should support running run() more than once", noop);
}).not.toThrow();

expect(run).not.toThrow();
