"use client";

import { UsersRolesDataTable, type UserRow } from "@/components/product/users-roles-data-table";
import { bulkDisableUsersAction, bulkEnableUsersAction, bulkRevokeSessionsAction } from "./actions";

type UsersTableClientProps = {
  users: UserRow[];
  detailReturnSource?: string;
};

export function UsersTableClient({ users, detailReturnSource }: UsersTableClientProps) {
  return (
    <UsersRolesDataTable
      users={users}
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
