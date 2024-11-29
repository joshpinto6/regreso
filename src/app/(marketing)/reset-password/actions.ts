"use server";

import { verifyPasswordStrength } from "~/server/password";
import {
  deletePasswordResetSessionTokenCookie,
  invalidateUserPasswordResetSessions,
  getCurrentPasswordResetSession,
} from "~/server/password-reset";
import {
  createSession,
  generateSessionToken,
  invalidateUserSessions,
  setSessionTokenCookie,
} from "~/server/session";
import { updateUserPassword } from "~/server/user";
import { redirect } from "next/navigation";
import { globalPOSTRateLimit } from "~/server/request";

import type { SessionFlags } from "~/server/models";

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) {
    return {
      message: "Too many requests",
    };
  }

  const { session: passwordResetSession, user } =
    await getCurrentPasswordResetSession();
  if (passwordResetSession === null) {
    return {
      message: "Not authenticated",
    };
  }
  if (!passwordResetSession.emailVerified) {
    return {
      message: "Forbidden",
    };
  }
  if (user.registered2FA && !passwordResetSession.twoFactorVerified) {
    return {
      message: "Forbidden",
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string") {
    return {
      message: "Invalid or missing fields",
    };
  }

  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) {
    return {
      message: "Weak password",
    };
  }
  invalidateUserPasswordResetSessions(passwordResetSession.userId);
  void invalidateUserSessions(passwordResetSession.userId);
  await updateUserPassword(passwordResetSession.userId, password);

  const sessionFlags: SessionFlags = {
    twoFactorVerified: passwordResetSession.twoFactorVerified,
  };
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, sessionFlags);
  void setSessionTokenCookie(sessionToken, session.expiresAt);
  void deletePasswordResetSessionTokenCookie();
  return redirect("/dashboard");
}

interface ActionResult {
  message: string;
}
