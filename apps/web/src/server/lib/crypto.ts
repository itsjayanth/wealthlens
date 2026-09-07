import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV length for GCM
const KEY_LENGTH = 32; // AES-256 requires a 32-byte key

/**
 * Resolves CREDENTIALS_ENCRYPTION_KEY into a 32-byte Buffer.
 * Accepts base64 or hex encoding. Throws only when actually invoked (not at
 * import time) so the server can boot even if this env var is misconfigured
 * for routes that don't need it yet.
 */
function resolveKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. Provide a 32-byte key (base64 or hex encoded)."
    );
  }

  let key: Buffer;
  // Try base64 first (the documented default), fall back to hex.
  const base64Candidate = Buffer.from(raw, "base64");
  if (base64Candidate.length === KEY_LENGTH) {
    key = base64Candidate;
  } else {
    const hexCandidate = Buffer.from(raw, "hex");
    if (hexCandidate.length === KEY_LENGTH) {
      key = hexCandidate;
    } else {
      throw new Error(
        `CREDENTIALS_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes (base64 or hex). ` +
          `Got ${base64Candidate.length} bytes as base64 / ${hexCandidate.length} bytes as hex.`
      );
    }
  }

  return key;
}

export interface EncryptedPayload {
  iv: string; // base64
  authTag: string; // base64
  ciphertext: string; // base64
}

/**
 * Encrypts plaintext with AES-256-GCM. Returns a payload serialized as a
 * single string ("iv:authTag:ciphertext", all base64) suitable for storing
 * directly in a text column.
 */
export function encrypt(plaintext: string): string {
  const key = resolveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };

  return `${payload.iv}:${payload.authTag}:${payload.ciphertext}`;
}

/**
 * Decrypts a payload produced by encrypt().
 */
export function decrypt(payload: string): string {
  const key = resolveKey();
  const [ivB64, authTagB64, ciphertextB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted payload");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
