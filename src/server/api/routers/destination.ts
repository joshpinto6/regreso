import {
  aliasedTable,
  and,
  asc,
  desc,
  eq,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import {
  destinationSchema,
  destinationSearchSchema,
  updateDestinationSchema,
  type Destination,
} from "~/server/models";

import {
  createTRPCRouter,
  protectedMutationProcedure,
  protectedQueryProcedure,
} from "~/server/api/trpc";
import {
  destinationLists,
  destinations,
  destinationTags,
  lists,
  listTags,
  tags,
} from "~/server/db/schema";

export const destinationRouter = createTRPCRouter({
  create: protectedMutationProcedure
    .input(destinationSchema)
    .mutation(async ({ ctx, input }) => {
      const destinationRows = await ctx.db
        .insert(destinations)
        .values({
          userId: ctx.user.id,
          name: input.name,
          body: input.body,
          type: input.type,
          location: input.location,
        })
        .returning({
          id: destinations.id,
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
            destinationTags: true,
          },
        });
        const newTagRows = await ctx.db
          .insert(tags)
          .values(
            input.tags.map((tag) => {
              return {
                userId: ctx.user.id,
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
        await ctx.db.insert(destinationTags).values(
          tagRows.map((tag) => {
            return {
              destinationId: destinationRows[0]!.id,
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
    .input(destinationSearchSchema)
    .query(
      async ({
        ctx,
        input,
      }): Promise<{ items: Destination[]; count: number }> => {
        const tagNames = input.tags ?? [];
        const listIds = input.lists ?? [];
        const dests = await ctx.db
          .select({
            destination: destinations,
            count: sql<number>`count(*) over()`,
          })
          .from(destinations)
          .leftJoin(
            destinationLists,
            listIds.length > 0 || tagNames.length > 0
              ? eq(destinationLists.destinationId, destinations.id)
              : sql`1 = 0`,
          )
          .leftJoin(
            destinationTags,
            tagNames.length > 0
              ? eq(destinations.id, destinationTags.destinationId)
              : sql`1 = 0`,
          )
          .leftJoin(
            tags,
            tagNames.length > 0
              ? eq(destinationTags.tagId, tags.id)
              : sql`1 = 0`,
          )
          .leftJoin(
            listTags,
            tagNames.length > 0
              ? eq(destinationLists.listId, listTags.listId)
              : sql`1 = 0`,
          )
          .leftJoin(
            aliasedTable(tags, "list_tags"),
            tagNames.length > 0
              ? eq(listTags.tagId, sql`list_tags.id`)
              : sql`1 = 0`,
          )
          .where(
            and(
              and(
                input.searchString && input.searchString.length > 0
                  ? sql`(setweight(to_tsvector('english', ${destinations.name}), 'A') ||
                      setweight(to_tsvector('english', ${destinations.body}), 'B'))
                      @@ websearch_to_tsquery('english', ${input.searchString})`
                  : undefined,
              ),
              input.location
                ? sql`regexp_replace(${destinations.location}, '^https?://', '') SIMILAR TO ${input.location}`
                : undefined,
              input.type && input.type != "any"
                ? eq(destinations.type, input.type)
                : undefined,
              tagNames.length > 0
                ? or(
                    inArray(tags.name, tagNames),
                    inArray(tags.shortcut, tagNames),
                    inArray(sql`list_tags.name`, tagNames),
                    inArray(sql`list_tags.shortcut`, tagNames),
                  )
                : undefined,
              listIds.length > 0
                ? inArray(destinationLists.listId, listIds)
                : undefined,
              eq(destinations.userId, ctx.user.id),
            ),
          )
          .groupBy(destinations.id)
          .having(
            and(
              tagNames.length > 0
                ? sql`COUNT(DISTINCT CASE 
                    WHEN ${tags.id} IS NOT NULL THEN ${tags.id} 
                    WHEN list_tags.id IS NOT NULL THEN list_tags.id 
                    END) = ${tagNames.length}`
                : undefined,
              listIds.length > 0
                ? sql`COUNT(DISTINCT ${destinationLists.listId}) = ${listIds.length}`
                : undefined,
            ),
          )
          .orderBy(
            input.order == "ASC"
              ? asc(destinations[input.sortBy ?? "createdAt"])
              : desc(destinations[input.sortBy ?? "createdAt"]),
          )
          .limit(input.limit)
          .offset(input.offset);
        const destTags = await ctx.db
          .select()
          .from(destinationTags)
          .innerJoin(tags, eq(destinationTags.tagId, tags.id))
          .where(
            inArray(
              destinationTags.destinationId,
              dests.map((dest) => dest.destination.id),
            ),
          );

        const returnDestinations = dests.map((dest) => {
          return {
            tags: destTags
              .filter(
                (tag) =>
                  tag.destination_tag.destinationId == dest.destination.id,
              )
              .map((tag) => {
                return {
                  id: tag.tag.id,
                  text: tag.tag.name,
                };
              }),
            ...dest.destination,
          };
        });
        return {
          items: returnDestinations,
          count: dests[0]?.count ?? 0,
        };
      },
    ),
  update: protectedMutationProcedure
    .input(updateDestinationSchema)
    .mutation(async ({ ctx, input }) => {
      const destinationRows = await ctx.db
        .update(destinations)
        .set({
          name: input.name,
          body: input.body,
          type: input.type,
          location: input.location,
        })
        .where(
          and(
            eq(destinations.id, input.id),
            eq(destinations.userId, ctx.user.id),
          ),
        )
        .returning({
          id: destinations.id,
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
            destinationTags: true,
          },
        });
        const newTagRows = await ctx.db
          .insert(tags)
          .values(
            input.tags.map((tag) => {
              return {
                userId: ctx.user.id,
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
        await ctx.db
          .insert(destinationTags)
          .values(
            tagRows.map((tag) => {
              return {
                destinationId: destinationRows[0]!.id,
                tagId: tag.id,
              };
            }),
          )
          .onConflictDoNothing();
      }
      return {
        success: true,
      };
    }),
  delete: protectedMutationProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(destinations)
        .where(
          and(
            eq(destinations.id, input.id),
            eq(destinations.userId, ctx.user.id),
          ),
        );
      return {
        success: true,
      };
    }),

  get: protectedQueryProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const dest: Destination | undefined =
        await ctx.db.query.destinations.findFirst({
          where: and(
            eq(destinations.id, input.id),
            eq(destinations.userId, ctx.user.id),
          ),
        });

      return {
        ...dest,
        lists: dest
          ? await ctx.db.query.destinationLists
              .findMany({
                where: eq(destinationLists.destinationId, dest.id),
                with: {
                  list: true,
                },
              })
              .then((res) =>
                res.map((listRow) => {
                  return {
                    ...listRow.list,
                  };
                }),
              )
          : undefined,
        tags: dest
          ? await ctx.db.query.destinationTags
              .findMany({
                where: eq(destinationTags.destinationId, dest.id),
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
  addToLists: protectedMutationProcedure
    .input(z.object({ destinationId: z.number(), lists: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const destination = await ctx.db.query.destinations.findFirst({
        where: and(
          eq(destinations.id, input.destinationId),
          eq(destinations.userId, ctx.user.id),
        ),
      });

      if (!destination) {
        throw new Error("Destination not found or does not belong to the user");
      }

      const validLists = await ctx.db.query.lists.findMany({
        where: and(
          inArray(lists.id, input.lists),
          eq(lists.userId, ctx.user.id),
        ),
      });

      await ctx.db.insert(destinationLists).values(
        validLists.map((list) => {
          return {
            destinationId: input.destinationId,
            listId: list.id,
          };
        }),
      );
      return {
        success: true,
      };
    }),
  removeFromLists: protectedMutationProcedure
    .input(z.object({ destinationId: z.number(), lists: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const destination = await ctx.db.query.destinations.findFirst({
        where: and(
          eq(destinations.id, input.destinationId),
          eq(destinations.userId, ctx.user.id),
        ),
      });

      if (!destination) {
        throw new Error("Destination not found or does not belong to the user");
      }

      const validLists = await ctx.db.query.lists.findMany({
        where: and(
          inArray(lists.id, input.lists),
          eq(lists.userId, ctx.user.id),
        ),
      });

      await ctx.db.delete(destinationLists).where(
        and(
          eq(destinationLists.destinationId, input.destinationId),
          inArray(
            destinationLists.listId,
            validLists.map((list) => list.id),
          ),
        ),
      );
      return {
        success: true,
      };
    }),
});
