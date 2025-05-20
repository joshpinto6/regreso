"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type UseTRPCMutationResult } from "@trpc/react-query/shared";
import { TRPCMutationProcedure } from "@trpc/server";
import { api } from "~/trpc/react";
import {
  Flame,
  Forklift,
  Heart,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  Shovel,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import {
  User,
  workspaceFormSchema,
  type updateWorkspaceSchema,
  type Workspace,
  type workspaceSchema,
} from "~/server/models";

import { timeSince } from "~/lib/utils";

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
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "~/components/hooks/use-toast";

type WorkspaceFormProps =
  | {
      workspaceMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof updateWorkspaceSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof updateWorkspaceSchema>,
        unknown
      >;
      update: true;
      updateId: number;
      defaultValues?: z.infer<typeof workspaceSchema>;
    }
  | {
      workspaceMutation: (callback?: () => void) => UseTRPCMutationResult<
        { success: boolean },
        TRPCClientErrorLike<{
          input: z.infer<typeof updateWorkspaceSchema>;
          output: { success: boolean };
          transformer: true;
          errorShape: { message: string };
        }>,
        z.infer<typeof workspaceFormSchema>,
        unknown
      >;
      update: false;
      defaultValues?: z.infer<typeof workspaceFormSchema>;
    };

export function WorkspaceCard(props: Workspace) {
  return (
    <Card>
      <div>
        <CardHeader className="px-3 pb-2 pt-4 text-sm leading-tight">
          <CardTitle className="truncate">
            <Link href={`/box/${props.id}`}>
              <span className="mr-2 leading-tight">{props?.emoji ?? "❔"}</span>
              {props.name ?? "Unnamed Trunk"}
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
                <p className="font-muted mr-0.5 text-sm">
                  Created {timeSince(props.createdAt)} ago
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{props.createdAt.toISOString()}</p>
              </TooltipContent>
            </Tooltip>

            {props.destinationCount != null &&
              props.destinationCount != undefined && (
                <>
                  <p>•</p>

                  <p className="font-muted mr-0.5 text-sm">
                    {props.destinationCount} destination
                    {props.destinationCount == 1 ? null : "s"}
                  </p>
                </>
              )}
            {props.listCount != null && props.listCount != undefined && (
              <>
                <p>•</p>

                <p className="font-muted mr-0.5 text-sm">
                  {props.listCount} map{props.listCount == 1 ? null : "s"}
                </p>
              </>
            )}
            {props.tagCount != null && props.tagCount != undefined && (
              <>
                <p>•</p>

                <p className="font-muted mr-0.5 text-sm">
                  {props.tagCount} tag{props.tagCount == 1 ? null : "s"}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function WorkspaceForm(props: WorkspaceFormProps) {
  const form = useForm<z.infer<typeof workspaceFormSchema>>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: props.defaultValues?.name ?? "",
      description: props.defaultValues?.description ?? "",
      emoji: props.defaultValues?.emoji ?? "🧰",
    } as z.infer<typeof workspaceFormSchema>,
  });

  const submitMutation = props.workspaceMutation(() => {
    form.reset();
  });

  function onSubmit(data: z.infer<typeof workspaceFormSchema>) {
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
                  <Input placeholder="Bird Research" {...field} />
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
                  placeholder="Research about birds and their habitats"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
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

              {submitMutation.isPending ? "Updating Trunk..." : "Update Trunk"}
            </>
          ) : (
            <>
              {submitMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus />
              )}

              {submitMutation.isPending ? "Creating Trunk..." : "Create Trunk"}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export function RecentWorkspacesDropdown({
  workspace,
  recentWorkspaces,
  isFetchingWorkspaces,
  user,
}: {
  workspace?: Workspace;
  recentWorkspaces: Workspace[];
  isFetchingWorkspaces?: boolean;
  user?: User;
}) {
  const utils = api.useUtils();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const createWorkspace = (callback?: () => void) =>
    api.workspace.create.useMutation({
      onSuccess: async () => {
        await utils.workspace.invalidate();
        if (typeof callback === "function") {
          callback();
        }
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to create workspace",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const updateWorkspace = (callback?: () => void) =>
    api.workspace.update.useMutation({
      onSuccess: async () => {
        await utils.workspace.invalidate();
        toast({
          title: "Trunk updated",
          description: "Successfully updated trunk properties.",
        });
        if (typeof callback === "function") {
          callback();
        }
        setEditing(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to update trunk",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  const archiveMutation = updateWorkspace();
  const updateUser = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.user.invalidate();
      toast({
        title: "Preferences updated",
        description: "Successfully updated user preferences.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  function handleArchivalToggle() {
    if (workspace?.archived) {
      archiveMutation.mutate({
        id: workspace.id,
        archived: false,
      });
      utils.workspace.invalidate();
      router.refresh();
    } else if (workspace) {
      archiveMutation.mutate({
        id: workspace.id,
        archived: true,
      });
      utils.workspace.invalidate();
    } else {
      toast({
        title: "Failed to update trunk",
        description: "No trunk selected.",
        variant: "destructive",
      });
    }
  }
  function handleMakingWorkspaceDefault() {
    if (!workspace) {
      toast({
        title: "Failed to update user",
        description: "No trunk selected.",
        variant: "destructive",
      });
      return;
    }
    updateUser.mutate({
      workspaceId: workspace.id,
    });
  }

  return (
    <>
      <p className="text-sm font-bold">Switch Trunk</p>
      <div className="flex w-full flex-row flex-wrap items-center gap-2 xs:flex-nowrap">
        <Select
          disabled={isFetchingWorkspaces}
          onValueChange={(value) => {
            if (value === "0") {
              router.push("/dashboard");
              return;
            }
            router.push("/box/" + value);
          }}
          defaultValue={(workspace?.id ?? 0).toString()}
        >
          <SelectTrigger className="max-w-[160px] flex-shrink">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Workspaces</SelectItem>
            {recentWorkspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id.toString()}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />{" "}
          <span className="mx-0 hidden xs:block sm:hidden md:block">New</span>
        </Button>
      </div>
      <Dialog open={open} onOpenChange={() => setOpen(false)}>
        <DialogContent className="sm:max-w-md">
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
      {workspace ? (
        <>
          <p className="mt-6 text-sm font-bold">Trunk Actions</p>

          <div className="flex flex-row flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditing(true);
              }}
            >
              <Pencil /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex flex-shrink"
              onClick={handleMakingWorkspaceDefault}
            >
              <Heart />
              Make Default
            </Button>
            {workspace.archived ? (
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
                      This action cannot be undone. Are you sure you want to
                      bury this trunk? It will be hidden from the dashboard and
                      other pages until you excavate it.
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
              <DeleteTrunk id={workspace.id} routePath="/search/boxes">
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex flex-shrink"
                  >
                    <Flame />
                    Burn
                  </Button>
                </DialogTrigger>
              </DeleteTrunk>
            </Dialog>
          </div>
          <Dialog open={editing} onOpenChange={() => setEditing(false)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PackagePlus /> Edit Trunk
                </DialogTitle>
              </DialogHeader>
              <main className="flex flex-1 flex-col space-y-6 pt-0">
                <WorkspaceForm
                  update={true}
                  workspaceMutation={updateWorkspace}
                  defaultValues={workspace}
                  updateId={workspace.id}
                />
              </main>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </>
  );
}

export function DeleteTrunk({
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

  const deleteWorkspace = api.workspace.delete.useMutation({
    onSuccess: async () => {
      await utils.workspace.invalidate();
      router.push(routePath);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete trunk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function handleDeleteWorkspace() {
    deleteWorkspace.mutate({ id: parseInt(id.toString()) });
  }
  return (
    <Dialog>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete this trunk?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" onClick={handleDeleteWorkspace}>
              Confirm
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
