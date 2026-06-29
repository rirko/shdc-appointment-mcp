import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DATA_DIR, SESSION_FILE } from "../config.js";

interface EncryptedEnvelope {
  version: 1;
  iv: string;
  tag: string;
  data: string;
}

export class EncryptedStore<T extends object> {
  private readonly filePath: string;

  constructor(rootDir = process.cwd()) {
    this.filePath = path.join(rootDir, DATA_DIR, SESSION_FILE);
  }

  async read(defaultValue: T): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const envelope = JSON.parse(raw) as EncryptedEnvelope;
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        deriveKey(),
        Buffer.from(envelope.iv, "base64")
      );
      decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(envelope.data, "base64")),
        decipher.final()
      ]);
      return JSON.parse(decrypted.toString("utf8")) as T;
    } catch {
      return defaultValue;
    }
  }

  async write(value: T): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final()
    ]);
    const envelope: EncryptedEnvelope = {
      version: 1,
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: encrypted.toString("base64")
    };
    await fs.writeFile(this.filePath, JSON.stringify(envelope, null, 2), "utf8");
  }

  async clear(): Promise<void> {
    await fs.rm(this.filePath, { force: true });
  }
}

function deriveKey(): Buffer {
  const material = [
    os.userInfo().username,
    os.hostname(),
    process.cwd(),
    "shdc-appointment-mcp-v1"
  ].join("|");
  return crypto.createHash("sha256").update(material).digest();
}

