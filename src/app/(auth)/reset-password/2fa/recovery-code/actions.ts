"use server";

import { redirect } from "next/navigation";

import { recoveryCodeBucket, resetUser2FAWithRecoveryCode } from "~/server/2fa";
import { getCurrentPasswordResetSession } from "~/server/password-reset";
import { globalPOSTRateLimit } from "~/server/request";

export async function verifyPasswordReset2FAWithRecoveryCodeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) {
    return {
      message: "Too many requests",
    };
  }

  const { session, user } = await getCurrentPasswordResetSession();
  if (session === null) {
    return {
      message: "Not authenticated",
    };
  }
  if (
    !session.emailVerified ||
    !user.registered2FA ||
    session.twoFactorVerified
  ) {
    return {
      message: "Forbidden",
    };
  }

  if (!recoveryCodeBucket.check(session.userId, 1)) {
    return {
      message: "Too many requests",
    };
  }
  const code = formData.get("code");
  if (typeof code !== "string") {
    return {
      message: "Invalid or missing fields",
    };
  }
  if (code === "") {
    return {
      message: "Please enter your code",
    };
  }
  if (!recoveryCodeBucket.consume(session.userId, 1)) {
    return {
      message: "Too many requests",
    };
  }
  const valid = await resetUser2FAWithRecoveryCode(session.userId, code);
  if (!valid) {
    return {
      message: "Invalid code",
    };
  }
  recoveryCodeBucket.reset(session.userId);
  return redirect("/reset-password");
}

interface ActionResult {
  message: string;
}
