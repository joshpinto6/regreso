import { redirect } from "next/navigation";

import { globalGETRateLimit } from "~/server/request";
import { getCurrentSession } from "~/server/session";

import { SignupForm } from "~/components/signup-form";

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return "Too many requests!!";
  }
  const { session, user } = await getCurrentSession();
  if (session !== null) {
    if (!user.emailVerified) {
      return redirect("/verify-email");
    }
    if (user.registered2FA && !session.twoFactorVerified) {
      return redirect("/2fa");
    }
    return redirect("/dashboard");
  }

  return <SignupForm />;
}
