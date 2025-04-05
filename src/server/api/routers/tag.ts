import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  updateWorkspaceSchema,
  workspaceFormSchema,
  workspaceSchema,
  workspaceSearchSchema,
  type Workspace,
} from "~/server/models";

import {
  protectedMutationProcedure,
  protectedQueryProcedure,
} from "~/server/api/trpc";
import { destinations, lists, users, workspaces } from "~/server/db/schema";

import { createTRPCRouter } from "../trpc";

export const tagRouter = createTRPCRouter({
  create: protectedMutationProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/tags",
        protect: true,
      },
    })
    .input(workspaceFormSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRows = await ctx.db
        .insert(workspaces)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
        })
        .returning({
          id: workspaces.id,
        });
      if (!workspaceRows || workspaceRows.length == 0 || !workspaceRows[0]) {
        throw new Error("Unexpected error");
      }
      if (input.newDefault) {
        await ctx.db
          .update(users)
          .set({ workspaceId: workspaceRows[0].id })
          .where(eq(users.id, ctx.user.id));
      }
      return {
        success: true,
      };
    }),
  getMany: protectedQueryProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/v1/workspaces",
        protect: true,
      },
    })
    .input(workspaceSearchSchema)
    .output(
      z.object({
        items: z.array(workspaceSchema),
        count: z.number(),
      }),
    )
    .query(
      async ({
        ctx,
        input,
      }): Promise<{ items: Workspace[]; count: number }> => {
        const wkspcs = await ctx.db
          .select({
            workspace: workspaces,
            count: sql<number>`count(*) over()`,
            destinationCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${destinations}
            WHERE ${destinations.workspaceId} = ${workspaces.id}
          )`,
            listCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${lists}
            WHERE ${lists.workspaceId} = ${workspaces.id}
          )`,
          })
          .from(workspaces)
          .where(
            and(
              and(
                input.searchString && input.searchString.length > 0
                  ? sql`(setweight(to_tsvector('english', ${workspaces.name}), 'A') ||
        setweight(to_tsvector('english', ${workspaces.description}), 'B'))
        @@ websearch_to_tsquery  ('english', ${input.searchString})`
                  : undefined,
              ),

              eq(workspaces.userId, ctx.user.id),
            ),
          )
          .orderBy(
            input.order === "ASC"
              ? asc(
                  input.sortBy === "destinationCount"
                    ? sql`destinationCount`
                    : input.sortBy === "listCount"
                      ? sql`listCount`
                      : workspaces.createdAt,
                )
              : desc(
                  input.sortBy === "destinationCount"
                    ? sql`destinationCount`
                    : input.sortBy === "listCount"
                      ? sql`listCount`
                      : workspaces.createdAt,
                ),
          )
          .limit(input.limit)
          .offset(input.offset);

        const returnLists: Workspace[] = wkspcs.map((workspace) => {
          return {
            destinationCount:
              (typeof workspace.destinationCount == "string"
                ? parseInt(workspace.destinationCount)
                : workspace.destinationCount) ?? 0,
            listCount:
              (typeof workspace.listCount == "string"
                ? parseInt(workspace.listCount)
                : workspace.listCount) ?? 0,
            ...workspace.workspace,
            emoji: workspace.workspace?.emoji
              ? workspace.workspace?.emoji.match(
                  /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                )
                ? (workspace.workspace?.emoji.match(
                    /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                  )?.[0] ?? null)
                : null
              : null,
          };
        });
        if (!wkspcs || wkspcs.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No lists found",
          });
        }
        return {
          items: returnLists,
          count:
            (typeof wkspcs[0]?.count == "string"
              ? parseInt(wkspcs[0]?.count)
              : wkspcs[0]?.count) ?? 0,
        };
      },
    ),
  update: protectedMutationProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/v1/workspace/{id}",
        protect: true,
      },
    })
    .input(updateWorkspaceSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      let workspaceRows = null;
      if (input.name || input.emoji || input.description) {
        workspaceRows = await ctx.db
          .update(lists)
          .set({
            name: input.name,
            description: input.description,
            emoji: input.emoji,
          })
          .where(and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)))
          .returning({
            id: lists.id,
          });
      } else {
        workspaceRows = await ctx.db.query.lists.findMany({
          columns: { id: true },
          where: and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)),
        });
      }

      return {
        success: true,
      };
    }),
  delete: protectedMutationProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/v1/list/{id}",
        protect: true,
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(lists)
        .where(and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)));
      return {
        success: true,
      };
    }),
  get: protectedQueryProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/v1/list/{id}",
        protect: true,
      },
    })
    .input(z.object({ id: z.number() }))
    .output(workspaceSchema)
    .query(async ({ ctx, input }) => {
      const wkspcData = await ctx.db
        .select({
          id: lists.id,
          name: lists.name,
          description: lists.description,
          emoji: lists.emoji,
          createdAt: lists.createdAt,
          userId: lists.userId,
          workspaceId: lists.workspaceId,
          count: sql<number>`count(*) over()`,
          destinationCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${destinations}
          WHERE ${destinations.workspaceId} = ${workspaces.id}
        )`,
          listCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${lists}
          WHERE ${lists.workspaceId} = ${workspaces.id}
        )`,
        })
        .from(workspaces)
        .where(and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)))
        .groupBy(lists.id)
        .limit(1);

      if (!wkspcData || wkspcData.length === 0 || !wkspcData[0]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or access denied",
        });
      }

      const wkspc: Workspace | undefined =
        wkspcData.length > 0
          ? {
              ...wkspcData[0],
              destinationCount:
                (typeof wkspcData[0]?.destinationCount == "string"
                  ? parseInt(wkspcData[0]?.destinationCount)
                  : wkspcData[0]?.destinationCount) ?? 0,
              listCount:
                (typeof wkspcData[0]?.listCount == "string"
                  ? parseInt(wkspcData[0]?.listCount)
                  : wkspcData[0]?.listCount) ?? 0,
            }
          : undefined;

      if (!wkspc) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or access denied",
        });
      }

      return {
        ...wkspc,
        emoji:
          (wkspc?.emoji
            ? wkspc?.emoji.match(
                /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
              )
              ? (wkspc?.emoji.match(
                  /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                )?.[0] ?? null)
              : null
            : null) ?? "❔",
      };
    }),
});
