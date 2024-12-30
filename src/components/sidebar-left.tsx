"use client";

import * as React from "react";

import {
  Calendar,
  Command,
  Home,
  MessageCircleQuestion,
  Network,
  Search,
  Settings,
} from "lucide-react";

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
      name: "My Squad",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Search",
      render: (
        <div>
          Search{" "}
          <Badge className="ml-2" variant="secondary">
            Soon!
          </Badge>
        </div>
      ),
      url: "#search",
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
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/help",
      icon: MessageCircleQuestion,
    },
  ],
  lists: [
    // {
    //   name: "Project Management & Task Tracking",
    //   url: "#",
    //   emoji: "📊",
    // },
    // {
    //   name: "Family Recipe Collection & Meal Planning",
    //   url: "#",
    //   emoji: "🍳",
    // },
    // {
    //   name: "Fitness Tracker & Workout Routines",
    //   url: "#",
    //   emoji: "💪",
    // },
  ],
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

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavLists lists={data.lists} />
      </SidebarContent>
      <SidebarFooter>
        <NavWorkspaces workspaces={data.workspaces} />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
