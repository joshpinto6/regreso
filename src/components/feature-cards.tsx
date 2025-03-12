"use client";

import React, { memo, useMemo } from "react";

import { Code, Database, Zap } from "lucide-react";
import { motion } from "motion/react";

type Feature = {
  icon: JSX.Element;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: <Zap className="h-10 w-10 text-cyan-500" />,
    title: "Smart Bookmarking",
    description:
      "Treat internet places like locations: organize and search for websites and resources.",
  },
  {
    icon: <Code className="h-10 w-10 text-cyan-500" />,
    title: "Self-hostable",
    description:
      "Painlessly set up, host, and run your own instance of Regreso.",
  },
  {
    icon: <Database className="h-10 w-10 text-cyan-500" />,
    title: "Connect Your Data",
    description:
      "Easily import, export, migrate, or delete your data at any time.",
  },
];

const FeatureCard = ({ feature }: { feature: Feature }) => {
  const initial = useMemo(() => ({ opacity: 0.5, y: 50 }), []);
  const whileInView = useMemo(() => ({ opacity: 1, y: 0 }), []);
  const transition = useMemo(
    () => ({
      delay: 0,
      duration: 0.3,
      ease: "easeInOut",
    }),
    [],
  );

  return (
    <motion.div
      initial={initial}
      whileInView={whileInView}
      transition={transition}
      className="relative overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800"
    >
      <div className="p-6">
        <div className="mb-4 inline-block rounded-full bg-cyan-100 p-3 dark:bg-cyan-900">
          {feature.icon}
        </div>
        <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
          {feature.title}
        </h3>
        <p className="text-black dark:text-white">{feature.description}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
    </motion.div>
  );
};

const FeatureCards = memo(() => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <FeatureCard key={index} feature={feature} />
      ))}
    </div>
  );
});
FeatureCards.displayName = "FeatureCards";

export { FeatureCards };
