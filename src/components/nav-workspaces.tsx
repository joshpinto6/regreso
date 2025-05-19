import { MoreHorizontal } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export function NavWorkspaces({
  workspaces,
}: {
  workspaces: {
    name: string;
    emoji: React.ReactNode;
    id: number;
    pages: {
      name: string;
      emoji: React.ReactNode;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>My Trunks</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <SidebarMenuItem key={workspace.name}>
                <SidebarMenuButton asChild>
                  <a href={`box/${workspace.id}`} title={workspace.name}>
                    <span>{workspace.emoji}</span>
                    <span>{workspace.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            <p className="my-3 px-4 text-sm text-muted-foreground">
              🧰 No trunks found. Try creating one and come back!
            </p>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
