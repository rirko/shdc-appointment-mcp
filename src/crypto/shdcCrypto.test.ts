import { describe, expect, it } from "vitest";
import { encryptGetPayload, encryptJsonPayload, sortObjectForWire } from "./shdcCrypto.js";

describe("shdcCrypto", () => {
  it("sorts object keys and preserves zero values", () => {
    expect(sortObjectForWire({ b: "", a: 0, c: "x", d: null })).toEqual({
      a: 0,
      b: "",
      c: "x",
      d: ""
    });
  });

  it("encrypts json and get payloads", () => {
    expect(encryptJsonPayload({ b: 2, a: 1 })).toEqual(expect.any(String));
    expect(encryptGetPayload({ b: 2, a: 1 })).toEqual(expect.any(String));
  });
});
