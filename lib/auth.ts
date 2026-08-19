import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getUserByEmail, getUserById } from "./db";
import {
  createSessionToken,
  type SessionPayload,
  verifySessionToken,
} from "./session";

export type { SessionPayload } from "./session";
export {
  createSessionToken,
  getSessionFromRequest,
  requireAdminRole,
  sessionCookieOptions,
  clearSessionCookieOptions,
  verifySessionToken,
} from "./session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, password: string) {
  const record = await getUserByEmail(email);
  if (!record?.passwordHash) return null;
  const valid = await verifyPassword(password, record.passwordHash);
  if (!valid) return null;
  return record;
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("racktag_session")?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await getUserById(session.userId);
  if (!user || user.orgId !== session.orgId) return null;
  return session;
}
