import type { LocalSession } from "../types.js";
import { EncryptedStore } from "./encryptedStore.js";

export class SessionStore {
  private readonly store = new EncryptedStore<LocalSession>();
  private cache?: LocalSession;

  async get(): Promise<LocalSession> {
    this.cache ??= await this.store.read({});
    return this.cache;
  }

  async set(session: LocalSession): Promise<void> {
    this.cache = { ...session, updatedAt: new Date().toISOString() };
    await this.store.write(this.cache);
  }

  async update(patch: LocalSession): Promise<LocalSession> {
    const current = await this.get();
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    await this.set(next);
    return next;
  }

  async clear(): Promise<void> {
    this.cache = {};
    await this.store.clear();
  }
}

