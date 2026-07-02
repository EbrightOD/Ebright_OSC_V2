import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { backfillRange } from "@/lib/scanner-sync";
import { mytDayUtcBounds } from "@/lib/myt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["superadmin", "ceo", "hr"]);

// Parse "YYYY-MM-DD" anchored at noon MYT so MYT helpers compute the right
// calendar day regardless of server clock or DST.
function parseMytDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), 4, 0, 0));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const roleType = me?.role?.role_type?.toLowerCase() ?? "";
  if (!ALLOWED_ROLES.has(roleType)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const dateParam = sp.get("date");
  const fromParam = sp.get("from");
  const toParam = sp.get("to");

  let startTime: Date;
  let endTime: Date;

  if (fromParam && toParam) {
    const f = parseMytDate(fromParam);
    const t = parseMytDate(toParam);
    if (!f || !t) {
      return NextResponse.json(
        { error: "invalid from/to (expected YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    if (f.getTime() > t.getTime()) {
      return NextResponse.json(
        { error: "from must be on or before to" },
        { status: 400 },
      );
    }
    startTime = mytDayUtcBounds(f).start;
    endTime = mytDayUtcBounds(t).end;
  } else if (dateParam) {
    const ref = parseMytDate(dateParam);
    if (!ref) {
      return NextResponse.json(
        { error: "invalid date (expected YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    const bounds = mytDayUtcBounds(ref);
    startTime = bounds.start;
    endTime = bounds.end;
  } else {
    // Default: yesterday MYT
    const yesterday = new Date(Date.now() - 24 * 3600_000);
    const bounds = mytDayUtcBounds(yesterday);
    startTime = bounds.start;
    endTime = bounds.end;
  }

  const result = await backfillRange(startTime, endTime);
  return NextResponse.json(result);
}
