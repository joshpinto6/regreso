import Link from "next/link";

import { globalGETRateLimit } from "~/server/request";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ForgotPasswordForm } from "~/components/forgot-password";

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return "Too many requests";
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription>
          Send a password reset link to your email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <div className="mt-3 flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/log-in">Log in</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
