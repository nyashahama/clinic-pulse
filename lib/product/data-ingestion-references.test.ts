import { dataIngestionSourceReferences } from "./data-ingestion-references";

describe("data ingestion source references", () => {
  it("keeps source-available implementation references in product evidence", () => {
    expect(dataIngestionSourceReferences.map((reference) => reference.source)).toEqual([
      "Trigger.dev",
      "OpenStatus",
      "Supabase Studio",
      "Unkey audit logs",
    ]);
    expect(dataIngestionSourceReferences.every((reference) => reference.href)).toBe(true);
  });
});
