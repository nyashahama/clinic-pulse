import { connection } from "next/server";

import BookDemoThanksPageClient from "./page-client";

export default async function BookDemoThanksPage() {
  await connection();

  return <BookDemoThanksPageClient />;
}
