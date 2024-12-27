"use client";

import { cloneElement, isValidElement } from "react";

import type { User } from "~/server/models";
import { SidebarLeft } from "~/components/sidebar-left";
import { SidebarRight } from "~/components/sidebar-right";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

interface ClientLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export function ClientLayout({ children, user }: ClientLayoutProps) {
  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        {children && isValidElement(children) ? (
          cloneElement(children, { props: { user } } as Parameters<
            typeof cloneElement
          >[0])
        ) : (
          <p>
            🌌 Nothing to display on the dashboard right now. Try selecting a
            menu item.
          </p>
        )}
      </SidebarInset>
      <SidebarRight user={user} />
    </SidebarProvider>
  );
}
