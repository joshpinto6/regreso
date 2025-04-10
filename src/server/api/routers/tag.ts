import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  tagFormSchema,
  tagSchema,
  tagSearchSchema,
  updateTagSchema,
  type Tag,
} from "~/server/models";

import {
  protectedMutationProcedure,
  protectedQueryProcedure,
} from "~/server/api/trpc";
import { destinationTags, lists, listTags, tags } from "~/server/db/schema";

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
    .input(tagFormSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const tagRows = await ctx.db
        .insert(tags)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
          shortcut: input.shortcut,
          workspaceId: input.workspaceId,
        })
        .returning({
          id: tags.id,
        });
      if (!tagRows || tagRows.length == 0 || !tagRows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Unexpected error" });
      }
      return {
        success: true,
      };
    }),
  getMany: protectedQueryProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/v1/tags",
        protect: true,
      },
    })
    .input(tagSearchSchema)
    .output(
      z.object({
        items: z.array(tagSchema),
        count: z.number(),
      }),
    )
    .query(async ({ ctx, input }): Promise<{ items: Tag[]; count: number }> => {
      const tgs = await ctx.db
        .select({
          tag: tags,
          count: sql<number>`count(*) over()`,
          destinationCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${destinationTags}
            WHERE ${destinationTags.tagId} = ${tags.id}
          )`,
          listCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${listTags}
            WHERE ${listTags.tagId} = ${tags.id}
          )`,
        })
        .from(tags)
        .where(
          and(
            and(
              input.searchString && input.searchString.length > 0
                ? sql`(setweight(to_tsvector('english', ${tags.name}), 'A') ||
        setweight(to_tsvector('english', ${tags.description}), 'B'))
        @@ websearch_to_tsquery  ('english', ${input.searchString})`
                : undefined,
            ),

            eq(tags.userId, ctx.user.id),
          ),
        )
        .orderBy(
          input.order === "ASC"
            ? asc(
                input.sortBy === "destinationCount"
                  ? sql`destinationCount`
                  : input.sortBy === "listCount"
                    ? sql`listCount`
                    : tags.createdAt,
              )
            : desc(
                input.sortBy === "destinationCount"
                  ? sql`destinationCount`
                  : input.sortBy === "listCount"
                    ? sql`listCount`
                    : tags.createdAt,
              ),
        )
        .limit(input.limit)
        .offset(input.offset);

      const returnTags: Tag[] = tgs.map((tag) => {
        return {
          destinationCount:
            (typeof tag.destinationCount == "string"
              ? parseInt(tag.destinationCount)
              : tag.destinationCount) ?? 0,
          listCount:
            (typeof tag.listCount == "string"
              ? parseInt(tag.listCount)
              : tag.listCount) ?? 0,
          text: tag.tag.name, // Assuming 'name' should be used as 'text'
          ...tag.tag,
        };
      });
      if (!tgs || tgs.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tags found",
        });
      }
      return {
        items: returnTags,
        count:
          (typeof tgs[0]?.count == "string"
            ? parseInt(tgs[0]?.count)
            : tgs[0]?.count) ?? 0,
      };
    }),
  update: protectedMutationProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/v1/tag/{id}",
        protect: true,
      },
    })
    .input(updateTagSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(tags)
        .set({
          name: input.name,
          description: input.description,
          color: input.color,
          shortcut: input.shortcut,
        })
        .where(and(eq(tags.id, input.id), eq(tags.userId, ctx.user.id)))
        .returning({
          id: tags.id,
        });

      return {
        success: true,
      };
    }),
  delete: protectedMutationProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/v1/tag/{id}",
        protect: true,
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(tags)
        .where(and(eq(tags.id, input.id), eq(tags.userId, ctx.user.id)));
      return {
        success: true,
      };
    }),
  get: protectedQueryProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/v1/tag/{id}",
        protect: true,
      },
    })
    .input(z.object({ id: z.number() }))
    .output(tagSchema)
    .query(async ({ ctx, input }) => {
      const tgData = await ctx.db
        .select({
          id: tags.id,
          name: tags.name,
          description: tags.description,
          color: tags.color,
          shortcut: tags.shortcut,
          createdAt: tags.createdAt,
          updatedAt: tags.updatedAt,
          userId: tags.userId,
          workspaceId: tags.workspaceId,
          count: sql<number>`count(*) over()`,
          destinationCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${destinationTags}
          WHERE ${destinationTags.tagId} = ${tags.id}
        )`,
          listCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${lists}
          WHERE ${listTags.tagId} = ${tags.id}
        )`,
        })
        .from(tags)
        .where(and(eq(tags.id, input.id), eq(tags.userId, ctx.user.id)))
        .limit(1);

      if (!tgData || tgData.length === 0 || !tgData[0]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Tag not found or access denied",
        });
      }

      const tg: Tag | undefined =
        tgData.length > 0
          ? {
              ...tgData[0],
              destinationCount:
                (typeof tgData[0]?.destinationCount == "string"
                  ? parseInt(tgData[0]?.destinationCount)
                  : tgData[0]?.destinationCount) ?? 0,
              listCount:
                (typeof tgData[0]?.listCount == "string"
                  ? parseInt(tgData[0]?.listCount)
                  : tgData[0]?.listCount) ?? 0,
            }
          : undefined;

      if (!tg) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Tag not found or access denied",
        });
      }

      return tg;
    }),
});
