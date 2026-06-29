import { describe, expect, it } from "vitest";
import { buildReservationPayload, nextAppointmentField } from "./appointmentFlow.js";
import type { AppointmentDraft } from "../types.js";

describe("appointmentFlow", () => {
  it("requires final confirmation before ready", () => {
    const draft: AppointmentDraft = {
      slot: {
        id: "slot_1",
        scheduleId: "s",
        numSourceId: "n",
        date: "2026-06-27",
        timeRange: "1",
        raw: {}
      },
      patient: {
        id: "patient_1",
        memberId: "m",
        userName: "张三",
        raw: {}
      },
      mobile: "13812345678",
      captcha: {
        flowId: "f",
        captchaId: "c",
        imageDataUri: "data:image/png;base64,AA==",
        purpose: "appointment",
        prompt: ""
      },
      captchaCode: "1234",
      smsCode: "567890"
    };
    expect(nextAppointmentField(draft)).toBe("confirm");
    draft.confirmed = true;
    expect(nextAppointmentField(draft)).toBe("ready");
  });

  it("builds reservation payload", () => {
    const payload = buildReservationPayload({
      hospital: {
        id: "hospital_1",
        name: "测试医院",
        hosOrgCode: "h1",
        platformHosNo: "-1",
        raw: {}
      },
      department: {
        id: "dept_1",
        name: "内科",
        hosDeptCode: "d1",
        topHosDeptCode: "td",
        hospitalId: "hospital_1",
        raw: {}
      },
      expert: {
        id: "expert_1",
        doctName: "李医生",
        hosDoctCode: "doc",
        registerType: "1",
        hospitalId: "hospital_1",
        departmentId: "dept_1",
        raw: {}
      },
      slot: {
        id: "time_1",
        scheduleId: "sch",
        numSourceId: "num",
        date: "2026-06-27",
        timeRange: "1",
        startTime: "2026-06-27 08:00:00",
        endTime: "2026-06-27 08:30:00",
        visitCost: "25",
        raw: { visitLevelCode: "1" }
      },
      patient: {
        id: "patient_1",
        memberId: "mem",
        userName: "张三",
        raw: {}
      },
      smsCode: "999999"
    });
    expect(payload).toMatchObject({
      hosOrgName: "测试医院",
      hosDeptCode: "d1",
      doctName: "李医生",
      memberId: "mem",
      validateCode: "999999",
      orderTime: "2026-06-27 08:00-08:30"
    });
  });
});
