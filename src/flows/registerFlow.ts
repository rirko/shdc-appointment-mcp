import type { CaptchaChallenge, RegisterDraft } from "../types.js";
import { maskCardId, maskMobile, maskName } from "../utils/mask.js";

export type RegisterNextField =
  | "offlineFirstVisit"
  | "agreementAccepted"
  | "loginName"
  | "password"
  | "passwordAgain"
  | "userName"
  | "type"
  | "idCard"
  | "countryCode"
  | "familyName"
  | "name"
  | "birthYear"
  | "birthMonth"
  | "birthDay"
  | "sexCode"
  | "mobile"
  | "mediCardIdType"
  | "mediCardId"
  | "provinceName"
  | "cityName"
  | "email"
  | "nickname"
  | "promptQuestion"
  | "promptAnswer"
  | "captchaCode"
  | "mobileCaptchaCode"
  | "confirm"
  | "ready";

export function nextRegisterField(draft: RegisterDraft): RegisterNextField {
  if (draft.offlineFirstVisit !== true) return "offlineFirstVisit";
  if (!draft.agreementAccepted) return "agreementAccepted";
  if (!draft.loginName) return "loginName";
  if (!draft.password) return "password";
  if (!draft.passwordAgain) return "passwordAgain";
  if (!draft.userName) return "userName";
  if (!draft.type) return "type";
  if (!draft.idCard) return "idCard";
  if (needsCountry(draft.type) && !draft.countryCode) return "countryCode";
  if (needsSplitName(draft.type) && !draft.familyName) return "familyName";
  if (needsSplitName(draft.type) && !draft.name) return "name";
  if (needsBirthParts(draft.type) && !draft.birthYear) return "birthYear";
  if (needsBirthParts(draft.type) && !draft.birthMonth) return "birthMonth";
  if (needsBirthParts(draft.type) && !draft.birthDay) return "birthDay";
  if (needsBirthParts(draft.type) && !draft.sexCode) return "sexCode";
  if (!draft.mobile) return "mobile";
  if (!draft.mediCardIdType) return "mediCardIdType";
  if (needsMedicalCardId(draft) && !draft.mediCardId) return "mediCardId";
  if (!draft.provinceName) return "provinceName";
  if (!draft.cityName) return "cityName";
  if (!draft.email) return "email";
  if (!draft.nickname) return "nickname";
  if (!draft.promptQuestion) return "promptQuestion";
  if (!draft.promptAnswer) return "promptAnswer";
  if (!draft.captcha) return "captchaCode";
  if (!draft.captchaCode) return "captchaCode";
  if (!draft.mobileCaptchaCode) return "mobileCaptchaCode";
  if (!draft.confirmed) return "confirm";
  return "ready";
}

export function registerPrompt(field: RegisterNextField, captcha?: CaptchaChallenge): string {
  switch (field) {
    case "offlineFirstVisit":
      return "注册前请先确认：用户是否已经在线下完成过该院初诊/建档？如果已经完成，请回复 true；如果没有完成，请回复 false。";
    case "agreementAccepted":
      return "请确认已阅读并同意医联预约平台用户注册协议和隐私协议，回复 true。";
    case "loginName":
      return "请提供注册用户名，4-20 位。";
    case "password":
      return "请提供登录密码，6-12 位。";
    case "passwordAgain":
      return "请再次提供登录密码。";
    case "userName":
      return "请提供真实姓名。";
    case "type":
      return "请提供证件类型代码：1=身份证，2=军官证，3=护照，4=港澳通行证，7=台湾居民来往大陆通行证，8=户口簿，10=港澳居民往来大陆通行证，11=Passport，13=华侨护照，14=外国人永久居留身份证。";
    case "idCard":
      return "请提供证件号码。";
    case "countryCode":
      return "请提供国籍代码，例如 CHN。";
    case "familyName":
      return "请提供姓。";
    case "name":
      return "请提供名。";
    case "birthYear":
      return "请提供出生年份，例如 1990。";
    case "birthMonth":
      return "请提供出生月份，1-12。";
    case "birthDay":
      return "请提供出生日期，1-31。";
    case "sexCode":
      return "请提供性别代码：0=男，1=女。";
    case "mobile":
      return "请提供真实有效的手机号，用于接收注册短信验证码。";
    case "mediCardIdType":
      return "请提供医疗卡类型：0=暂无/不填写，1=社(医)保卡，2=医联卡(自费)。";
    case "mediCardId":
      return "请提供医疗卡号码。";
    case "provinceName":
      return "请提供省份名称，例如 上海市。";
    case "cityName":
      return "请提供城市名称，例如 上海市。";
    case "email":
      return "请提供电子邮箱；如果没有，可填 no-email@example.com。";
    case "nickname":
      return "请提供昵称，2-10 位。";
    case "promptQuestion":
      return "请提供密码提示问题，6-20 位。";
    case "promptAnswer":
      return "请提供密码提示答案，4-20 位。";
    case "captchaCode":
      return captcha ? "请查看验证码图片，并提供图形验证码。" : "需要先获取图形验证码，请调用 register_get_captcha。";
    case "mobileCaptchaCode":
      return "短信验证码已发送后，请提供手机短信验证码。";
    case "confirm":
      return "请调用 register_confirm 查看并确认注册摘要。";
    case "ready":
      return "注册信息已确认，可以调用 register_submit 提交注册。";
  }
}

