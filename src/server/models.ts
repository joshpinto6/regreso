import { z } from "zod";

export interface User {
  id: number;
  email: string;
  name: string;
  displayName: string;
  bio: string | null;
  workspaceId: number | null;
  googleId?: string | null;
  githubId?: number | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  registered2FA: boolean;
  registeredPasskey: boolean;
  registeredTOTP: boolean;
  registeredSecurityKey: boolean;
}

export interface SessionFlags {
  twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
  id: string;
  expiresAt: Date;
  userId: number;
}

export interface Destination {
  id: number;
  name: string | null;
  location: string | null;
  type: string;
  userId: number;
  body: string | null;
  attachments?: string[];
  createdAt: Date;
  tags?: { id: number; text: string }[];
  updatedAt: Date | null;
  lists?: List[];
  workspace: Workspace;
  archived: boolean;
}

export interface List {
  id: number;
  name: string;
  emoji: string | null;
  description: string | null;
  userId: number;
  createdAt: Date;
  size?: number;
  updatedAt?: Date | null;
  tags?: { id: number; text: string }[];
  workspace: Workspace;
  archived: boolean;
}

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  emoji: string | null;
  userId: number;
  createdAt: Date;
  destinationCount?: number;
  listCount?: number;
  tagCount?: number;
  archived: boolean;
}

export interface Tag {
  id: number;
  name: string;
  shortcut: string | null;
  description: string | null;
  color: string | null;
  userId: number;
  destinationCount?: number;
  listCount?: number;
  workspace: Workspace | null;
  createdAt: Date;
  updatedAt: Date | null;
  archived: boolean;
}

const destinationTypes = ["location", "note", "file"] as const;

export const destinationFormSchema = z.object({
  type: z.enum(destinationTypes),
  location: z.string().nullable(),
  name: z
    .string({
      required_error: "Please enter a destination name.",
    })
    .max(100, {
      message: "The name must be less than 100 characters.",
    }),
  body: z
    .string()
    .min(0)
    .max(1000, {
      message: "The body must be less than 1000 characters.",
    })
    .nullable(),
  tags: z.array(z.object({ id: z.string(), text: z.string() })).min(0),
  attachments: z.array(z.string()),
  workspaceId: z.number().optional(),
});

export const listFormSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "The name must be at least 1 characters.",
    })
    .max(100, {
      message: "The name must be less than 100 characters.",
    }),
  emoji: z.string().min(1).max(5, {
    message: "The emoji must be 1 character.",
  }),
  description: z.string().min(0).max(200, {
    message: "The description must be less than 200 characters.",
  }),
  tags: z.array(z.object({ id: z.string(), text: z.string() })).min(0),
  workspaceId: z.number().optional(),
});

export const workspaceFormSchema = z.object({
  name: z
    .string({
      required_error: "Please enter a workspace name.",
    })
    .min(1, {
      message: "The name must be at least 1 characters.",
    })
    .max(100, {
      message: "The name must be less than 100 characters.",
    }),
  description: z.string().min(0).max(200, {
    message: "The description must be less than 200 characters.",
  }),
  emoji: z.string().min(1).max(5, {
    message: "The emoji must be 1 character.",
  }),
  newDefault: z.boolean().optional(),
  workspaceId: z.number().optional(),
});

export const tagFormSchema = z.object({
  name: z
    .string({
      required_error: "Please enter a tag name.",
    })
    .min(1, {
      message: "The name must be at least 1 characters.",
    })
    .max(100, {
      message: "The name must be less than 100 characters.",
    }),
  shortcut: z.string().min(0).max(10, {
    message: "The shortcut must be less than 10 characters.",
  }),
  description: z
    .string()
    .min(0)
    .max(200, {
      message: "The description must be less than 200 characters.",
    })
    .optional(),
  color: z
    .string()
    .min(3, {
      message: "Invalid color",
    })
    .max(300, {
      message: "The color must be between 3-300 characters.",
    })
    .optional(),
  workspaceId: z.number().optional(),
});

export const workspaceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  name: z.string(),
  description: z.string().nullable(),
  emoji: z.string().nullable(),
  destinationCount: z.number().optional(),
  listCount: z.number().optional(),
  tagCount: z.number().optional(),
  archived: z.boolean(),
});

export const destinationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  tags: z.array(z.object({ id: z.number(), text: z.string() })).optional(),
  type: z.string(),
  name: z.string().nullable(),
  location: z.string().nullable(),
  body: z.string().nullable(),
  attachments: z.array(z.any()).optional(),
  workspace: workspaceSchema,
  archived: z.boolean(),
});

export const listSchema = z.object({
  id: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
  tags: z.array(z.object({ id: z.number(), text: z.string() })).optional(),
  size: z.number().optional(),
  name: z.string(),
  emoji: z.string().nullable(),
  workspace: workspaceSchema,
  description: z.string().nullable(),
  archived: z.boolean(),
});

export const tagSchema = z.object({
  id: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  name: z.string(),
  shortcut: z.string().nullable(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  workspace: workspaceSchema.nullable(),
  destinationCount: z.number().optional(),
  listCount: z.number().optional(),
  archived: z.boolean(),
});

export const updateDestinationSchema = z.object({
  id: z.number(),
  ...destinationFormSchema.partial().shape,
  archived: z.boolean().optional(),
});

export const updateListSchema = z.object({
  id: z.number(),
  ...listFormSchema.partial().shape,
  newTags: z.array(z.string()).optional(),
  removedTags: z.array(z.string()).optional(),
    archived: z.boolean().optional(),
});

export const updateWorkspaceSchema = z.object({
  id: z.number(),
  ...workspaceFormSchema.partial().shape,
  newDefault: z.boolean().optional(),
    archived: z.boolean().optional(),

});

export const updateTagSchema = z.object({
  id: z.number(),
  ...tagFormSchema.partial().shape,
    archived: z.boolean().optional(),

});

const destinationSearchTypes = ["location", "note", "any"] as const;

export const destinationSearchSchema = z.object({
  type: z.enum(destinationSearchTypes).optional().nullable(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  lists: z.array(z.number()).optional(),
  searchString: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  limit: z.number().max(30).optional().default(5),
  offset: z.number().optional().default(0),
  workspaceId: z.number().optional(),
  archived: z.boolean().optional(),
});

export const listSearchSchema = z.object({
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "size", "name", "emoji"])
    .optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  searchString: z.string().nullable().optional(),
  onlyFavorites: z.boolean().optional(),
  limit: z.number().optional().default(5),
  offset: z.number().optional().default(0),
  workspaceId: z.number().optional(),
  archived: z.boolean().optional(),
});

export const workspaceSearchSchema = z.object({
  searchString: z.string().nullable().optional(),
  sortBy: z
    .enum([
      "name",
      "createdAt",
      "destinationCount",
      "listCount",
      "tagCount",
      "emoji",
    ])
    .optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  limit: z.number().max(30).optional().default(5),
  offset: z.number().optional().default(0),
  archived: z.boolean().optional(),
});

export const tagSearchSchema = z.object({
  searchString: z.string().nullable().optional(),
  sortBy: z
    .enum([
      "createdAt",
      "updatedAt",
      "destinationCount",
      "listCount",
      "name",
      "color",
    ])
    .optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  limit: z.number().max(30).optional().default(5),
  offset: z.number().optional().default(0),
  workspaceId: z.number().optional(),
  archived: z.boolean().optional(),
});
