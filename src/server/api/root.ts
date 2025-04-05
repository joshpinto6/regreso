import { destinationRouter } from "~/server/api/routers/destination";
import { listRouter } from "~/server/api/routers/list";
import { sessionRouter } from "~/server/api/routers/session";
// import { tagRouter } from "~/server/api/routers/tag";
import { workspaceRouter } from "~/server/api/routers/workspace";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  destination: destinationRouter,
  list: listRouter,
  session: sessionRouter,
  workspace: workspaceRouter,
  // tag: tagRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
