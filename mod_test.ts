import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  run,
} from "./mod.ts";

describe("test", () => {
  it("should wait for promises", () => {
    return new Promise((resolve) => setTimeout(resolve, 20));
  });

  it("should refuse to add hooks within a case", () => {
    expect(() => {
      beforeAll(() => {});
    }).toThrow();
  });

  it("should refuse to add nodes within a case", () => {
    expect(() => {
      describe("_", () => {});
    }).toThrow();

    expect(() => {
      it("_", () => {});
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
  });

  describe("only", () => {
    it.only("should only run focused nodes", () => {});

    it("should mark everything else as skipped", () => {
      throw new Error("this should not run");
    });

    describe.only("focused suites", () => {
      it("should run cases inside", () => {});
    });

    describe.only("focused nested cases", () => {
      it("should not run other cases", () => {
        throw new Error("this should not run");
      });

      it.only("should focused cases", () => {});
    });
  });

  describe("hooks", () => {
    describe("hook errors", () => {
      beforeAll(() => {
        throw new Error("hook error");
      });

      it("should catch and report hook errors", () => {});
    });

    const order: string[] = [];

    describe("hooks execution order", () => {
      beforeAll(() => {
        order.push("1 - beforeAll");
      });
      beforeEach(() => {
        order.push("1 - beforeEach");
      });
      afterEach(() => {
        order.push("1 - afterEach");
      });
      afterAll(() => {
        order.push("1 - afterAll");
      });
      it("__", () => {
        order.push("1 - it");
      });

      describe("nested describe", () => {
        beforeAll(() => {
          order.push("2 - beforeAll");
        });
        beforeEach(() => {
          order.push("2 - beforeEach");
        });
        afterEach(() => {
          order.push("2 - afterEach");
        });
        afterAll(() => {
          order.push("2 - afterAll");
        });
        it("__", () => {
          order.push("2 - it");
        });
      });
    });

    it("should execute in the correct order", () => {
      expect(order).toEqual([
        "1 - beforeAll",
        "1 - beforeEach",
        "1 - it",
        "1 - afterEach",
        "2 - beforeAll",
        "1 - beforeEach",
        "2 - beforeEach",
        "2 - it",
        "2 - afterEach",
        "1 - afterEach",
        "2 - afterAll",
        "1 - afterAll",
      ]);
    });
  });
});

run();
