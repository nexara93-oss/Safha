import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Not authenticated", 401);
  return ok({
    user: {
      id: auth.user.id,
      fullName: auth.user.fullName,
      email: auth.user.email,
      phone: auth.user.phone,
      role: auth.user.role,
      schoolId: auth.user.schoolId,
      school: auth.user.school
    }
  });
}
