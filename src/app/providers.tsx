"use client";

import * as React from "react";
import { type ReactNode } from "react";
import dynamic from "next/dynamic";

import { type ThemeProviderProps } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const NextThemesProvider = dynamic(
  () => import("next-themes").then((e) => e.ThemeProvider),
  {
    ssr: false,
  },
);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return React.useMemo(
    () => <NextThemesProvider {...props}>{children}</NextThemesProvider>,
    [children, props],
  );
}

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,
    disable_session_recording: process.env.NODE_ENV === "development",
    person_profiles: "identified_only",
  });
}

export function CSPostHogProvider({ children }: { children: ReactNode }) {
  return React.useMemo(
    () => <PostHogProvider client={posthog}>{children}</PostHogProvider>,
    [children],
  );
}
