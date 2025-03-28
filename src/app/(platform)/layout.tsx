"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { TRPCReactProvider } from "~/trpc/react";
import { HydrateClient } from "~/trpc/server";
import { Onborda, OnbordaProvider } from "onborda";
import { extractRouterConfig } from "uploadthing/server";

import { getCurrentSession } from "~/server/session";

import { Toaster } from "~/components/ui/toaster";
import { TourCard } from "~/components/tour-card";

import { ClientLayout } from "~/app/(platform)/client-layout";
import { ourFileRouter } from "~/app/api/uploadthing/core";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user } = await getCurrentSession();

  const cookieStore = await cookies();

  if (!user) {
    return redirect("/log-in");
  }

  if (session == null) {
    return redirect("/log-in");
  } else {
    if (!user.emailVerified && !user.githubId && !user.googleId) {
      return redirect("/verify-email");
    }
    if (user.registered2FA && !session.twoFactorVerified) {
      return redirect("/2fa");
    }
    if (
      !user.registered2FA &&
      cookieStore.get("disable2FAReminder")?.value != "yes"
    ) {
      return redirect("/2fa/setup");
    }
  }

  return (
    <TRPCReactProvider>
      <HydrateClient>
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <OnbordaProvider>
          <Onborda
            interact={true}
            cardComponent={TourCard}
            shadowOpacity="0.6"
            cardTransition={{ type: "spring", stiffness: 300, damping: 30 }}
            steps={[
              {
                tour: "welcome-tour",
                steps: [
                  {
                    icon: <>👋</>,
                    title: "Welcome to Regreso!",
                    content: (
                      <>Learn about how to use Regreso and its features.</>
                    ),
                    selector: "#start-tour",
                    side: "bottom",
                    showControls: true,
                    pointerPadding: 45,

                    pointerRadius: 10,
                  },
                  {
                    icon: <>⛵</>,
                    title: "This is your first crew",
                    content: (
                      <>
                        You&apos;re all alone for now. But one day you might
                        invite friends.
                      </>
                    ),
                    selector: "#team-switcher",
                    side: "bottom",
                    showControls: true,
                    pointerPadding: 40,
                    pointerRadius: 10,
                  },
                  {
                    icon: <>🌎</>,
                    title: "Create your first destination",
                    content: (
                      <>
                        Destinations are key to Regreso. An optional location,
                        headline, body, and tags can be provided.
                      </>
                    ),
                    selector: "#create-destination",
                    side: "bottom",
                    showControls: true,
                    pointerPadding: 30,
                    pointerRadius: 10,
                  },
                  {
                    icon: <>🗺</>,
                    title: "Organize your destinations",
                    content: (
                      <>
                        Create maps of destinations to find and group them
                        easily.
                      </>
                    ),
                    selector: "#create-map",
                    side: "bottom",
                    showControls: true,
                    pointerPadding: 45,
                    pointerRadius: 10,
                    nextRoute: "/search/pins",
                  },
                  {
                    icon: <>🔎</>,
                    title: "Find your stuff later",
                    content: (
                      <>
                        Locate destinations by searching using tags, name,
                        location, or maps.
                      </>
                    ),
                    selector: "#search-button",
                    side: "bottom",
                    showControls: true,
                    pointerPadding: 45,
                    pointerRadius: 10,
                    prevRoute: "/dashboard",
                    nextRoute: "/dashboard",
                  },
                ],
              },
            ]}
          >
            <ClientLayout user={user}>{children}</ClientLayout>
          </Onborda>
        </OnbordaProvider>
        <Toaster />
      </HydrateClient>
    </TRPCReactProvider>
  );
}
