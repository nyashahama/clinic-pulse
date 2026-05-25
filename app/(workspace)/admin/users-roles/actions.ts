"use server";

import { revalidatePath } from "next/cache";

import { AUTH_ROLES, type AuthRole } from "@/lib/auth/api";
import {
  createAdminUser,
  revokeAdminUserSessions,
  updateAdminUser,
  updateAdminUserAccess,
} from "@/lib/demo/api-client";
import { getAdminLoaderOptions } from "../admin-loaders";

const usersRolesPath = "/admin/users-roles";
const authRoles = new Set<string>(AUTH_ROLES);

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (value == null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new Error(`Invalid ${key}.`);
  }

  return value.trim();
}

function formOptionalNumber(formData: FormData, key: string) {
  const value = formString(formData, key);
  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("Invalid organisation ID.");
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid organisation ID.");
  }

  return parsed;
}

function formOptionalString(formData: FormData, key: string) {
  return formString(formData, key) || undefined;
}

function formRole(formData: FormData): AuthRole {
  const role = formString(formData, "role");
  if (authRoles.has(role)) {
    return role as AuthRole;
  }

  throw new Error("Invalid user role.");
}

export async function createPilotUserAction(formData: FormData) {
  const result = await createAdminUser(
    {
      email: formString(formData, "email"),
      displayName: formString(formData, "displayName"),
      role: formRole(formData),
      organisationId: formOptionalNumber(formData, "organisationId"),
      district: formOptionalString(formData, "district"),
    },
    await getAdminLoaderOptions(),
  );
  revalidatePath(usersRolesPath);
  return result;
}

export async function setUserDisabledAction(userId: number, disabled: boolean) {
  await updateAdminUser(userId, { disabled }, await getAdminLoaderOptions());
  revalidatePath(usersRolesPath);
}

export async function updateUserAccessAction(userId: number, formData: FormData) {
  await updateAdminUserAccess(
    userId,
    {
      role: formRole(formData),
      organisationId: formOptionalNumber(formData, "organisationId"),
      district: formOptionalString(formData, "district"),
    },
    await getAdminLoaderOptions(),
  );
  revalidatePath(usersRolesPath);
}

export async function revokeUserSessionsAction(userId: number) {
  await revokeAdminUserSessions(userId, await getAdminLoaderOptions());
  revalidatePath(usersRolesPath);
}
