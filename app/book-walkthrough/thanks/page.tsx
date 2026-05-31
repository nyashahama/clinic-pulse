import { connection } from "next/server";

import BookWalkthroughThanksPageClient from "./page-client";

export default async function BookWalkthroughThanksPage() {
  await connection();

  return <BookWalkthroughThanksPageClient />;
}
