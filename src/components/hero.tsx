"use client";

import React, { memo } from "react";
import Link from "next/link";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { LampContainer } from "~/components/ui/lamp";

const Hero = memo(function Hero() {
  const [email, setEmail] = React.useState("");
  const memoizedArrowRight = React.useMemo(
    () => (
      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
    ),
    [],
  );

  return (
    <section className="pt-16 md:pt-16">
      {" "}
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-16 bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text py-4 text-center text-4xl font-medium tracking-tight text-transparent dark:from-slate-300 dark:to-slate-500 md:text-7xl"
        >
          Never Lose Your <br /> Digital Trail Again
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-700 dark:text-slate-300"
        >
          Effortlessly find your way back to websites, articles, and resources
          you&apos;ve visited. Your digital breadcrumbs, always at your
          fingertips.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.7,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:flex-row"
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event?.target.value)}
            placeholder="Enter your email"
            className="rounded-full border-gray-300 bg-white text-gray-900 placeholder-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-400"
          />
          <Button
            className="group rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2 font-medium text-white transition-all duration-300 ease-in-out hover:scale-105 hover:opacity-90 hover:shadow-lg"
            asChild
          >
            <Link href={`/sign-up?email=${email}`}>
              Get Started
              {memoizedArrowRight}
            </Link>
          </Button>
        </motion.div>
      </LampContainer>
    </section>
  );
});

export default Hero;
