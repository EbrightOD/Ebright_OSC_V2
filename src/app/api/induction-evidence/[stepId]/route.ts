import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamFromDrive, mimeForName } from "@/lib/drive";
import { canManageInductions } from "@/app/induction/roles";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams the evidence photo for an induction_step. Auth model:
 *   - Caller must be signed in (session check).
 *   - Caller must be either the owner of the induction (the inductee) or a
 *     manager (HR/admin/CEO). Other employees get 404 to avoid leaking the
 *     existence of evidence for inductions that aren't theirs.
 *
 * Returns 404 if the step doesn't exist, has no evidence, or the caller isn't
 * authorised. Same status code on purpose — don't distinguish "no access"
 * from "doesn't exist".
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ stepId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stepId: stepIdStr } = await params;
  const stepId = parseInt(stepIdStr, 10);
  if (!Number.isFinite(stepId) || stepId <= 0) {
    return NextResponse.json({ error: "Invalid step id" }, { status: 400 });
  }

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const step = await prisma.induction_step.findUnique({
    where: { id: stepId },
    select: {
      evidence_file_id: true,
      induction_profile: { select: { user_id: true } },
    },
  });
  if (!step || !step.evidence_file_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isManager = canManageInductions(me.role?.role_type ?? null);
  const isOwner = me.user_id === step.induction_profile.user_id;
  if (!isManager && !isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { body, meta } = await streamFromDrive(step.evidence_file_id);
    const safeName = (meta.name || "evidence").replace(/"/g, '\\"');
    const resolvedMime =
      mimeForName(meta.name) ?? meta.mimeType ?? "application/octet-stream";
    const webStream = Readable.toWeb(body) as unknown as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": resolvedMime,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }
}
