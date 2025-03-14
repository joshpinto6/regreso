import { type NextRequest } from "next/server";

import { api } from "~/trpc/server";
import RSS from "rss";
import { type Destination, type List } from "~/server/models";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { getBaseOrigin } from "~/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ searchType: string }> },
) {
  const { searchType } = await context.params;

  if (searchType !== "pins" && searchType !== "maps") {
    return new Response("Not found", { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const session =
    searchParams.get("session") ?? request.headers.get("authorization");

  const trpcServerClient = session
    ? appRouter.createCaller(
        await createTRPCContext({
          headers: new Headers(),
          sesh: session,
        }),
      )
    : null;
  try {
    // TODO: consolidate this code with that from /map/[mapId]/feed.xml/route.ts
    const searchResults: { count: number; items: Destination[] | List[] } =
      searchType == "pins"
        ? await (trpcServerClient ?? api).destination.getMany({
            lists: searchParams.get("lists")
              ? searchParams
                  .get("lists")
                  ?.split(",")
                  .map((id) => parseInt(id))
              : [],
            offset: parseInt(searchParams.get("offset") ?? "0"),
            limit: parseInt(searchParams.get("limit") ?? "6"),
            type:
              (searchParams.get("type") as "location" | "note" | "any") ??
              "any",
            tags:
              searchParams
                .get("tags")
                ?.split(",")
                .filter((t) => t && t != "") ?? [],
            searchString: searchParams.get("search") ?? "",
            location: searchParams.get("location") ?? "",
            startDate: searchParams.get("startDate")
              ? new Date(searchParams.get("startDate")!)
              : undefined,
            endDate: searchParams.get("endDate")
              ? new Date(searchParams.get("endDate")!)
              : undefined,
            sortBy:
              (searchParams.get("sortBy") as
                | "createdAt"
                | "updatedAt"
                | "name") ?? undefined,
            order: (searchParams.get("order") as "ASC" | "DESC") ?? undefined,
          })
        : await (trpcServerClient ?? api).list.getMany({
            offset: parseInt(searchParams.get("offset") ?? "0"),
            limit: parseInt(searchParams.get("limit") ?? "6"),
            searchString: searchParams.get("search") ?? "",
            sortBy:
              (searchParams.get("sortBy") as
                | "createdAt"
                | "updatedAt"
                | "name") ?? undefined,
            order: (searchParams.get("order") as "ASC" | "DESC") ?? undefined,
          });

    const feed = new RSS({
      title: "Search results > Regreso",
      description:
        (searchType == "pins" ? "Destinations" : "Maps") +
        (searchParams.get("type") != "any"
          ? ` of type "${searchParams.get("type")}"`
          : "") +
        (searchParams.get("search")
          ? ` matching "${searchParams.get("search")}"${searchParams.get("location") ? " and location: '" + searchParams.get("location") + "'" : ""}`
          : searchParams.get("location")
            ? " matching location '" + searchParams.get("location") + "'"
            : "") +
        (searchParams.get("lists") &&
        (searchParams.get("lists") ?? "").split(",").length > 0
          ? ` in lists ${searchParams.get("lists") ?? ""}`
          : "") +
        (searchParams.get("tags") &&
        (searchParams.get("tags") ?? "").split(",").length > 0
          ? ` with tags ${searchParams.get("tags") ?? ""}`
          : "") +
        (searchParams.get("startDate")
          ? ` after ${searchParams.get("startDate")}`
          : "") +
        (searchParams.get("endDate")
          ? `${searchParams.get("startDate") ? " and" : ""} before ${searchParams.get("endDate")}`
          : ""),
      image_url: `${getBaseOrigin()}/logo.png`,
      site_url: getBaseOrigin(),
      feed_url: `${getBaseOrigin()}/search/${searchType}/feed.xml`,
      copyright: `${new Date().getFullYear()} Regreso`,
      language: "en",
      pubDate: new Date(),
    });

    searchResults.items.map((result: Destination | List) => {
      feed.item({
        title: result.name ?? "",
        guid: result.id.toString(),
        url: `${getBaseOrigin()}/pin/${result.id}`,
        author: result.userId.toString(),
        date: result.createdAt,
        description:
          ("body" in result ? result.body : result.description) ?? "",
        categories: result.tags?.map((tag) => tag.text) ?? [],
      });
    });

    return new Response(feed.xml({ indent: true }), {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message == "UNAUTHORIZED") {
        return new Response(e.message, { status: 401 });
      }
      return new Response(e.message, { status: 500 });
    }
    return new Response("An unknown error occurred", { status: 500 });
  }
}