export function validateRegisterPatch(field: string, value: unknown): Partial<RegisterDraft> {
  if (field === "offlineFirstVisit") {
    return { offlineFirstVisit: parseBooleanAnswer(value, "是否已线下初诊"), confirmed: false };
  }
  if (field === "agreementAccepted") return { agreementAccepted: value === true || value === "true" };
  if (field === "loginName") {
    const loginName = requiredString(value, "用户名");
    if (loginName.length < 4 || loginName.length > 20) throw new Error("用户名需要 4-20 位。");
    return { loginName };
  }
  if (field === "password") {
    const password = requiredString(value, "密码");
    if (password.length < 6 || password.length > 12) throw new Error("密码需要 6-12 位。");
    return { password, passwordAgain: undefined, confirmed: false };
  }
  if (field === "passwordAgain") return { passwordAgain: requiredString(value, "确认密码"), confirmed: false };
  if (field === "userName") return { userName: requiredString(value, "真实姓名"), confirmed: false };
  if (field === "type") return { type: requiredString(value, "证件类型"), confirmed: false };
  if (field === "idCard") return { idCard: requiredString(value, "证件号码"), confirmed: false };
  if (field === "countryCode") return { countryCode: requiredString(value, "国籍代码"), confirmed: false };
  if (field === "familyName") return { familyName: requiredString(value, "姓"), confirmed: false };
  if (field === "name") return { name: requiredString(value, "名"), confirmed: false };
  if (field === "birthYear") return { birthYear: normalizeNumberText(value, "出生年份"), confirmed: false };
  if (field === "birthMonth") return { birthMonth: normalizeNumberText(value, "出生月份"), confirmed: false };
  if (field === "birthDay") return { birthDay: normalizeNumberText(value, "出生日期"), confirmed: false };
  if (field === "sexCode") return { sexCode: String(value) === "1" ? "1" : "0", confirmed: false };
  if (field === "mobile") return { mobile: requiredString(value, "手机号"), confirmed: false };
  if (field === "mediCardIdType") return { mediCardIdType: requiredString(value, "医疗卡类型"), confirmed: false };
  if (field === "mediCardId") return { mediCardId: requiredString(value, "医疗卡号"), confirmed: false };
  if (field === "provinceName") return { provinceName: requiredString(value, "省份名称"), provinceId: undefined, confirmed: false };
  if (field === "cityName") return { cityName: requiredString(value, "城市名称"), cityId: undefined, confirmed: false };
  if (field === "email") return { email: requiredString(value, "电子邮箱"), confirmed: false };
  if (field === "nickname") return { nickname: requiredString(value, "昵称"), confirmed: false };
  if (field === "promptQuestion") return { promptQuestion: requiredString(value, "提示问题"), confirmed: false };
  if (field === "promptAnswer") return { promptAnswer: requiredString(value, "提示答案"), confirmed: false };
  if (field === "captchaCode") return { captchaCode: requiredString(value, "图形验证码") };
  if (field === "mobileCaptchaCode") return { mobileCaptchaCode: requiredString(value, "短信验证码"), confirmed: false };
  throw new Error(`不支持的注册字段: ${field}`);
}

export function buildRegisterPayload(draft: RegisterDraft): Record<string, unknown> {
  if (draft.password !== draft.passwordAgain) throw new Error("两次输入的密码不一致。");
  const payload: Record<string, unknown> = {
    loginName: draft.loginName,
    password: draft.password,
    userName: draft.userName,
    idCard: draft.idCard,
    mobile: draft.mobile,
    mediCardIdType: normalizeMedicalCardType(draft),
    mediCardId: draft.mediCardId ?? "",
    email: draft.email,
    nickname: draft.nickname,
    promptQuestion: draft.promptQuestion,
    promptAnswer: draft.promptAnswer,
    validateCode: draft.mobileCaptchaCode,
    provinceId: draft.provinceId ?? "",
    cityId: draft.cityId ?? "",
    type: draft.type
  };

  if (["10", "12", "13"].includes(draft.type)) {
    payload.countryCode = "CHN";
  } else if (needsCountry(draft.type)) {
    payload.countryCode = draft.countryCode;
  }

  if (needsBirthParts(draft.type)) {
    payload.familyName = draft.familyName;
    payload.name = draft.name;
    payload.sexCode = draft.sexCode;
    payload.birthYear = draft.birthYear;
    payload.birthMonth = pad2(draft.birthMonth);
    payload.birthDay = pad2(draft.birthDay);
  }

  return payload;
}

