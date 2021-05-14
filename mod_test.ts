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
    return new Promise((resolve) => setTimeout(resolve, 100));
  });

  it.skip("should log a pretty output for failing cases", () => {
    throw new Error("error");
  });

  it.skip("should not run skipped tests", () => {
    throw new Error("this should not run");
  });

  describe.skip("skipped suites", () => {
    it("should mark its children as skipped", () => {
      throw new Error("this should not run");
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
});

const hooksOrder: string[] = [];

describe.only("hooks execution", () => {
  beforeAll(() => {
    hooksOrder.push("1 - beforeAll");
  });
  beforeEach(() => {
    hooksOrder.push("1 - beforeEach");
  });
  afterEach(() => {
    hooksOrder.push("1 - afterEach");
  });
  afterAll(() => {
    hooksOrder.push("1 - afterAll");
  });
  it("a", () => {
    hooksOrder.push("1 - it");
  });

  describe("nested describe", () => {
    beforeAll(() => {
      hooksOrder.push("2 - beforeAll");
    });
    beforeEach(() => {
      hooksOrder.push("2 - beforeEach");
    });
    afterEach(() => {
      hooksOrder.push("2 - afterEach");
    });
    afterAll(() => {
      hooksOrder.push("2 - afterAll");
    });
    it("a", () => {
      hooksOrder.push("2 - it");
    });
  });
});

describe("hooks", () => {
  it("executes in the correct order", () => {
    expect(hooksOrder).toEqual([
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

run();
