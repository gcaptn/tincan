<p align="center">
  <img src="./preview.png" width="80%" align="center"/>
  <h1 align="center">tincan</h1>
</p>

<p align="center">A lightweight Jest-like testing library for Deno</p>

<p align="center">
    <a href="https://github.com/gcaptn/tincan/actions/"><img alt="ci" src="https://img.shields.io/github/workflow/status/gcaptn/tincan/ci?label=ci" /></a>
    <img src="https://shields.io/github/v/tag/gcaptn/tincan" />
    <a href="https://www.codefactor.io/repository/github/gcaptn/tincan/"><img alt="CodeFactor" src="https://www.codefactor.io/repository/github/gcaptn/tincan/badge" /></a>
    <a href="https://deno.land/x/tincan"><img alt="deno.land/x" src="http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno&labelColor=black" /></a>
</p>

## Features

- Nested suites / cases
- Reports cases with the full hierarchy
- Hooks (`beforeAll`, `afterAll`, `beforeEach`, `afterEach`)
- Focusing (`*.only()`)
- Skipping (`*.skip()`)
- Uses `Deno.test`, works with the built-in reporter
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
    it.only("should return -1 when the item isn't found", () => {
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

