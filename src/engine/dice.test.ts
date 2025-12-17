/**
 * Unit tests for dice rolling utilities
 */

import { describe, expect, it } from "vitest";
import {
  isSuccess,
  parseDiceExpression,
  rollD3,
  rollD6,
  shouldReroll,
} from "./dice";

describe("rollD6", () => {
  it("should return a number between 1 and 6", () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD6();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it("should produce all possible values over many rolls", () => {
    const results = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      results.add(rollD6());
    }
    // With 1000 rolls, we should see all 6 values
    expect(results.size).toBe(6);
  });
});

describe("rollD3", () => {
  it("should return a number between 1 and 3", () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD3();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(3);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it("should produce all possible values over many rolls", () => {
    const results = new Set<number>();
    for (let i = 0; i < 500; i++) {
      results.add(rollD3());
    }
    expect(results.size).toBe(3);
  });
});

describe("parseDiceExpression", () => {
  it("should return a number when given a number", () => {
    expect(parseDiceExpression(10)).toBe(10);
    expect(parseDiceExpression(0)).toBe(0);
    expect(parseDiceExpression(100)).toBe(100);
  });

  it("should parse plain number strings", () => {
    expect(parseDiceExpression("10")).toBe(10);
    expect(parseDiceExpression("5")).toBe(5);
    expect(parseDiceExpression("0")).toBe(0);
  });

  it("should parse d6 expressions", () => {
    for (let i = 0; i < 50; i++) {
      const result = parseDiceExpression("d6");
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it("should parse d3 expressions", () => {
    for (let i = 0; i < 50; i++) {
      const result = parseDiceExpression("d3");
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(3);
    }
  });

  it("should parse 2d6 expressions", () => {
    for (let i = 0; i < 50; i++) {
      const result = parseDiceExpression("2d6");
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    }
  });

  it("should parse expressions with positive modifiers", () => {
    for (let i = 0; i < 50; i++) {
      const result = parseDiceExpression("d6+3");
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(9);
    }
  });

  it("should parse expressions with negative modifiers", () => {
    for (let i = 0; i < 50; i++) {
      const result = parseDiceExpression("2d6-2");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it("should parse complex expressions", () => {
    for (let i = 0; i < 50; i++) {
      const result = parseDiceExpression("3d3+1");
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it("should handle whitespace", () => {
    expect(() => parseDiceExpression("  d6  ")).not.toThrow();
    expect(() => parseDiceExpression("2d6+3")).not.toThrow();
  });

  it("should throw on invalid expressions", () => {
    expect(() => parseDiceExpression("invalid")).toThrow();
    expect(() => parseDiceExpression("d8")).toThrow(); // Only d3 and d6 supported
    expect(() => parseDiceExpression("2d10")).toThrow();
    expect(() => parseDiceExpression("abc")).toThrow();
  });
});

describe("shouldReroll", () => {
  describe("reroll none", () => {
    it("should never reroll", () => {
      expect(shouldReroll(1, 4, "none")).toBe(false);
      expect(shouldReroll(6, 4, "none")).toBe(false);
      expect(shouldReroll(3, 4, "none")).toBe(false);
    });
  });

  describe("reroll 1s", () => {
    it("should only reroll 1s", () => {
      expect(shouldReroll(1, 4, "1s")).toBe(true);
      expect(shouldReroll(2, 4, "1s")).toBe(false);
      expect(shouldReroll(3, 4, "1s")).toBe(false);
      expect(shouldReroll(4, 4, "1s")).toBe(false);
      expect(shouldReroll(5, 4, "1s")).toBe(false);
      expect(shouldReroll(6, 4, "1s")).toBe(false);
    });
  });

  describe("reroll fails", () => {
    it("should reroll failed rolls", () => {
      expect(shouldReroll(1, 4, "fails")).toBe(true);
      expect(shouldReroll(2, 4, "fails")).toBe(true);
      expect(shouldReroll(3, 4, "fails")).toBe(true);
      expect(shouldReroll(4, 4, "fails")).toBe(false);
      expect(shouldReroll(5, 4, "fails")).toBe(false);
      expect(shouldReroll(6, 4, "fails")).toBe(false);
    });

    it("should work with different target numbers", () => {
      expect(shouldReroll(3, 3, "fails")).toBe(false);
      expect(shouldReroll(2, 3, "fails")).toBe(true);
      expect(shouldReroll(5, 6, "fails")).toBe(true);
      expect(shouldReroll(6, 6, "fails")).toBe(false);
    });
  });

  describe("reroll successes", () => {
    it("should reroll successful rolls", () => {
      expect(shouldReroll(1, 4, "successes")).toBe(false);
      expect(shouldReroll(2, 4, "successes")).toBe(false);
      expect(shouldReroll(3, 4, "successes")).toBe(false);
      expect(shouldReroll(4, 4, "successes")).toBe(true);
      expect(shouldReroll(5, 4, "successes")).toBe(true);
      expect(shouldReroll(6, 4, "successes")).toBe(true);
    });
  });

  describe("auto and none targets", () => {
    it("should handle auto-success targets", () => {
      expect(shouldReroll(3, "auto", "fails")).toBe(false);
      expect(shouldReroll(3, "auto", "successes")).toBe(true);
      expect(shouldReroll(3, "auto", "none")).toBe(false);
    });

    it("should handle auto-fail targets", () => {
      expect(shouldReroll(3, "none", "fails")).toBe(true);
      expect(shouldReroll(3, "none", "successes")).toBe(false);
      expect(shouldReroll(3, "none", "none")).toBe(false);
    });
  });
});

describe("isSuccess", () => {
  it("should check if roll meets or exceeds target", () => {
    expect(isSuccess(4, 4)).toBe(true);
    expect(isSuccess(5, 4)).toBe(true);
    expect(isSuccess(6, 4)).toBe(true);
    expect(isSuccess(3, 4)).toBe(false);
    expect(isSuccess(2, 4)).toBe(false);
    expect(isSuccess(1, 4)).toBe(false);
  });

  it("should handle auto-success", () => {
    expect(isSuccess(1, "auto")).toBe(true);
    expect(isSuccess(6, "auto")).toBe(true);
  });

  it("should handle auto-fail", () => {
    expect(isSuccess(1, "none")).toBe(false);
    expect(isSuccess(6, "none")).toBe(false);
  });

  it("should work with all target numbers", () => {
    expect(isSuccess(2, 2)).toBe(true);
    expect(isSuccess(1, 2)).toBe(false);
    expect(isSuccess(6, 6)).toBe(true);
    expect(isSuccess(5, 6)).toBe(false);
  });
});
