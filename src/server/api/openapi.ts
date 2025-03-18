import { generateOpenApiDocument } from "trpc-to-openapi";

import { getBaseOrigin } from "~/lib/utils";

import { appRouter } from "./root";

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Regreso API v1",
  version: "0.1.0",
  baseUrl: getBaseOrigin() + "/api/v1",
});
