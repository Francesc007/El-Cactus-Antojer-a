import type { ApiErrorBody } from "@/lib/types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json()) as T | ApiErrorBody;
  if (!response.ok) {
    const body = json as ApiErrorBody;
    throw new ApiRequestError(body.error ?? "Error de red", response.status, body.code);
  }
  return json as T;
}
