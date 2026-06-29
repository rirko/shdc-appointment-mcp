import type {
  DepartmentOption,
  ExpertOption,
  HospitalOption,
  PatientOption,
  RegisterType,
  SlotOption
} from "../types.js";
import { asNonEmptyString, maskCardId, maskMobile } from "../utils/mask.js";

export function mapHospitals(rawItems: unknown[]): HospitalOption[] {
  return rawItems
    .filter(isRecord)
    .map((item, index) => ({
      id: `hospital_${index + 1}`,
      name:
        stringOf(item.platformHosName) ??
        stringOf(item.hosName) ??
        stringOf(item.orgName) ??
        `医院 ${index + 1}`,
      hosOrgCode: stringOf(item.hosOrgCode) ?? stringOf(item.HOSORGCODE) ?? "",
      platformHosNo: stringOf(item.platformHosNo) ?? "-1",
      address: stringOf(item.hospitalAdd) ?? stringOf(item.address),
      grade: stringOf(item.hospitalGrade),
      raw: item
    }))
    .filter((item) => item.hosOrgCode);
}

export function mapDepartments(
  rawItems: unknown[],
  hospitalId: string,
  query?: string
): DepartmentOption[] {
  const result: DepartmentOption[] = [];
  for (const one of rawItems.filter(isRecord)) {
    const topCode = stringOf(one.oneDeptCode) ?? "";
    const children = Array.isArray(one.Data) ? one.Data : [];
    for (const child of children.filter(isRecord)) {
      const name = stringOf(child.twoDeptName) ?? stringOf(child.deptName) ?? "";
      const hosDeptCode = stringOf(child.twoDeptCode) ?? stringOf(child.deptCode) ?? "";
      if (!name || !hosDeptCode) continue;
      if (query && !name.includes(query)) continue;
      result.push({
        id: `dept_${result.length + 1}`,
        name,
        hosDeptCode,
        topHosDeptCode: topCode,
        hospitalId,
        raw: child
      });
    }
  }
  return result;
}

export function mapExperts(
  rawItems: unknown[],
  context: {
    hospitalId: string;
    departmentId: string;
    registerType?: RegisterType;
  }
): ExpertOption[] {
  return rawItems.filter(isRecord).map((item, index) => {
    const reserve = Number(item.reserveOrderNum ?? item.orderNum ?? 0);
    const status = stringOf(item.status);
    const statusText = status === "2" ? "停诊" : reserve > 0 ? `可约 ${reserve}` : "约满";
    return {
      id: `expert_${index + 1}`,
      doctName: stringOf(item.doctName) ?? stringOf(item.doctorName) ?? `专家 ${index + 1}`,
      hosDoctCode: stringOf(item.hosDoctCode),
      deptName: stringOf(item.deptName),
      title: stringOf(item.doctTile) ?? stringOf(item.title),
      visitLevel: stringOf(item.visitLevel),
      availableSummary: statusText,
      registerType: context.registerType ?? "1",
      hospitalId: context.hospitalId,
      departmentId: context.departmentId,
      raw: item
    };
  });
}

export function mapSlots(rawItems: unknown[]): SlotOption[] {
  return rawItems.filter(isRecord).map((item, index) => {
    const scheduleDate = stringOf(item.scheduleDate) ?? stringOf(item.startTime)?.slice(0, 10) ?? "";
    const timeRange = stringOf(item.timeRange) ?? "";
    const reserve = Number(item.reserveOrderNum ?? 0);
    const status = stringOf(item.status);
    const statusText =
      status === "2" ? "停诊" : reserve > 3 ? "有号" : reserve > 0 ? `余${reserve}` : "约满";
    return {
      id: `slot_${index + 1}`,
      scheduleId: stringOf(item.scheduleId) ?? "",
      numSourceId: stringOf(item.numSourceId),
      date: scheduleDate,
      timeRange,
      startTime: stringOf(item.startTime),
      endTime: stringOf(item.endTime),
      visitCost: stringOf(item.visitCost) ?? (typeof item.visitCost === "number" ? item.visitCost : undefined),
      status,
      statusText,
      raw: item
    };
  });
}

export function mapTimeSegments(rawItems: unknown[], parentSlot: SlotOption): SlotOption[] {
  return rawItems.filter(isRecord).map((item, index) => ({
    id: `time_${index + 1}`,
    scheduleId: parentSlot.scheduleId,
    numSourceId: stringOf(item.numSourceId),
    date: stringOf(item.startTime)?.slice(0, 10) ?? parentSlot.date,
    timeRange: parentSlot.timeRange,
    startTime: stringOf(item.startTime),
    endTime: stringOf(item.endTime),
    visitCost: parentSlot.visitCost,
    status: parentSlot.status,
    statusText: parentSlot.statusText,
    raw: { ...parentSlot.raw, timeSegment: item }
  }));
}

export function mapPatients(rawItems: unknown[]): PatientOption[] {
  return rawItems
    .filter(isRecord)
    .filter((item) => stringOf(item.memberId) && stringOf(item.memberId) !== "0")
    .map((item, index) => ({
      id: `patient_${index + 1}`,
      memberId: stringOf(item.memberId) ?? "",
      userName: stringOf(item.userName) ?? stringOf(item.name) ?? `就诊人 ${index + 1}`,
      maskedMobile: maskMobile(item.mobile),
      maskedCardId: maskCardId(item.cardId),
      medicineCardType: stringOf(item.medicineCardType),
      medicineCardId: stringOf(item.medicineCardId),
      status: stringOf(item.states),
      raw: item
    }));
}

export function pickById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

export function stringOf(value: unknown): string | undefined {
  return asNonEmptyString(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

