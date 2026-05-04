export type OfflineSyncApiResult = {
  clientReportId: string;
  result:
    | "created"
    | "duplicate"
    | "conflict"
    | "validation_error"
    | "forbidden"
    | "server_error";
  report?: { id: number; reviewState: string };
  warning?: string | null;
  error?: { code: string; message: string; fields?: string[] } | null;
};
