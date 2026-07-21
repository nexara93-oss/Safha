import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}

export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await req.json().catch(() => { throw new Error("Invalid JSON body"); });
  const result = schema.safeParse(body);
  if (!result.success) {
    const flat = result.error.flatten();
    throw new ZodError(result.error.issues);
  }
  return result.data;
}

export function zodToErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    });
    return err("Validation failed", 422, { fieldErrors });
  }
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "production") {
      return err("An error occurred", 400);
    }
    return err(error.message, 400);
  }
  return err("Unexpected error", 500);
}
