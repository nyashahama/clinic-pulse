"use client";

import { UsersRolesDataTable, type UserRow } from "@/components/product/users-roles-data-table";
import type { AccessLifecycleSubject } from "@/lib/product/admin-access-lifecycle";
import { bulkDisableUsersAction, bulkEnableUsersAction, bulkRevokeSessionsAction } from "./actions";

type UsersTableClientProps = {
  users: UserRow[];
  accessSubjects: AccessLifecycleSubject[];
  defaultSubjectId: string | null;
  evidenceLinks: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  detailReturnSource?: string;
};

export function UsersTableClient({
  users,
  accessSubjects,
  defaultSubjectId,
  evidenceLinks,
  detailReturnSource,
}: UsersTableClientProps) {
  return (
    <UsersRolesDataTable
      users={users}
      accessSubjects={accessSubjects}
      defaultSubjectId={defaultSubjectId}
      evidenceLinks={evidenceLinks}
      detailReturnSource={detailReturnSource}
      onBulkDisable={async (userIds) => {
        await bulkDisableUsersAction(userIds);
      }}
      onBulkEnable={async (userIds) => {
        await bulkEnableUsersAction(userIds);
      }}
      onBulkRevokeSessions={async (userIds) => {
        await bulkRevokeSessionsAction(userIds);
      }}
    />
  );
}
