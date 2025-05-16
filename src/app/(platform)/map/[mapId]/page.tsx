import { api } from "~/trpc/server";

import { ListPage } from "~/app/(platform)/_components/list";

export default async function MapPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { user } = await api.session.get({});
  const { items: workspaces } = await api.workspace.getMany({ limit: 30 });
  return (
    <div className="grid grid-cols-1 xl:grid-cols-1">
      <ListPage id={(await params).mapId} workspaces={workspaces} user={user} />
    </div>
  );
}
