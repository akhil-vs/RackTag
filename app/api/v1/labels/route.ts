import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys";
import { applyPattern, DEFAULT_TEMPLATES } from "@/lib/templates";
import { getOrgTemplates } from "@/lib/db";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const rawKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!rawKey) {
    return NextResponse.json({ error: "Missing API key." }, { status: 401 });
  }

  const auth = await authenticateApiKey(rawKey);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  let body: {
    type?: "bin" | "cart" | "cartbin" | "raw";
    values?: Record<string, string | number>;
    code?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.type === "raw" && body.code) {
    return NextResponse.json({ code: body.code.trim() });
  }

  const templates = await getOrgTemplates(auth.orgId);
  const type = body.type ?? "bin";
  const values = body.values ?? {};

  if (type === "bin") {
    const t = templates.bin;
    const xxx = Number(values.xxx);
    const zzzz = Number(values.zzzz);
    const y = String(values.y ?? "A");
    if (
      !Number.isInteger(xxx) ||
      xxx < t.validation.xxx.min ||
      xxx > t.validation.xxx.max ||
      !Number.isInteger(zzzz) ||
      zzzz < t.validation.zzzz.min ||
      zzzz > t.validation.zzzz.max
    ) {
      return NextResponse.json({ error: "Invalid bin values." }, { status: 400 });
    }
    return NextResponse.json({
      code: applyPattern(t.pattern, { xxx, y, zzzz }),
    });
  }

  if (type === "cart") {
    const t = templates.cart;
    const xxx = Number(values.xxx);
    if (
      !Number.isInteger(xxx) ||
      xxx < t.validation.xxx.min ||
      xxx > t.validation.xxx.max
    ) {
      return NextResponse.json({ error: "Invalid cart values." }, { status: 400 });
    }
    return NextResponse.json({
      code: applyPattern(t.pattern, { xxx: String(xxx) }),
    });
  }

  if (type === "cartbin") {
    const t = templates.cartbin;
    const xxx = Number(values.xxx);
    const y = String(values.y ?? "A");
    const z = Number(values.z ?? 1);
    if (
      !Number.isInteger(xxx) ||
      xxx < t.validation.xxx.min ||
      xxx > t.validation.xxx.max
    ) {
      return NextResponse.json({ error: "Invalid cart bin values." }, { status: 400 });
    }
    return NextResponse.json({
      code: applyPattern(t.pattern, { xxx: String(xxx), y, z: String(z) }),
    });
  }

  return NextResponse.json(
    { error: "Unsupported type.", supported: ["bin", "cart", "cartbin", "raw"] },
    { status: 400 },
  );
}

export async function GET() {
  return NextResponse.json({
    service: "RackTag Labels API",
    version: "1.0",
    endpoints: {
      POST: {
        description: "Generate a label code",
        auth: "Bearer rtk_…",
        body: {
          type: "bin | cart | cartbin | raw",
          values: "{ xxx, y, zzzz, z }",
          code: "required when type=raw",
        },
      },
    },
    defaultTemplates: DEFAULT_TEMPLATES,
  });
}
