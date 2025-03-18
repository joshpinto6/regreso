"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useDraggable, type Active, type Over } from "@dnd-kit/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditorContent, useEditor } from "@tiptap/react";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type UseTRPCMutationResult } from "@trpc/react-query/shared";
import { api } from "~/trpc/react";
import { TagInput, type Tag } from "emblor";
import {
  ArrowRight,
  GalleryVerticalEnd,
  Loader2,
  MapPinPlus,
  Pencil,
  Plus,
  RefreshCw,
  Telescope,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  destinationFormSchema,
  type Destination,
  type List,
  type updateDestinationSchema,
} from "~/server/models";

import { cn } from "~/lib/utils";
import { useMediaQuery } from "~/hooks/use-media-query";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
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
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/hooks/use-toast";
import { MinimalTiptapEditor } from "~/components/minimal-tiptap";
import { createExtensions } from "~/components/minimal-tiptap/hooks/use-minimal-tiptap";
import { TiltCard } from "~/components/tilt-card";

import { getWebDetailsAction } from "~/app/(platform)/dashboard/actions";

const destinationTypes = ["location", "note", "file"] as const;

const destinationTypeSchema = z.object({
  type: z.enum(destinationTypes),
  location: z
    .string()
    .regex(
      new RegExp(
        /(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
      ),
      "Please enter a valid URL",
    ),
});

type DestinationFormProps =
  | {
      destinationMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof updateDestinationSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof updateDestinationSchema>,
        unknown
      >;
      update: true;
      updateId: number;
      defaultValues?: z.infer<typeof destinationFormSchema>;
    }
  | {
      destinationMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof destinationFormSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof destinationFormSchema>,
        unknown
      >;
      update: false;
      defaultValues?: z.infer<typeof destinationFormSchema>;
    };

export function DestinationForm(props: DestinationFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(
    props.update ? true : false,
  );

  const [tags, setTags] = useState<Tag[]>([]);

  const [detailsState, action] = useActionState(getWebDetailsAction, {
    error: "",
    url: undefined,
    title: [undefined],
    description: [undefined],
  });

  const destinationTypeForm = useForm<z.infer<typeof destinationTypeSchema>>({
    resolver: zodResolver(destinationTypeSchema),

    defaultValues: {
      type: (props.defaultValues?.type as "note" | "location") ?? "location",
      location: props.defaultValues?.location ?? "",
    },
  });

  const form = useForm<z.infer<typeof destinationFormSchema>>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: {
      type: "location",
      location: props.defaultValues?.location ?? null,
      name: props.defaultValues?.name ?? "",
      body: props.defaultValues?.body ?? '<p class="text-node"></p>',
      tags: props.defaultValues?.tags ?? [],
      attachments: [],
    },
  });

  useEffect(() => {
    if (
      props.update &&
      props.defaultValues?.location != "" &&
      props.defaultValues != undefined &&
      loadingUpdate
    ) {
      form.reset({
        type: "location",
        location: props.defaultValues?.location ?? null,
        name: props.defaultValues?.name ?? "",
        body: props.defaultValues?.body ?? '<p class="text-node"></p>',
        tags: props.defaultValues?.tags ?? [],
        attachments: [],
      });
      setTags(props.defaultValues?.tags ?? []);
    }
  }, [props.defaultValues, form, loadingUpdate, props.update]);
  const location = form.watch("location");
  useEffect(() => {
    if (
      loadingUpdate &&
      form.watch("type") === "location" &&
      form.watch("location") &&
      props.defaultValues?.body == form.watch("body")
    ) {
      setLoadingUpdate(false);
    }
  }, [location, loadingUpdate, form, props.defaultValues?.body]);

  useEffect(() => {
    if (detailsState.title && detailsState.title.length > 0) {
      const names = detailsState.title.filter(String);
      const descriptions = detailsState.description.filter(String);
      form.setValue("name", names[0] ?? "");
      form.setValue(
        "body",
        `<p class="text-node">${descriptions[0] ?? ""}</p>`,
      );
    }
    if (detailsState.url) {
      form.setValue(
        "location",
        detailsState.url ?? destinationTypeForm.watch("location"),
      );
      destinationTypeForm.setValue(
        "location",
        detailsState.url ?? destinationTypeForm.watch("location"),
      );
    }
    setLoading(false);
  }, [detailsState, destinationTypeForm, form]);

  const type = destinationTypeForm.watch("type");
  useEffect(() => {
    if (props.update) {
      form.reset({
        type: props.defaultValues?.type ?? "location",
        location: null,
        name: props.defaultValues?.name ?? "",
        body: props.defaultValues?.body ?? "",
        tags: props.defaultValues?.tags ?? [],
        attachments: [],
      });
      setTags(props.defaultValues?.tags ?? []);
      setLoading(false);
      setLoadingUpdate(false);
    }
  }, [
    type,
    destinationTypeForm,
    form,
    props.defaultValues?.body,
    props.defaultValues?.type,
    props.update,
    props.defaultValues?.name,
    props.defaultValues?.tags,
  ]);

  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  function onSubmit(data: z.infer<typeof destinationFormSchema>) {
    if (props.update) {
      if (!props.updateId) {
        return;
      }
      submitMutation.mutate({ ...data, id: props.updateId });
    } else {
      submitMutation.mutate({ ...data, id: 0 });
    }
  }

  const submitMutation = props.destinationMutation(() => {
    form.reset();
    setTags([]);
    destinationTypeForm.reset();
  });

  const {
    trigger: triggerDestinationTypeForm,
    formState: { isValid: isDestinationTypeValid },
  } = destinationTypeForm;

  return (
    <>
      <Form {...destinationTypeForm}>
        <form
          action={action}
          onSubmit={async (e) => {
            if (!isDestinationTypeValid) {
              e.preventDefault();
              await triggerDestinationTypeForm();
              return;
            }
            setLoading(true);
            form.reset();
            setTags([]);

            e.currentTarget?.requestSubmit();
          }}
          className="overflow-y-auto"
        >
          <div
            className={`flex w-full flex-row flex-wrap items-end gap-3 overflow-y-auto`}
          >
            <div
              className={`w-${destinationTypeForm.watch("type") === "location" ? "1/3" : "full"} min-w-[100px]`}
            >
              <FormField
                control={destinationTypeForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="file" disabled>
                          File
                          <Badge variant="secondary" className="ml-2">
                            Soon!
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {destinationTypeForm.watch("type") == "location" ? (
              <>
                <div className="min-w-[200px] sm:w-1/2">
                  <FormField
                    control={destinationTypeForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://pelicans.dev"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  size="icon"
                  type="submit"
                  disabled={
                    destinationTypeForm.watch("location") === "" ||
                    destinationTypeForm.watch("location") ===
                      form.watch("location") ||
                    loading
                  }
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                </Button>
              </>
            ) : null}
          </div>
        </form>
      </Form>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          {(!loading && destinationTypeForm.watch("type") === "note") ||
          (form.watch("type") === "location" && form.watch("location")) ||
          props.update ? (
            <>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Coolest Pelicans in the World"
                        {...field}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                      <MinimalTiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full"
                        editorContentClassName="p-5"
                        output="html"
                        placeholder="Type your note here..."
                        editorClassName="focus:outline-none"
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
                    </FormControl>
                    <FormDescription>
                      These are tags which can be used to categorize and search
                      for your destination.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={
                  submitMutation.isPending ||
                  (!form.watch("name") && form.watch("type") === "note") ||
                  (form.watch("type") === "location" &&
                    (!form.watch("location") ||
                      destinationTypeForm.watch("location") !=
                        form.watch("location")))
                }
                size="sm"
              >
                {props.update ? (
                  <>
                    {submitMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Pencil />
                    )}

                    {submitMutation.isPending
                      ? "Updating Destination..."
                      : "Update Destination"}
                  </>
                ) : (
                  <>
                    {submitMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Plus />
                    )}

                    {submitMutation.isPending
                      ? "Creating Destination..."
                      : "Create Destination"}
                  </>
                )}
              </Button>
            </>
          ) : null}
        </form>
      </Form>
    </>
  );
}

