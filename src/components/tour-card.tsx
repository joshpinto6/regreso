"use client";

import React from "react";

import { X } from "lucide-react";
import type { CardComponentProps } from "onborda";
import { useOnborda } from "onborda";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const TourCard: React.FC<CardComponentProps> = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}) => {
  const { closeOnborda } = useOnborda();

  function handleConfetti() {
    closeOnborda();
  }

  return (
    <Card
      id="tour-card"
      style={{
        position: "absolute",
        top: "-35px",
        left: "-150px",
      }}
      className="z-[999] w-max min-w-[300px] max-w-full border-0 border-none bg-white"
    >
      <CardHeader>
        <div className="flex w-full items-start justify-between space-x-4">
          <div className="flex flex-col space-y-2">
            <CardDescription className="text-black/50">
              {currentStep + 1} of {totalSteps}
            </CardDescription>
            <CardTitle className="mb-2 text-lg text-black">
              {step.icon} {step.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            className="absolute right-2 top-4 text-black/50 hover:bg-transparent hover:text-black/80"
            size="icon"
            onClick={() => closeOnborda()}
          >
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-black">{step.content}</CardContent>
      <CardFooter className="text-black">
        <div className="flex w-full justify-between gap-4">
          {currentStep !== 0 && (
            <Button
              onClick={() => prevStep()}
              className="bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white"
            >
              Previous
            </Button>
          )}
          {currentStep + 1 !== totalSteps && (
            <Button
              onClick={() => nextStep()}
              className="ml-auto bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white"
            >
              Next
            </Button>
          )}
          {currentStep + 1 === totalSteps && (
            <Button
              className="ml-auto bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white"
              onClick={handleConfetti}
            >
              🎉 Finish!
            </Button>
          )}
        </div>
      </CardFooter>
      <span className="text-white">{arrow}</span>
    </Card>
  );
};
