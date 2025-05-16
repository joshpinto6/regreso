"use client";

import { isValidElement, useState } from "react";
import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ChevronsUpDown,
  FileQuestion,
  Home,
  Map,
  Package2,
  Search,
  Tag as TagIcon,
} from "lucide-react";
import posthog from "posthog-js";
import type { User } from "~/server/models";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarTriggerRight,
} from "~/components/ui/sidebar";
import { TooltipProvider } from "~/components/ui/tooltip";
import { SidebarLeft } from "~/components/sidebar-left";
import { SidebarRight } from "~/components/sidebar-right";

interface ClientLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export function ClientLayout({ children, user }: ClientLayoutProps) {
  const pathname = usePathname();
  const platformRoute = pathname.split("/") ?? ["unknown"];
  const [searchType, setSearchType] = useState(platformRoute[2]);
  const router = useRouter();
  const searchParams = useSearchParams();
  if (searchParams.get("loginState") == "signedIn" && user) {
    posthog.identify(user.email);
    redirect("/dashboard");
  }
  function selectSearchType(value: string) {
    router.push(`/search/${value}`);
    setSearchType(value);
  }
  const platformPages = [
    {
      render: (
        <BreadcrumbItem>
          <Home size="16" />
          <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
        </BreadcrumbItem>
      ),
      name: "Home",
      route: "dashboard",
    },
    {
      render: (
        <BreadcrumbItem>
          <Map size="16" />
          <BreadcrumbLink href="/search/maps">Maps</BreadcrumbLink>
        </BreadcrumbItem>
      ),
      name: "Map",
      route: "map",
    },
    {
      render: (
        <BreadcrumbItem>
          <TagIcon size="16" />
          <BreadcrumbLink href="/search/tags">Tags</BreadcrumbLink>
        </BreadcrumbItem>
      ),
      name: "Tag",
      route: "tag",
    },
    {
      render: (
        <BreadcrumbItem>
          <Package2 size="16" />
          <BreadcrumbLink href="/search/boxes">Trunks</BreadcrumbLink>
        </BreadcrumbItem>
      ),
      name: "Workspace",
      route: "box",
    },
    {
      render: (
        <BreadcrumbItem>
          <Search size="16" />
          {platformRoute[1] == "search" ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-2 flex items-center gap-1">
                {searchType == "maps"
                  ? "Map"
                  : searchType == "tags"
                    ? "Tag"
                    : searchType == "boxes"
                      ? "Trunk"
                      : "Destination"}
                <ChevronsUpDown size="16" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Search Type</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={platformRoute[2]}
                  onValueChange={selectSearchType}
                >
                  <DropdownMenuRadioItem value="pins">
                    Destination
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="maps">
                    Map
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="tags">
                    Tag
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="boxes">
                    Trunk
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          Search
        </BreadcrumbItem>
      ),
      name: "Search",
      route: "search",
    },
  ];

  return (
    <SidebarProvider className="grid h-svh w-full grid-cols-[auto_1fr_auto] overflow-hidden">
      <TooltipProvider delayDuration={0}>
        <div
          className="h-svh w-fit overflow-hidden"
          style={{ maxWidth: "var(--sidebar-width)" }}
        >
          <SidebarLeft side="left" className="h-full" />
        </div>

        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden lg:block">
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden lg:block" />
                  {platformPages.find((item) => item.route == platformRoute[1]!)
                    ?.render ?? (
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href="#"
                        className="flex flex-row items-center gap-2"
                      >
                        <FileQuestion size="16" /> Unknown Route
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <SidebarTriggerRight />
          </header>

          <div className="h-[calc(100vh-3.5rem)] overflow-auto">
            {children && isValidElement(children) ? (
              children
            ) : (
              <p>
                🌌 Nothing to display on the dashboard right now. Try selecting
                a menu item.
              </p>
            )}
          </div>
        </SidebarInset>

        <div
          className="h-svh w-fit overflow-hidden"
          style={{ maxWidth: "var(--sidebar-width)" }}
        >
          <SidebarRight side="right" user={user} className="h-full" />
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
