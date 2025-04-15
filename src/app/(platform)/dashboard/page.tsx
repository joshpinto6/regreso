"use client";

import React from "react";

import {
  DndContext,
  type Active,
  type DragEndEvent,
  type Over,
} from "@dnd-kit/core";
import { Sailboat } from "lucide-react";
import { motion } from "motion/react";
import type { User } from "~/server/models";

import { WelcomeCard } from "~/components/welcome-card";

import "~/styles/tour.css";

import { MasonryItem, MasonryRoot } from "~/components/ui/masonry";
import { Skeleton } from "~/components/ui/skeleton";

import {
  CreateDestination,
  RecentDestinations,
} from "../_components/destination";
import { RecentLists } from "../_components/list";

const DashboardHome: React.FC = (props: { user?: User }) => {
  const [dragEnd, setDragEnd] = React.useState<{
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
    <>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="z-10 p-4">
          <MasonryRoot
            className="w-full align-top align-text-top"
            gap={12}
            columnWidth={300}
            linear
            fallback={<Skeleton className="h-72 w-full" />}
          >
            <MasonryItem asChild>
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
                    teams={[
                      {
                        name: "My Crew",
                        logo: Sailboat,
                        plan: "Free",
                      },
                    ]}
                    name={props.user?.displayName}
                  />
                </motion.div>
              </div>
            </MasonryItem>
            <MasonryItem asChild>
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
                  <CreateDestination />
                </motion.div>
              </div>
            </MasonryItem>
            <MasonryItem asChild>
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
                    dragEnd={dragEnd}
                    setDragEnd={setDragEnd}
                  />
                </motion.div>
              </div>
            </MasonryItem>
            <MasonryItem asChild>
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
                  <RecentLists />
                </motion.div>
              </div>
            </MasonryItem>
          </MasonryRoot>
        </div>
      </DndContext>
    </>
  );
};

export default DashboardHome;
