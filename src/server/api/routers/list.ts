import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, exists, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  listFormSchema,
  listSchema,
  listSearchSchema,
  updateListSchema,
  type List,
} from "~/server/models";

import {
  createTRPCRouter,
  protectedMutationProcedure,
  protectedQueryProcedure,
} from "~/server/api/trpc";
import {
  destinationLists,
  destinations,
  lists,
  listTags,
  tags,
  workspaces,
} from "~/server/db/schema";

export const listRouter = createTRPCRouter({
  create: protectedMutationProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/lists",
        protect: true,
      },
    })
    .input(listFormSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const listRows = await ctx.db
        .insert(lists)
        .values({
          workspaceId: input.workspaceId ?? ctx.user.workspaceId ?? 0,
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
        })
        .returning({
          id: lists.id,
        });
      if (input.tags.length > 0) {
        const existingTagRows = await ctx.db.query.tags.findMany({
          where: or(
            inArray(
              tags.name,
              input.tags.map((tag) => tag.text),
            ),
            inArray(
              tags.shortcut,
              input.tags.map((tag) => tag.text),
            ),
          ),
          with: {
            listTags: true,
          },
        });
        const newTagRows = await ctx.db
          .insert(tags)
          .values(
            input.tags.map((tag) => {
              return {
                userId: ctx.user.id,
                workspaceId: input.workspaceId ?? ctx.user.workspaceId ?? 0,
                name: tag.text,
                shortcut: tag.text.toLowerCase().replace(/\s/g, "-"),
              };
            }),
          )
          .onConflictDoNothing()
          .returning({
            id: tags.id,
          });

        const tagRows = [...newTagRows, ...existingTagRows];
        await ctx.db.insert(listTags).values(
          tagRows.map((tag) => {
            return {
              listId: listRows[0]!.id,
              tagId: tag.id,
            };
          }),
        );
      }
      return {
        success: true,
      };
    }),
  getMany: protectedQueryProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/v1/lists",
        protect: true,
      },
    })
    .input(listSearchSchema)
    .output(
      z.object({
        items: z.array(listSchema),
        count: z.number(),
      }),
    )
    .query(
      async ({ ctx, input }): Promise<{ items: List[]; count: number }> => {
        const tagNames = input.tags ?? [];

        const stats = ctx.db.$with("list_stats").as(
          ctx.db
            .select({
              listId: lists.id,
              size: sql<number>`COUNT(${destinationLists}.id)`.as("list_size"),
              latestCreatedAt:
                sql<Date | null>`MAX(${destinations.createdAt})`.as(
                  "latest_created",
                ),
            })

            .from(lists)
            .where(eq(lists.userId, ctx.user.id))

            .leftJoin(destinationLists, eq(lists.id, destinationLists.listId))
            .leftJoin(
              destinations,
              eq(destinationLists.destinationId, destinations.id),
            )
            .groupBy(lists.id),
        );

        const lsts = await ctx.db
          .with(stats)
          .select({
            list: lists,
            count: sql<number>`count(*) over()`,
            size: sql<number>`${stats.size}`.as("size"),
            latestCreatedAt: sql<Date | null>`${stats.latestCreatedAt}`.as(
              "updated_at",
            ),
            workspace: workspaces,
          })
          .from(lists)
          .leftJoin(stats, eq(lists.id, stats.listId))
          .leftJoin(
            listTags,
            tagNames.length > 0 ? eq(lists.id, listTags.listId) : sql`1 = 0`,
          )
          .leftJoin(
            tags,
            tagNames.length > 0 ? eq(listTags.tagId, tags.id) : sql`1 = 0`,
          )
          .leftJoin(workspaces, eq(lists.workspaceId, workspaces.id))
          .where(
            and(
              and(
                input.searchString && input.searchString.length > 0
                  ? sql`(setweight(to_tsvector('english', ${lists.name}), 'A') ||
            setweight(to_tsvector('english', ${lists.description}), 'B'))
            @@ websearch_to_tsquery  ('english', ${input.searchString})`
                  : undefined,
              ),
              tagNames.length > 0
                ? or(
                    inArray(tags.name, tagNames),
                    inArray(tags.shortcut, tagNames),
                  )
                : undefined,
              eq(lists.userId, ctx.user.id),
              input.workspaceId
                ? eq(lists.workspaceId, input.workspaceId)
                : undefined,
            ),
          )

          .groupBy(
            lists.id,
            lists.name,
            lists.description,
            lists.userId,
            lists.createdAt,
            stats.size,
            stats.latestCreatedAt,
            workspaces.id,
          )
          .orderBy(
            (input.order === "ASC" ? asc : desc)(
              input.sortBy === "size"
                ? stats.size
                : input.sortBy === "updatedAt"
                  ? stats.latestCreatedAt
                  : lists[input.sortBy ?? "createdAt"],
            ),
          )
          .limit(input.limit)
          .offset(input.offset);

        const lstTags = await ctx.db
          .select()
          .from(listTags)
          .innerJoin(tags, eq(listTags.tagId, tags.id))
          .where(
            inArray(
              listTags.listId,
              lsts.map((list) => list.list.id),
            ),
          );

        const returnLists: List[] = lsts.map((list) => {
          if (!list.workspace) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Workspace not found for list.",
            });
          }
          return {
            tags: lstTags
              .filter((tag) => tag.list_tag.listId == list.list.id)
              .map((tag) => {
                return {
                  id: tag.tag.id,
                  text: tag.tag.name,
                };
              }),
            size:
              (typeof list.size == "string"
                ? parseInt(list.size)
                : list.size) ?? 0,
            updatedAt:
              typeof list.latestCreatedAt == "string"
                ? new Date(list.latestCreatedAt)
                : list.latestCreatedAt,
            ...list.list,
            emoji: list.list?.emoji
              ? list.list?.emoji.match(
                  /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                )
                ? (list.list?.emoji.match(
                    /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                  )?.[0] ?? null)
                : null
              : null,
            workspace: list.workspace,
          };
        });
        if (!lsts) {
          return {
            items: [],
            count: 0,
          };
        }

        return {
          items: returnLists,
          count:
            (typeof lsts[0]?.count == "string"
              ? parseInt(lsts[0]?.count)
              : lsts[0]?.count) ?? 0,
        };
      },
    ),
  update: protectedMutationProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/v1/list/{id}",
        protect: true,
      },
    })
    .input(updateListSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      let listRows = null;
      if (input.name || input.emoji || input.description) {
        listRows = await ctx.db
          .update(lists)
          .set({
            name: input.name,
            description: input.description,
            emoji: input.emoji,
            workspaceId: input.workspaceId ?? undefined,
                      archived: input.archived ?? false,

          })
          .where(and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id), (eq(lists.archived, false) || input.archived === false)))
          .returning({
            id: lists.id,
          });
      } else {
        listRows = await ctx.db.query.lists.findMany({
          columns: { id: true },
          where: and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)),
        });
      }
      if (
        (input.tags && input.tags.length > 0) ||
        (input.newTags && input.newTags?.length > 0) ||
        (input.removedTags && input.removedTags.length > 0)
      ) {
        const existingTagRows =
          input.tags || input.newTags
            ? await ctx.db.query.tags.findMany({
                where: or(
                  inArray(
                    tags.name,
                    input.tags
                      ? input.tags.map((tag) => tag.text)
                      : input.newTags
                        ? input.newTags?.map((tag) => tag)
                        : [],
                  ),
                  inArray(
                    tags.shortcut,
                    input.tags
                      ? input.tags.map((tag) => tag.text)
                      : input.newTags
                        ? input.newTags?.map((tag) => tag)
                        : [],
                  ),
                ),
                with: {
                  destinationTags: true,
                },
              })
            : [];
        const newTagValues = [
          ...(input.tags
            ? input.tags.map((tag) => {
                return {
                  userId: ctx.user.id,
                  workspaceId: input.workspaceId ?? ctx.user.workspaceId ?? 0,
                  name: tag.text,
                  shortcut: tag.text.toLowerCase().replace(/\s/g, "-"),
                };
              })
            : []),
          ...(input.newTags
            ? input.newTags.map((tag) => {
                return {
                  userId: ctx.user.id,
                  workspaceId: input.workspaceId ?? ctx.user.workspaceId ?? 0,
                  name: tag,
                  shortcut: tag.toLowerCase().replace(/\s/g, "-"),
                };
              })
            : []),
        ];
        let newTagRows: { id: number }[] = [];
        if (newTagValues.length > 0) {
          newTagRows = await ctx.db
            .insert(tags)
            .values(newTagValues)
            .onConflictDoNothing()
            .returning({
              id: tags.id,
            });
        }

        if (input.removedTags && input.removedTags.length > 0) {
          await ctx.db.delete(listTags).where(
            and(
              eq(listTags.listId, input.id),
              exists(
                ctx.db
                  .select()
                  .from(lists)
                  .where(
                    and(
                      eq(lists.id, listTags.listId),
                      eq(lists.userId, ctx.user.id),
                    ),
                  ),
              ),
              exists(
                ctx.db
                  .select()
                  .from(tags)
                  .where(
                    and(
                      eq(tags.id, listTags.tagId),
                      inArray(tags.name, input.removedTags),
                    ),
                  ),
              ),
            ),
          );
        }

        const tagRows = [...newTagRows, ...existingTagRows];
        if (tagRows.length > 0) {
          await ctx.db
            .insert(listTags)
            .values(
              tagRows.map((tag) => {
                return {
                  listId: listRows[0]!.id,
                  tagId: tag.id,
                };
              }),
            )
            .onConflictDoNothing();
        }
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
    .output(listSchema)
    .query(async ({ ctx, input }) => {
      const lstData = await ctx.db
        .select({
          id: lists.id,
          name: lists.name,
          description: lists.description,
          emoji: lists.emoji,
          createdAt: lists.createdAt,
          userId: lists.userId,
          archived: lists.archived,
          count: sql<number>`count(*) over()`,
          size: sql<number>`COUNT(${destinationLists}.id)`,
          updatedAt: sql<Date | null>`(
                SELECT MAX(${destinations.createdAt})
                FROM ${destinations}
                JOIN ${destinationLists} ON ${destinations.id} = ${destinationLists.destinationId}
                WHERE ${destinationLists.listId} = ${lists.id}
              )`,
          workspace: workspaces,
        })
        .from(lists)
        .leftJoin(destinationLists, eq(lists.id, destinationLists.listId))
        .leftJoin(workspaces, eq(lists.workspaceId, workspaces.id))
        .where(and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)))
        .groupBy(lists.id, workspaces.id)
        .limit(1);

      if (!lstData || lstData.length === 0 || !lstData[0]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or access denied",
        });
      }

      if (!lstData[0].workspace) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Workspace not found for list",
        });
      }
      const lst: List | undefined =
        lstData.length > 0
          ? {
              ...lstData[0],
              size:
                (typeof lstData[0]?.size == "string"
                  ? parseInt(lstData[0]?.size)
                  : lstData[0]?.size) ?? 0,
              updatedAt:
                typeof lstData[0].updatedAt == "string"
                  ? new Date(lstData[0].updatedAt)
                  : lstData[0].updatedAt,
              workspace: lstData[0].workspace,
            }
          : undefined;

      if (!lst) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or access denied",
        });
      }

      return {
        ...lst,
        emoji:
          (lst?.emoji
            ? lst?.emoji.match(
                /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
              )
              ? (lst?.emoji.match(
                  /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                )?.[0] ?? null)
              : null
            : null) ?? "❔",
        tags: lst
          ? await ctx.db.query.listTags
              .findMany({
                where: eq(listTags.listId, lst.id),
                with: {
                  tag: true,
                },
              })
              .then((res) =>
                res.map((tagRow) => {
                  return {
                    id: tagRow.tag!.id,
                    text: tagRow.tag!.name,
                  };
                }),
              )
          : undefined,
      };
    }),

  addDestinations: protectedMutationProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/list/{id}/add-destinations",
        protect: true,
      },
    })
    .input(z.object({ destinations: z.array(z.number()), id: z.number() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.query.lists.findFirst({
        where: and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)),
      });

      if (!list) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or access denied",
        });
      }

      const destinationCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(destinations)
        .where(
          and(
            inArray(destinations.id, input.destinations),
            eq(destinations.userId, ctx.user.id),
          ),
        );

      if (destinationCount[0]?.count !== input.destinations.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "One or more destinations not found or access denied",
        });
      }

      await ctx.db.insert(destinationLists).values(
        input.destinations.map((id) => ({
          destinationId: id,
          listId: input.id,
        })),
      );

      return { success: true };
    }),

  removeDestinations: protectedMutationProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/list/{id}/remove-destinations",
        protect: true,
      },
    })
    .input(z.object({ destinations: z.array(z.number()), id: z.number() }))
    .output(z.object({ success: z.boolean() }))

    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(destinationLists).where(
        and(
          eq(destinationLists.id, input.id),
          inArray(destinationLists.destinationId, input.destinations),
          exists(
            ctx.db
              .select()
              .from(lists)
              .where(
                and(eq(lists.id, input.id), eq(lists.userId, ctx.user.id)),
              ),
          ),
          exists(
            ctx.db
              .select()
              .from(destinations)
              .where(
                and(
                  inArray(destinations.id, input.destinations),
                  eq(destinations.userId, ctx.user.id),
                ),
              ),
          ),
        ),
      );

      return { success: true };
    }),
});
