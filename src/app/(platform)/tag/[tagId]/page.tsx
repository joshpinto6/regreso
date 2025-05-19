import { TagPage } from "~/app/(platform)/_components/tag";

export default async function MapPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-1">
      <TagPage id={(await params).tagId} />
    </div>
  );
}
