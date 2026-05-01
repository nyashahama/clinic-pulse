import { connection } from "next/server";

import DistrictConsolePageClient from "./page-client";

export default async function DistrictConsolePage() {
  await connection();

  return <DistrictConsolePageClient />;
}