export function CreateDestination() {
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

  return (
    <TiltCard>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPinPlus className="mr-2 h-5 w-5" /> Create Destination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <DestinationForm
            update={false}
            destinationMutation={createDestination}
          />
        </CardContent>
      </Card>
    </TiltCard>
  );
}

export function RecentDestinations({
  dragEnd,
  setDragEnd,
}: {
  dragEnd: { over: Over; active: Active } | null;
  setDragEnd: React.Dispatch<
    React.SetStateAction<{
      over: Over;
      active: Active;
    } | null>
  >;
}) {
  const {
    data: recentDestinations = { items: [], count: 0 },
    refetch,
    isFetching,
  } = api.destination.getMany.useQuery({
    limit: 3,
    order: "DESC",
  });

  return (
    <TiltCard>
      <Card>
        <CardHeader>
          <Link href="/search/pins">
            <CardTitle className="flex items-center">
              <Telescope className="mr-2 h-5 w-5" /> Recent Destinations
            </CardTitle>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          {recentDestinations.items.length > 0 ? (
            recentDestinations?.items.map((dest: Destination) => {
              return (
                <DestinationCard
                  key={dest.id}
                  {...dest}
                  {...(dragEnd?.active?.id === dest.id
                    ? { dragEnd, setDragEnd }
                    : null)}
                />
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              🌌 No destinations found. Try creating one and come back!
            </p>
          )}
          <div className="flex space-x-2">
            <Button size="sm" variant="secondary" disabled={isFetching} asChild>
              <Link href="/search/pins">
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
              <RefreshCw className={isFetching ? "animate-spin" : undefined} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </TiltCard>
  );
}

export function DestinationCard(
  props: Destination & {
    setDragEnd?: React.Dispatch<
      React.SetStateAction<{ over: Over; active: Active } | null>
    >;
    dragEnd?: { over: Over | null; active: Active | null };
  },
) {
  const utils = api.useUtils();

  const addToLists = api.destination.addToLists.useMutation({
    onSuccess: async () => {
      await utils.destination.invalidate();
      toast({
        title: "Destination added to list(s)",
        description: "Destination has been added to the selected list(s).",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add destination to list(s)",
        description: error.message,
        variant: "destructive",
      });
    },
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
      addToLists.mutate({
        lists: [
          typeof dragEnd.over.id === "number"
            ? dragEnd.over.id
            : parseInt(String(dragEnd.over.id)),
        ],
        id,
      });
      setDragEnd(null);
    }
  }, [dragEnd, setDragEnd, addToLists, id]);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CardHeader className="px-3 pb-2 pt-4 text-sm">
        <CardTitle className="truncate">
          <Link href={`/pin/${props.id}`}>
            {props.name && props.name.length > 0
              ? props.name
              : "Unnamed Destination"}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 text-sm">
        {props.type == "location" ? (
          <p className="truncate text-xs">
            <Button variant="link" asChild className="truncate p-0">
              <Link
                href={props.location ?? "#"}
                className="truncate"
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.location}
              </Link>
            </Button>
          </p>
        ) : null}
        <DestinationDialogRender data={props} />
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge className="mr-2">
            {String(props.type).charAt(0).toUpperCase() +
              String(props.type).slice(1)}
          </Badge>
          {props.tags && props.tags?.length > 0
            ? props.tags.map((tag) => (
                <Link key={tag.id} href={`/search/pins?tags=${tag.text}`}>
                  <Badge variant="secondary">{tag.text}</Badge>
                </Link>
              ))
            : null}
        </div>
      </CardContent>
    </Card>
  );
}

