import axios, { type AxiosInstance, type Method } from "axios";
import {
  SHDC_API_PREFIX,
  SHDC_BASE_URL,
  SHDC_CLIENT,
  SHDC_VERSION
} from "../config.js";
import {
  createSignature,
  encryptGetPayload,
  encryptJsonPayload,
  generateSm2KeyPair,
  sm2DecryptJson,
  sm2DecryptText
} from "../crypto/shdcCrypto.js";
import type { LocalSession, ShdcResponse } from "../types.js";
import type { SessionStore } from "../storage/sessionStore.js";

export class ShdcClient {
  private readonly http: AxiosInstance;

  constructor(private readonly sessionStore: SessionStore) {
    this.http = axios.create({
      baseURL: `${SHDC_BASE_URL}${SHDC_API_PREFIX}`,
      timeout: 20_000,
      headers: {
        Referer: `${SHDC_BASE_URL}/`,
        Origin: SHDC_BASE_URL,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
      },
      validateStatus: () => true
    });
  }

  async request<T>(
    method: Method,
    url: string,
    data?: Record<string, unknown>,
    options?: { accessToken?: string; rawPost?: boolean }
  ): Promise<ShdcResponse<T>> {
    const session = await this.sessionStore.get();
    const accessToken = options?.accessToken ?? session.accessToken ?? "";
    const headers: Record<string, string | number> = {
      client: SHDC_CLIENT,
      version: SHDC_VERSION,
      "access-token": accessToken,
      signature: createSignature()
    };

    let finalUrl = normalizeUrl(url);
    let body: unknown = undefined;
    const normalizedMethod = method.toLowerCase();

    if (normalizedMethod === "get") {
      const encrypted = encryptGetPayload(data);
      if (encrypted) finalUrl = `${finalUrl}?${encrypted}`;
    } else if (normalizedMethod === "post") {
      headers["Content-Type"] = "application/json;charset=utf-8";
      body = options?.rawPost ? data : data ? encryptJsonPayload(data) : undefined;
    }

    const response = await this.http.request<ShdcResponse<T>>({
      method,
      url: finalUrl,
      data: body,
      headers,
      transformRequest: [(requestBody) => requestBody]
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`SHDC HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }
    return response.data;
  }

  async getCaptcha(): Promise<{
    captchaId: string;
    imageDataUri: string;
    plainText?: string;
  }> {
    const keyPair = generateSm2KeyPair();
    const response = await this.request<string>("get", "api/user/getCaptcha", {
      sm2PublicKey: keyPair.publicKey
    });
    assertOk(response, "获取图形验证码失败");
    return {
      captchaId: String(response.msg ?? ""),
      imageDataUri: `data:${response.data ?? ""}`,
      plainText: sm2DecryptText(response.errorMsg, keyPair.privateKey)
    };
  }

  async sendSmsCode(data: {
    mobile?: string;
    cardId?: string;
    captchaId: string;
    captchaCode: string;
    scheduleId?: string;
  }): Promise<ShdcResponse> {
    return this.request("post", "api/user/sendValidCode", data);
  }

  async login(data: {
    username: string;
    password: string;
    validateCode: string;
  }): Promise<ShdcResponse<{ accessToken: string; info: Record<string, unknown> }>> {
    return this.request("post", "/api/user/login", {
      origin: "web",
      ...data
    });
  }

  async queryHospitals(data: {
    hosOrgCode?: string;
    platformHosNo?: string;
  } = {}): Promise<ShdcResponse<unknown[]>> {
    return this.request("post", "api/hospital/queryHospitalsForWeb", {
      hosOrgCode: data.hosOrgCode ?? "",
      platformHosNo: data.platformHosNo ?? ""
    });
  }

  async queryDepartments(data: {
    hosOrgCode: string;
    platformHosNo: string;
  }): Promise<ShdcResponse<unknown[]>> {
    const hosOrgCode =
      data.platformHosNo && data.platformHosNo !== "-1" ? data.platformHosNo : data.hosOrgCode;
    return this.request("get", "api/department/queryDeptInfoFromWeb", {
      platformHosNo: data.hosOrgCode,
      hosOrgCode
    });
  }

  async queryExpertList(data: {
    hosOrgCode: string;
    platformHosNo: string;
    hosDeptCode: string;
    topHosDeptCode: string;
    registerType?: string;
  }): Promise<ShdcResponse<{ doctorEntities?: unknown[] }>> {
    return this.request("get", "/api/schedule/queryDoctorByScheduleDate", {
      platformHosNo: data.hosOrgCode,
      hosOrgCode:
        data.platformHosNo && data.platformHosNo !== "-1" ? data.platformHosNo : data.hosOrgCode,
      hosDeptCode: data.hosDeptCode,
      topHosDeptCode: data.topHosDeptCode,
      registerType: data.registerType ?? "1"
    });
  }

  async queryExpertSchedules(data: {
    hosOrgCode: string;
    platformHosNo: string;
    hosDeptCode: string;
    topHosDeptCode: string;
    hosDoctCode: string;
    registerType?: string;
  }): Promise<unknown[]> {
    const keyPair = generateSm2KeyPair();
    const response = await this.request<unknown>("get", "/api/schedule/queryDoctorByScheduleDate", {
      platformHosNo: data.hosOrgCode,
      hosOrgCode:
        data.platformHosNo && data.platformHosNo !== "-1" ? data.platformHosNo : data.hosOrgCode,
      hosDeptCode: data.hosDeptCode,
      topHosDeptCode: data.topHosDeptCode,
      registerType: data.registerType ?? "1",
      hosDoctCode: data.hosDoctCode,
      sm2PublicKey: keyPair.publicKey
    });
    assertOk(response, "查询专家排班失败");
    const payload =
      typeof response.data === "string"
        ? sm2DecryptJson<Record<string, unknown>>(response.data, keyPair.privateKey, {})
        : isRecord(response.data)
          ? response.data
          : {};
    const schedules = Array.isArray(payload.schedules) ? payload.schedules : [];
    const first = schedules[0] as Record<string, unknown> | undefined;
    if (Array.isArray(first?.doctors)) return first.doctors;
    if (Array.isArray(payload.doctors)) return payload.doctors;
    return [];
  }

  async queryTimeSegments(data: {
    hosOrgCode: string;
    platformHosNo: string;
    scheduleId: string;
  }): Promise<unknown[]> {
    const keyPair = generateSm2KeyPair();
    const response = await this.request<string>("get", "/api/schedule/queryTimeSegmentList", {
      platformHosNo: data.hosOrgCode,
      hosOrgCode:
        data.platformHosNo && data.platformHosNo !== "-1" ? data.platformHosNo : data.hosOrgCode,
      scheduleId: data.scheduleId,
      sm2PublicKey: keyPair.publicKey
    });
    assertOk(response, "查询可约时间段失败");
    return sm2DecryptJson<unknown[]>(response.data, keyPair.privateKey, []);
  }

  async listCards(): Promise<ShdcResponse<unknown[]>> {
    return this.request("get", "/api/user/card/list");
  }

  async addCard(data: Record<string, unknown>): Promise<ShdcResponse> {
    return this.request("post", "/api/user/card/add", data);
  }

  async webRegister(data: Record<string, unknown>): Promise<ShdcResponse> {
    return this.request("post", "api/user/webRegister", data);
  }

  async getCountry(): Promise<ShdcResponse<unknown[]>> {
    return this.request("get", "api/user/getCountry");
  }

  async getProvince(): Promise<ShdcResponse<unknown[]>> {
    return this.request("get", "api/user/getProvince");
  }

  async getCity(data: { provinceId: string }): Promise<ShdcResponse<unknown[]>> {
    return this.request("get", "api/user/getCity", data);
  }

  async submitReservation(data: Record<string, unknown>): Promise<ShdcResponse<Record<string, unknown>>> {
    return this.request("post", "/api/reservation/submitReservation", data);
  }

  async saveLogin(response: ShdcResponse<{ accessToken: string; info: Record<string, unknown> }>): Promise<LocalSession> {
    assertOk(response, "登录失败");
    const data = response.data;
    if (!data?.accessToken) throw new Error("登录成功响应缺少 accessToken");
    return this.sessionStore.update({
      accessToken: data.accessToken,
      userInfo: data.info ?? {}
    });
  }
}

export function assertOk<T>(response: ShdcResponse<T>, prefix: string): asserts response is ShdcResponse<T> & { code: 200 } {
  if (response.code !== 200) {
    throw new Error(`${prefix}: ${responseMessage(response)}`);
  }
}

export function normalizeShdcMessage(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value);
  if (!/[ÃÂâåçèéæä]/.test(text)) return text;

  const repaired = Buffer.from(text, "latin1").toString("utf8");
  if (!repaired.includes("�") && countCjk(repaired) > countCjk(text)) return repaired;
  return text;
}

function responseMessage(response: ShdcResponse): string {
  return normalizeShdcMessage(response.msg) ?? normalizeShdcMessage(response.errorMsg) ?? String(response.code);
}

function countCjk(value: string): number {
  return [...value].filter((char) => /[\u3400-\u9fff]/.test(char)).length;
}

function normalizeUrl(url: string): string {
  return url.startsWith("/") ? url.slice(1) : url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
