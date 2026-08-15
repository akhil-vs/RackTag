import { NextRequest, NextResponse } from "next/server";
import {
  insertUsageEvent,
  isDatabaseConfigured,
} from "@/lib/analytics-db";

const ALLOWED_EVENTS = new Set([
  "app_open",
  "analytics_enabled",
  "analytics_disabled",
  "tab_change",
  "camera_start",
  "scan_barcode",
  "scan_text",
  "download_png",
  "add_to_sheet",
  "print_sheet",
  "clear_sheet",
]);

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Analytics database is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const sessionId = typeof data.sessionId === "string" ? data.sessionId.trim() : "";
  const event = typeof data.event === "string" ? data.event.trim() : "";

  if (!sessionId || !event || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  const tab = typeof data.tab === "string" ? data.tab.slice(0, 32) : null;
  const scanMode = typeof data.scanMode === "string" ? data.scanMode.slice(0, 32) : null;
  const labelCode =
    typeof data.labelCode === "string" ? data.labelCode.slice(0, 256) : null;
  const sheetCount =
    typeof data.sheetCount === "number" && Number.isFinite(data.sheetCount)
      ? Math.max(0, Math.floor(data.sheetCount))
      : null;
  const metadata =
    data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : null;

  try {
    await insertUsageEvent({
      sessionId,
      event,
      tab,
      scanMode,
      labelCode,
      sheetCount,
      userAgent: request.headers.get("user-agent"),
      metadata,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to store analytics event", error);
    return NextResponse.json({ error: "Failed to store event." }, { status: 500 });
  }
}
