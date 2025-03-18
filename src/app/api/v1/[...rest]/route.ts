import { type NextRequest } from "next/server";

import { createOpenApiFetchHandler } from "trpc-to-openapi";

import { appRouter } from "~/server/api/root";
import { createRESTContext } from "~/server/api/trpc";

export const dynamic = "force-dynamic";

const handler = (req: NextRequest) => {
  return createOpenApiFetchHandler({
    endpoint: "/api",
    router: appRouter,
    createContext: async () => {
      const ctx = await createRESTContext(req);
      return { ...ctx, headers: req.headers };
    },
    req,
  });
};

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
