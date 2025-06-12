import React from "react";

import { SearchPage } from "../../_components/search";

export async function generateStaticParams() {
  return ["maps", "pins", "tags", "boxes"].map((searchType) => ({
    searchType,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ searchType: string }>;
}) {
  return (
    <div className="center flex flex-col items-center p-4">
      <SearchPage
        searchType={
          (await params).searchType as "pins" | "maps" | "tags" | "boxes"
        }
      />
    </div>
  );
}
