import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createApiKey, deleteApiKey, listApiKeys } from "@/lib/api-keys";
import { dispatchWebhook, listWebhookDeliveries, updateWebhookUrl } from "@/lib/webhooks";
import {
  activatePilotPlan,
  getOrganizationById,
  updateOrganizationSso,
  updateOrganizationTemplates,
} from "@/lib/db";
import { type LabelTemplateConfig } from "@/lib/templates";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const org = await getOrganizationById(session.orgId);
    const keys = await listApiKeys(session.orgId);
    const deliveries = await listWebhookDeliveries(session.orgId);
    return NextResponse.json({ org, keys, deliveries });
  } catch (error) {
    console.error("Settings load failed", error);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: {
    action?: string;
    webhookUrl?: string | null;
    templates?: LabelTemplateConfig;
    apiKeyName?: string;
    apiKeyId?: string;
    ssoProvider?: string | null;
    ssoDomain?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    if (body.action === "create_api_key") {
      const name = body.apiKeyName?.trim() || "Default";
      const key = await createApiKey(session.orgId, name);
      return NextResponse.json({ ok: true, apiKey: key });
    }

    if (body.action === "delete_api_key" && body.apiKeyId) {
      await deleteApiKey(session.orgId, body.apiKeyId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update_webhook") {
      await updateWebhookUrl(session.orgId, body.webhookUrl ?? null);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "test_webhook") {
      const result = await dispatchWebhook(session.orgId, "webhook.test", {
        message: "RackTag webhook test",
        orgId: session.orgId,
      });
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "update_templates" && body.templates) {
      await updateOrganizationTemplates(session.orgId, body.templates);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update_sso") {
      await updateOrganizationSso(session.orgId, body.ssoProvider ?? null, body.ssoDomain ?? null);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "activate_pilot") {
      await activatePilotPlan(session.orgId);
      return NextResponse.json({ ok: true, plan: "pilot" });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Settings update failed", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
