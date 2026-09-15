import { NextResponse } from "next/server";
import { errorFromUnknown } from "@/lib/errors";
import { logEvent } from "@/lib/observability";

export function jsonError(error: unknown) {
  const appError = errorFromUnknown(error);
  if (appError.status >= 500) {
    logEvent("error", {
      message: appError.message,
      code: appError.code,
    });
  }
  return NextResponse.json(
    { error: appError.message, code: appError.code },
    { status: appError.status }
  );
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
