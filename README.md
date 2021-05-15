<p align="center">
  <img src="./preview.png" align="center"/>
  <h1 align="center">tincan</h1>
</p>

<p align="center">A lightweight Jest-like testing library for Deno</p>

## Features

- Nested suites / cases
- Hooks (`beforeAll`, `afterAll`, `beforeEach`, `afterEach`)
- Focusing and skipping (`*.only()`, `*.skip()`)
- Uses `Deno.test`
- Lightweight

## Running

```sh
deno test
```

## Usage

```ts
import {
  beforeEach,
  describe,
  expect,
  it,
  run,
} from "https://deno.land/x/tincan/mod.ts";

describe("Array", () => {
  let array: number[];

  beforeEach(() => {
    array = [];
  });

  describe("#indexOf", () => {
    it("should return -1 when the item isn't found", () => {
      expect(array.indexOf(0)).toBe(-1);
    });

    it("should return the index of the item", () => {
      array.push(0);
      expect(array.indexOf(0)).toBe(0);
    });
  });
});

run();
```
