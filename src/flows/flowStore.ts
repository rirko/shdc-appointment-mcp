import type { AppointmentDraft, FlowKind, FlowState, PatientAddDraft, RegisterDraft } from "../types.js";
import { createId } from "../utils/ids.js";

export class FlowStore {
  private readonly flows = new Map<string, FlowState>();

  create(kind: "appointment", draft?: Partial<AppointmentDraft>): FlowState;
  create(kind: "patient_add", draft?: Partial<PatientAddDraft>): FlowState;
  create(kind: "register", draft?: Partial<RegisterDraft>): FlowState;
  create(kind: "captcha", draft?: Record<string, unknown>): FlowState;
  create(kind: FlowKind, draft: Record<string, unknown> = {}): FlowState {
    const now = new Date().toISOString();
    const flow: FlowState = {
      id: createId(kind),
      kind,
      createdAt: now,
      updatedAt: now,
      draft
    };
    this.flows.set(flow.id, flow);
    return flow;
  }

  get(id: string): FlowState | undefined {
    return this.flows.get(id);
  }

  require(id: string, kind?: FlowKind): FlowState {
    const flow = this.flows.get(id);
    if (!flow) {
      throw new Error(
        `流程不存在或已过期: ${id}。请在同一个 MCP stdio 会话内继续调用；如果客户端每次调用都重启 MCP 进程，请重新开始该验证码/预约流程。`
      );
    }
    if (kind && flow.kind !== kind) throw new Error(`流程类型不匹配: expected ${kind}, got ${flow.kind}`);
    return flow;
  }

  update<T extends object>(id: string, patch: Partial<T>): FlowState {
    const flow = this.require(id);
    flow.draft = { ...(flow.draft as Record<string, unknown>), ...patch };
    flow.updatedAt = new Date().toISOString();
    this.flows.set(id, flow);
    return flow;
  }

  delete(id: string): void {
    this.flows.delete(id);
  }
}
