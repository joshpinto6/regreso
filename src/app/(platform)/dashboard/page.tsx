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
        <div className="z-10 grid grid-cols-1 gap-4 p-4 xl:grid-cols-5">
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
                <CreateDestination />
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
                <RecentDestinations dragEnd={dragEnd} setDragEnd={setDragEnd} />
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
                <RecentLists />
              </motion.div>
            </div>
          </div>
        </div>
      </DndContext>
    </>
  );
};

export default DashboardHome;
