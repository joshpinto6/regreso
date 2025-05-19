import React from "react";

import { api } from "~/trpc/server";
import type { Workspace } from "~/server/models";

import { Dashboard } from "../../_components/dashboard";

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ boxId: string }>;
}) {
  const { user } = await api.session.get({});
  const { items: workspaces } = await api.workspace.getMany({ limit: 30 });
  const workspaceId = (await params).boxId;

  if (!workspaceId) {
    return <div>Invalid workspace ID</div>;
  }

  const data: Workspace | undefined = await api.workspace.get(
    { id: parseInt(workspaceId ?? "0", 10) },
    // { enabled: !!workspaceId },
  );
  return <Dashboard workspace={data} user={user} workspaces={workspaces} />;
}
