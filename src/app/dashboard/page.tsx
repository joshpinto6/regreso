import { SidebarLeft } from "~/components/sidebar-left";
import { SidebarRight } from "~/components/sidebar-right";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

import { api, HydrateClient } from "~/trpc/server";
// app/api/page.tsx
import { redirect } from "next/navigation";
import { getCurrentSession } from "~/server/session";

// async function Page() {
//   const { user } = await getCurrentSession();
//   if (user === null) {
//     return redirect("/login");
//   }

//   async function action() {
//     "use server";
//     const { user } = await getCurrentSession();
//     if (user === null) {
//       return redirect("/login");
//     }
//     // ...
//   }
//   // ...
// }

export default async function Page() {
  const { user } = await getCurrentSession();
  if (user === null) {
    return redirect("/login");
  }
  return (
    <HydrateClient>
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      Project Management & Task Tracking
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
            <div className="bg-muted/50 mx-auto h-[100vh] w-full max-w-3xl rounded-xl" />
          </div>
        </SidebarInset>
        <SidebarRight />
      </SidebarProvider>
    </HydrateClient>
  );
}
