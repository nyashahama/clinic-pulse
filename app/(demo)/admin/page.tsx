import { connection } from "next/server";

import AdminPageClient from "./page-client";

export default async function AdminPage() {
  await connection();

  return <AdminPageClient />;
}
