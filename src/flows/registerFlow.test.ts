import { describe, expect, it } from "vitest";
import {
  buildRegisterPayload,
  nextRegisterField,
  summarizeRegisterDraft,
  validateRegisterPatch
} from "./registerFlow.js";
import type { RegisterDraft } from "../types.js";

describe("registerFlow", () => {
  it("asks for one registration field at a time", () => {
    const draft: RegisterDraft = { type: "1", mediCardIdType: "0" };

    expect(nextRegisterField(draft)).toBe("offlineFirstVisit");
    Object.assign(draft, validateRegisterPatch("offlineFirstVisit", true));
    expect(nextRegisterField(draft)).toBe("agreementAccepted");
    Object.assign(draft, validateRegisterPatch("agreementAccepted", true));
    expect(nextRegisterField(draft)).toBe("loginName");
    Object.assign(draft, validateRegisterPatch("loginName", "test_user"));
    expect(nextRegisterField(draft)).toBe("password");
  });

  it("builds a confirmed id-card registration payload", () => {
    const draft: RegisterDraft = {
      offlineFirstVisit: true,
      agreementAccepted: true,
      loginName: "test_user",
      password: "secret1",
      passwordAgain: "secret1",
      userName: "张三",
      type: "1",
      idCard: "310101199001011234",
      mobile: "13800138000",
      mediCardIdType: "0",
      provinceName: "上海市",
      cityName: "上海市",
      provinceId: "310000",
      cityId: "310100",
      email: "user@example.com",
      nickname: "tester",
      promptQuestion: "favorite book",
      promptAnswer: "answer",
      captcha: {
        flowId: "register_1",
        captchaId: "captcha",
        imageDataUri: "data:image/png;base64,abc",
        purpose: "register",
        prompt: ""
      },
      captchaCode: "ABCD",
      mobileCaptchaCode: "123456",
      confirmed: true
    };

    expect(nextRegisterField(draft)).toBe("ready");
    expect(buildRegisterPayload(draft)).toMatchObject({
      loginName: "test_user",
      password: "secret1",
      userName: "张三",
      idCard: "310101199001011234",
      mobile: "13800138000",
      mediCardIdType: "0",
      validateCode: "123456",
      provinceId: "310000",
      cityId: "310100",
      type: "1"
    });
  });

  it("does not expose sensitive values in summaries", () => {
    const summary = summarizeRegisterDraft({
      offlineFirstVisit: true,
      type: "1",
      loginName: "test_user",
      password: "secret1",
      userName: "张三",
      idCard: "310101199001011234",
      mobile: "13800138000",
      email: "user@example.com"
    });

    expect(summary).toMatchObject({
      loginName: "test_user",
      passwordSet: true,
      userName: "张*",
      idCard: "3101********1234",
      mobile: "138****8000",
      email: "u***@example.com"
    });
  });

  it("parses a no first-visit answer without moving forward", () => {
    const draft: RegisterDraft = { type: "1", mediCardIdType: "0" };

    Object.assign(draft, validateRegisterPatch("offlineFirstVisit", "没有"));

    expect(draft.offlineFirstVisit).toBe(false);
    expect(nextRegisterField(draft)).toBe("offlineFirstVisit");
  });

  it("rejects mismatched passwords before submit", () => {
    expect(() =>
      buildRegisterPayload({
        type: "1",
        password: "secret1",
        passwordAgain: "secret2"
      })
    ).toThrow("两次输入的密码不一致");
  });
});
