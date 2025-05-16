"use client";

import { useState } from "react";
import Link from "next/link";

import {
  DndContext,
  type Active,
  type DragEndEvent,
  type Over,
} from "@dnd-kit/core";
import { AlertCircle, Binoculars, Rocket } from "lucide-react";
import { motion } from "motion/react";
import { useOnborda } from "onborda";
import type { User, Workspace } from "~/server/models";

import { timeSince } from "~/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { TiltCard } from "~/components/tilt-card";

import { CreateDestination, RecentDestinations } from "./destination";
import { RecentLists } from "./list";
import { RecentTags } from "./tag";
import { RecentWorkspacesDropdown } from "./workspace";

export function WelcomeCard({
  workspace,
  user,
  workspaces,
  isFetchingWorkspaces,
}: {
  workspace?: Workspace;
  user?: User;
  workspaces?: Workspace[];
  isFetchingWorkspaces?: boolean;
}) {
  const { startOnborda } = useOnborda();

  return (
    <TiltCard>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="leading-relaxed">
            {workspace
              ? `${workspace.emoji} ${workspace.name}`
              : `👋 Welcome ${user?.name ?? " to Regreso"},`}
          </CardTitle>
          <CardDescription className={workspace ? "mt-8" : undefined}>
            {workspace
              ? workspace.description
              : "Learn the basics of how to use Regreso."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 sm:px-6 xl:px-6">
          {workspace ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm">
                    Created {timeSince(workspace.createdAt)} ago
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{workspace.createdAt.toISOString()}</p>
                </TooltipContent>
              </Tooltip>
              {workspace.destinationCount != null &&
                workspace.destinationCount != undefined && (
                  <>
                    <p>•</p>
                    <p className="font-muted mr-0.5 text-sm">
                      {workspace.destinationCount} destination
                      {workspace.destinationCount == 1 ? null : "s"}
                    </p>
                  </>
                )}{" "}
              {workspace.listCount != null &&
                workspace.listCount != undefined && (
                  <>
                    <p>•</p>

                    <p className="font-muted mr-0.5 text-sm">
                      {workspace.listCount} map
                      {workspace.listCount == 1 ? null : "s"}
                    </p>
                  </>
                )}{" "}
              {workspace.tagCount != null &&
                workspace.tagCount != undefined && (
                  <>
                    <p>•</p>

                    <p className="font-muted mr-0.5 text-sm">
                      {workspace.tagCount} tag
                      {workspace.tagCount == 1 ? null : "s"}
                    </p>
                  </>
                )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/guide">
                  <Rocket />
                  Setup Guide
                </Link>
              </Button>
              <Button
                size="sm"
                id="start-tour"
                onClick={() => {
                  startOnborda("welcome-tour");
                }}
              >
                <Binoculars /> Start Tour
              </Button>
            </div>
          )}
          <Separator className={workspace ? "mt-0" : undefined} />
          <RecentWorkspacesDropdown
            workspace={workspace}
            recentWorkspaces={workspaces ?? []}
            isFetchingWorkspaces={isFetchingWorkspaces}
          />
        </CardContent>
      </Card>
    </TiltCard>
  );
}

export function Dashboard(props: {
  workspace?: Workspace;
  user?: User;
  workspaces?: Workspace[];
}) {
  const [dragEnd, setDragEnd] = useState<{
    over: Over;
    active: Active;
  } | null>(null);
  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    if (over && active) {
      setDragEnd({ over: over, active: active });
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-full w-full flex-col gap-4 p-4">
        {/* <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Burial Notice</AlertTitle>
          <AlertDescription className="flex w-full items-center justify-between">
            This trunk is buried, meaning you cannot add or update destinations,
            lists, or tags.
            <Button variant="outline" size="sm">
              Excavate Trunk
            </Button>
          </AlertDescription>
        </Alert> */}
        <div className="z-10 grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="col-span-1 xl:col-span-2">
            <div className="rounded-xl bg-muted/50">
              <motion.div
                initial={{ opacity: 0.5, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0,
                  duration: 0.2,
                  ease: "easeOut",
                }}
              >
                <WelcomeCard
                  workspace={props.workspace}
                  user={props.user}
                  workspaces={props.workspaces}
                />
              </motion.div>
            </div>
          </div>
          <div className="col-span-1 xl:col-span-3">
            <div className="rounded-xl bg-muted/50">
              <motion.div
                initial={{ opacity: 0.5, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0,
                  duration: 0.2,
                  ease: "easeOut",
                }}
              >
                <CreateDestination
                  workspaces={props?.workspaces}
                  workspace={props?.workspace}
                  user={props?.user}
                />
              </motion.div>
            </div>
          </div>
          <div className="z-50 col-span-1 xl:col-span-2">
            <div className="rounded-xl bg-muted/50">
              <motion.div
                initial={{ opacity: 0.5, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0,
                  duration: 0.2,
                  ease: "easeOut",
                }}
              >
                <RecentDestinations
                  workspace={props?.workspace}
                  dragEnd={dragEnd}
                  setDragEnd={setDragEnd}
                />
              </motion.div>
            </div>
          </div>
          <div className="col-span-1 xl:col-span-3">
            <div className="rounded-xl bg-muted/50">
              <motion.div
                initial={{ opacity: 0.5, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0,
                  duration: 0.2,
                  ease: "easeOut",
                }}
              >
                <RecentLists
                  workspace={props?.workspace}
                  user={props?.user}
                  workspaces={props?.workspaces}
                />
              </motion.div>
            </div>
          </div>
          <div className="col-span-1 xl:col-span-2">
            <div className="rounded-xl bg-muted/50">
              <motion.div
                initial={{ opacity: 0.5, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0,
                  duration: 0.2,
                  ease: "easeOut",
                }}
              >
                <RecentTags
                  workspace={props?.workspace}
                  user={props?.user}
                  workspaces={props?.workspaces}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
