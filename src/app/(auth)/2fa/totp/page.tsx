import Link from "next/link";
import { redirect } from "next/navigation";

import { globalGETRateLimit } from "~/server/request";
import { getCurrentSession } from "~/server/session";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TwoFactorVerificationForm } from "~/components/2fa-verify";

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return "Too many requests";
  }

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return redirect("/log-in");
  }
  if (!user.emailVerified) {
    return redirect("/verify-email");
  }
  if (!user.registered2FA) {
    return redirect("/2fa/setup");
  }
  if (session.twoFactorVerified) {
    return redirect("/dashboard");
  }
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">
          Authenticate with authenticator app
        </CardTitle>
        <CardDescription>Enter the code from your app.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TwoFactorVerificationForm />
        <Button asChild variant="outline">
          <Link href="/2fa/reset">Use recovery code</Link>
        </Button>
        <div>
          {user.registeredPasskey && (
            <Button asChild variant="outline">
              <Link href="/2fa/passkey">Use passkeys</Link>
            </Button>
          )}
        </div>
        {user.registeredSecurityKey && (
          <Button asChild variant="outline">
            <Link href="/2fa/security-key">Use security keys</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
