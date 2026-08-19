import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, requireAdminRole } from "@/lib/session";
import { getAuditEvents } from "@/lib/db";

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!requireAdminRole(session) || !session) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const rows = await getAuditEvents(session.orgId);
    const header = [
      "created_at",
      "event_type",
      "tab",
      "label_code",
      "sheet_count",
      "user_email",
      "user_name",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        header.map((key) => csvEscape(row[key as keyof typeof row])).join(","),
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="racktag-audit-${session.orgId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Audit export failed", error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
