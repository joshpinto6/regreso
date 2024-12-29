import React from "react";

import { getPostData, getSortedPostsData } from "~/lib/knowledge";

import { SiteContent } from "~/components/site-content";

export async function generateStaticParams() {
  return getSortedPostsData();
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const postData = await getPostData((await params).slug);
  return (
    <div className="align-center min-w-sm mx-auto max-w-3xl space-y-8 pt-4">
      <SiteContent postData={postData} />
    </div>
  );
}
