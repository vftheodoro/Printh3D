import { NextResponse } from "next/server";

export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export function apiSuccess<T>(
  data: T,
  init?: ResponseInit,
  meta?: Record<string, unknown>,
) {
  return NextResponse.json(meta ? { data, meta } : { data }, init);
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      } satisfies ApiErrorPayload,
    },
    { status },
  );
}
