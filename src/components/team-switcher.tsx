"use client";

import * as React from "react";

import { ChevronDown, Plus } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export function TeamSwitcher({
  teams,
  id,
  disabled,
}: {
  id?: string;
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
  disabled?: boolean;
}) {
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  return (
    <SidebarMenu id={id}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger disabled={disabled} asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {activeTeam && <activeTeam.logo className="size-3" />}
              </div>
              {activeTeam && (
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
              )}
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
              <Badge variant="secondary">Soon!</Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
