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
  shouldRerollSplit,
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

describe("shouldRerollSplit", () => {
  describe("both none", () => {
    it("should never reroll when both are none", () => {
      expect(shouldRerollSplit(1, 4, "none", "none")).toBe(false);
      expect(shouldRerollSplit(6, 4, "none", "none")).toBe(false);
      expect(shouldRerollSplit(3, 4, "none", "none")).toBe(false);
      expect(shouldRerollSplit(4, 4, "none", "none")).toBe(false);
    });
  });

  describe("failure rerolls only", () => {
    it("should reroll 1s when failure reroll is 1s", () => {
      expect(shouldRerollSplit(1, 4, "1s", "none")).toBe(true);
      expect(shouldRerollSplit(2, 4, "1s", "none")).toBe(false);
      expect(shouldRerollSplit(3, 4, "1s", "none")).toBe(false);
      expect(shouldRerollSplit(4, 4, "1s", "none")).toBe(false); // success, not 1
      expect(shouldRerollSplit(6, 4, "1s", "none")).toBe(false); // success, not 1
    });

    it("should reroll all fails when failure reroll is all", () => {
      expect(shouldRerollSplit(1, 4, "all", "none")).toBe(true);
      expect(shouldRerollSplit(2, 4, "all", "none")).toBe(true);
      expect(shouldRerollSplit(3, 4, "all", "none")).toBe(true);
      expect(shouldRerollSplit(4, 4, "all", "none")).toBe(false); // success
      expect(shouldRerollSplit(5, 4, "all", "none")).toBe(false); // success
      expect(shouldRerollSplit(6, 4, "all", "none")).toBe(false); // success
    });
  });

  describe("success rerolls only", () => {
    it("should reroll 6s when success reroll is 6s", () => {
      expect(shouldRerollSplit(1, 4, "none", "6s")).toBe(false); // fail, not 6
      expect(shouldRerollSplit(4, 4, "none", "6s")).toBe(false); // success but not 6
      expect(shouldRerollSplit(5, 4, "none", "6s")).toBe(false); // success but not 6
      expect(shouldRerollSplit(6, 4, "none", "6s")).toBe(true);  // success and 6
    });

    it("should reroll all successes when success reroll is all", () => {
      expect(shouldRerollSplit(1, 4, "none", "all")).toBe(false); // fail
      expect(shouldRerollSplit(2, 4, "none", "all")).toBe(false); // fail
      expect(shouldRerollSplit(3, 4, "none", "all")).toBe(false); // fail
      expect(shouldRerollSplit(4, 4, "none", "all")).toBe(true);  // success
      expect(shouldRerollSplit(5, 4, "none", "all")).toBe(true);  // success
      expect(shouldRerollSplit(6, 4, "none", "all")).toBe(true);  // success
    });
  });

  describe("combined rerolls", () => {
    it("should reroll both 1s and 6s when both are set", () => {
      expect(shouldRerollSplit(1, 4, "1s", "6s")).toBe(true);  // 1 is a fail
      expect(shouldRerollSplit(2, 4, "1s", "6s")).toBe(false); // fail but not 1
      expect(shouldRerollSplit(4, 4, "1s", "6s")).toBe(false); // success but not 6
      expect(shouldRerollSplit(6, 4, "1s", "6s")).toBe(true);  // 6 is a success
    });

    it("should reroll all dice when both are all", () => {
      expect(shouldRerollSplit(1, 4, "all", "all")).toBe(true);  // fail -> reroll
      expect(shouldRerollSplit(2, 4, "all", "all")).toBe(true);  // fail -> reroll
      expect(shouldRerollSplit(3, 4, "all", "all")).toBe(true);  // fail -> reroll
      expect(shouldRerollSplit(4, 4, "all", "all")).toBe(true);  // success -> reroll
      expect(shouldRerollSplit(5, 4, "all", "all")).toBe(true);  // success -> reroll
      expect(shouldRerollSplit(6, 4, "all", "all")).toBe(true);  // success -> reroll
    });

    it("should handle reroll fails and 6s together", () => {
      expect(shouldRerollSplit(1, 4, "all", "6s")).toBe(true);  // fail -> reroll
      expect(shouldRerollSplit(3, 4, "all", "6s")).toBe(true);  // fail -> reroll
      expect(shouldRerollSplit(4, 4, "all", "6s")).toBe(false); // success but not 6
      expect(shouldRerollSplit(6, 4, "all", "6s")).toBe(true);  // 6 -> reroll
    });
  });

  describe("auto and none targets", () => {
    it("should handle auto-success targets", () => {
      // All rolls are successes when target is auto
      expect(shouldRerollSplit(1, "auto", "all", "none")).toBe(false);  // no fails
      expect(shouldRerollSplit(1, "auto", "none", "all")).toBe(true);   // all are successes
      expect(shouldRerollSplit(6, "auto", "none", "6s")).toBe(true);    // 6 is a success
      expect(shouldRerollSplit(3, "auto", "none", "6s")).toBe(false);   // success but not 6
    });

    it("should handle auto-fail targets", () => {
      // All rolls are failures when target is none
      expect(shouldRerollSplit(1, "none", "all", "none")).toBe(true);   // all are fails
      expect(shouldRerollSplit(6, "none", "all", "none")).toBe(true);   // all are fails
      expect(shouldRerollSplit(1, "none", "1s", "none")).toBe(true);    // 1 is a fail
      expect(shouldRerollSplit(6, "none", "1s", "none")).toBe(false);   // fail but not 1
      expect(shouldRerollSplit(6, "none", "none", "all")).toBe(false);  // no successes
    });
  });
});
