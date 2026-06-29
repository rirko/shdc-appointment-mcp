import { describe, expect, it } from "vitest";
import {
  buildAddCardPayload,
  nextPatientAddField,
  validatePatientAddPatch
} from "./patientAddFlow.js";
import type { PatientAddDraft } from "../types.js";

describe("patientAddFlow", () => {
  it("asks one field at a time for default ID card flow", () => {
    const draft: PatientAddDraft = { cardType: "1" };
    expect(nextPatientAddField(draft)).toBe("privacyAccepted");
    Object.assign(draft, validatePatientAddPatch("privacyAccepted", true));
    expect(nextPatientAddField(draft)).toBe("name");
    Object.assign(draft, {
      name: "张三",
      cardId: "310101199001011234",
      medicineCardType: "1",
      medicineCardId: "A123",
      mobile: "13812345678",
      captcha: {
        flowId: "f",
        captchaId: "c",
        imageDataUri: "data:image/png;base64,AA==",
        purpose: "patient_add",
        prompt: ""
      },
      captchaCode: "1234",
      smsCode: "567890"
    });
    expect(nextPatientAddField(draft)).toBe("ready");
  });

  it("builds add-card payload and infers sex", () => {
    const payload = buildAddCardPayload({
      cardType: "1",
      privacyAccepted: true,
      name: "张三",
      cardId: "310101199001011234",
      medicineCardType: "1",
      medicineCardId: "A123",
      mobile: "13812345678",
      smsCode: "567890"
    });
    expect(payload).toMatchObject({
      name: "张三",
      cardType: "1",
      sex: "1",
      validateCode: "567890"
    });
  });
});