export function summarizeRegisterDraft(draft: RegisterDraft): Record<string, unknown> {
  return {
    offlineFirstVisit: draft.offlineFirstVisit,
    agreementAccepted: Boolean(draft.agreementAccepted),
    loginName: draft.loginName,
    passwordSet: Boolean(draft.password),
    userName: maskName(draft.userName),
    type: draft.type,
    idCard: maskCardId(draft.idCard),
    mobile: maskMobile(draft.mobile),
    mediCardIdType: draft.mediCardIdType,
    mediCardId: draft.mediCardId ? maskCardId(draft.mediCardId) : undefined,
    provinceName: draft.provinceName,
    cityName: draft.cityName,
    email: draft.email ? maskEmail(draft.email) : undefined,
    nickname: draft.nickname,
    promptQuestion: draft.promptQuestion,
    countryCode: draft.countryCode,
    familyName: maskName(draft.familyName),
    name: maskName(draft.name),
    birthDate:
      draft.birthYear && draft.birthMonth && draft.birthDay
        ? `${draft.birthYear}-${pad2(draft.birthMonth)}-${pad2(draft.birthDay)}`
        : undefined,
    sexCode: draft.sexCode,
    confirmed: Boolean(draft.confirmed)
  };
}

export function applyProvinceSelection(
  draft: RegisterDraft,
  provinceList: unknown[]
): Partial<RegisterDraft> {
  if (!draft.provinceName) return {};
  const match = provinceList
    .filter(isRecord)
    .find((item) => stringOf(item.provinceName) === draft.provinceName);
  if (!match) throw new Error(`未找到省份: ${draft.provinceName}`);
  return { provinceId: stringOf(match.provinceId) ?? "" };
}

export function applyCitySelection(draft: RegisterDraft, cityList: unknown[]): Partial<RegisterDraft> {
  if (!draft.cityName) return {};
  const match = cityList.filter(isRecord).find((item) => stringOf(item.cityName) === draft.cityName);
  if (!match) throw new Error(`未找到城市: ${draft.cityName}`);
  return { cityId: stringOf(match.cityId) ?? "" };
}

function normalizeMedicalCardType(draft: RegisterDraft): string {
  return draft.mediCardIdType === "0" ? "0" : draft.mediCardIdType ?? "0";
}

function needsMedicalCardId(draft: RegisterDraft): boolean {
  return draft.mediCardIdType !== "0";
}

function needsSplitName(cardType: string): boolean {
  return ["8", "13", "11", "14", "10", "7"].includes(cardType);
}

function needsBirthParts(cardType: string): boolean {
  return ["8", "13", "11", "14", "10", "7"].includes(cardType);
}

function needsCountry(cardType: string): boolean {
  return ["11", "14"].includes(cardType);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`${label}不能为空`);
  const text = String(value).trim();
  if (!text) throw new Error(`${label}不能为空`);
  return text;
}

function parseBooleanAnswer(value: unknown, label: string): boolean {
  if (value === true || value === false) return value;
  const text = requiredString(value, label).toLowerCase();
  const negativeAnswers = ["false", "no", "n", "0", "否", "不", "没有", "没", "未", "没参加", "未初诊", "没有初诊", "未完成"];
  if (negativeAnswers.some((answer) => text.includes(answer))) {
    return false;
  }
  const positiveAnswers = ["true", "yes", "y", "1", "是", "已", "已经", "有", "参加过", "初诊过", "已初诊", "已完成"];
  if (positiveAnswers.some((answer) => text.includes(answer))) return true;
  throw new Error(`${label}需要回答 true/false，或明确回答是/否。`);
}

function normalizeNumberText(value: unknown, label: string): string {
  const text = requiredString(value, label);
  if (!/^\d+$/.test(text)) throw new Error(`${label}必须是数字`);
  return text;
}

function pad2(value: unknown): string {
  return String(value ?? "").padStart(2, "0");
}

function maskEmail(value: string): string {
  const [name, domain] = value.split("@");
  if (!domain) return "***";
  return `${name.slice(0, 1)}***@${domain}`;
}

function stringOf(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
