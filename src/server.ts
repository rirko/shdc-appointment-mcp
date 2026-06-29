import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShdcClient, assertOk } from "./api/shdcClient.js";
import {
  mapDepartments,
  mapExperts,
  mapHospitals,
  mapPatients,
  mapSlots,
  mapTimeSegments,
  pickById
} from "./api/mappers.js";
import { buildReservationPayload, nextAppointmentField, summarizeAppointment } from "./flows/appointmentFlow.js";
import { FlowStore } from "./flows/flowStore.js";
import {
  buildAddCardPayload,
  nextPatientAddField,
  patientAddPrompt,
  summarizePatientAddDraft,
  validatePatientAddPatch
} from "./flows/patientAddFlow.js";
import {
  applyCitySelection,
  applyProvinceSelection,
  buildRegisterPayload,
  nextRegisterField,
  registerPrompt,
  summarizeRegisterDraft,
  validateRegisterPatch
} from "./flows/registerFlow.js";
import { SessionStore } from "./storage/sessionStore.js";
import type {
  AppointmentDraft,
  CaptchaChallenge,
  DepartmentOption,
  ExpertOption,
  HospitalOption,
  PatientAddDraft,
  PatientOption,
  RegisterDraft,
  SlotOption
} from "./types.js";
import { createId } from "./utils/ids.js";
import { maskCardId, maskMobile } from "./utils/mask.js";
import { fail, imageResult, ok, textResult } from "./utils/result.js";

export interface AppContext {
  sessionStore: SessionStore;
  client: ShdcClient;
  flows: FlowStore;
  search: {
    hospitals: HospitalOption[];
    departments: DepartmentOption[];
    experts: ExpertOption[];
    slots: SlotOption[];
    patients: PatientOption[];
  };
}

export function createContext(): AppContext {
  const sessionStore = new SessionStore();
  return {
    sessionStore,
    client: new ShdcClient(sessionStore),
    flows: new FlowStore(),
    search: {
      hospitals: [],
      departments: [],
      experts: [],
      slots: [],
      patients: []
    }
  };
}

export function createServer(context = createContext()): McpServer {
  const server = new McpServer({
    name: "shdc-appointment-mcp",
    version: "0.1.0"
  });

  registerAuthTools(server, context);
  registerAccountTools(server, context);
  registerSearchTools(server, context);
  registerPatientTools(server, context);
  registerAppointmentTools(server, context);

  return server;
}

function registerAuthTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "auth_get_captcha",
    {
      title: "获取登录图形验证码",
      description: "获取医联预约平台登录所需图形验证码。返回图片和 flowId。",
      inputSchema: z.object({}).optional()
    },
    async () => {
      try {
        const captcha = await createCaptcha(ctx, "login");
        return imageResult({
          text: JSON.stringify(
            {
              ok: true,
              flowId: captcha.flowId,
              captchaId: captcha.captchaId,
              prompt: "请读取图片验证码，然后调用 auth_send_sms_code。"
            },
            null,
            2
          ),
          dataUri: captcha.imageDataUri
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "auth_send_sms_code",
    {
      title: "发送登录短信验证码",
      description: "用户提供登录名和图形验证码后发送短信验证码。",
      inputSchema: z.object({
        flowId: z.string(),
        username: z.string(),
        captchaCode: z.string()
      })
    },
    async ({ flowId, username, captchaCode }) => {
      try {
        const flow = ctx.flows.require(flowId, "captcha");
        const captcha = (flow.draft as { captcha?: CaptchaChallenge }).captcha;
        if (!captcha) throw new Error("验证码流程缺少 captcha");
        const response = await ctx.client.sendSmsCode({
          mobile: username.length <= 11 ? username : "",
          cardId: username.length > 11 ? username : "",
          captchaId: captcha.captchaId,
          captchaCode
        });
        assertOk(response, "发送短信验证码失败");
        ctx.flows.update(flowId, { username, captchaCode });
        return ok({
          flowId,
          message: "短信验证码已发送，请调用 auth_login 并提供短信验证码。"
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "auth_login",
    {
      title: "登录医联预约平台",
      description: "使用登录名、密码和短信验证码登录，并加密保存本机会话。",
      inputSchema: z.object({
        flowId: z.string(),
        username: z.string(),
        password: z.string(),
        smsCode: z.string()
      })
    },
    async ({ flowId, username, password, smsCode }) => {
      try {
        ctx.flows.require(flowId, "captcha");
        const response = await ctx.client.login({ username, password, validateCode: smsCode });
        const session = await ctx.client.saveLogin(response);
        ctx.flows.delete(flowId);
        return ok({
          message: "登录成功，会话已本机加密保存。",
          user: session.userInfo ? sanitizeUserInfo(session.userInfo) : undefined
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );
}

function registerAccountTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "register_start",
    {
      title: "开始账号实名注册",
      description: "创建医联预约平台账号实名注册聊天流程。第一步会确认用户是否已线下初诊；未初诊则不会继续注册。",
      inputSchema: z.object({
        cardType: z.string().default("1")
      })
    },
    async ({ cardType }) => {
      const flow = ctx.flows.create("register", {
        type: cardType,
        mediCardIdType: "0",
        birthYear: "1900",
        birthMonth: "1",
        birthDay: "1",
        sexCode: "0"
      });
      const draft = flow.draft as RegisterDraft;
      const nextField = nextRegisterField(draft);
      return ok({
        flowId: flow.id,
        nextField,
        prompt: registerPrompt(nextField),
        summary: summarizeRegisterDraft(draft)
      });
    }
  );

  server.registerTool(
    "register_next",
    {
      title: "继续账号实名注册流程",
      description: "为注册流程提供一个字段。长流程必须保持同一个 MCP stdio 会话。",
      inputSchema: z.object({
        flowId: z.string(),
        field: z.string(),
        value: z.unknown()
      })
    },
    async ({ flowId, field, value }) => {
      try {
        const flow = ctx.flows.require(flowId, "register");
        const expectedField = nextRegisterField(flow.draft as RegisterDraft);
        if (expectedField === "offlineFirstVisit" && field !== "offlineFirstVisit") {
          throw new Error("注册流程必须先确认用户是否已线下初诊/建档；未确认前不会收集注册信息。");
        }
        let draft = ctx.flows.update<RegisterDraft>(flowId, validateRegisterPatch(field, value))
          .draft as RegisterDraft;
        if (field === "offlineFirstVisit" && draft.offlineFirstVisit === false) {
          ctx.flows.delete(flowId);
          return ok(registrationBlockedByFirstVisit(flowId));
        }
        draft = await resolveRegisterArea(ctx, flowId, draft, field);
        const nextField = nextRegisterField(draft);
        return ok({
          flowId,
          nextField,
          prompt: registerPrompt(nextField, draft.captcha),
          summary: summarizeRegisterDraft(draft)
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "register_get_captcha",
    {
      title: "获取注册图形验证码",
      description: "获取实名注册所需图形验证码图片。",
      inputSchema: z.object({
        flowId: z.string()
      })
    },
    async ({ flowId }) => {
      try {
        const flow = ctx.flows.require(flowId, "register");
        assertCanContinueRegister(flow.draft as RegisterDraft);
        const captcha = await createCaptcha(ctx, "register", flowId);
        return imageResult({
          text: JSON.stringify(
            {
              ok: true,
              flowId,
              captchaId: captcha.captchaId,
              nextField: "captchaCode",
              prompt: registerPrompt("captchaCode", captcha)
            },
            null,
            2
          ),
          dataUri: captcha.imageDataUri
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "register_send_sms_code",
    {
      title: "发送注册短信验证码",
      description: "用户提供手机号和图形验证码后发送注册短信验证码。",
      inputSchema: z.object({
        flowId: z.string()
      })
    },
    async ({ flowId }) => {
      try {
        const flow = ctx.flows.require(flowId, "register");
        const draft = flow.draft as RegisterDraft;
        assertCanContinueRegister(draft);
        if (!draft.mobile || !draft.captcha || !draft.captchaCode) {
          throw new Error("发送短信前需要手机号、图形验证码和 captchaCode。");
        }
        const response = await ctx.client.sendSmsCode({
          mobile: draft.mobile,
          captchaId: draft.captcha.captchaId,
          captchaCode: draft.captchaCode
        });
        assertOk(response, "发送注册短信验证码失败");
        return ok({ flowId, nextField: "mobileCaptchaCode", prompt: registerPrompt("mobileCaptchaCode") });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "register_confirm",
    {
      title: "确认账号注册摘要",
      description: "返回账号实名注册摘要。用户确认后才允许提交注册。",
      inputSchema: z.object({
        flowId: z.string(),
        confirm: z.boolean().default(false)
      })
    },
    async ({ flowId, confirm }) => {
      try {
        const flow = ctx.flows.require(flowId, "register");
        let draft = flow.draft as RegisterDraft;
        assertCanContinueRegister(draft);
        const nextField = nextRegisterField(draft);
        if (nextField !== "confirm" && nextField !== "ready") {
          return fail("注册信息尚未完整。", {
            flowId,
            nextField,
            prompt: registerPrompt(nextField, draft.captcha),
            summary: summarizeRegisterDraft(draft)
          });
        }
        if (!confirm) {
          return ok({
            flowId,
            needsConfirmation: true,
            prompt: "请确认以下实名注册信息。确认无误后再次调用 register_confirm，confirm=true。",
            summary: summarizeRegisterDraft(draft)
          });
        }
        draft = ctx.flows.update<RegisterDraft>(flowId, { confirmed: true }).draft as RegisterDraft;
        return ok({
          flowId,
          nextField: nextRegisterField(draft),
          prompt: "已确认。可以调用 register_submit 提交注册。",
          summary: summarizeRegisterDraft(draft)
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "register_submit",
    {
      title: "提交账号实名注册",
      description: "仅在用户确认后提交账号实名注册，不会自动登录。",
      inputSchema: z.object({
        flowId: z.string()
      })
    },
    async ({ flowId }) => {
      try {
        const flow = ctx.flows.require(flowId, "register");
        const draft = flow.draft as RegisterDraft;
        assertCanContinueRegister(draft);
        const nextField = nextRegisterField(draft);
        if (nextField !== "ready") {
          return fail("注册信息尚未完整或尚未确认，未提交。", {
            flowId,
            nextField,
            prompt: registerPrompt(nextField, draft.captcha),
            summary: summarizeRegisterDraft(draft)
          });
        }
        const response = await ctx.client.webRegister(buildRegisterPayload(draft));
        assertOk(response, "账号注册失败");
        ctx.flows.delete(flowId);
        return ok({
          message: response.msg ?? "注册成功。请继续调用 auth_get_captcha / auth_login 登录。",
          loginName: draft.loginName,
          next: "注册成功后需要单独登录，服务不会自动使用密码登录。"
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );
}

function registerSearchTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "search_hospitals",
    {
      title: "查询医院/院区",
      description: "按医院名称模糊查询医联预约平台医院与院区。",
      inputSchema: z.object({
        query: z.string().default("")
      })
    },
    async ({ query }) => {
      try {
        const response = await ctx.client.queryHospitals();
        assertOk(response, "查询医院失败");
        const hospitals = mapHospitals(response.data ?? []).filter((item) =>
          query ? item.name.includes(query) : true
        );
        ctx.search.hospitals = hospitals;
        ctx.search.departments = [];
        ctx.search.experts = [];
        ctx.search.slots = [];
        return ok({
          hospitals: hospitals.map(({ raw, ...item }) => item),
          next: "选择 hospital id 后调用 search_departments。"
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "search_departments",
    {
      title: "查询科室",
      description: "根据医院编号和科室名称查询二级科室。",
      inputSchema: z.object({
        hospitalId: z.string(),
        query: z.string().default("")
      })
    },
    async ({ hospitalId, query }) => {
      try {
        const hospital = pickById(ctx.search.hospitals, hospitalId);
        if (!hospital) throw new Error("未找到 hospitalId，请先调用 search_hospitals。");
        const response = await ctx.client.queryDepartments({
          hosOrgCode: hospital.hosOrgCode,
          platformHosNo: hospital.platformHosNo
        });
        assertOk(response, "查询科室失败");
        const departments = mapDepartments(response.data ?? [], hospital.id, query);
        ctx.search.departments = departments;
        ctx.search.experts = [];
        ctx.search.slots = [];
        return ok({
          hospital: { id: hospital.id, name: hospital.name },
          departments: departments.map(({ raw, ...item }) => item),
          next: "选择 department id 后调用 list_available_experts。"
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "list_available_experts",
    {
      title: "列出可预约专家",
      description: "根据医院和科室返回当前科室可预约专家。",
      inputSchema: z.object({
        hospitalId: z.string(),
        departmentId: z.string(),
        registerType: z.enum(["1", "2", "3"]).default("1")
      })
    },
    async ({ hospitalId, departmentId, registerType }) => {
      try {
        const hospital = pickById(ctx.search.hospitals, hospitalId);
        const department = pickById(ctx.search.departments, departmentId);
        if (!hospital) throw new Error("未找到 hospitalId，请先调用 search_hospitals。");
        if (!department) throw new Error("未找到 departmentId，请先调用 search_departments。");
        const response = await ctx.client.queryExpertList({
          hosOrgCode: hospital.hosOrgCode,
          platformHosNo: hospital.platformHosNo,
          hosDeptCode: department.hosDeptCode,
          topHosDeptCode: department.topHosDeptCode,
          registerType
        });
        assertOk(response, "查询专家失败");
        const experts = mapExperts(response.data?.doctorEntities ?? [], {
          hospitalId,
          departmentId,
          registerType
        });
        ctx.search.experts = experts;
        ctx.search.slots = [];
        return ok({
          hospital: hospital.name,
          department: department.name,
          experts: experts.map(({ raw, ...item }) => item),
          next: "选择 expert id 后调用 list_expert_slots。"
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "list_expert_slots",
    {
      title: "查询专家可约时间",
      description: "选择专家后返回可预约日期、上午/下午、余号和价格。",
      inputSchema: z.object({
        expertId: z.string()
      })
    },
    async ({ expertId }) => {
      try {
        const expert = pickById(ctx.search.experts, expertId);
        if (!expert) throw new Error("未找到 expertId，请先调用 list_available_experts。");
        if (!expert.hosDoctCode) throw new Error("该专家缺少 hosDoctCode，无法查询排班。");
        const hospital = pickById(ctx.search.hospitals, expert.hospitalId);
        const department = pickById(ctx.search.departments, expert.departmentId);
        if (!hospital || !department) throw new Error("医院或科室上下文已过期，请重新查询。");
        const rawSlots = await ctx.client.queryExpertSchedules({
          hosOrgCode: hospital.hosOrgCode,
          platformHosNo: hospital.platformHosNo,
          hosDeptCode: department.hosDeptCode,
          topHosDeptCode: department.topHosDeptCode,
          hosDoctCode: expert.hosDoctCode,
          registerType: expert.registerType
        });
        const slots = mapSlots(rawSlots).filter((slot) => slot.scheduleId);
        ctx.search.slots = slots;
        return ok({
          expert: expert.doctName,
          slots: slots.map(({ raw, ...item }) => item),
          next: "选择 slot id 后可调用 appointment_start。"
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );
}

function registerPatientTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "list_patients",
    {
      title: "列出已绑定就诊人",
      description: "返回当前账号下已绑定就诊人，敏感信息已脱敏。",
      inputSchema: z.object({}).optional()
    },
    async () => {
      try {
        const response = await ctx.client.listCards();
        assertOk(response, "查询就诊人失败");
        const patients = mapPatients(response.data ?? []);
        ctx.search.patients = patients;
        return ok({
          patients: patients.map(({ raw, ...item }) => item),
          next: "选择 patient id 用于 appointment_next。"
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "patient_add_start",
    {
      title: "开始新增就诊人",
      description: "创建新增就诊人聊天流程，每次只询问一个字段。",
      inputSchema: z.object({
        cardType: z.string().default("1")
      })
    },
    async ({ cardType }) => {
      const flow = ctx.flows.create("patient_add", { cardType });
      const draft = flow.draft as PatientAddDraft;
      const nextField = nextPatientAddField(draft);
      return ok({
        flowId: flow.id,
        nextField,
        prompt: patientAddPrompt(nextField),
        summary: summarizePatientAddDraft(draft)
      });
    }
  );

  server.registerTool(
    "patient_add_next",
    {
      title: "继续新增就诊人流程",
      description: "为新增就诊人流程提供一个字段，或获取验证码、发送短信、提交绑定。",
      inputSchema: z.object({
        flowId: z.string(),
        field: z.string().optional(),
        value: z.unknown().optional(),
        action: z.enum(["set_field", "get_captcha", "send_sms", "submit"]).default("set_field")
      })
    },
    async ({ flowId, field, value, action }) => {
      try {
        const flow = ctx.flows.require(flowId, "patient_add");
        let draft = flow.draft as PatientAddDraft;

        if (action === "get_captcha") {
          const captcha = await createCaptcha(ctx, "patient_add", flowId);
          draft = ctx.flows.update<PatientAddDraft>(flowId, { captcha }).draft as PatientAddDraft;
          return imageResult({
            text: JSON.stringify(
              {
                ok: true,
                flowId,
                captchaId: captcha.captchaId,
                nextField: "captchaCode",
                prompt: patientAddPrompt("captchaCode", captcha)
              },
              null,
              2
            ),
            dataUri: captcha.imageDataUri
          });
        }

        if (action === "send_sms") {
          if (!draft.captcha || !draft.captchaCode || !draft.mobile) {
            throw new Error("发送短信前需要手机号、图形验证码和 captchaCode。");
          }
          const response = await ctx.client.sendSmsCode({
            mobile: draft.mobile,
            captchaId: draft.captcha.captchaId,
            captchaCode: draft.captchaCode
          });
          assertOk(response, "发送短信验证码失败");
          return ok({ flowId, nextField: "smsCode", prompt: patientAddPrompt("smsCode") });
        }

        if (action === "submit") {
          const nextField = nextPatientAddField(draft);
          if (nextField !== "ready") {
            return fail("新增就诊人信息尚未完整。", {
              flowId,
              nextField,
              prompt: patientAddPrompt(nextField, draft.captcha),
              summary: summarizePatientAddDraft(draft)
            });
          }
          const response = await ctx.client.addCard(buildAddCardPayload(draft));
          assertOk(response, "新增就诊人失败");
          ctx.flows.delete(flowId);
          return ok({ message: response.msg ?? "新增就诊人成功，请调用 list_patients 刷新列表。" });
        }

        if (!field) throw new Error("set_field 需要提供 field。");
        const patch = validatePatientAddPatch(field, value);
        draft = ctx.flows.update<PatientAddDraft>(flowId, patch).draft as PatientAddDraft;
        const nextField = nextPatientAddField(draft);
        return ok({
          flowId,
          nextField,
          prompt: patientAddPrompt(nextField, draft.captcha),
          summary: summarizePatientAddDraft(draft)
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );
}

function registerAppointmentTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "appointment_start",
    {
      title: "开始预约流程",
      description: "基于已选择的专家和 slot 创建预约流程，并尝试展开具体时段。",
      inputSchema: z.object({
        hospitalId: z.string(),
        departmentId: z.string(),
        expertId: z.string(),
        slotId: z.string()
      })
    },
    async ({ hospitalId, departmentId, expertId, slotId }) => {
      try {
        const hospital = pickById(ctx.search.hospitals, hospitalId);
        const department = pickById(ctx.search.departments, departmentId);
        const expert = pickById(ctx.search.experts, expertId);
        const slot = pickById(ctx.search.slots, slotId);
        if (!hospital || !department || !expert || !slot) {
          throw new Error("医院、科室、专家或时间上下文缺失，请重新查询。");
        }
        if (slot.status === "2" || slot.statusText === "约满") throw new Error("该号源不可预约。");
        let selectedSlot = slot;
        const segments = await ctx.client.queryTimeSegments({
          hosOrgCode: hospital.hosOrgCode,
          platformHosNo: hospital.platformHosNo,
          scheduleId: slot.scheduleId
        });
        const segmentSlots = mapTimeSegments(segments, slot).filter((item) => item.numSourceId);
        if (segmentSlots.length > 0) {
          ctx.search.slots = segmentSlots;
          selectedSlot = segmentSlots[0];
        }
        const flow = ctx.flows.create("appointment", {
          hospital,
          department,
          expert,
          slot: selectedSlot
        });
        const field = nextAppointmentField(flow.draft as AppointmentDraft);
        return ok({
          flowId: flow.id,
          timeSegments: segmentSlots.map(({ raw, ...item }) => item),
          selectedSlot: omitRaw(selectedSlot),
          nextField: field,
          prompt:
            segmentSlots.length > 1
              ? "已展开具体可约时段；如需更换时段，调用 appointment_next field=slot value=time_x。否则请选择就诊人。"
              : "请选择就诊人。",
          summary: summarizeAppointment(flow.draft as AppointmentDraft)
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "appointment_next",
    {
      title: "继续预约流程",
      description: "为预约流程提供一个字段，或获取验证码、发送短信。",
      inputSchema: z.object({
        flowId: z.string(),
        field: z.string().optional(),
        value: z.unknown().optional(),
        action: z.enum(["set_field", "get_captcha", "send_sms"]).default("set_field")
      })
    },
    async ({ flowId, field, value, action }) => {
      try {
        const flow = ctx.flows.require(flowId, "appointment");
        let draft = flow.draft as AppointmentDraft;

        if (action === "get_captcha") {
          const captcha = await createCaptcha(ctx, "appointment", flowId);
          draft = ctx.flows.update<AppointmentDraft>(flowId, { captcha }).draft as AppointmentDraft;
          return imageResult({
            text: JSON.stringify(
              {
                ok: true,
                flowId,
                captchaId: captcha.captchaId,
                nextField: "captchaCode",
                prompt: "请查看验证码图片，并提供图形验证码。"
              },
              null,
              2
            ),
            dataUri: captcha.imageDataUri
          });
        }

        if (action === "send_sms") {
          if (!draft.captcha || !draft.captchaCode || !draft.mobile || !draft.slot?.scheduleId) {
            throw new Error("发送短信前需要手机号、图形验证码和排班信息。");
          }
          const response = await ctx.client.sendSmsCode({
            mobile: draft.mobile,
            captchaId: draft.captcha.captchaId,
            captchaCode: draft.captchaCode,
            scheduleId: draft.slot.scheduleId
          });
          assertOk(response, "发送预约短信验证码失败");
          return ok({ flowId, nextField: "smsCode", prompt: "请提供短信验证码。" });
        }

        if (!field) throw new Error("set_field 需要提供 field。");
        draft = applyAppointmentPatch(ctx, flowId, draft, field, value);
        const nextField = nextAppointmentField(draft);
        return ok({
          flowId,
          nextField,
          prompt: nextField === "confirm" ? "请调用 appointment_confirm 查看并确认摘要。" : nextField,
          summary: summarizeAppointment(draft)
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "appointment_confirm",
    {
      title: "确认预约摘要",
      description: "返回最终挂号摘要，用户确认后才允许提交。",
      inputSchema: z.object({
        flowId: z.string(),
        confirm: z.boolean().default(false)
      })
    },
    async ({ flowId, confirm }) => {
      try {
        const flow = ctx.flows.require(flowId, "appointment");
        let draft = flow.draft as AppointmentDraft;
        if (!confirm) {
          return ok({
            flowId,
            needsConfirmation: true,
            prompt: "请确认以下挂号信息。确认无误后再次调用 appointment_confirm，confirm=true。",
            summary: summarizeAppointment(draft)
          });
        }
        draft = ctx.flows.update<AppointmentDraft>(flowId, { confirmed: true }).draft as AppointmentDraft;
        return ok({
          flowId,
          nextField: nextAppointmentField(draft),
          prompt: "已确认。可以调用 appointment_submit 提交挂号。",
          summary: summarizeAppointment(draft)
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    "appointment_submit",
    {
      title: "提交挂号",
      description: "仅在用户确认后提交挂号。",
      inputSchema: z.object({
        flowId: z.string()
      })
    },
    async ({ flowId }) => {
      try {
        const flow = ctx.flows.require(flowId, "appointment");
        const draft = flow.draft as AppointmentDraft;
        const nextField = nextAppointmentField(draft);
        if (nextField !== "ready") {
          return fail("预约信息尚未完整或尚未确认，未提交。", {
            flowId,
            nextField,
            summary: summarizeAppointment(draft)
          });
        }
        const response = await ctx.client.submitReservation(buildReservationPayload(draft));
        assertOk(response, "提交挂号失败");
        ctx.flows.delete(flowId);
        return ok({
          message: response.msg ?? "挂号提交成功。",
          order: sanitizeReservationResult(response.data ?? {}),
          summary: summarizeAppointment(draft)
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );
}

async function createCaptcha(
  ctx: AppContext,
  purpose: CaptchaChallenge["purpose"],
  existingFlowId?: string
): Promise<CaptchaChallenge> {
  const captchaData = await ctx.client.getCaptcha();
  const flowId = existingFlowId ?? ctx.flows.create("captcha").id;
  const captcha: CaptchaChallenge = {
    flowId,
    captchaId: captchaData.captchaId,
    imageDataUri: captchaData.imageDataUri,
    purpose,
    prompt: "请读取图片验证码。"
  };
  if (existingFlowId) {
    ctx.flows.update(existingFlowId, { captcha });
  } else {
    ctx.flows.update(flowId, { captcha });
  }
  return captcha;
}

function applyAppointmentPatch(
  ctx: AppContext,
  flowId: string,
  draft: AppointmentDraft,
  field: string,
  value: unknown
): AppointmentDraft {
  if (field === "slot") {
    const slot = pickById(ctx.search.slots, String(value));
    if (!slot) throw new Error("未找到 slot/time 编号。");
    return ctx.flows.update<AppointmentDraft>(flowId, { slot }).draft as AppointmentDraft;
  }
  if (field === "patient") {
    const patient = pickById(ctx.search.patients, String(value));
    if (!patient) throw new Error("未找到 patient id，请先调用 list_patients。");
    const mobile = String((patient.raw as Record<string, unknown>).mobile ?? "");
    return ctx.flows.update<AppointmentDraft>(flowId, { patient, mobile }).draft as AppointmentDraft;
  }
  if (field === "mobile") {
    return ctx.flows.update<AppointmentDraft>(flowId, { mobile: requireText(value, "手机号") })
      .draft as AppointmentDraft;
  }
  if (field === "captchaCode") {
    return ctx.flows.update<AppointmentDraft>(flowId, { captchaCode: requireText(value, "图形验证码") })
      .draft as AppointmentDraft;
  }
  if (field === "smsCode") {
    return ctx.flows.update<AppointmentDraft>(flowId, { smsCode: requireText(value, "短信验证码") })
      .draft as AppointmentDraft;
  }
  throw new Error(`不支持的预约字段: ${field}`);
}

async function resolveRegisterArea(
  ctx: AppContext,
  flowId: string,
  draft: RegisterDraft,
  changedField: string
): Promise<RegisterDraft> {
  if (changedField === "provinceName") {
    const provinceResponse = await ctx.client.getProvince();
    assertOk(provinceResponse, "查询省份失败");
    return ctx.flows.update<RegisterDraft>(flowId, applyProvinceSelection(draft, provinceResponse.data ?? []))
      .draft as RegisterDraft;
  }

  if (changedField === "cityName") {
    let current = draft;
    if (!current.provinceId) {
      const provinceResponse = await ctx.client.getProvince();
      assertOk(provinceResponse, "查询省份失败");
      current = ctx.flows.update<RegisterDraft>(
        flowId,
        applyProvinceSelection(current, provinceResponse.data ?? [])
      ).draft as RegisterDraft;
    }
    const cityResponse = await ctx.client.getCity({ provinceId: current.provinceId ?? "" });
    assertOk(cityResponse, "查询城市失败");
    return ctx.flows.update<RegisterDraft>(flowId, applyCitySelection(current, cityResponse.data ?? []))
      .draft as RegisterDraft;
  }

  return draft;
}

function sanitizeUserInfo(userInfo: Record<string, unknown>): Record<string, unknown> {
  return {
    username: userInfo.username,
    mobile: maskMobile(userInfo.mobile),
    cardId: maskCardId(userInfo.cardId)
  };
}

function assertCanContinueRegister(draft: RegisterDraft): void {
  if (draft.offlineFirstVisit === true) return;
  throw new Error(
    "暂不能继续线上注册。医联预约网页登录/注册通常要求用户已在线下完成该院初诊或建档；如果用户没有线下初诊，请不要收集注册隐私信息，只查询医院位置、可预约专家和可约时间。"
  );
}

function registrationBlockedByFirstVisit(flowId: string): Record<string, unknown> {
  return {
    flowId,
    canRegister: false,
    flowClosed: true,
    message:
      "用户尚未线下初诊/建档，不能继续通过网页注册账号。本次注册流程已结束，不会继续收集姓名、证件号、手机号或验证码。",
    allowedActions: [
      "search_hospitals 查询医院/院区和地址",
      "search_departments 查询科室",
      "list_available_experts 查询可预约专家",
      "list_expert_slots 查询专家可约时间"
    ],
    next: "请只返回医院位置、可预约专家和可约时间；如需注册或正式挂号，请提示用户先按医院要求完成线下初诊/建档。"
  };
}

function sanitizeReservationResult(data: Record<string, unknown>): Record<string, unknown> {
  return {
    orderId: data.orderId ?? data.pfOrderId,
    paymentNo: data.paymentNo,
    orderName: data.orderName,
    papersNum: maskCardId(data.papersNum),
    mediCardid: data.mediCardid ? maskCardId(data.mediCardid) : undefined,
    mobile: maskMobile(data.mobile)
  };
}

function omitRaw<T extends { raw: unknown }>(value: T): Omit<T, "raw"> {
  const { raw: _raw, ...rest } = value;
  return rest;
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`${label}不能为空`);
  const text = String(value).trim();
  if (!text) throw new Error(`${label}不能为空`);
  return text;
}
