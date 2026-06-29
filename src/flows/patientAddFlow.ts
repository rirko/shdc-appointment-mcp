import type { CaptchaChallenge, PatientAddDraft } from "../types.js";
import { maskCardId, maskMobile, maskName } from "../utils/mask.js";

export type PatientAddNextField =
  | "privacyAccepted"
  | "cardType"
  | "name"
  | "familyName"
  | "givenName"
  | "cardId"
  | "birthDate"
  | "sex"
  | "countryCode"
  | "medicineCardType"
  | "medicineCardId"
  | "mobile"
  | "captchaCode"
  | "smsCode"
  | "ready";

export function nextPatientAddField(draft: PatientAddDraft): PatientAddNextField {
  if (!draft.privacyAccepted) return "privacyAccepted";
  if (!draft.cardType) return "cardType";
  if (needsSplitName(draft.cardType)) {
    if (!draft.familyName) return "familyName";
    if (!draft.givenName) return "givenName";
  } else if (!draft.name) {
    return "name";
  }
  if (!draft.cardId) return "cardId";
  if (needsBirthDate(draft.cardType) && !draft.birthDate) return "birthDate";
  if (draft.cardType !== "1" && !draft.sex) return "sex";
  if (needsCountry(draft.cardType) && !draft.countryCode) return "countryCode";
  if (!draft.medicineCardType) return "medicineCardType";
  if (!draft.medicineCardId) return "medicineCardId";
  if (!draft.mobile) return "mobile";
  if (!draft.captcha) return "captchaCode";
  if (!draft.captchaCode) return "captchaCode";
  if (!draft.smsCode) return "smsCode";
  return "ready";
}

export function patientAddPrompt(field: PatientAddNextField, captcha?: CaptchaChallenge): string {
  switch (field) {
    case "privacyAccepted":
      return "请确认已阅读并同意医联预约平台用户隐私协议，回复 true。";
    case "cardType":
      return "请提供证件类型代码：1=身份证，2=军官证，3=护照，4=港澳通行证，7=台湾居民来往大陆通行证，10=港澳居民往来大陆通行证，11=Passport，13=华侨护照，14=外国人永久居留身份证。";
    case "name":
      return "请提供持卡人姓名。";
    case "familyName":
      return "请提供姓。";
    case "givenName":
      return "请提供名。";
    case "cardId":
      return "请提供证件号码。";
    case "birthDate":
      return "请提供出生日期，格式 YYYY-MM-DD。";
    case "sex":
      return "请提供性别代码：1=男，2=女。";
    case "countryCode":
      return "请提供国籍代码，例如 CHN。";
    case "medicineCardType":
      return "请提供医疗卡类型：1=社(医)保卡，2=医联卡(自费)。";
    case "medicineCardId":
      return "请提供医疗卡号码。";
    case "mobile":
      return "请提供用于接收短信验证码的手机号。";
    case "captchaCode":
      return captcha
        ? "请查看验证码图片，并提供图形验证码。"
        : "需要先获取图形验证码，请调用 patient_add_next，action=get_captcha。";
    case "smsCode":
      return "短信验证码已发送后，请提供手机短信验证码。";
    case "ready":
      return "新增就诊人信息已收集完成，可以提交绑定。";
  }
}

export function buildAddCardPayload(draft: PatientAddDraft): Record<string, unknown> {
  const cardType = draft.cardType || "1";
  const isPassport = cardType === "11";
  const name = needsSplitName(cardType) ? draft.givenName : draft.name;
  const familyName = needsSplitName(cardType) ? draft.familyName : null;
  const payload: Record<string, unknown> = isPassport
    ? {
        countryCode: draft.countryCode,
        cardType: "11",
        cardId: draft.cardId,
        familyName: draft.familyName,
        name: draft.givenName,
        userBirthday: draft.birthDate,
        sex: draft.sex,
        mobile: draft.mobile,
        validateCode: draft.smsCode,
        medicineCardType: draft.medicineCardType,
        medicineCardId: draft.medicineCardId
      }
    : {
        name,
        familyName,
        cardType,
        cardId: draft.cardId,
        sex: cardType === "1" ? inferSexFromChineseId(draft.cardId ?? "") : draft.sex,
        mobile: draft.mobile,
        validateCode: draft.smsCode,
        medicineCardType: draft.medicineCardType,
        medicineCardId: draft.medicineCardId
      };

  if (needsBirthDate(cardType)) payload.userBirthday = draft.birthDate;
  if (cardType === "7") payload.countryCode = "CHN";
  if (cardType === "14") payload.countryCode = draft.countryCode;
  return payload;
}

export function validatePatientAddPatch(field: string, value: unknown): Record<string, unknown> {
  if (field === "privacyAccepted") return { privacyAccepted: value === true || value === "true" };
  if (field === "cardType") return { cardType: String(value) };
  if (field === "name") return { name: requiredString(value, "姓名") };
  if (field === "familyName") return { familyName: requiredString(value, "姓") };
  if (field === "givenName") return { givenName: requiredString(value, "名") };
  if (field === "cardId") return { cardId: requiredString(value, "证件号码") };
  if (field === "birthDate") return { birthDate: requiredString(value, "出生日期") };
  if (field === "sex") return { sex: String(value) === "2" ? "2" : "1" };
  if (field === "countryCode") return { countryCode: requiredString(value, "国籍代码") };
  if (field === "medicineCardType") return { medicineCardType: String(value) === "2" ? "2" : "1" };
  if (field === "medicineCardId") return { medicineCardId: requiredString(value, "医疗卡号") };
  if (field === "mobile") return { mobile: requiredString(value, "手机号") };
  if (field === "captchaCode") return { captchaCode: requiredString(value, "图形验证码") };
  if (field === "smsCode") return { smsCode: requiredString(value, "短信验证码") };
  throw new Error(`不支持的字段: ${field}`);
}

export function summarizePatientAddDraft(draft: PatientAddDraft): Record<string, unknown> {
  return {
    cardType: draft.cardType,
    name: maskName(draft.name ?? draft.givenName),
    familyName: maskName(draft.familyName),
    cardId: maskCardId(draft.cardId),
    medicineCardType: draft.medicineCardType,
    medicineCardId: draft.medicineCardId ? maskCardId(draft.medicineCardId) : undefined,
    mobile: maskMobile(draft.mobile)
  };
}

function needsSplitName(cardType: string): boolean {
  return ["11", "7", "14"].includes(cardType);
}

function needsBirthDate(cardType: string): boolean {
  return ["8", "13", "11", "7", "10", "14"].includes(cardType);
}

function needsCountry(cardType: string): boolean {
  return ["11", "14"].includes(cardType);
}

function inferSexFromChineseId(cardId: string): "1" | "2" {
  if (cardId.length >= 17) return Number(cardId[16]) % 2 === 0 ? "2" : "1";
  return "1";
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`${label}不能为空`);
  const text = String(value).trim();
  if (!text) throw new Error(`${label}不能为空`);
  return text;
}

