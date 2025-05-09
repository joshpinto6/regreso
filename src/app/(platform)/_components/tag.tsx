"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useDraggable,
  useDroppable,
  type Active,
  type Over,
} from "@dnd-kit/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type UseTRPCMutationResult } from "@trpc/react-query/shared";
import { api } from "~/trpc/react";
import {
  ArrowRight,
  GalleryVerticalEnd,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Tag as TagIcon,
  Tags,
} from "lucide-react";
import { motion, useAnimation } from "motion/react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import {
  tagFormSchema,
  type Destination,
  type Tag,
  type updateTagSchema,
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
import { GradientPicker } from "~/components/ui/gradient-picker";
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
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "~/components/hooks/use-toast";
import { TiltCard } from "~/components/tilt-card";

import { DestinationCard } from "./destination";
import { ListCard } from "./list";

const getRandomDelay = () => -(Math.random() * 0.7 + 0.05);
const randomDuration = () => Math.random() * 0.07 + 0.23;

function getContrastTextColor(color: string) {
  const gradientMatch = /(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/.exec(color);
  const baseColor = (gradientMatch ? gradientMatch[1] : color) ?? "#ffffff";

  const hex = baseColor.replace("#", "").trim();

  let r = 255,
    g = 255,
    b = 255;

  if (baseColor.startsWith("rgb")) {
    const rgbMatch = /rgba?\(([^)]+)\)/.exec(baseColor);
    if (rgbMatch?.[1]) {
      const [rr, gg, bb] = rgbMatch[1].split(",").map(Number);
      r = rr ?? 255;
      g = gg ?? 255;
      b = bb ?? 255;
    }
  } else if (hex && hex.length === 3) {
    r = hex[0] ? parseInt(hex[0] + hex[0], 16) : 255;
    g = hex[1] ? parseInt(hex[1] + hex[1], 16) : 255;
    b = hex[2] ? parseInt(hex[2] + hex[2], 16) : 255;
  } else if (hex && hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

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

type TagFormProps =
  | {
      tagMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof updateTagSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof updateTagSchema>,
        unknown
      >;
      update: true;
      updateId: number;
      defaultValues?: z.infer<typeof tagFormSchema>;
    }
  | {
      tagMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof updateTagSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof tagFormSchema>,
        unknown
      >;
      update: false;
      defaultValues?: z.infer<typeof tagFormSchema>;
    };

export function TagForm(
  props: TagFormProps & {
    workspace?: Workspace;
    user?: User;
    workspaces?: Workspace[];
  },
) {
  const form = useForm<z.infer<typeof tagFormSchema>>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: props.defaultValues?.name ?? "",
      shortcut: props.defaultValues?.shortcut ?? "",
      color: props.defaultValues?.color ?? undefined,
      description: props.defaultValues?.description ?? "",
      workspaceId:
        props.defaultValues?.workspaceId ??
        props.workspace?.id ??
        props.user?.workspaceId ??
        undefined,
    } as z.infer<typeof tagFormSchema>,
  });

  const submitMutation = props.tagMutation(() => {
    form.reset();
  });

  function onSubmit(data: z.infer<typeof tagFormSchema>) {
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
            name="color"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <GradientPicker
                    className="w-full truncate"
                    background={field.value ?? ""}
                    setBackground={(newVal) => {
                      field.onChange(newVal);
                    }}
                  />
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
                  <Input placeholder="geese resources" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="shortcut"
          render={({ field }) => (
            <FormItem className="grow">
              <FormLabel>Shortcut</FormLabel>
              <FormControl>
                <Input placeholder="geese" {...field} />
              </FormControl>
              <FormMessage />
              <FormDescription>
                This is the tag shortcut, used to quickly apply this tag.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Resources about geese, not pelicans"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
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

                      {props.workspaces?.map((workspace) => {
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

                {submitMutation.isPending ? "Updating Tag..." : "Update Tag"}
              </>
            ) : (
              <>
                {submitMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}

                {submitMutation.isPending ? "Creating Tag..." : "Create Tag"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function TagCard(
  props: Tag & {
    setDragEnd?: React.Dispatch<
      React.SetStateAction<{ over: Over; active: Active } | null>
    >;
    dragEnd?: { over: Over | null; active: Active | null };
  },
) {
  const controls = useAnimation();

  const utils = api.useUtils();

  const addToWorkspace = api.tag.update.useMutation({
    onSuccess: async () => {
      await utils.destination.invalidate();
      toast({
        title: "Tag added to workspace",
        description: "Tag has been added to the selected workspace.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add tag to workspace",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { isOver, setNodeRef: setNodeDropRef } = useDroppable({
    id: props.id,
  });
  const { dragEnd, setDragEnd, id } = props;
  useEffect(() => {
    if (
      dragEnd &&
      setDragEnd &&
      dragEnd.over &&
      dragEnd.active &&
      dragEnd.active.id == id
    ) {
      addToWorkspace.mutate({
        id,
        workspaceId:
          typeof dragEnd.over.id === "number"
            ? dragEnd.over.id
            : parseInt(String(dragEnd.over.id)),
      });
      setDragEnd(null);
    }
  }, [dragEnd, setDragEnd, addToWorkspace, id]);
  const {
    attributes,
    listeners,
    transform,
    setNodeRef: setNodeDragRef,
  } = useDraggable({
    id: props.id,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;
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
      <Card ref={setNodeDragRef} style={style} {...listeners} {...attributes}>
        <div ref={setNodeDropRef}>
          <CardHeader className="flex flex-row items-end px-3 pb-2 pt-4 text-sm leading-tight">
            <div
              className="circle mr-1.5 flex h-4 w-4 overflow-hidden rounded-full"
              style={{ background: props.color ?? "hsl(var(--secondary))" }}
            >
              <div
                className="circle m-auto h-1.5 w-1.5 overflow-hidden rounded-full"
                style={{
                  background:
                    getContrastTextColor(props?.color ?? "#ffffff") ??
                    "hsl(var(--secondary))",
                }}
              ></div>
            </div>
            <CardTitle className="truncate">
              <Link href={`/tag/${props.id}`}>
                {props.name ?? "Unnamed Tag"}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3 pt-0 text-sm">
            <p className="text-muted-foreground">
              {props.description ?? "No description provided."}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <>
                    {(props.updatedAt &&
                      "Updated " + timeSince(props.updatedAt) + " ago") ??
                      "Created " + timeSince(props.createdAt) + " ago"}
                  </>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {props.updatedAt?.toISOString() ??
                      props.createdAt.toISOString()}
                  </p>
                </TooltipContent>
              </Tooltip>

              <p>•</p>

              {props.destinationCount != null &&
                props.destinationCount != undefined && (
                  <p className="font-muted mr-2 text-sm">
                    {props.destinationCount} destination
                    {props.destinationCount == 1 ? null : "s"}
                  </p>
                )}
              <p>•</p>

              {props.listCount != null && props.listCount != undefined && (
                <p className="font-muted mr-2 text-sm">
                  {props.listCount} map{props.listCount == 1 ? null : "s"}
                </p>
              )}
              <Link href={`/box/${props.workspace.id}`}>
                <Badge variant="outline">
                  {(props.workspace.emoji ?? "❔") + " " + props.workspace.name}
                </Badge>
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

export function RecentTags({
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
    data: recentTags = { items: [], count: 0 },
    refetch,
    isFetching,
  } = api.tag.getMany.useQuery({
    limit: 24,
    order: "DESC",
    sortBy: "updatedAt",
    workspaceId: workspace?.id ?? undefined,
  });
  const [open, setOpen] = useState(false);

  const createTag = (callback?: () => void) =>
    api.tag.create.useMutation({
      onSuccess: async () => {
        await utils.tag.invalidate();
        if (typeof callback === "function") {
          callback();
        }
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to create tag",
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
              <Link href="/search/tags">
                <div className="flex items-center">
                  <Tags className="mr-2 h-5 w-5" /> Recent Tags
                </div>
              </Link>

              <Button onClick={() => setOpen(true)} size="sm">
                <Plus />
                Create Tag
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="flex flex-row flex-wrap gap-1.5 pb-6">
              {recentTags.items.length > 0 ? (
                recentTags.items.map((tg) => {
                  return (
                    <Link href={`/tag/${tg.id}`} key={tg.id} className="w-fit">
                      <Badge
                        variant="secondary"
                        style={{
                          background: tg.color ?? "hsl(var(--secondary))",
                          color: tg.color
                            ? getContrastTextColor(tg.color)
                            : undefined,
                        }}
                      >
                        {tg.name}
                      </Badge>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  🏷 No tags found. Try creating one and come back!
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={isFetching}
                asChild
              >
                <Link
                  href={`/search/tags${workspace ? "?workspace=" + workspace.id : ""}`}
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
            <TagIcon /> Create Tag
          </DialogTitle>
        </DialogHeader>
        <main className="flex flex-1 flex-col space-y-6 pt-0">
          <TagForm
            update={false}
            tagMutation={createTag}
            workspaces={workspaces}
            user={user}
            workspace={workspace}
          />
        </main>
      </DialogContent>
    </Dialog>
  );
}

export function TagPage(props: { id: string }) {
  const utils = api.useUtils();

  const tagId = props.id;
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"pins" | "lists">("pins");
  const [pageNumber, setPageNumber] = useState(1);

  const updateTag = (callback?: () => void) =>
    api.tag.update.useMutation({
      onSuccess: async () => {
        await utils.list.invalidate();
        toast({
          title: "Tag updated",
          description: "Successfully updated tag properties.",
        });
        if (typeof callback === "function") {
          callback();
        }
        setEditing(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to update tag",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const { data }: { data: Tag | undefined } = api.tag.get.useQuery(
    { id: parseInt(tagId ?? "0", 10) },
    { enabled: !!tagId },
  );

  const {
    data: searchResults = { count: 0, items: [] },
    refetch,
    isFetching,
  } = tab == "pins"
    ? api.destination.getMany.useQuery({
        tags: [data?.name ?? ""],
        offset: Math.round(pageNumber - 1) * 6,
        limit: 6,
      })
    : api.list.getMany.useQuery({
        tags: [data?.name ?? ""],
        offset: Math.round(pageNumber - 1) * 6,
        limit: 6,
      });

  function handleOpenChange(openStatus: boolean) {
    setEditing(openStatus);
  }
  return editing ? (
    <Dialog open={editing} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-y-auto md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Map</DialogTitle>
        </DialogHeader>
        {editing && data != undefined ? (
          <TagForm
            update={true}
            defaultValues={
              {
                name: data.name ?? "",
                description: data.description ?? "",
                color: data.color ?? undefined,
                shortcut: data.shortcut ?? "",
                workspaceId: data.workspace.id ?? undefined,
              } as z.infer<typeof tagFormSchema>
            }
            updateId={parseInt(props.id)}
            tagMutation={(callback) =>
              updateTag(() => {
                void utils.tag.get.invalidate({ id: parseInt(props.id) });
                if (callback) {
                  callback();
                }
              })
            }
          />
        ) : null}
        <Dialog>
          <DeleteTag id={parseInt(props.id)} routePath="/search/maps">
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="flex flex-shrink"
              >
                Destroy Tag
              </Button>
            </DialogTrigger>
          </DeleteTag>
        </Dialog>
      </DialogContent>
    </Dialog>
  ) : (
    <div className="w-full space-y-4 p-6">
      <div className="flex w-full flex-row flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <div
              className="circle mr-2 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full"
              style={{ background: data?.color ?? "hsl(var(--secondary))" }}
            >
              <div
                className="circle m-auto h-2.5 w-2.5 overflow-hidden rounded-full"
                style={{
                  background:
                    getContrastTextColor(data?.color ?? "#ffffff") ??
                    "hsl(var(--secondary))",
                }}
              ></div>
            </div>
            <h1>{data?.name ?? "Unnamed Tag"}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {data?.description ?? "No description provided."}
          </p>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil /> Edit Tag
          </Button>
        </div>
      </div>

      <div className="font-muted flex flex-row space-x-2 text-sm italic">
        {data?.listCount ? (
          <div className="flex flex-row space-x-2 pr-2">
            <p className="font-muted text-sm not-italic">
              {data?.listCount} map{data?.listCount > 0 ? "s" : null}
            </p>
            <p>•</p>
          </div>
        ) : null}
        {data?.destinationCount ? (
          <div className="flex flex-row space-x-2 pr-2">
            <p className="font-muted text-sm not-italic">
              {data?.destinationCount} destination
              {data?.destinationCount > 0 ? "s" : null}
            </p>
            <p>•</p>
          </div>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <>
              {(data?.updatedAt &&
                "Updated " + timeSince(data?.updatedAt) + " ago") ??
                "Created " + timeSince(data?.createdAt ?? new Date()) + " ago"}
            </>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {data?.updatedAt?.toISOString() ?? data?.createdAt.toISOString()}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Separator />

      <Tabs
        value={tab}
        onValueChange={(val) => {
          setTab(val as "pins" | "lists");
        }}
        defaultValue="pins"
        className="w-full"
      >
        <TabsList className="h-30 flex w-full flex-row flex-wrap items-center justify-center gap-2 lg:grid lg:grid-cols-2">
          <TabsTrigger value="pins" className="w-full lg:w-auto">
            Destinations
            <Badge variant="secondary" className="ml-2">
              {data?.destinationCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="maps" className="w-full lg:w-auto">
            Maps
            <Badge variant="secondary" className="ml-2">
              {data?.listCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {data != undefined ? (
        <div className="block space-y-4">
          {searchResults.items.length > 0 ? (
            tab == "pins" ? (
              searchResults.items.map((dest) => {
                if (
                  dest &&
                  "location" in dest &&
                  "type" in dest &&
                  "body" in dest
                ) {
                  return (
                    <DestinationCard key={dest.id} {...(dest as Destination)} />
                  );
                }
                return null;
              })
            ) : (
              searchResults.items.map((lst) => {
                if (lst && "name" in lst && "description" in lst) {
                  return <ListCard key={lst.id} {...lst} />;
                }
                return null;
              })
            )
          ) : isFetching ? (
            <p className="justify-center text-sm text-muted-foreground">
              🔍 Searching {tab == "pins" ? "destinations" : "maps"}...
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              🌌 No {tab == "pins" ? "destinations" : "maps"} found. Try{" "}
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

export function DeleteTag({
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

  const deleteList = api.tag.delete.useMutation({
    onSuccess: async () => {
      await utils.tag.invalidate();
      router.push(routePath);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete tag",
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
