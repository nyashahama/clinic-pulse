import { connection } from "next/server";

import FinderPageClient from "./page-client";
import { fetchClinics } from "@/lib/workspace/api-client";
import { mapApiClinicDetailToClinicRow } from "@/lib/workspace/api-mappers";
import type { WorkspaceImageKey } from "@/lib/workspace/types";

const publicFinderImageKeys = [
  "clinic-front-01",
  "clinic-front-02",
] satisfies WorkspaceImageKey[];

function getPublicFinderImageKey(index: number) {
  return publicFinderImageKeys[index % publicFinderImageKeys.length];
}

export default async function FinderPage() {
  await connection();

  const clinics = (await fetchClinics()).map((clinic, index) =>
    mapApiClinicDetailToClinicRow(clinic, {
      imageKey: getPublicFinderImageKey(index),
    }),
  );

  return <FinderPageClient clinics={clinics} />;
}
