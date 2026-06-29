import crypto from "node:crypto";
import { sm2 } from "sm-crypto";
import { SHDC_RSA_PUBLIC_KEY } from "../config.js";

export function sortObjectForWire(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(input).sort()) {
    const value = input[key];
    output[key] = value === 0 || value ? value : "";
  }
  return output;
}

export function encryptJsonPayload(input: Record<string, unknown>): string {
  return rsaEncryptLong(JSON.stringify(sortObjectForWire(input)));
}

export function encryptGetPayload(input?: Record<string, unknown>): string | undefined {
  if (!input || Object.keys(input).length === 0) return undefined;
  const parts: string[] = [];
  for (const key of Object.keys(input)) {
    const value = input[key];
    parts.push(`${key}=${value === 0 || value ? String(value) : ""}`);
  }
  return rsaEncryptLong(parts.join("&"));
}

export function createSignature(seed?: string): string {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const timestamp = Date.now();
  return rsaEncryptLong(seed ? `${nonce}+${timestamp}+${seed}` : `${nonce}+${timestamp}`);
}

export function rsaEncryptLong(value: string): string {
  const pem = `-----BEGIN PUBLIC KEY-----\n${SHDC_RSA_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;
  const hex = splitUtf8Chunks(value, 110)
    .map((chunk) =>
      crypto
        .publicEncrypt(
          {
            key: pem,
            padding: crypto.constants.RSA_PKCS1_PADDING
          },
          chunk
        )
        .toString("hex")
    )
    .join("");
  return Buffer.from(hex, "hex").toString("base64");
}

export function generateSm2KeyPair(): { publicKey: string; privateKey: string } {
  return sm2.generateKeyPairHex();
}

export function sm2DecryptJson<T>(cipherText: unknown, privateKey: string, fallback: T): T {
  if (typeof cipherText !== "string" || cipherText.length === 0) return fallback;
  try {
    const decrypted = sm2.doDecrypt(cipherText, privateKey, 0);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    throw new Error(`SM2 response decrypt failed: ${(error as Error).message}`);
  }
}

export function sm2DecryptText(cipherText: unknown, privateKey: string): string | undefined {
  if (typeof cipherText !== "string" || cipherText.length === 0) return undefined;
  try {
    return sm2.doDecrypt(cipherText, privateKey, 0);
  } catch {
    return undefined;
  }
}

function splitUtf8Chunks(value: string, maxBytes: number): Buffer[] {
  const chunks: Buffer[] = [];
  let current = "";
  for (const char of value) {
    const next = current + char;
    if (Buffer.byteLength(next, "utf8") > maxBytes) {
      chunks.push(Buffer.from(current, "utf8"));
      current = char;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(Buffer.from(current, "utf8"));
  return chunks;
}
