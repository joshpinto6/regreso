import { isRedirectError } from "next/dist/client/components/redirect-error";

import { z } from "zod";

import { toast } from "~/components/hooks/use-toast";

export function getErrorMessage(err: unknown) {
  const unknownError = "Something went wrong, please try again later.";

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });
    return errors.join("\n");
  } else if (err instanceof Error) {
    return err.message;
  } else if (isRedirectError(err)) {
    throw err;
  } else {
    return unknownError;
  }
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);
  return toast({
    title: "Uh oh!",
    description: errorMessage,
    variant: "destructive",
  });
}
