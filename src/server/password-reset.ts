import { cache } from "react";
import { cookies } from "next/headers";

import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import type { User } from "~/server/models";

import { db } from "~/server/db";
import { passwordResetSessions } from "~/server/db/schema";
import { generateRandomOTP } from "~/server/utils";
import { getBaseOrigin } from "~/lib/utils";

export async function createPasswordResetSession(
  token: string,
  userId: number,
  email: string,
): Promise<PasswordResetSession> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: PasswordResetSession = {
    id: sessionId,
    userId,
    email,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    code: generateRandomOTP(),
    emailVerified: false,
    twoFactorVerified: false,
  };

  await db.insert(passwordResetSessions).values(session);
  return session;
}

export async function validatePasswordResetSessionToken(
  token: string,
): Promise<PasswordResetSessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const resetSession = await db.query.passwordResetSessions.findFirst({
    where: eq(passwordResetSessions.id, sessionId),
    with: {
      user: {
        with: {
          totpCredentials: true,
          passkeyCredentials: true,
          securityKeyCredentials: true,
        },
      },
    },
  });
  if (!resetSession) {
    return { session: null, user: null };
  }
  const session: PasswordResetSession = {
    id: resetSession.id,
    userId: resetSession.userId,
    email: resetSession.email,
    code: resetSession.code,
    expiresAt: resetSession.expiresAt,
    emailVerified: resetSession.emailVerified,
    twoFactorVerified: resetSession.twoFactorVerified,
  };
  const user: User = {
    id: resetSession.user.id,
    email: resetSession.user.email,
    displayName: resetSession.user.displayName,
    bio: resetSession.user.bio,
    name: resetSession.user.name,
    emailVerified: resetSession.user.emailVerified,
    registered2FA: false,
    registeredSecurityKey: resetSession.user.securityKeyCredentials.length > 0,
    registeredTOTP: resetSession.user.totpCredentials.length > 0,
    registeredPasskey: resetSession.user.passkeyCredentials.length > 0,
    avatarUrl: resetSession.user.avatarUrl,
    workspaceId: resetSession.user.workspaceId,
  };
  if (
    user.registeredPasskey ||
    user.registeredSecurityKey ||
    user.registeredTOTP
  ) {
    user.registered2FA = true;
  }

  return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(
  sessionId: string,
): Promise<void> {
  await db
    .update(passwordResetSessions)
    .set({
      emailVerified: true,
    })
    .where(eq(passwordResetSessions.id, sessionId))
    .returning({ emailVerified: passwordResetSessions.emailVerified });
}

export async function setPasswordResetSessionAs2FAVerified(
  sessionId: string,
): Promise<void> {
  await db
    .update(passwordResetSessions)
    .set({
      twoFactorVerified: true,
    })
    .where(eq(passwordResetSessions.id, sessionId))
    .returning({ twoFactorVerified: passwordResetSessions.twoFactorVerified });
}

export function invalidateUserPasswordResetSessions(userId: number): void {
  db.delete(passwordResetSessions).where(
    eq(passwordResetSessions.userId, userId),
  );
}

export const getCurrentPasswordResetSession = cache(async () => {
  const token = (await cookies()).get("password_reset_session")?.value ?? null;

  if (token === null) {
    return { session: null, user: null };
  }
  const result = await validatePasswordResetSessionToken(token);

  if (result.session === null) {
    void deletePasswordResetSessionTokenCookie();
  }
  return result;
});

export async function setPasswordResetSessionTokenCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  (await cookies()).set("password_reset_session", token, {
    expires: expiresAt,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function deletePasswordResetSessionTokenCookie(): Promise<void> {
  (await cookies()).set("password_reset_session", "", {
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<Error | null> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    secure: true,
    port: 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Regreso Password Reset Request",
    html: `<div><p>To ${email}: A password reset request has been created for your email from <a href="${getBaseOrigin()}">Regreso</a>. Your reset code is ${code}</p>
    <p>Enter this code in the password reset form to continue restoring accesss to your account.</p>
    <p>If you have 2-factor auth set up, you may be required to prove your identity using one of these methods as well. 
    <strong>If you did  not request this, ignore this message.</strong>
    </p>
    <strong>The Regreso Team</strong></div>`,
  };
  return new Promise((resolve) => {
    transporter.sendMail(mailOptions, function (err) {
      if (err) {
        resolve(err);
      } else {
        resolve(null);
      }
    });
    setTimeout(() => {
      transporter.close();
      resolve(new Error("Timeout"));
    }, 1000);
  });
}

export interface PasswordResetSession {
  id: string;
  userId: number;
  email: string;
  expiresAt: Date;
  code: string;
  emailVerified: boolean;
  twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
  | { session: PasswordResetSession; user: User }
  | { session: null; user: null };
