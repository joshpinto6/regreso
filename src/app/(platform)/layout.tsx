"use server";
import { redirect } from "next/navigation";
import { getCurrentSession } from "~/server/session";
import { HydrateClient } from "~/trpc/server";
import { ClientLayout } from "~/app/(platform)/client-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user } = await getCurrentSession();

  // TODO: Audit this auth logic
  if (user) {
    if (session == null) {
      return redirect("/log-in");
    } else {
      console.log(!user.githubId, session);
      if (!user.emailVerified && !user.githubId && !user.googleId) {
        console.log("redirect");
        return redirect("/verify-email");
      }
      if (user.registered2FA && !session.twoFactorVerified) {
        return redirect("/2fa");
      }
      //   return redirect("/dashboard");
    }
  }

  return (
    <HydrateClient>
      <ClientLayout user={user}>{children}</ClientLayout>
    </HydrateClient>
  );
}
