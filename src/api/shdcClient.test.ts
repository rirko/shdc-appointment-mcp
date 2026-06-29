import { describe, expect, it } from "vitest";
import { normalizeShdcMessage } from "./shdcClient.js";

describe("normalizeShdcMessage", () => {
  it("keeps readable Chinese messages unchanged", () => {
    expect(normalizeShdcMessage("用户名或密码错误")).toBe("用户名或密码错误");
  });

  it("repairs common latin1-decoded UTF-8 mojibake", () => {
    const mojibake = Buffer.from("请先获取图形验证码", "utf8").toString("latin1");

    expect(normalizeShdcMessage(mojibake)).toBe("请先获取图形验证码");
  });
});
