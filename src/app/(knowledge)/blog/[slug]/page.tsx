import React from "react";

import { SiteContent } from "~/components/site-content";

import { getPostData, getSortedPostsData } from "~/lib/knowledge";

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.id,
  }));
}

export default async function Post({
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
