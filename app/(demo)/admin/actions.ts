"use server";

import {
  AuthenticationRequiredError,
  getCurrentSession,
  getSessionCookieHeader,
  requireWorkflowRole,
} from "@/lib/auth/session";
import {
  createAdminDemoLead,
  createPartnerApiKey,
  createPartnerExport,
  createPartnerWebhook,
  revokePartnerApiKey,
  testPartnerWebhook,
  updateAdminDemoLeadStatus,
} from "@/lib/demo/api-client";
import type {
  CreateDemoLeadApiInput,
  CreatePartnerApiKeyApiInput,
  CreatePartnerExportApiInput,
  CreatePartnerWebhookApiInput,
  UpdateDemoLeadStatusApiInput,
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

export async function createAdminDemoLeadAction(input: CreateDemoLeadApiInput) {
  return createAdminDemoLead(input, await getAdminApiOptions());
}

export async function updateAdminDemoLeadStatusAction(
  leadId: number | string,
  input: UpdateDemoLeadStatusApiInput,
) {
  return updateAdminDemoLeadStatus(leadId, input, await getAdminApiOptions());
}
