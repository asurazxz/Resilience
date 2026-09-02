import { describe, expect, it } from "vitest";

import { centsToInput, parseMoneyToCents } from "./money";

describe("money boundary helpers", () => {
  it("converts decimal strings without floating-point arithmetic", () => {
    expect(parseMoneyToCents("12.30")).toBe(1230);
    expect(centsToInput(1230)).toBe("12.30");
  });

  it("rejects excessive decimal precision", () => {
    expect(() => parseMoneyToCents("12.345")).toThrow(/two decimal/);
  });
});
