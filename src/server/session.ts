import { cache } from "react";
import { cookies } from "next/headers";

import { sha256 } from "@oslojs/crypto/sha2";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { eq } from "drizzle-orm";
import type { Session, SessionFlags, User } from "~/server/models";

import { db } from "~/server/db";
import {
  passkeyCredentials,
  securityKeyCredentials,
  sessions,
  totpCredentials,
  users,
} from "~/server/db/schema";

export async function validateSessionToken(
  token: string,
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await db
    .select({
      user: users,
      session: sessions,
      totpCredentials,
      passkeyCredentials,
      securityKeyCredentials,
      avatarUrl: users.avatarUrl,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(totpCredentials, eq(sessions.userId, totpCredentials.userId))
    .leftJoin(
      passkeyCredentials,
      eq(sessions.userId, passkeyCredentials.userId),
    )
    .leftJoin(
      securityKeyCredentials,
      eq(sessions.userId, securityKeyCredentials.userId),
    )
    .where(eq(sessions.id, sessionId));

  if (result.length < 1) {
    return { session: null, user: null };
  }
  const user: User = {
    id: result[0]!.user.id,
    email: result[0]!.user.email,
    displayName: result[0]!.user.displayName,
    bio: result[0]!.user.bio,
    name: result[0]!.user.name,
    workspaceId: result[0]!.user.workspaceId,
    emailVerified: result[0]!.user.emailVerified,
    googleId: result[0]!.user.googleId,
    githubId: result[0]!.user.githubId,
    registeredPasskey: !!result[0]!.passkeyCredentials,
    registeredSecurityKey: !!result[0]!.securityKeyCredentials,
    registeredTOTP: !!result[0]!.totpCredentials,
    avatarUrl: result[0]!.avatarUrl,
    registered2FA: !!(
      result[0]!.totpCredentials ??
      result[0]!.securityKeyCredentials ??
      result[0]!.passkeyCredentials
    ),
  };
  const session = result[0]!.session;
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return { session: null, user: null };
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db
      .update(sessions)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(sessions.id, session.id));
  }
  return { session, user };
}

export function invalidateSession(sessionId: string): void {
  db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function invalidateUserSessions(userId: number): void {
  db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function createSession(
  token: string,
  userId: number,
  flags: SessionFlags,
): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    twoFactorVerified: flags.twoFactorVerified,
  };
  await db.insert(sessions).values(session);
  return session;
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export async function setSessionTokenCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSessionTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function setSessionAs2FAVerified(
  sessionId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ twoFactorVerified: true })
    .where(eq(sessions.id, sessionId));
}

export const getCurrentSession = cache(
  async (): Promise<SessionValidationResult> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value ?? null;
    if (token === null) {
      return { session: null, user: null };
    }
    const result = await validateSessionToken(token);
    return result;
  },
);

export async function getSession(
  token: string,
): Promise<SessionValidationResult> {
  if (token === null) {
    return { session: null, user: null };
  }
  const result = await validateSessionToken(token);
  return result;
}

type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };
