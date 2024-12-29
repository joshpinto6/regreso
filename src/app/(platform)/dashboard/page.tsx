"use client";

import React from "react";

import {
  CreateDestination,
  RecentDestinations,
} from "~/app/(platform)/_components/destination";
import { WelcomeCard } from "~/components/welcome-card";
import { Command } from "lucide-react";
import type { User } from "~/server/models";

export default function DashboardHome(user: User) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="rounded-xl bg-muted/50">
            <WelcomeCard
              teams={[
                {
                  name: "My Squad",
                  logo: Command,
                  plan: "Free",
                },
              ]}
              name={user.displayName}
            />
          </div>
        </div>
        <div className="xl:col-span-3">
          <div className="rounded-xl bg-muted/50">
            <CreateDestination />
          </div>
        </div>
        <div className="col-span-2">
          <div className="rounded-xl bg-muted/50">
            <RecentDestinations />
          </div>
        </div>
        <div className="col-span-3 min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4 md:min-h-min" />
      </div>
    </>
  );
}
