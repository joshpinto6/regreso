import React from "react";
import Link from "next/link";

import { SiteContent } from "~/components/site-content";
import { Button } from "~/components/ui/button";
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
      <footer>
        <p className="text-sm text-muted-foreground">
          Illustrations by{" "}
          <Button variant="link" asChild className="p-0">
            <Link href="https://popsy.co">Popsy</Link>
          </Button>
        </p>
      </footer>
    </div>
  );
}
