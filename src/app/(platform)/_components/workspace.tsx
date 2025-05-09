"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type UseTRPCMutationResult } from "@trpc/react-query/shared";
import { api } from "~/trpc/react";
import { Loader2, PackagePlus, Pencil, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import {
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
  DialogContent,
  DialogHeader,
  DialogTitle,
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
}: {
  workspace?: Workspace;
  recentWorkspaces: Workspace[];
  isFetchingWorkspaces?: boolean;
}) {
  const utils = api.useUtils();
  const router = useRouter();

  const [open, setOpen] = useState(false);

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
  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <p className="text-sm font-bold">Switch Workspace</p>

      <div className="flex flex-row space-x-2">
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
          <SelectTrigger className="w-[180px]">
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
          <Plus /> New
        </Button>
      </div>
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
  );
}
