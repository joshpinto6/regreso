"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useDroppable } from "@dnd-kit/core";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type UseTRPCMutationResult } from "@trpc/react-query/shared";
import { api } from "~/trpc/react";
import { TagInput, type Tag } from "emblor";
import {
  ArrowRight,
  Flame,
  Forklift,
  GalleryVerticalEnd,
  ListPlus,
  Loader2,
  Map,
  Pencil,
  Plus,
  RefreshCw,
  Shovel,
  Star,
  StarOff,
} from "lucide-react";
import { motion, useAnimation } from "motion/react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import {
  listFormSchema,
  type Destination,
  type List,
  type updateListSchema,
  type User,
  type Workspace,
} from "~/server/models";

import { timeSince } from "~/lib/utils";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
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
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "~/components/hooks/use-toast";
import { TiltCard } from "~/components/tilt-card";

import { DestinationCard } from "./destination";

const getRandomDelay = () => -(Math.random() * 0.7 + 0.05);

const randomDuration = () => Math.random() * 0.07 + 0.23;

const variants = {
  start: (i: number) => ({
    rotate: i % 2 === 0 ? [-1, 1.3, 0] : [1, -1.4, 0],
    transition: {
      delay: getRandomDelay(),
      repeat: Infinity,
      duration: randomDuration(),
    },
  }),
  reset: {
    rotate: 0,
  },
};

