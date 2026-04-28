import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors/app-error";

type Params = Record<string, string | string[] | undefined>;

const uuidParamsSchema = z.record(z.string(), z.string().uuid());

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function jsonError(message: string, status: number, code?: string, requestId?: string) {
  return NextResponse.json(
    {
      error: {
        code: code ?? "REQUEST_ERROR",
        message,
        statusCode: status,
        requestId,
      },
    },
    { status },
  );
}

export function parseUuidParam(
  params: Params,
  key: string,
  invalidMessage: string,
): string | NextResponse {
  const parsedParams = uuidParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return jsonError(invalidMessage, 400, "INVALID_PARAMS");
  }

  const value = parsedParams.data[key];
  if (!value) {
    return jsonError(invalidMessage, 400, "INVALID_PARAMS");
  }

  return value;
}

export function handleRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return jsonError(error.message, error.statusCode, error.code);
  }

  return jsonError(fallbackMessage, 500, "INTERNAL_SERVER_ERROR");
}
