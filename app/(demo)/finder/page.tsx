import { connection } from "next/server";

import FinderPageClient from "./page-client";

export default async function FinderPage() {
  await connection();

  return <FinderPageClient />;
}
