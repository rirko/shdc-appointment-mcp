import { describe, expect, it } from "vitest";
import { maskCardId, maskMobile, redactObject } from "./mask.js";

describe("mask utilities", () => {
  it("masks mobile and card values", () => {
    expect(maskMobile("13812345678")).toBe("138****5678");
    expect(maskCardId("310101199001011234")).toBe("3101********1234");
  });

  it("redacts nested sensitive fields", () => {
    expect(redactObject({ token: "secret", nested: { mobile: "13812345678" } })).toEqual({
      token: "***",
      nested: { mobile: "***" }
    });
  });
});
