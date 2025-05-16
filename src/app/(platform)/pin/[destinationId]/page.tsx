import { api } from "~/trpc/server";

import { DestinationDialog } from "~/app/(platform)/_components/destination";

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ destinationId: string }>;
}) {
  const { user } = await api.session.get({});
  const { items: workspaces } = await api.workspace.getMany({ limit: 30 });
  return (
    <div className="flex h-svh items-center justify-center">
      <DestinationDialog
        id={(await params).destinationId}
        workspaces={workspaces}
        user={user}
      />
    </div>
  );
}
