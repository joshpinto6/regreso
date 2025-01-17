"use client";

import { useActionState, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import BoringAvatar from "boring-avatars";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { User } from "~/server/models";

import { UploadButton } from "~/lib/client/uploadthing";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/hooks/use-toast";

import {
  clearProfilePictureAction,
  updateProfileAction,
} from "~/app/(platform)/settings/profile/actions";

const FormSchema = z.object({
  displayName: z
    .string()
    .min(1, {
      message: "Display name must be at least 1 characters.",
    })
    .max(50, {
      message: "Display name must be at most 50 characters.",
    }),
  bio: z.string().max(160, {
    message: "Bio must be at most 160 characters.",
  }),
});

const initialState = {
  message: "",
};

const pfpClearInitialState = {
  message: "",
};

export default function ProfileEdit(props: { user: User }) {
  const [avatarUrl, setAvatarUrl] = useState(props.user.avatarUrl ?? "");

  const [, action] = useActionState(updateProfileAction, initialState);
  const [pfpClearState, deletePfpAction] = useActionState(
    clearProfilePictureAction,
    pfpClearInitialState,
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      displayName: props.user.displayName,
      bio: props.user.bio ?? "",
    },
  });
  const {
    trigger,
    formState: { isValid },
  } = form;

  useEffect(() => {
    if (pfpClearState.message === "ok") {
      setAvatarUrl("");
    } else {
      toast({
        description: pfpClearState.message,
      });
    }
  }, [pfpClearState]);

  return (
    <div className="max-w-2/3 space-y-6 overflow-y-scroll px-3">
      <Form {...form}>
        <div className="space-y-2">
          <FormItem className="w-full">
            <FormLabel>Profile Picture</FormLabel>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={avatarUrl} alt={`@${props.user.name}`} />
                <AvatarFallback>
                  <BoringAvatar
                    name={props.user?.name ?? "anonymous"}
                    aria-label={`@${props.user?.name}'s profile picture`}
                    variant="beam"
                  />
                </AvatarFallback>
              </Avatar>
              <FormControl>
                <UploadButton
                  className="rounded px-4 py-2 font-bold text-white"
                  endpoint="profilePicture"
                  onClientUploadComplete={(res) => {
                    // console.log("Files", res);
                    alert("Files uploaded");
                    toast({
                      title: "Upload complete.",
                      description: "Your file was successfully uploaded!",
                    });
                    if (res[0]) {
                      setAvatarUrl(res[0].url);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                />
              </FormControl>
            </div>
            <form action={deletePfpAction}>
              <Button variant="ghost" type="submit">
                <X />
                Clear Picture
              </Button>
            </form>
          </FormItem>
          <form
            action={action}
            onSubmit={async (e) => {
              if (!isValid) {
                e.preventDefault();
                await trigger();
                return;
              }
              e.currentTarget?.requestSubmit();
            }}
            className="flex w-full flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Pelican Steve" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Biography</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      placeholder="Pelicans are epic"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Profile</Button>
          </form>
        </div>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>Profile Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                <BoringAvatar
                  aria-label={`@${props.user?.name}'s profile picture`}
                  name={props.user?.name ?? "anonymous"}
                  variant="beam"
                />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex space-x-1 align-middle">
                <h4 className="text-sm font-semibold">
                  {form.getValues().displayName}
                </h4>
                <h4 className="text-sm">@{props.user?.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {form.getValues().bio}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
