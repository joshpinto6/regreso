import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  tagFormSchema,
  tagSchema,
  tagSearchSchema,
  updateTagSchema,
} from "~/server/models";

import {
  protectedMutationProcedure,
  protectedQueryProcedure,
} from "~/server/api/trpc";
import {
  destinationTags,
  listTags,
  tags,
  workspaces,
} from "~/server/db/schema";

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
      if (input.color?.includes("url(")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Invalid color value. Only hex colors or gradients are allowed.",
        });
      }

      const tagRows = await ctx.db
        .insert(tags)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
          shortcut: input.shortcut,
          workspaceId: input.workspaceId ?? ctx.user.workspaceId ?? 0,
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
    .query(async ({ ctx, input }) => {
      const tgs = await ctx.db
        .select({
          tag: tags,
          count: sql<number>`count(*) over()`,
          destinationCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${destinationTags}
            WHERE ${destinationTags.tagId} = ${tags.id}
          )`.as("destinationCount"),
          listCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${listTags}
            WHERE ${listTags.tagId} = ${tags.id}
          )`.as("listCount"),
          workspace: workspaces,
        })
        .from(tags)
        .leftJoin(workspaces, eq(tags.workspaceId, workspaces.id))

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
            input.workspaceId
              ? eq(tags.workspaceId, input.workspaceId)
              : undefined,
          ),
        )
        .groupBy(tags.id, workspaces.id)
        .orderBy(
          (input.order === "ASC" ? asc : desc)(
            input.sortBy === "destinationCount"
              ? sql<number>`(
            SELECT COUNT(*)
            FROM ${destinationTags}
            WHERE ${destinationTags.tagId} = ${tags.id}
          )`.as("destinationCount")
              : input.sortBy === "listCount"
                ? sql<number>`(
            SELECT COUNT(*)
            FROM ${listTags}
            WHERE ${listTags.tagId} = ${tags.id}
          )`.as("listCount")
                : tags[input.sortBy ?? "createdAt"],
          ),
        )
        .limit(input.limit)
        .offset(input.offset);

      const returnTags = tgs.map((tag) => {
        if (!tag.tag) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Tag not found or access denied",
          });
        }
        const { workspaceId, ...tagWithoutWorkspaceId } = tag.tag;
        void workspaceId;
        return {
          destinationCount:
            (typeof tag.destinationCount == "string"
              ? parseInt(tag.destinationCount)
              : tag.destinationCount) ?? 0,
          listCount:
            (typeof tag.listCount == "string"
              ? parseInt(tag.listCount)
              : tag.listCount) ?? 0,
          text: tag.tag.name,
          workspace: tag.workspace,
          ...tagWithoutWorkspaceId,
        };
      });
      if (!tgs || tgs.length === 0) {
        return {
          items: [],
          count: 0,
        };
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
          workspaceId: input.workspaceId ?? undefined,
          archived: input.archived ?? false,
        })
        .where(and(eq(tags.id, input.id), eq(tags.userId, ctx.user.id), (eq(tags.archived, false) || input.archived === false)))
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
          archived: tags.archived,
          createdAt: tags.createdAt,
          updatedAt: tags.updatedAt,
          userId: tags.userId,
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
          workspace: workspaces,
        })
        .from(tags)

        .leftJoin(workspaces, eq(tags.workspaceId, workspaces.id))
        .where(and(eq(tags.id, input.id), eq(tags.userId, ctx.user.id)))
        .limit(1);

      if (!tgData || tgData.length === 0 || !tgData[0]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Tag not found or access denied",
        });
      }

      const tgDataRow = tgData[0];
      if (!tgDataRow) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Tag not found or access denied",
        });
      }

      return {
        id: tgDataRow.id,
        name: tgDataRow.name,
        description: tgDataRow.description,
        color: tgDataRow.color,
        shortcut: tgDataRow.shortcut,
        createdAt: tgDataRow.createdAt,
        updatedAt: tgDataRow.updatedAt,
        archived: tgDataRow.archived,
        userId: tgDataRow.userId,
        workspace: tgDataRow.workspace,
        destinationCount:
          (typeof tgDataRow?.destinationCount == "string"
            ? parseInt(tgDataRow?.destinationCount)
            : tgDataRow?.destinationCount) ?? 0,
        listCount:
          (typeof tgDataRow?.listCount == "string"
            ? parseInt(tgDataRow?.listCount)
            : tgDataRow?.listCount) ?? 0,
      };
    }),
});
