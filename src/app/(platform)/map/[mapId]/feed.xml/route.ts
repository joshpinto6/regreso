import { type NextRequest } from "next/server";

import { api } from "~/trpc/server";
import RSS from "rss";
import { type Destination, type List } from "~/server/models";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { getBaseOrigin } from "~/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mapId: string }> },
) {
  const { mapId } = await context.params;

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
    const data: List | undefined = await (trpcServerClient ?? api).list.get({
      id: parseInt(mapId.split(",")[0] ?? "0", 10),
    });
    if (data === undefined) {
      return new Response("Not found", { status: 404 });
    }

    const searchResults: { count: number; items: Destination[] } = await (
      trpcServerClient ?? api
    ).destination.getMany({
      lists: mapId.split(",").map((id) => parseInt(id)),
      offset: parseInt(searchParams.get("offset") ?? "0"),
      limit: parseInt(searchParams.get("limit") ?? "6"),
      type: (searchParams.get("type") as "location" | "note" | "any") ?? "any",
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
        (searchParams.get("sortBy") as "createdAt" | "updatedAt" | "name") ??
        undefined,
      order: (searchParams.get("order") as "ASC" | "DESC") ?? undefined,
    });

    const feed = new RSS({
      title: data?.emoji + " " + data?.name + " > Regreso",
      description: data.description ?? undefined,
      site_url: getBaseOrigin(),
      feed_url: `${getBaseOrigin()}/map/${mapId}/feed.xml`,
      copyright: `${new Date().getFullYear()} Regreso`,
      language: "en",
      pubDate: new Date(),
    });

    searchResults.items.map((result: Destination) => {
      feed.item({
        title: result.name ?? "",
        guid: result.id.toString(),
        url: `${getBaseOrigin()}/pin/${result.id}`,
        date: result.createdAt,
        description: result.body ?? "",
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
