import { openApiDocument } from "~/server/api/openapi";

const handler = () => {
  return Response.json(openApiDocument);
};

export { handler as GET };
