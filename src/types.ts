export type ShdcCode = string | number;

export interface ShdcResponse<T = unknown> {
  code: number;
  msg?: string;
  errorMsg?: string;
  data?: T;
}

export interface HospitalOption {
  id: string;
  name: string;
  hosOrgCode: string;
  platformHosNo: string;
  address?: string;
  grade?: string;
  raw: Record<string, unknown>;
}

export interface DepartmentOption {
  id: string;
  name: string;
  hosDeptCode: string;
  topHosDeptCode: string;
  hospitalId: string;
  raw: Record<string, unknown>;
}

export interface ExpertOption {
  id: string;
  doctName: string;
  hosDoctCode?: string;
  deptName?: string;
  title?: string;
  visitLevel?: string;
  availableSummary?: string;
  registerType: RegisterType;
  hospitalId: string;
  departmentId: string;
  raw: Record<string, unknown>;
}

export interface SlotOption {
  id: string;
  scheduleId: string;
  numSourceId?: string;
  date: string;
  timeRange: "1" | "2" | string;
  startTime?: string;
  endTime?: string;
  visitCost?: string | number;
  status?: string;
  statusText?: string;
  raw: Record<string, unknown>;
}

export interface PatientOption {
  id: string;
  memberId: string;
  userName: string;
  maskedMobile?: string;
  maskedCardId?: string;
  medicineCardType?: string;
  medicineCardId?: string;
  status?: string;
  raw: Record<string, unknown>;
}

export interface CaptchaChallenge {
  flowId: string;
  captchaId: string;
  imageDataUri: string;
  purpose: CaptchaPurpose;
  prompt: string;
}

export type CaptchaPurpose = "login" | "patient_add" | "appointment" | "register";

export type RegisterType = "1" | "2" | "3";

export interface SearchContext {
  hospitals: HospitalOption[];
  departments: DepartmentOption[];
  experts: ExpertOption[];
  slots: SlotOption[];
}

export interface AppointmentDraft {
  hospital?: HospitalOption;
  department?: DepartmentOption;
  expert?: ExpertOption;
  slot?: SlotOption;
  patient?: PatientOption;
  captcha?: CaptchaChallenge;
  mobile?: string;
  captchaCode?: string;
  smsCode?: string;
  confirmed?: boolean;
}

export interface PatientAddDraft {
  cardType: string;
  name?: string;
  familyName?: string;
  givenName?: string;
  cardId?: string;
  birthDate?: string;
  sex?: "1" | "2";
  countryCode?: string;
  medicineCardType?: string;
  medicineCardId?: string;
  mobile?: string;
  captcha?: CaptchaChallenge;
  captchaCode?: string;
  smsCode?: string;
  privacyAccepted?: boolean;
}

export interface RegisterDraft {
  offlineFirstVisit?: boolean;
  agreementAccepted?: boolean;
  loginName?: string;
  password?: string;
  passwordAgain?: string;
  userName?: string;
  type: string;
  idCard?: string;
  mobile?: string;
  mediCardIdType?: string;
  mediCardId?: string;
  provinceName?: string;
  cityName?: string;
  provinceId?: string;
  cityId?: string;
  email?: string;
  nickname?: string;
  promptQuestion?: string;
  promptAnswer?: string;
  countryCode?: string;
  familyName?: string;
  name?: string;
  sexCode?: "0" | "1";
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  captcha?: CaptchaChallenge;
  captchaCode?: string;
  mobileCaptchaCode?: string;
  confirmed?: boolean;
}

export type FlowKind = "captcha" | "appointment" | "patient_add" | "register";

export interface FlowState {
  id: string;
  kind: FlowKind;
  createdAt: string;
  updatedAt: string;
  draft: AppointmentDraft | PatientAddDraft | RegisterDraft | Record<string, unknown>;
}

export interface LocalSession {
  accessToken?: string;
  userInfo?: Record<string, unknown>;
  updatedAt?: string;
}

export interface ToolTextResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
}

export interface ToolImageResult {
  [key: string]: unknown;
  content: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  >;
}

export type ToolResult = ToolTextResult | ToolImageResult;
