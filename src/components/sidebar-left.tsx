"use client";

import { useEffect, useState, type ComponentProps } from "react";

import { api } from "~/trpc/react";
import {
  Calendar,
  Home,
  MessageCircleQuestion,
  Network,
  Sailboat,
  Search,
  Settings,
} from "lucide-react";
import type { List } from "~/server/models";

import { Badge } from "~/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { NavLists } from "~/components/nav-lists";
import { NavMain } from "~/components/nav-main";
import { NavSecondary } from "~/components/nav-secondary";
import { NavWorkspaces } from "~/components/nav-workspaces";
import { TeamSwitcher } from "~/components/team-switcher";

// This is sample data.
const data = {
  teams: [
    {
      name: "My Crew",
      logo: Sailboat,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Graph",
      render: (
        <div>
          Graph{" "}
          <Badge className="ml-2" variant="secondary">
            Soon!
          </Badge>
        </div>
      ),
      url: "#graph",
      icon: Network,
    },
    {
      title: "Calendar",
      render: (
        <div>
          Calendar{" "}
          <Badge className="ml-2" variant="secondary">
            Soon!
          </Badge>
        </div>
      ),
      url: "#calendar",
      icon: Calendar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/help",
      icon: MessageCircleQuestion,
    },
  ],
  lists: [],
  workspaces: [
    // {
    //   name: "Personal Life Management",
    //   emoji: "🏠",
    //   pages: [
    //     {
    //       name: "Daily Journal & Reflection",
    //       url: "#",
    //       emoji: "📔",
    //     },
    //     {
    //       name: "Health & Wellness Tracker",
    //       url: "#",
    //       emoji: "🍏",
    //     },
    //     {
    //       name: "Personal Growth & Learning Goals",
    //       url: "#",
    //       emoji: "🌟",
    //     },
    //   ],
    // },
    // {
    //   name: "Professional Development",
    //   emoji: "💼",
    //   pages: [
    //     {
    //       name: "Career Objectives & Milestones",
    //       url: "#",
    //       emoji: "🎯",
    //     },
    //     {
    //       name: "Skill Acquisition & Training Log",
    //       url: "#",
    //       emoji: "🧠",
    //     },
    //     {
    //       name: "Networking Contacts & Events",
    //       url: "#",
    //       emoji: "🤝",
    //     },
    //   ],
    // },
  ],
};

export function SidebarLeft({ ...props }: ComponentProps<typeof Sidebar>) {
  const [mode, setMode] = useState<"fav" | "rec">("rec");
  const [oldMode, setOldMode] = useState<"fav" | "rec">("rec");

  const { data: recentLists = { items: [], count: 0 }, refetch: refetchLists } =
    api.list.getMany.useQuery({
      limit: 3,
      order: "DESC",
      tags: mode === "fav" ? ["favorite maps"] : undefined,
    });

  const { data: recentWorkspaces = { items: [], count: 0 } } =
    api.workspace.getMany.useQuery({
      limit: 3,
      order: "DESC",
    });

  useEffect(() => {
    if (mode !== oldMode) {
      void refetchLists();
      setOldMode(mode);
    }
  }, [mode, refetchLists, oldMode, setOldMode]);
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavLists
          mode={mode}
          refetch={refetchLists}
          setMode={setMode}
          lists={recentLists.items.map((l: List) => {
            return {
              id: l.id,
              name: l.name,
              emoji: l.emoji ?? "❔",
              url: "/map/" + l.id,
              favorite:
                l.tags?.some((t) => t.text === "favorite maps") ?? false,
            };
          })}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavWorkspaces
          workspaces={recentWorkspaces.items.map((w) => {
            return {
              id: w.id,
              name: w.name,
              emoji: w.emoji,
              pages: [],
            };
          })}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
