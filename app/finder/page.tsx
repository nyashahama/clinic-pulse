import { connection } from "next/server";

import FinderPageClient from "./page-client";
import { fetchClinics } from "@/lib/demo/api-client";
import { mapApiClinicDetailToClinicRow } from "@/lib/demo/api-mappers";
import type { DemoImageKey } from "@/lib/demo/types";

const publicFinderImageKeys = [
  "clinic-front-01",
  "clinic-front-02",
] satisfies DemoImageKey[];

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