export function ListCard(props: List) {
  const controls = useAnimation();

  // const utils = api.useUtils();

  // const addToWorkspace = api.list.update.useMutation({
  //   onSuccess: async () => {
  //     await utils.destination.invalidate();
  //     toast({
  //       title: "List added to workspace",
  //       description: "Destination has been added to the selected workspace.",
  //     });
  //   },
  //   onError: (error) => {
  //     toast({
  //       title: "Failed to add list to workspace",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  /* }); */

  const { isOver, setNodeRef: setNodeDropRef } = useDroppable({
    id: props.id,
  });

  // useEffect(() => {
  // if (
  //  dragEnd &&
  //  setDragEnd &&
  //  dragEnd.over &&
  //  dragEnd.active &&
  //  dragEnd.active.id == id
  // ) {
  // addToWorkspace.mutate({
  //   id,
  //   workspaceId:
  //     typeof dragEnd.over.id === "number"
  //       ? dragEnd.over.id
  //       : parseInt(String(dragEnd.over.id)),
  //  });
  //  setDragEnd(null);
  //  }
  // }, [dragEnd, setDragEnd, addToWorkspace, id]);
  // const {
  //  attributes,
  // listeners,
  // transform,
  // setNodeRef: setNodeDragRef,
  //} = useDraggable({
  //  id: props.id,
  //});
  // const style = transform
  //  ? {
  //      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  //    }
  //  : undefined;
  useEffect(() => {
    if (isOver) {
      void controls.start("start");
    } else {
      controls.stop();
      controls.set("reset");
    }
  }, [isOver, controls]);

  return (
    <motion.div custom={1} variants={variants} animate={controls}>
      <Card>
        <div ref={setNodeDropRef}>
          <CardHeader className="px-3 pb-2 pt-4 text-sm leading-tight">
            <CardTitle className="truncate">
              <Link href={`/map/${props.id}`}>
                <span className="mr-2 leading-tight">
                  {props?.emoji ?? "❔"}
                </span>
                {props.name ?? "Unnamed Map"}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3 pt-0 text-sm">
            <p className="text-muted-foreground">
              {props.description ?? "No description provided."}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tooltip>
                <TooltipTrigger>
                  {(props.updatedAt &&
                    "Updated " + timeSince(props.updatedAt) + " ago") ??
                    "Created " + timeSince(props.createdAt) + " ago"}
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {props.updatedAt?.toISOString() ??
                      props.createdAt.toISOString()}
                  </p>
                </TooltipContent>
              </Tooltip>

              <p>•</p>

              {props.size != null && props.size != undefined && (
                <p className="font-muted mr-0.5 text-sm">
                  {props.size} destination{props.size == 1 ? null : "s"}
                </p>
              )}

              {props.tags && props.tags.length > 0
                ? [...props.tags]
                    .sort((a, b) => a.text.length - b.text.length)
                    .map((tag) => (
                      <Link href={`/tag/${tag.id}`} key={tag.id}>
                        <Badge variant="secondary">{tag.text}</Badge>
                      </Link>
                    ))
                : null}
              <Link href={`/box/${props.workspace.id}`}>
                <Badge variant="outline">
                  {(props.workspace.emoji ?? "❔") + " " + props.workspace.name}
                </Badge>
              </Link>
              {props.workspace.archived ? null : props.archived ? (
                <Badge variant="destructive">Archived</Badge>
              ) : null}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

type ListFormProps =
  | {
      listMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof updateListSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof updateListSchema>,
        unknown
      >;
      update: true;
      updateId: number;
      defaultValues?: z.infer<typeof listFormSchema>;
    }
  | {
      listMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof updateListSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof listFormSchema>,
        unknown
      >;
      update: false;
      defaultValues?: z.infer<typeof listFormSchema>;
    };

export function ListForm(
  props: ListFormProps & {
    workspace?: Workspace;
    user?: User;
    workspaces?: Workspace[];
  },
) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const form = useForm<z.infer<typeof listFormSchema>>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      name: props.defaultValues?.name ?? "",
      description: props.defaultValues?.description ?? "",
      tags: props.defaultValues?.tags ?? [],
      emoji: props.defaultValues?.emoji ?? "🗺️",
      workspaceId:
        props.defaultValues?.workspaceId ??
        props.workspace?.id ??
        props.user?.workspaceId ??
        undefined,
    } as z.infer<typeof listFormSchema>,
  });

  useEffect(() => {
    setTags(props.defaultValues?.tags ?? []);
  }, [props.defaultValues?.tags]);

  const submitMutation = props.listMutation(() => {
    form.reset();
    setTags([]);
  });

  function onSubmit(data: z.infer<typeof listFormSchema>) {
    if (props.update) {
      if (!props.updateId) {
        return;
      }
      submitMutation.mutate({ ...data, id: props.updateId });
    } else {
      submitMutation.mutate({ ...data, id: 0 });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <div className="flex w-full flex-row items-end gap-4">
          <FormField
            control={form.control}
            name="emoji"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>Emoji</FormLabel>
                <FormControl>
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          {form.watch("emoji") != undefined &&
                          form.watch("emoji").length > 0
                            ? form.watch("emoji")
                            : "❔"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Picker
                          data={data}
                          value={form.watch("emoji")}
                          onEmojiSelect={(emoji: { native: string }) => {
                            form.setValue("emoji", emoji.native);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grow">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Pelican Resources" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A list of resources for raising pelicans at home."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-left">Tags</FormLabel>
              <FormControl>
                <>
                  <TagInput
                    {...field}
                    placeholder="Enter some tags..."
                    tags={tags}
                    className="sm:min-w-[450px]"
                    setTags={(newTags) => {
                      setTags(newTags);
                      form.setValue("tags", newTags as [Tag, ...Tag[]]);
                    }}
                    styleClasses={{
                      input: "w-full sm:max-w-[350px]",
                    }}
                    activeTagIndex={activeTagIndex}
                    setActiveTagIndex={setActiveTagIndex}
                  />
                </>
              </FormControl>
              <FormDescription>
                All maps added to this map will be searchable using these tags.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row items-end justify-end gap-4">
          <FormField
            control={form.control}
            name="workspaceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trunk</FormLabel>

                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="space-between min-w-[120px]">
                      <SelectValue placeholder="Trunk" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Trunk</SelectLabel>

                      {props.workspaces
                        ?.filter((w) => !w.archived)
                        .map((workspace) => {
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
          <Button
            type="submit"
            disabled={submitMutation.isPending || !form.formState.isValid}
            size="sm"
          >
            {props.update ? (
              <>
                {submitMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Pencil />
                )}

                {submitMutation.isPending ? "Updating Map..." : "Update Map"}
              </>
            ) : (
              <>
                {submitMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}

                {submitMutation.isPending ? "Creating Map..." : "Create Map"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function RecentLists({
  workspace,
  user,
  workspaces,
}: {
  workspace?: Workspace;
  user?: User;
  workspaces?: Workspace[];
}) {
  const utils = api.useUtils();

  const {
    data: recentLists = { items: [], count: 0 },
    refetch,
    isFetching,
  } = api.list.getMany.useQuery({
    limit: 3,
    order: "DESC",
    sortBy: "updatedAt",
    archived: workspace?.archived ? undefined : false,
    workspaceId: workspace?.id ?? undefined,
  });
  const [open, setOpen] = useState(false);

  const createList = (callback?: () => void) =>
    api.list.create.useMutation({
      onSuccess: async () => {
        await utils.list.invalidate();
        if (typeof callback === "function") {
          callback();
        }
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to create map",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <TiltCard>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-row items-center justify-between">
              <Link href="/search/maps">
                <div className="flex items-center">
                  <Map className="mr-2 h-5 w-5" /> Recent Maps
                </div>
              </Link>

              <Button
                id="create-map"
                disabled={workspace?.archived}
                onClick={() => setOpen(true)}
                size="sm"
              >
                <ListPlus />
                Create Map
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            {recentLists.items.length > 0 ? (
              recentLists.items.map((lst: List) => {
                return <ListCard key={lst.id} {...lst} />;
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                🗺️ No maps found. Try creating one and come back!
              </p>
            )}
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={isFetching}
                asChild
              >
                <Link
                  href={`/search/maps${workspace ? "?workspace=" + workspace.id : ""}`}
                >
                  <GalleryVerticalEnd />
                  See All
                </Link>
              </Button>
              <Button
                size="sm"
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                }}
              >
                <RefreshCw
                  className={isFetching ? "animate-spin" : undefined}
                />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </TiltCard>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus /> Create Map
          </DialogTitle>
        </DialogHeader>
        <main className="flex flex-1 flex-col space-y-6 pt-0">
          <ListForm
            workspace={workspace}
            user={user}
            workspaces={workspaces}
            update={false}
            listMutation={createList}
          />
        </main>
      </DialogContent>
    </Dialog>
  );
}

export function ListPage(props: {
  id: string;
  workspaces?: Workspace[];
  user?: User;
}) {
  const utils = api.useUtils();

  const listId = props.id;
  const [editing, setEditing] = useState(false);

  const updateList = (callback?: () => void) =>
    api.list.update.useMutation({
      onSuccess: async () => {
        await utils.list.invalidate();
        toast({
          title: "Map updated",
          description: "Successfully updated map properties.",
        });
        if (typeof callback === "function") {
          callback();
        }
        setEditing(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to update map",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  const favoriteListMutation = updateList();
  const archiveMutation = updateList();

  const { data }: { data: List | undefined } = api.list.get.useQuery(
    { id: parseInt(listId ?? "0", 10) },
    { enabled: !!listId },
  );

  const [pageNumber, setPageNumber] = useState(1);

  const {
    data: searchResults = { count: 0, items: [] },
    refetch,
    isFetching,
  } = api.destination.getMany.useQuery({
    lists: [parseInt(listId)],
    offset: Math.round(pageNumber - 1) * 6,
    limit: 6,
  });

  function handleOpenChange(openStatus: boolean) {
    setEditing(openStatus);
  }
  function handleArchivalToggle() {
    if (data?.archived) {
      void archiveMutation.mutate({
        id: data?.id,
        archived: false,
      });
    } else if (data) {
      void archiveMutation.mutate({
        id: data?.id,
        archived: true,
      });
    } else {
      toast({
        title: "Failed to update map",
        description: "No map selected.",
        variant: "destructive",
      });
    }
  }
  return editing ? (
    <Dialog open={editing} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-y-auto md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Map</DialogTitle>
        </DialogHeader>
        {editing && data != undefined ? (
          <ListForm
            workspaces={props.workspaces}
            user={props.user}
            update={true}
            defaultValues={
              {
                name: data.name ?? "",
                description: data.description ?? "",
                emoji: data.emoji ?? "🗺️",
                tags:
                  data.tags?.map((tag) => ({
                    id: tag.id.toString(),
                    text: tag.text,
                  })) ?? [],
                workspaceId: data.workspace.id ?? undefined,
              } as z.infer<typeof listFormSchema>
            }
            updateId={parseInt(props.id)}
            listMutation={updateList}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  ) : (
    <div className="w-full space-y-4 p-6">
      <div className="flex w-full flex-row flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <span className="mr-2 text-2xl">{data?.emoji ?? "❔"}</span>

            <h1>{data?.name ?? "Unnamed Map"}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {data?.description ?? "No description provided."}
          </p>
        </div>
        <div className="flex flex-row gap-2">
          {data?.tags ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  data?.tags &&
                  !!data?.tags.find((t) => t.text == "favorite maps")
                ) {
                  favoriteListMutation.mutate({
                    id: parseInt(props.id),
                    removedTags: ["favorite maps"],
                  });
                } else {
                  favoriteListMutation.mutate({
                    id: parseInt(props.id),
                    newTags: ["favorite maps"],
                  });
                }
              }}
            >
              {!!data?.tags.find((t) => t.text == "favorite maps") ? (
                <>
                  <StarOff /> Unfavorite
                </>
              ) : (
                <>
                  <Star /> Favorite
                </>
              )}
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil /> Edit
          </Button>
          {data?.archived ? (
            <Button
              size="sm"
              variant="secondary"
              className="flex flex-shrink"
              onClick={handleArchivalToggle}
            >
              <Forklift />
              Excavate
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex flex-shrink"
                >
                  <Shovel />
                  Bury
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. Are you sure you want to bury
                    this map? It will be hidden from the dashboard and other
                    pages (except search) until you excavate it.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" onClick={handleArchivalToggle}>
                      Confirm
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog>
            <DeleteList id={parseInt(props.id)} routePath="/search/maps">
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Flame />
                  Burn
                </Button>
              </DialogTrigger>
            </DeleteList>
          </Dialog>
        </div>
      </div>
      {data?.tags && data?.tags?.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          Tags:{" "}
          {data?.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.text}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        Trunk:{" "}
        <Badge variant={data?.workspace.archived ? "destructive" : "outline"}>
          {data?.workspace.emoji ?? "❔"} {data?.workspace.name}{" "}
          <span className="ml-1 italic">
            {data?.workspace.archived ? "(Archived)" : null}
          </span>
        </Badge>
      </div>

      <div className="font-muted flex flex-row space-x-2 text-sm italic">
        {data?.size != undefined ? (
          <div className="flex flex-row space-x-2 pr-2">
            <p className="font-muted text-sm not-italic">
              {data?.size} destinations{" "}
            </p>
            <p>•</p>
          </div>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {(data?.updatedAt &&
                "Updated " +
                  timeSince(data?.updatedAt ?? new Date()) +
                  " ago") ??
                "Created " + timeSince(data?.createdAt ?? new Date()) + " ago"}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {data?.updatedAt?.toISOString() ?? data?.createdAt.toISOString()}
            </p>
          </TooltipContent>
        </Tooltip>
        {data?.archived ? (
          <>
            <p className="ml-3">•</p>
            <Badge className="ml-3 not-italic" variant="destructive">
              Archived
            </Badge>
          </>
        ) : null}
      </div>

      {data != undefined ? (
        <div className="block space-y-4">
          <Separator />
          {searchResults.items.length > 0 ? (
            searchResults.items.map((dest: Destination) => {
              return <DestinationCard key={dest.id} {...dest} />;
            })
          ) : isFetching ? (
            <p className="justify-center text-sm text-muted-foreground">
              🔍 Searching...
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              🌌 No destinations found. Try{" "}
              <Link href="/dashboard">creating one</Link> and come back!
            </p>
          )}
          <Pagination>
            <PaginationContent>
              <Popover>
                {pageNumber != 1 && !isFetching ? (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => {
                        setPageNumber(pageNumber - 1);

                        void refetch();
                      }}
                    />
                  </PaginationItem>
                ) : null}
                {(Math.ceil(searchResults.count / 6) <= 4
                  ? Array.from(
                      { length: Math.ceil(searchResults.count / 6) },
                      (x, i) => i + 1,
                    )
                  : pageNumber <= 2
                    ? [1, 2, 3, "...", Math.ceil(searchResults.count / 6)]
                    : pageNumber >= Math.ceil(searchResults.count / 6) - 1
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
                          pageNumber,
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
                          isActive={pageNumber == page}
                          onClick={() => {
                            setPageNumber(page);
                            void refetch();
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
                      onClick={() => {
                        void refetch();
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

              {pageNumber != Math.ceil(searchResults.count / 6) &&
              !isFetching ? (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => {
                      setPageNumber(pageNumber + 1);
                      void refetch();
                    }}
                  />
                </PaginationItem>
              ) : null}
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}

export function DeleteList({
  id,
  children,
  routePath,
}: {
  id: number;
  children: React.ReactNode;
  routePath: string;
}) {
  const router = useRouter();

  const utils = api.useUtils();

  const deleteList = api.list.delete.useMutation({
    onSuccess: async () => {
      await utils.list.invalidate();
      router.push(routePath);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete map",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return (
    <Dialog>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete this map?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              onClick={() => {
                deleteList.mutate({ id: parseInt(id.toString()) });
              }}
            >
              Confirm
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
