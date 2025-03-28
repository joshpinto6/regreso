"use client";

import { startTransition, useActionState } from "react";
import { redirect, useRouter } from "next/navigation";

import BoringAvatar from "boring-avatars";
import {
  Bell,
  ChevronsUpDown,
  CircleUser,
  Lock,
  LogIn,
  LogOut,
} from "lucide-react";
import type { User } from "~/server/models";

import { cn } from "~/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

import { logoutAction } from "~/app/(platform)/actions";

const initialState = {
  message: "",
};

function ProfilePicture({
  user,
  borderRadius,
  className,
}: {
  user: User | null;
  borderRadius?: "sm" | "md" | "lg" | "xl" | "xs";
  className?: string;
}) {
  return user?.githubId ? (
    <Avatar
      className={cn(
        borderRadius ? "rounded-" + borderRadius : "rounded-lg",
        className,
      )}
    >
      <AvatarImage
        src={`https://avatars.githubusercontent.com/u/${user.githubId}`}
        alt={`Avatar for ${user?.name}`}
      />
      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
    </Avatar>
  ) : (
    <Avatar
      className={cn(
        borderRadius ? "rounded-" + borderRadius : "rounded-lg",
        className,
      )}
    >
      <AvatarImage src={user?.avatarUrl ?? ""} alt={`@${user?.name}`} />
      <AvatarFallback>
        <BoringAvatar
          aria-label={`@${user?.name}'s profile picture`}
          name={user?.name ?? "anonymous"}
          variant="beam"
        />
      </AvatarFallback>
    </Avatar>
  );
}

export function NavUser({ user }: { user: User | null }) {
  const { isMobile } = useSidebar();
  const [, action] = useActionState(logoutAction, initialState);

  const router = useRouter();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <ProfilePicture user={user} className="!h-8 !w-8" />

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.displayName ?? "Anonymous"}
                </span>
                <span className="truncate text-xs">
                  @{user?.name ?? "anonymous"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <ProfilePicture user={user} className="!h-8 !w-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.displayName ?? "Anonymous"}
                  </span>
                  <span className="truncate text-xs">
                    @{user?.name ?? "Not logged in"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSeparator />
            {user?.name ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => router.push("/settings/profile")}
                  >
                    <CircleUser />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => router.push("/settings/account")}
                  >
                    <Lock />
                    Account
                  </DropdownMenuItem>
                  {/* 
                  <DropdownMenuItem
                    onSelect={() => router.push("/settings/notifications")}
                  >
                    <Bell />
                    Notifications
                  </DropdownMenuItem> */}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    startTransition(() => {
                      action();
                    });
                  }}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onSelect={() => {
                    redirect("/log-in");
                  }}
                >
                  <LogIn />
                  Log in
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
