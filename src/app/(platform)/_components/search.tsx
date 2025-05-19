"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { api } from "~/trpc/react";
import { TagInput, type Tag as EmblorTag } from "emblor";
import {
  ArrowRight,
  ListPlus,
  Loader2,
  MapPinPlus,
  PackagePlus,
  Search,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import {
  type Destination,
  type destinationSearchSchema,
  type List,
  type listSearchSchema,
  type Tag,
  type tagSearchSchema,
  type Workspace,
  type workspaceSearchSchema,
} from "~/server/models";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/hooks/use-toast";

import { DestinationCard, DestinationForm } from "./destination";
import { ListCard, ListForm } from "./list";
import { TagCard, TagForm } from "./tag";
import { WorkspaceCard, WorkspaceForm } from "./workspace";

export function SearchForm({
  searchType,
  recentWorkspaces,
  isFetchingWorkspaces,
}: {
  searchType: "maps" | "pins" | "tags" | "boxes";
  recentWorkspaces: Workspace[];
  isFetchingWorkspaces: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [submitType, setSubmitType] = useState(searchType);

  const [tags, setTags] = useState<EmblorTag[]>(
    searchParams.get("tags") && searchParams.get("tags")!.split(",").length > 0
      ? searchParams
          .get("tags")!
          .split(",")
          .map(
            (tag) =>
              ({
                text: tag,
                id: Math.floor(Math.random() * 1000000000).toString(),
              }) as EmblorTag,
          )
      : [],
  );

  const form = useForm<
    | z.infer<typeof listSearchSchema>
    | z.infer<typeof destinationSearchSchema>
    | z.infer<typeof tagSearchSchema>
    | z.infer<typeof workspaceSearchSchema>
  >({
    defaultValues:
      searchType === "maps"
        ? {
            tags: searchParams.get("tags")?.split(",") ?? [],
            sortBy:
              (searchParams.get("sortBy") as "name" | "createdAt") ??
              "createdAt",
            order: (searchParams.get("order") as "ASC" | "DESC") ?? "ASC",
            searchString: searchParams.get("searchString") ?? "",
          }
        : searchType === "tags"
          ? {
              sortBy:
                (searchParams.get("sortBy") as "name" | "createdAt") ??
                "createdAt",
              order: (searchParams.get("order") as "ASC" | "DESC") ?? "ASC",
              searchString: searchParams.get("searchString") ?? "",
            }
          : searchType === "boxes"
            ? {
                sortBy:
                  (searchParams.get("sortBy") as "name" | "createdAt") ??
                  "createdAt",
                order: (searchParams.get("order") as "ASC" | "DESC") ?? "ASC",
                searchString: searchParams.get("searchString") ?? "",
              }
            : {
                type:
                  (searchParams.get("type") as "location" | "note" | "any") ??
                  "any",
                tags: searchParams.get("tags")?.split(",") ?? [],
                sortBy:
                  (searchParams.get("sortBy") as "name" | "createdAt") ??
                  "createdAt",
                order: (searchParams.get("order") as "ASC" | "DESC") ?? "DESC",
                searchString: searchParams.get("searchString") ?? "",
                location: searchParams.get("location") ?? "",
              },
  });

  const [submitValues, setSubmitValues] = useState(form.getValues());

  const {
    data: searchResults = { count: 0, items: [] },
    refetch,
    isFetching,
  } = searchType === "boxes"
    ? api.workspace.getMany.useQuery({
        ...submitValues,
        sortBy: submitValues.sortBy as
          | "name"
          | "createdAt"
          | "destinationCount"
          | "listCount"
          | "tagCount",
        limit: 6,
      })
    : searchType === "maps"
      ? api.list.getMany.useQuery({
          ...submitValues,
          limit: 6,
          sortBy: submitValues.sortBy as
            | "name"
            | "createdAt"
            | "updatedAt"
            | "emoji"
            | "size",
        })
      : searchType === "tags"
        ? api.tag.getMany.useQuery({
            ...submitValues,
            sortBy: submitValues.sortBy as
              | "name"
              | "color"
              | "createdAt"
              | "destinationCount"
              | "listCount"
              | "updatedAt",
            limit: 6,
          })
        : api.destination.getMany.useQuery({
            ...submitValues,
            sortBy: submitValues.sortBy as "name" | "createdAt" | "updatedAt",
            limit: 6,
          });

  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const [pageNumber, setPageNumber] = useState(1);

  function updateUrl(
    data:
      | z.infer<typeof destinationSearchSchema>
      | z.infer<typeof listSearchSchema>
      | z.infer<typeof tagSearchSchema>
      | z.infer<typeof workspaceSearchSchema>,
  ) {
    const newParams = Object.entries(data).map(([key, value]) =>
      value !== undefined && value !== null && value !== ""
        ? `${key}=${Array.isArray(value) ? value.join(",") : value}`
        : null,
    );

    return newParams.filter(Boolean).join("&");
  }
  function onSubmit(
    data:
      | z.infer<typeof destinationSearchSchema>
      | z.infer<typeof listSearchSchema>
      | z.infer<typeof tagSearchSchema>
      | z.infer<typeof workspaceSearchSchema>,
  ) {
    setSubmitValues(data);
    setSubmitType(searchType);
    router.push(pathname + "?" + updateUrl(data));
    void refetch();
  }
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-grow flex-col items-center space-y-4 lg:gap-3 lg:space-y-0">
            <div className="flex w-full flex-grow flex-row items-center gap-4 sm:flex-wrap lg:flex-nowrap">
              {searchType !== "boxes" ? (
                <FormField
                  control={form.control}
                  name="workspaceId"
                  render={({ field }) => (
                    <FormItem className="flex flex-row space-x-2 space-y-0">
                      <Select
                        onValueChange={(value) => {
                          if (value === "any") {
                            field.onChange(undefined);
                          } else {
                            field.onChange(parseInt(value));
                          }
                        }}
                        value={field.value?.toString() ?? "any"}
                        defaultValue={"any"}
                        disabled={isFetchingWorkspaces}
                      >
                        <FormControl>
                          <SelectTrigger className="space-between min-w-[120px]">
                            <SelectValue placeholder="Trunk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Trunk</SelectLabel>

                            <SelectItem value="any">Any Trunk</SelectItem>
                            {recentWorkspaces.map((workspace) => {
                              return (
                                <SelectItem
                                  value={workspace.id.toString()}
                                  key={workspace.id.toString()}
                                >
                                  {workspace.name}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              ) : null}
              {searchType !== "pins" ? null : (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex flex-row space-x-2 space-y-0">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? "any"}
                      >
                        <FormControl>
                          <SelectTrigger className="space-between w-[110px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Type</SelectLabel>
                            <SelectItem value="any">Any Type</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                            <SelectItem value="note">Note</SelectItem>
                            <SelectItem value="file" disabled>
                              File
                              <Badge variant="secondary" className="ml-2">
                                Soon!
                              </Badge>
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              {form.watch("type") == "location" ? (
                <>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <Input
                          placeholder="URL RegExp"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormItem>
                    )}
                  />
                  <Separator orientation="vertical" className="h-8" />
                </>
              ) : null}

              <FormField
                control={form.control}
                name="searchString"
                render={({ field }) => (
                  <FormControl>
                    <Input
                      placeholder="Search with text..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                )}
              />
            </div>
            {searchType == "maps" || searchType == "pins" ? (
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormControl>
                    <TagInput
                      {...field}
                      placeholder="Search with tags..."
                      tags={tags}
                      className="sm:min-w-[450px]"
                      setTags={(newTags) => {
                        setTags(newTags);
                        form.setValue(
                          "tags",
                          (newTags as [EmblorTag, ...EmblorTag[]]).map(
                            (tag: EmblorTag) => tag.text,
                          ),
                          { shouldDirty: true },
                        );
                      }}
                      styleClasses={{
                        input: "w-full sm:max-w-[350px]",
                      }}
                      activeTagIndex={activeTagIndex}
                      setActiveTagIndex={setActiveTagIndex}
                    />
                  </FormControl>
                )}
              />
            ) : null}
          </div>
          <div className="flex flex-row flex-wrap justify-end gap-4">
            <FormField
              control={form.control}
              name="sortBy"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sort by</SelectLabel>

                      <SelectItem value="createdAt">Created At</SelectItem>

                      {searchType !== "boxes" && (
                        <SelectItem value="updatedAt">Updated At</SelectItem>
                      )}
                      <SelectItem value="name">Name</SelectItem>
                      {(searchType === "maps" || searchType == "boxes") && (
                        <SelectItem value="emoji">Emoji</SelectItem>
                      )}
                      {searchType === "tags" && (
                        <SelectItem value="color">Color</SelectItem>
                      )}

                      {(searchType === "tags" || searchType === "boxes") && (
                        <SelectItem value="destinationCount">
                          Destinations
                        </SelectItem>
                      )}
                      {(searchType === "tags" || searchType === "boxes") && (
                        <SelectItem value="listCount">Maps</SelectItem>
                      )}
                      {searchType === "boxes" && (
                        <SelectItem value="tagCount">Tags</SelectItem>
                      )}
                      {searchType === "maps" && (
                        <SelectItem value="size">Size</SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Direction</SelectLabel>

                      <SelectItem value="ASC">Ascending</SelectItem>
                      <SelectItem value="DESC">Descending</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <Button
              type="submit"
              id="search-button"
              className="w-full lg:w-1/4"
              disabled={isFetching || !form.formState.isDirty}
            >
              {isFetching ? <Loader2 className="animate-spin" /> : <Search />}
              Search
            </Button>
          </div>
        </form>
      </Form>
      <div className="flex flex-col space-y-4 px-1">
        <p className="font-regular text-sm">
          {searchResults.count} search results found:
        </p>
        {searchResults.items.length > 0 ? (
          submitType === "maps" && searchType == "maps" ? (
            (searchResults.items as List[]).map((lst: List) => {
              return <ListCard key={lst.id} {...lst} />;
            })
          ) : submitType == "pins" && searchType == "pins" ? (
            (searchResults.items as Destination[]).map((dest: Destination) => {
              return <DestinationCard key={dest.id} {...dest} />;
            })
          ) : submitType == "tags" && searchType == "tags" ? (
            (searchResults.items as Tag[]).map((tg: Tag) => {
              return <TagCard key={tg.id} {...tg} />;
            })
          ) : submitType == "boxes" && searchType == "boxes" ? (
            (searchResults.items as Workspace[]).map((wkspc: Workspace) => {
              return <WorkspaceCard key={wkspc.id} {...wkspc} />;
            })
          ) : null
        ) : isFetching ? (
          <p className="justify-center text-sm text-muted-foreground">
            🔍 Searching...
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {searchType === "maps"
              ? "🗺️ No maps found."
              : searchType === "tags"
                ? "🏷 No tags found."
                : searchType === "boxes"
                  ? "🧰 No trunks found."
                  : "🌌 No destinations found."}{" "}
            Try <Link href="/dashboard">creating one</Link> and come back!
          </p>
        )}
      </div>

      <div className="flex flex-row flex-wrap justify-between pt-8">
        <Button
          variant="ghost"
          size="sm"
          disabled={!form.formState.isDirty}
          onClick={() => {
            form.reset();
            setTags([]);
            if (form.getValues() != submitValues) {
              void form.handleSubmit(onSubmit)();
            }
          }}
        >
          <X />
          Clear Search
        </Button>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Pagination>
              <PaginationContent>
                <Popover>
                  {Math.round(form.getValues("offset") ?? 0 / 6) != 0 &&
                  !isFetching ? (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => {
                          form.setValue(
                            "offset",
                            (form.getValues("offset") ?? 0) + 6,
                          );
                          void form.handleSubmit(onSubmit)();
                        }}
                      />
                    </PaginationItem>
                  ) : null}
                  {(Math.ceil(searchResults.count / 6) <= 4
                    ? Array.from(
                        { length: Math.ceil(searchResults.count / 6) },
                        (x, i) => i + 1,
                      )
                    : Math.round(form.getValues("offset") ?? 0 / 6) + 1 <= 2
                      ? [1, 2, 3, "...", Math.ceil(searchResults.count / 6)]
                      : Math.round(form.getValues("offset") ?? 0) / 6 + 1 >=
                          Math.ceil(searchResults.count / 6) - 1
                        ? [
                            1,
                            "...",
                            Math.ceil(searchResults.count / 6) - 2,
                            Math.ceil(searchResults.count / 6) - 1,
                            Math.ceil(searchResults.count / 6),
                          ]
                        : [
                            1,
                            "...",
                            Math.round(form.getValues("offset") ?? 0) / 6 + 1,
                            "...",
                            Math.ceil(searchResults.count / 6),
                          ]
                  ).map((page) => {
                    if (page === "...") {
                      return (
                        <PopoverTrigger key={page}>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        </PopoverTrigger>
                      );
                    } else if (typeof page === "number") {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={
                              Math.round(form.getValues("offset") ?? 0) / 6 +
                                1 ==
                              page
                            }
                            onClick={() => {
                              form.setValue("offset", (page - 1) * 6);
                              void form.handleSubmit(onSubmit)();
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  })}

                  <PopoverContent className="w-[200px]">
                    <div className="flex flex-row items-center gap-2 text-sm">
                      Page:
                      <Input
                        type="number"
                        value={pageNumber}
                        onChange={(event) => {
                          setPageNumber(parseInt(event.target.value));
                        }}
                      />
                      <Button
                        size="icon"
                        type="submit"
                        className="h-8 min-w-8"
                        disabled={!form.watch("offset")}
                        onClick={() => {
                          form.setValue("offset", (pageNumber - 1) * 6);
                          void form.handleSubmit(onSubmit)();
                        }}
                      >
                        {isFetching ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <ArrowRight />
                        )}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {Math.round(form.getValues("offset") ?? 0 / 6) + 1 !=
                  Math.ceil(searchResults.count / 6) && !isFetching ? (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() => {
                        form.setValue(
                          "offset",
                          (form.getValues("offset") ?? 0) + 6,
                        );
                        void form.handleSubmit(onSubmit)();
                      }}
                    />
                  </PaginationItem>
                ) : null}
              </PaginationContent>
            </Pagination>
          </form>
        </Form>
      </div>
    </>
  );
}

export function SearchPage({
  searchType,
}: {
  searchType: "maps" | "pins" | "tags" | "boxes";
}) {
  const [creating, setCreating] = useState<
    "maps" | "pins" | "tags" | "boxes" | null
  >(null);

  const utils = api.useUtils();

  const { data: user } = api.session.get.useQuery({});

  const {
    data: recentWorkspaces = { items: [], count: 0 },
    isFetching: isFetchingWorkspaces,
  } = api.workspace.getMany.useQuery(
    {
      limit: 30,
      order: "DESC",
    },
    // {
    //   refetchOnWindowFocus: false,
    //   refetchOnReconnect: false,
    //   refetchOnMount: false,
    // },
  );

  const createDestination = (callback?: () => void) =>
    api.destination.create.useMutation({
      onSuccess: async () => {
        await utils.destination.invalidate();
        if (typeof callback === "function") {
          callback();
        }
      },
      onError: (error) => {
        toast({
          title: "Failed to create destination",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const createList = (callback?: () => void) =>
    api.list.create.useMutation({
      onSuccess: async () => {
        await utils.list.invalidate();
        if (typeof callback === "function") {
          callback();
        }
        setCreating(null);
      },
      onError: (error) => {
        toast({
          title: "Failed to create map",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  const createTag = (callback?: () => void) =>
    api.tag.create.useMutation({
      onSuccess: async () => {
        await utils.tag.invalidate();
        if (typeof callback === "function") {
          callback();
        }
        setCreating(null);
      },
      onError: (error) => {
        toast({
          title: "Failed to create tag",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const createWorkspace = (callback?: () => void) =>
    api.workspace.create.useMutation({
      onSuccess: async () => {
        await utils.workspace.invalidate();
        if (typeof callback === "function") {
          callback();
        }
        setCreating(null);
      },
      onError: (error) => {
        toast({
          title: "Failed to create trunk",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  return (
    <>
      <div className="flex flex-row flex-wrap justify-between gap-2">
        <h1 className="md:2xl text-lg">
          My{" "}
          {searchType === "maps"
            ? "Map"
            : searchType === "tags"
              ? "Tag"
              : searchType === "boxes"
                ? "Trunk"
                : "Destination"}
          s
        </h1>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setCreating(searchType);
          }}
        >
          {searchType === "maps" ? (
            <ListPlus />
          ) : searchType === "tags" ? (
            <TagIcon />
          ) : searchType === "boxes" ? (
            <PackagePlus />
          ) : (
            <MapPinPlus />
          )}
          <div className="flex gap-1">
            Create
            <div className="mx-0 hidden px-0 lg:flex">
              {searchType === "maps"
                ? "Map"
                : searchType === "tags"
                  ? "Tag"
                  : searchType === "boxes"
                    ? "Trunk"
                    : "Destination"}
            </div>
          </div>
        </Button>
      </div>
      <SearchForm
        searchType={searchType}
        recentWorkspaces={recentWorkspaces.items}
        isFetchingWorkspaces={isFetchingWorkspaces}
      />
      <Dialog open={creating == "maps"} onOpenChange={() => setCreating(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListPlus /> Create Map
            </DialogTitle>
          </DialogHeader>
          <main className="flex flex-1 flex-col space-y-6 pt-0">
            <ListForm
              update={false}
              workspaces={recentWorkspaces.items}
              user={user?.user}
              listMutation={createList}
            />
          </main>
        </DialogContent>
      </Dialog>
      <Dialog open={creating == "pins"} onOpenChange={() => setCreating(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPinPlus /> Create Destination
            </DialogTitle>
          </DialogHeader>
          <main className="flex flex-1 flex-col space-y-6 pt-0">
            <DestinationForm
              update={false}
              destinationMutation={createDestination}
              workspaces={recentWorkspaces.items}
              user={user?.user}
            />
          </main>
        </DialogContent>
      </Dialog>
      <Dialog open={creating == "tags"} onOpenChange={() => setCreating(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TagIcon /> Create Tag
            </DialogTitle>
          </DialogHeader>
          <main className="flex flex-1 flex-col space-y-6 pt-0">
            <TagForm
              update={false}
              tagMutation={createTag}
              workspaces={recentWorkspaces.items}
              user={user?.user}
            />
          </main>
        </DialogContent>
      </Dialog>
      <Dialog open={creating == "boxes"} onOpenChange={() => setCreating(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus /> Create Trunk
            </DialogTitle>
          </DialogHeader>
          <main className="flex flex-1 flex-col space-y-6 pt-0">
            <WorkspaceForm update={false} workspaceMutation={createWorkspace} />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
}
