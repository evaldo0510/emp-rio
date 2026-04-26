import { describe, it, expect } from "vitest";
import { validateCommissionRate } from "../lib/commissions";

describe("validateCommissionRate", () => {
  it("validates 0 as a valid rate", () => {
    expect(validateCommissionRate(0)).toBe(0);
    expect(validateCommissionRate("0")).toBe(0);
  });

  it("validates 100 as a valid rate", () => {
    expect(validateCommissionRate(100)).toBe(100);
    expect(validateCommissionRate("100")).toBe(100);
  });

  it("rejects negative values", () => {
    expect(validateCommissionRate(-1)).toBeNull();
    expect(validateCommissionRate("-5")).toBeNull();
  });

  it("rejects values above 100", () => {
    expect(validateCommissionRate(100.1)).toBeNull();
    expect(validateCommissionRate(101)).toBeNull();
    expect(validateCommissionRate("150")).toBeNull();
  });

  it("rejects NaN and non-numeric strings", () => {
    expect(validateCommissionRate(NaN)).toBeNull();
    expect(validateCommissionRate("abc")).toBeNull();
  });

  it("rejects empty values", () => {
    expect(validateCommissionRate("")).toBeNull();
    expect(validateCommissionRate("   ")).toBeNull();
    expect(validateCommissionRate(null)).toBeNull();
    expect(validateCommissionRate(undefined)).toBeNull();
  });

  it("rounds values to 2 decimal places", () => {
    expect(validateCommissionRate(15.256)).toBe(15.26);
    expect(validateCommissionRate(10.111)).toBe(10.11);
    expect(validateCommissionRate("12.345")).toBe(12.35);
  });
});
