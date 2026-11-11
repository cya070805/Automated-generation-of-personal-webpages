import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // 去掉了容易看错的 0/o/1/l/i

/** 编辑链接里的密钥：22 字符 base64url，够长、可以放进 URL */
export function createEditToken(): string {
  return randomBytes(16).toString("base64url");
}

/** 分享页短链：8 位，避免和常见词撞车 */
export function createSlug(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** 简单的口令哈希：scrypt + 随机盐，分享页访问密码用 */
export function isValidEditToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(token);
}

/** 分享页访问密码：scrypt + 随机盐，只存哈希 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
}

/** 解锁凭证 = 哈希的摘要，换密码即失效，不需要额外的会话表 */
export function shareCookieValue(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex");
}
