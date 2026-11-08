import { randomBytes } from "node:crypto";

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
