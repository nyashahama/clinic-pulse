"use server";

import {
  AuthenticationRequiredError,
  getCurrentSession,
  getSessionCookieHeader,
  requireWorkflowRole,
} from "@/lib/auth/session";
import {
  createPartnerApiKey,
  createPartnerExport,
  createPartnerWebhook,
  revokePartnerApiKey,
  testPartnerWebhook,
} from "@/lib/demo/api-client";
import type {
  CreatePartnerApiKeyApiInput,
  CreatePartnerExportApiInput,
  CreatePartnerWebhookApiInput,
} from "@/lib/demo/api-types";

async function getAdminApiOptions() {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    throw new AuthenticationRequiredError();
  }

  requireWorkflowRole(await getCurrentSession({ cookieHeader }), "admin");

  return {
    init: {
      headers: {
        cookie: cookieHeader,
      },
    },
  };
}

export async function createPartnerApiKeyAction(input: CreatePartnerApiKeyApiInput) {
  return createPartnerApiKey(input, await getAdminApiOptions());
}

export async function revokePartnerApiKeyAction(keyId: number | string) {
  return revokePartnerApiKey(keyId, await getAdminApiOptions());
}

export async function createPartnerWebhookAction(input: CreatePartnerWebhookApiInput) {
  return createPartnerWebhook(input, await getAdminApiOptions());
}

export async function testPartnerWebhookAction(subscriptionId: number | string) {
  return testPartnerWebhook(subscriptionId, await getAdminApiOptions());
}

export async function createPartnerExportAction(input: CreatePartnerExportApiInput) {
  return createPartnerExport(input, await getAdminApiOptions());
}
