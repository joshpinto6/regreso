import { db } from "~/server/db";
import {
  users,
  sessions,
  totpCredentials,
  passkeyCredentials,
  securityKeyCredentials,
} from "~/server/db/schema";

import { generateRandomRecoveryCode } from "~/server/utils";
import { ExpiringTokenBucket } from "~/server/rate-limit";
import { decryptToString, encryptString } from "~/server/encryption";

import type { User } from "~/server/db/models";
import { eq } from "drizzle-orm";

export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export async function resetUser2FAWithRecoveryCode(
  userId: number,
  recoveryCode: string,
): Promise<boolean> {
  // Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
  await db.transaction(async (tx) => {
    try {
      const [user] = await tx
        .select({ recoveryCode: users.recoveryCode })
        .from(users)
        .where(eq(users.id, userId));

      if (!user?.recoveryCode) {
        tx.rollback();
        return false;
      }
      const encryptedRecoveryCode = user?.recoveryCode;
      const userRecoveryCode = decryptToString(
        Uint8Array.from(
          atob(encryptedRecoveryCode)
            .split("")
            .map((char) => char.charCodeAt(0)),
        ),
      );
      if (recoveryCode !== userRecoveryCode) {
        tx.rollback();
        return false;
      }

      const newRecoveryCode = generateRandomRecoveryCode();
      const encryptedNewRecoveryCode = encryptString(newRecoveryCode);

      const setRecoveryCode = await tx
        .update(users)
        .set({
          recoveryCode: Buffer.from(encryptedNewRecoveryCode).toString(
            "base64",
          ),
        })
        .where(eq(users.id, userId))
        .returning({ recoveryCode: users.recoveryCode });

      if (
        setRecoveryCode &&
        setRecoveryCode.length > 0 &&
        setRecoveryCode[0] &&
        setRecoveryCode[0].recoveryCode ==
          Buffer.from(encryptedNewRecoveryCode).toString("base64")
      ) {
        tx.rollback();
        return false;
      }
      await tx
        .update(sessions)
        .set({
          twoFactorVerified: false,
        })
        .where(eq(users.id, userId))
        .returning({ recoveryCode: users.recoveryCode });

      await tx.delete(totpCredentials).where(eq(users.id, userId));
      await tx.delete(passkeyCredentials).where(eq(users.id, userId));
      await tx.delete(securityKeyCredentials).where(eq(users.id, userId));
    } catch (e) {
      tx.rollback();
      throw e;
      return false;
    }
  });

  return true;
}

export function get2FARedirect(user: User): string {
  if (user.registeredPasskey) {
    return "/2fa/passkey";
  }
  if (user.registeredSecurityKey) {
    return "/2fa/security-key";
  }
  if (user.registeredTOTP) {
    return "/2fa/totp";
  }
  return "/2fa/setup";
}

export function getPasswordReset2FARedirect(user: User): string {
  if (user.registeredPasskey) {
    return "/reset-password/2fa/passkey";
  }
  if (user.registeredSecurityKey) {
    return "/reset-password/2fa/security-key";
  }
  if (user.registeredTOTP) {
    return "/reset-password/2fa/totp";
  }
  return "/2fa/setup";
}
