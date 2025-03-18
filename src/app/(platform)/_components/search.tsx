"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import { TagInput, type Tag } from "emblor";
import {
  ArrowRight,
  CalendarIcon,
  ChevronsUpDown,
  ListPlus,
  Loader2,
  MapPinPlus,
  Newspaper,
  Rss,
  Search,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import {
  destinationSearchSchema,
  listSearchSchema as originalListSearchSchema,
  type Destination,
  type List,
} from "~/server/models";

import { cn } from "~/lib/utils";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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

import { DestinationCard, DestinationForm, ListComboBox } from "./destination";
import { ListCard, ListForm } from "./list";

const listSearchSchema = originalListSearchSchema.extend({
  sortBy: originalListSearchSchema.shape.sortBy.refine(
    (val) => val !== "size",
    {
      message: "Invalid sortBy value",
    },
  ),
});

export function SearchForm({ searchType }: { searchType: "maps" | "pins" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [submitType, setSubmitType] = useState(searchType);

  const [tags, setTags] = useState<Tag[]>(
    searchParams.get("tags") && searchParams.get("tags")!.split(",").length > 0
      ? searchParams
          .get("tags")!
          .split(",")
          .map(
            (tag) =>
              ({
                text: tag,
                id: Math.floor(Math.random() * 1000000000).toString(),
              }) as Tag,
          )
      : [],
  );

  const form = useForm<
    z.infer<typeof listSearchSchema> | z.infer<typeof destinationSearchSchema>
  >({
    resolver: zodResolver(
      searchType === "maps" ? listSearchSchema : destinationSearchSchema,
    ),
    defaultValues:
      searchType === "maps"
        ? {
            tags:
              searchParams
                .get("tags")
                ?.split(",")
                ?.filter((t) => t && t != "") ?? [],
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
            lists:
              searchParams
                .get("maps")
                ?.split(",")
                .map((v) => parseInt(v)) ?? [],
            tags: searchParams.get("tags")?.split(",") ?? [],
            sortBy:
              (searchParams.get("sortBy") as "name" | "createdAt") ??
              "createdAt",
            order: (searchParams.get("order") as "ASC" | "DESC") ?? "DESC",
            searchString: searchParams.get("searchString") ?? "",
            location: searchParams.get("location") ?? "",
            startDate: searchParams.get("startDate")
              ? new Date(searchParams.get("startDate")!)
              : new Date("1900-01-01"),
            endDate: searchParams.get("endDate")
              ? new Date(searchParams.get("endDate")!)
              : new Date(),
          },
  });

  const [submitValues, setSubmitValues] = useState(form.getValues());

  const {
    data: searchResults = { count: 0, items: [] },
    refetch,
    isFetching,
  } = searchType === "maps"
    ? api.list.getMany.useQuery({
        ...submitValues,
        limit: 6,
      })
    : api.destination.getMany.useQuery({
        ...submitValues,
        sortBy:
          submitValues.sortBy === "updatedAt" ||
          (submitType === "maps" &&
            (submitValues.sortBy as
              | "size"
              | "createdAt"
              | "updatedAt"
              | "name") === "size")
            ? "createdAt"
            : submitValues.sortBy!,
        limit: 6,
      });
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const { data: allLists = { count: 0, items: [] } } =
    searchType == "pins"
      ? api.list.getMany.useQuery({
          limit: 100,
          sortBy: "updatedAt",
        })
      : { data: { count: 0, items: [] } };

  function updateUrl(
    data:
      | z.infer<typeof destinationSearchSchema>
      | z.infer<typeof listSearchSchema>,
  ) {
    const newParams = Object.entries(data).map(([key, value]) =>
      value !== undefined && value !== null && value !== ""
        ? `${key}=${Array.isArray(value) ? value.join(",") : key.includes("Date") ? format(value, "yyyy-MM-dd") : value}`
        : null,
    );

    return newParams.filter(Boolean).join("&");
  }
  function onSubmit(
    data:
      | z.infer<typeof destinationSearchSchema>
      | z.infer<typeof listSearchSchema>,
  ) {
    setSubmitValues(data);
    setSubmitType(searchType);
    router.push(pathname + "?" + updateUrl(data));
    void refetch();
  }
  function addLists(lists: List[] | null) {
    if (lists) {
      form.setValue(
        "lists",
        form.watch("lists")?.concat(lists.map((list) => list.id)),
        {
          shouldDirty: true,
        },
      );
    }
  }

  function removeLists(lists: List[] | null) {
    if (lists) {
      form.setValue(
        "lists",
        form
          .watch("lists")
          ?.filter((id) => !lists.find((list) => list.id === id)),
        {
          shouldDirty: true,
        },
      );
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-grow flex-col items-center space-y-4 lg:gap-3 lg:space-y-0">
            <div className="flex w-full flex-grow flex-row items-center gap-4 sm:flex-wrap sm:gap-2 lg:flex-nowrap">
              {searchType === "maps" ? null : (
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
            <div className="flex w-full flex-grow flex-col items-end gap-4 xs:flex-row xs:flex-wrap xs:flex-nowrap xs:items-center xs:justify-end xs:gap-2">
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
                          (newTags as [Tag, ...Tag[]]).map(
                            (tag: Tag) => tag.text,
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
              {searchType == "pins" ? (
                <FormField
                  control={form.control}
                  name="lists"
                  render={() => (
                    <FormControl>
                      <ListComboBox
                        text="Search with maps"
                        className="w-full xs:w-auto"
                        defaultList={allLists.items ?? []}
                        recentLists={allLists.items ?? []}
                        handleListAdds={addLists}
                        handleListRemovals={removeLists}
                      />
                    </FormControl>
                  )}
                />
              ) : null}
            </div>
          </div>
          <div className="flex flex-row flex-wrap justify-end gap-4 xs:gap-1 sm:gap-2 lg:justify-center lg:gap-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[120px] p-2 text-left font-normal sm:w-full lg:w-[140px] lg:p-4",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PP")
                          ) : (
                            <span>Start date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[120px] p-2 text-left font-normal sm:w-full lg:w-[140px] lg:p-4",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PP")
                          ) : (
                            <span>End Date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sortBy"
              render={({ field }) => (
                <div className="flex flex-row items-center">
                  <p className="mr-2 text-right text-xs font-medium leading-none xs:hidden lg:block">
                    Sort:
                  </p>
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
                        <SelectItem value="updatedAt">Updated At</SelectItem>

                        <SelectItem value="name">Name</SelectItem>
                        {searchType === "maps" && (
                          <SelectItem value="size">Size</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
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
            <div className="flex flex-row items-center lg:w-1/5">
              <Button
                type="submit"
                className="mt-1 w-full rounded-r-none sm:mt-2 md:mt-0"
                disabled={isFetching || !form.formState.isDirty}
              >
                {isFetching ? <Loader2 className="animate-spin" /> : <Search />}
                Search
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-l-none"
                  >
                    <ChevronsUpDown size="16" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={setCreateFeed(true)}>
                    <Newspaper />
                    Create Search Feed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        window.location.hostname +
                          (window.location.port
                            ? ":" + window.location.port
                            : "") +
                          pathname +
                          "/feed.xml?" +
                          updateUrl(form.getValues()),
                      );
                      toast({
                        title: "Copied Feed URL",
                        description:
                          "The feed URL has been copied to your clipboard.",
                      });
                    }}
                  >
                    <Rss />
                    Copy Feed URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
          ) : null
        ) : isFetching ? (
          <p className="justify-center text-sm text-muted-foreground">
            🔍 Searching...
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {searchType === "maps"
              ? "🗺️ No maps found."
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

export function SearchPage({ searchType }: { searchType: "maps" | "pins" }) {
  const [creating, setCreating] = useState<"maps" | "pins" | null>(null);

  const utils = api.useUtils();

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
          title: "Failed to update map",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  return (
    <>
      <div className="flex flex-row flex-wrap justify-between gap-2">
        <h1 className="md:2xl text-lg">
          My {searchType === "maps" ? "Map" : "Destination"}s
        </h1>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setCreating(searchType);
          }}
        >
          {searchType === "maps" ? <ListPlus /> : <MapPinPlus />}
          <div className="flex gap-1">
            Create
            <div className="mx-0 hidden px-0 lg:flex">
              {searchType === "maps" ? "Map" : "Destination"}
            </div>
          </div>
        </Button>
      </div>
      <SearchForm searchType={searchType} />
      <Dialog open={creating == "maps"} onOpenChange={() => setCreating(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListPlus /> Create Map
            </DialogTitle>
          </DialogHeader>
          <main className="flex flex-1 flex-col space-y-6 pt-0">
            <ListForm update={false} listMutation={createList} />
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
            />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
}