function DestinationDialogRender(props: { data?: Destination }) {
  const editor = useEditor({
    extensions: createExtensions(""),
    editable: false,
    content: props.data?.body ?? "",
  });
  return <EditorContent editor={editor} />;
}

export function DestinationDialog(props: { id: string }) {
  const utils = api.useUtils();

  const router = useRouter();
  const destinationId = props.id;
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);

  const updateDestination = (callback?: () => void) =>
    api.destination.update.useMutation({
      onSuccess: async () => {
        await utils.destination.invalidate();
        if (typeof callback === "function") {
          callback();
        }
        router.push("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Failed to update destination",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  const deleteDestination = api.destination.delete.useMutation({
    onSuccess: async () => {
      await utils.destination.invalidate();
      router.push("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Failed to update destination",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    data,
    isPending,
  }: { data: Destination | undefined; isPending: boolean } =
    api.destination.get.useQuery(
      { id: parseInt(destinationId ?? "0", 10) },
      { enabled: !!destinationId },
    );

  const { data: searchResults = { count: 0, items: [] } } =
    api.list.getMany.useQuery({
      limit: 100,
      sortBy: "updatedAt",
    });

  function handleOpenChange(openStatus: boolean) {
    setOpen(openStatus);
    if (!openStatus) {
      router.push("/dashboard");
    }
  }
  const addToLists = api.destination.addToLists.useMutation({
    onSuccess: async () => {
      await utils.destination.invalidate();
      toast({
        title: "Destination added to list(s)",
        description: "Destination has been added to the selected list(s).",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add destination to list(s)",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const removeFromLists = api.destination.removeFromLists.useMutation({
    onSuccess: async () => {
      await utils.destination.invalidate();
      toast({
        title: "Destination removed from list(s)",
        description: "Destination has been removed from the selected list(s).",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove destination from lists",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  function addLists(lists: List[] | null) {
    if (lists) {
      addToLists.mutate({
        lists: lists.map((l) => l.id),
        id: parseInt(props.id),
      });
    }
  }

  function removeLists(lists: List[] | null) {
    if (lists) {
      removeFromLists.mutate({
        lists: lists.map((l) => l.id),
        id: parseInt(props.id),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-y-auto sm:max-h-full md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <div className="flex w-full flex-1 flex-col space-y-6 pt-0">
          <DialogHeader>
            <DialogTitle className="break-words">
              {editing
                ? "Edit Destination"
                : data
                  ? data.name
                  : "Couldn't find Destination"}
            </DialogTitle>
          </DialogHeader>
          {editing && data != undefined && !isPending ? (
            <DestinationForm
              update={true}
              defaultValues={{
                ...data,
                body: data.body ?? '<p class="text-node"></p>',
                name: data.name ?? "",
                type: data.type as "location" | "note" | "file",
                attachments: [],
                tags:
                  data.tags?.map((tag) => ({
                    id: tag.id.toString(),
                    text: tag.text,
                  })) ?? [],
              }}
              updateId={parseInt(props.id)}
              destinationMutation={updateDestination}
            />
          ) : (
            <Dialog>
              <main className="space-y-6 pt-0">
                {data?.type === "location" ? (
                  <div className="text-sm">
                    Location:{" "}
                    <Button asChild variant="link" className="text-wrap p-0">
                      <Link href={data?.location ?? "#"} target="_blank">
                        {data?.location}
                      </Link>
                    </Button>
                  </div>
                ) : null}
                {data?.body ? (
                  <div className="w-full">
                    <DestinationDialogRender
                      data={data?.id !== undefined ? data : undefined}
                    />
                  </div>
                ) : null}
                {data?.tags && data?.tags?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    Tags:{" "}
                    {data?.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.text}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <DialogFooter>
                  {data != undefined ? (
                    <div className="w-full">
                      <Separator className="my-4" />
                      <p className="mb-4 text-sm font-semibold">
                        Destination actions:
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditing(true);
                          }}
                        >
                          Edit Destination
                        </Button>
                        <ListComboBox
                          text="+ Add to Map"
                          defaultList={data.lists ?? []}
                          recentLists={searchResults.items ?? []}
                          handleListAdds={addLists}
                          handleListRemovals={removeLists}
                        />
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            Delete Destination
                          </Button>
                        </DialogTrigger>
                      </div>
                    </div>
                  ) : null}
                </DialogFooter>
              </main>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. Are you sure you want to
                    permanently delete this destination?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      onClick={() => {
                        deleteDestination.mutate({ id: parseInt(props.id) });
                      }}
                    >
                      Confirm
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ListComboBox({
  text = "+ Add to Map",
  defaultList,
  recentLists,
  className,
  handleListAdds,
  handleListRemovals,
}: {
  text: string;
  className?: string;
  defaultList: List[];
  recentLists: List[];
  handleListAdds: (status: List[] | null) => void;
  handleListRemovals: (status: List[] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedList, setSelectedList] = useState<List[]>(defaultList);

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("justify-start", className)}>
            {selectedList.length > 0 && selectedList[0] ? (
              <>
                {selectedList[0].name}{" "}
                {selectedList.length > 1
                  ? "+ " + (selectedList.length - 1).toString() + " more"
                  : null}{" "}
              </>
            ) : (
              <>{text}</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <StatusList
            selectedList={selectedList}
            handleListAdds={(list) => {
              handleListAdds(list);
              setSelectedList([...selectedList, ...(list ?? [])]);
            }}
            handleListRemovals={(list) => {
              handleListRemovals(list);
              setSelectedList(
                selectedList.filter((l) => l && !list?.includes(l)),
              );
            }}
            recentLists={recentLists}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className={cn("justify-start", className)}>
          {selectedList.length > 0 && selectedList[0] ? (
            <>
              {selectedList[0].name}{" "}
              {selectedList.length > 1
                ? "+ " + (selectedList.length - 1).toString() + " more"
                : null}{" "}
            </>
          ) : (
            <>{text}</>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <StatusList
            selectedList={selectedList}
            handleListAdds={handleListAdds}
            handleListRemovals={handleListRemovals}
            recentLists={recentLists}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function StatusList({
  recentLists,
  selectedList,
  handleListAdds,
  handleListRemovals,
}: {
  recentLists: List[];
  selectedList: List[];
  handleListAdds: (list: List[] | null) => void;
  handleListRemovals: (list: List[] | null) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Filter maps..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {recentLists.map((list) => (
            <CommandItem key={list.id} value={list.name}>
              <Checkbox
                checked={
                  !!selectedList.find((priority) => priority.id === list.id)
                }
                onCheckedChange={(checked) => {
                  if (!checked) {
                    handleListRemovals(
                      selectedList.filter(
                        (priority) => priority.id === list.id,
                      ),
                    );
                  } else {
                    handleListAdds(
                      recentLists.filter((priority) => priority.id === list.id),
                    );
                  }
                }}
              />
              {list.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
