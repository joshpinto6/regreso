"use client";

import React, { memo, useMemo } from "react";
import Link from "next/link";

import { Github } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "~/components/ui/button";
import { MacbookScroll } from "~/components/ui/macbook-scroll";
import { FeatureCards } from "~/components/feature-cards";
import Hero from "~/components/hero";
import { Footer, LandingNavigation } from "~/components/landing-navigation";

const MacbookScrollDemo = memo(function MacbookScrollDemo() {
  const { theme } = useTheme();

  const src = React.useMemo(() => {
    return `/dashboard-screenshot-${theme === "system" ? "dark" : theme}.png`;
  }, [theme]);

  const title = React.useMemo(() => {
    return (
      <span>
        Use Anywhere <br /> No kidding.
      </span>
    );
  }, []);

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-[#0B0B0F]">
      <MacbookScroll title={title} src={src} showGradient={false} />
    </div>
  );
});

export default function LandingPage() {
  const memoizedLandingNavigation = useMemo(() => <LandingNavigation />, []);
  const memoizedFooter = useMemo(() => <Footer />, []);

  const memoizedViewOnGitHubButton = useMemo(
    () => (
      <Button className="bg-gray-800 text-white hover:bg-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700">
        <Github className="mr-2 h-4 w-4" /> View on GitHub
      </Button>
    ),
    [],
  );

  const memoizedContributeButton = useMemo(
    () => <Button variant="outline">Contribute</Button>,
    [],
  );

  const memoizedDashboardButton = useMemo(
    () => (
      <Button className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 text-lg text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
        Go to dashboard
      </Button>
    ),
    [],
  );

  return (
    <>
      <div className="lamding-page min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-white">
        {memoizedLandingNavigation}
        <Hero />
        <MacbookScrollDemo />
        <section className="py-20 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Key Features
            </h2>

            <FeatureCards />
          </div>
        </section>
        {/* <TabsDemo /> */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-slate-950 dark:to-slate-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold">Open but Private</h2>

            <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-slate-300">
              Regreso is proud to be <i>completely</i> open source. We believe
              in the community-driven development, transparency, and a
              commitment to privacy and security.
            </p>

            <div className="flex justify-center space-x-4">
              <Link href={process.env.NEXT_PUBLIC_REPO_URL ?? "#"} passHref>
                {memoizedViewOnGitHubButton}
              </Link>

              <Link
                href={
                  process.env.NEXT_PUBLIC_REPO_URL +
                  "/blob/" +
                  process.env.NEXT_PUBLIC_MAIN_BRANCH +
                  "/README.md#-contributing"
                }
                passHref
              >
                {memoizedContributeButton}
              </Link>
            </div>
          </div>
        </section>
        <section className="bg-gray-50 py-20 dark:bg-slate-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold">
              Ready to Never Lose Your Digital Trail?
            </h2>

            <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-slate-300">
              Regreso is the digital breadcrumbs tool you never knew you needed.
              Use locally in the browser or create an account to sync your data
            </p>

            {memoizedDashboardButton}
          </div>
        </section>
        {memoizedFooter}
      </div>
    </>
  );
}
